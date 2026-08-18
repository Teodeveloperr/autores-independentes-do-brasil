import "server-only";
import { prisma } from "@/lib/db";

const API_BASE = "https://api.mercadopago.com";

function getClientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.MERCADOPAGO_MARKETPLACE_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_MARKETPLACE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[mercadopago-marketplace] MERCADOPAGO_MARKETPLACE_CLIENT_ID/SECRET não configurados.");
    return null;
  }
  return { clientId, clientSecret };
}

export function gerarUrlAutorizacao(redirectUri: string, state: string): string | null {
  const creds = getClientCredentials();
  if (!creds) return null;

  const params = new URLSearchParams({
    client_id: creds.clientId,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: redirectUri,
    state,
  });
  return `https://auth.mercadopago.com.br/authorization?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  public_key: string;
  refresh_token: string;
  user_id: number | string;
  expires_in: number;
};

export async function trocarCodigoPorToken(code: string, redirectUri: string): Promise<TokenResponse | null> {
  const creds = getClientCredentials();
  if (!creds) return null;

  try {
    const res = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      console.error("[mercadopago-marketplace] Falha ao trocar code por token:", res.status, await res.text());
      return null;
    }

    return (await res.json()) as TokenResponse;
  } catch (err) {
    console.error("[mercadopago-marketplace] Falha ao trocar code por token:", err);
    return null;
  }
}

async function renovarToken(refreshToken: string): Promise<TokenResponse | null> {
  const creds = getClientCredentials();
  if (!creds) return null;

  try {
    const res = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.error("[mercadopago-marketplace] Falha ao renovar token:", res.status, await res.text());
      return null;
    }

    return (await res.json()) as TokenResponse;
  } catch (err) {
    console.error("[mercadopago-marketplace] Falha ao renovar token:", err);
    return null;
  }
}

export async function salvarTokenAutor(authorId: string, token: TokenResponse) {
  await prisma.authorMercadoPagoToken.upsert({
    where: { authorId },
    create: {
      authorId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publicKey: token.public_key,
      mpUserId: String(token.user_id),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publicKey: token.public_key,
      mpUserId: String(token.user_id),
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });
}

/** Retorna um access_token válido do autor, renovando via refresh_token se necessário. */
export async function getValidSellerAccessToken(authorId: string): Promise<string | null> {
  const token = await prisma.authorMercadoPagoToken.findUnique({ where: { authorId } });
  if (!token) return null;

  if (token.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return token.accessToken;
  }

  const renovado = await renovarToken(token.refreshToken);
  if (!renovado) return null;

  await salvarTokenAutor(authorId, renovado);
  return renovado.access_token;
}

export async function desconectarMercadoPago(authorId: string) {
  await prisma.authorMercadoPagoToken.deleteMany({ where: { authorId } });
}

export type ItemPreferencia = {
  titulo: string;
  quantidade: number;
  precoUnitarioCentavos: number;
};

export type PreferenciaCriada = { id: string; initPoint: string };

export async function criarPreferenciaMarketplace(
  sellerAccessToken: string,
  items: ItemPreferencia[],
  marketplaceFeeCentavos: number,
  externalReference: string,
  backUrls: { success: string; failure: string; pending: string },
  notificationUrl: string
): Promise<PreferenciaCriada | null> {
  try {
    const res = await fetch(`${API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sellerAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          title: item.titulo,
          quantity: item.quantidade,
          currency_id: "BRL",
          unit_price: item.precoUnitarioCentavos / 100,
        })),
        marketplace_fee: marketplaceFeeCentavos / 100,
        external_reference: externalReference,
        back_urls: backUrls,
        auto_return: "approved",
        notification_url: notificationUrl,
      }),
    });

    if (!res.ok) {
      console.error("[mercadopago-marketplace] Falha ao criar preferência:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { id: string; init_point: string };
    return { id: data.id, initPoint: data.init_point };
  } catch (err) {
    console.error("[mercadopago-marketplace] Falha ao criar preferência:", err);
    return null;
  }
}
