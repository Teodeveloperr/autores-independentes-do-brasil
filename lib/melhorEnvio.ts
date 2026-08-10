import "server-only";
import { prisma } from "@/lib/db";

const USER_AGENT = "Autores Independentes do Brasil (contato@autoresdobrasil.com.br)";

function getBaseUrl() {
  return process.env.MELHOR_ENVIO_BASE_URL || "https://sandbox.melhorenvio.com.br";
}

async function getValidAccessToken(): Promise<string | null> {
  const token = await prisma.melhorEnvioToken.findUnique({ where: { id: "singleton" } });
  if (!token) {
    console.error("[melhorenvio] Nenhum token salvo no banco — conexão OAuth não foi concluída ou foi perdida.");
    return null;
  }

  // Ainda válido com folga de 5 minutos — usa direto.
  if (token.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return token.accessToken;
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[melhorenvio] MELHOR_ENVIO_CLIENT_ID/MELHOR_ENVIO_CLIENT_SECRET não configurados no ambiente.");
    return null;
  }

  try {
    const res = await fetch(`${getBaseUrl()}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token.refreshToken,
      }),
    });
    if (!res.ok) {
      console.error("[melhorenvio] Falha ao renovar token:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await prisma.melhorEnvioToken.update({
      where: { id: "singleton" },
      data: { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt },
    });
    return data.access_token;
  } catch (err) {
    console.error("[melhorenvio] Falha ao renovar token:", err);
    return null;
  }
}

export type ProdutoFrete = {
  id: string;
  pesoGramas: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  precoCentavos: number;
  quantidade: number;
};

export type CotacaoFrete = {
  precoCentavos: number;
  nomeServico: string;
  nomeTransportadora: string;
  prazoDias: number | null;
};

export async function calcularFrete(
  cepOrigem: string,
  cepDestino: string,
  produtos: ProdutoFrete[]
): Promise<CotacaoFrete | null> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem.replace(/\D/g, "") },
        to: { postal_code: cepDestino.replace(/\D/g, "") },
        products: produtos.map((p) => ({
          id: p.id,
          width: p.larguraCm,
          height: p.alturaCm,
          length: p.comprimentoCm,
          weight: p.pesoGramas / 1000,
          insurance_value: (p.precoCentavos / 100) * p.quantidade,
          quantity: p.quantidade,
        })),
      }),
    });

    if (!res.ok) {
      console.error("[melhorenvio] Cálculo de frete falhou:", res.status, await res.text());
      return null;
    }

    const opcoes = (await res.json()) as Array<{
      id: number;
      name: string;
      price: string | null;
      delivery_time: number | null;
      company?: { name: string };
      error?: string;
    }>;

    const validas = opcoes.filter((o) => !o.error && o.price);
    if (validas.length === 0) {
      console.error("[melhorenvio] Nenhuma opção de frete válida retornada:", JSON.stringify(opcoes));
      return null;
    }

    const maisBarata = validas.reduce((a, b) => (parseFloat(a.price!) <= parseFloat(b.price!) ? a : b));

    return {
      precoCentavos: Math.round(parseFloat(maisBarata.price!) * 100),
      nomeServico: maisBarata.name,
      nomeTransportadora: maisBarata.company?.name ?? "",
      prazoDias: maisBarata.delivery_time,
    };
  } catch (err) {
    console.error("[melhorenvio] Falha ao calcular frete:", err);
    return null;
  }
}
