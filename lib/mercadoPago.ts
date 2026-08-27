import "server-only";
import crypto from "node:crypto";

const API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("[mercadopago] MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente.");
    return null;
  }
  return token;
}

export type CriarAssinaturaInput = {
  authorId: string;
  authorEmail: string;
  planoSlug: string;
  planoNome: string;
  valorCentavos: number;
  cicloMeses: number;
  backUrl: string;
  notificationUrl: string;
  freeTrialDias?: number;
};

export type AssinaturaCriada = { id: string; initPoint: string };

export async function criarAssinatura(input: CriarAssinaturaInput): Promise<AssinaturaCriada | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Autores Independentes do Brasil - ${input.planoNome}`,
        external_reference: `${input.authorId}|${input.planoSlug}`,
        payer_email: input.authorEmail,
        back_url: input.backUrl,
        notification_url: input.notificationUrl,
        auto_recurring: {
          frequency: input.cicloMeses,
          frequency_type: "months",
          transaction_amount: input.valorCentavos / 100,
          currency_id: "BRL",
          ...(input.freeTrialDias
            ? { free_trial: { frequency: input.freeTrialDias, frequency_type: "days" } }
            : {}),
        },
        status: "pending",
      }),
    });

    if (!res.ok) {
      console.error("[mercadopago] Falha ao criar assinatura:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { id: string; init_point: string };
    return { id: data.id, initPoint: data.init_point };
  } catch (err) {
    console.error("[mercadopago] Falha ao criar assinatura:", err);
    return null;
  }
}

export type AssinaturaMp = {
  id: string;
  status: string;
  externalReference: string | null;
  nextPaymentDate: string | null;
};

export async function buscarAssinatura(preapprovalId: string): Promise<AssinaturaMp | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE}/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("[mercadopago] Falha ao buscar assinatura:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id: string; status: string; external_reference: string | null; next_payment_date: string | null };
    return { id: data.id, status: data.status, externalReference: data.external_reference, nextPaymentDate: data.next_payment_date };
  } catch (err) {
    console.error("[mercadopago] Falha ao buscar assinatura:", err);
    return null;
  }
}

export async function cancelarAssinaturaMp(preapprovalId: string): Promise<boolean> {
  const accessToken = getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${API_BASE}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      console.error("[mercadopago] Falha ao cancelar assinatura:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[mercadopago] Falha ao cancelar assinatura:", err);
    return false;
  }
}

/**
 * Verifica a assinatura HMAC do webhook (header x-signature) conforme
 * documentação da Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#editor_5
 */
export function verificarAssinaturaWebhook(xSignature: string | null, xRequestId: string | null, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId || !dataId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.trim().split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = partes["ts"];
  const hashRecebido = partes["v1"];
  if (!ts || !hashRecebido) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hashCalculado = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const bufCalculado = Buffer.from(hashCalculado);
  const bufRecebido = Buffer.from(hashRecebido);
  if (bufCalculado.length !== bufRecebido.length) return false;

  return crypto.timingSafeEqual(bufCalculado, bufRecebido);
}
