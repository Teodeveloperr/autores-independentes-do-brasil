import "server-only";
import crypto from "node:crypto";

function getBaseUrl() {
  return process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
}

function getAccessToken(): string | null {
  const token = process.env.ASAAS_API_KEY;
  if (!token) {
    console.error("[asaas] ASAAS_API_KEY não configurado no ambiente.");
    return null;
  }
  return token;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function criarOuBuscarCliente(input: { nome: string; cpf: string; email: string }): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  const cpfDigits = input.cpf.replace(/\D/g, "");

  try {
    const busca = await fetch(`${getBaseUrl()}/customers?cpfCnpj=${cpfDigits}`, {
      headers: { access_token: accessToken, Accept: "application/json" },
    });
    if (busca.ok) {
      const data = (await busca.json()) as { data: Array<{ id: string }> };
      if (data.data?.length > 0) return data.data[0].id;
    }

    const criacao = await fetch(`${getBaseUrl()}/customers`, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: input.nome, cpfCnpj: cpfDigits, email: input.email }),
    });
    if (!criacao.ok) {
      console.error("[asaas] Falha ao criar cliente:", criacao.status, await criacao.text());
      return null;
    }
    const criado = (await criacao.json()) as { id: string };
    return criado.id;
  } catch (err) {
    console.error("[asaas] Falha ao criar/buscar cliente:", err);
    return null;
  }
}

export type CobrancaCriada = { id: string; invoiceUrl: string };

export async function criarCobranca(input: {
  customerId: string;
  valueCentavos: number;
  description: string;
  externalReference: string;
}): Promise<CobrancaCriada | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/payments`, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        customer: input.customerId,
        billingType: "UNDEFINED",
        value: input.valueCentavos / 100,
        dueDate: hoje(),
        description: input.description,
        externalReference: input.externalReference,
      }),
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao criar cobrança:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id: string; invoiceUrl: string };
    return { id: data.id, invoiceUrl: data.invoiceUrl };
  } catch (err) {
    console.error("[asaas] Falha ao criar cobrança:", err);
    return null;
  }
}

export type TransferenciaCriada = { id: string; status: string };

export async function criarTransferenciaPix(input: {
  valueCentavos: number;
  pixKey: string;
  pixKeyType: string;
  description: string;
  externalReference: string;
}): Promise<TransferenciaCriada | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/transfers`, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        value: input.valueCentavos / 100,
        pixAddressKey: input.pixKey,
        pixAddressKeyType: input.pixKeyType,
        operationType: "PIX",
        description: input.description,
        externalReference: input.externalReference,
      }),
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao criar transferência:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id: string; status: string };
    return { id: data.id, status: data.status };
  } catch (err) {
    console.error("[asaas] Falha ao criar transferência:", err);
    return null;
  }
}

export type FrequenciaPixAutomatico = "MONTHLY" | "SEMIANNUALLY" | "ANNUALLY";

export type AutorizacaoPixAutomaticoCriada = { id: string; qrCodePayload: string; qrCodeImage: string };

export async function criarAutorizacaoPixAutomatico(input: {
  customerId: string;
  frequency: FrequenciaPixAutomatico;
  contractId: string;
  valueCentavos: number;
  description: string;
}): Promise<AutorizacaoPixAutomaticoCriada | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  const value = input.valueCentavos / 100;

  try {
    const res = await fetch(`${getBaseUrl()}/pix/automatic/authorizations`, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        customerId: input.customerId,
        frequency: input.frequency,
        contractId: input.contractId,
        startDate: hoje(),
        value,
        description: input.description,
        paymentCreationMode: "SUBSCRIPTION",
        immediateQrCode: {
          originalValue: value,
          expirationSeconds: 1800,
          description: input.description,
        },
      }),
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao criar autorização Pix Automático:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      id: string;
      immediateQrCode?: { payload?: string; encodedImage?: string };
    };
    return {
      id: data.id,
      qrCodePayload: data.immediateQrCode?.payload ?? "",
      qrCodeImage: data.immediateQrCode?.encodedImage ?? "",
    };
  } catch (err) {
    console.error("[asaas] Falha ao criar autorização Pix Automático:", err);
    return null;
  }
}

export async function cancelarAutorizacaoPixAutomatico(id: string): Promise<boolean> {
  const accessToken = getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${getBaseUrl()}/pix/automatic/authorizations/${id}`, {
      method: "DELETE",
      headers: { access_token: accessToken, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao cancelar autorização Pix Automático:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[asaas] Falha ao cancelar autorização Pix Automático:", err);
    return false;
  }
}

export type CicloAssinaturaAsaas = "MONTHLY" | "SEMIANNUALLY" | "YEARLY";

export type AssinaturaAsaasCriada = { id: string; invoiceUrl: string };

export async function criarAssinaturaAsaas(input: {
  customerId: string;
  cycle: CicloAssinaturaAsaas;
  valueCentavos: number;
  description: string;
}): Promise<AssinaturaAsaasCriada | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/subscriptions`, {
      method: "POST",
      headers: { access_token: accessToken, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        customer: input.customerId,
        billingType: "UNDEFINED",
        value: input.valueCentavos / 100,
        nextDueDate: hoje(),
        cycle: input.cycle,
        description: input.description,
      }),
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao criar assinatura:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id: string };
    const pagamentos = await fetch(`${getBaseUrl()}/payments?subscription=${data.id}`, {
      headers: { access_token: accessToken, Accept: "application/json" },
    });
    let invoiceUrl = "";
    if (pagamentos.ok) {
      const pagData = (await pagamentos.json()) as { data: Array<{ invoiceUrl: string }> };
      invoiceUrl = pagData.data?.[0]?.invoiceUrl ?? "";
    }
    return { id: data.id, invoiceUrl };
  } catch (err) {
    console.error("[asaas] Falha ao criar assinatura:", err);
    return null;
  }
}

export async function cancelarAssinaturaAsaas(id: string): Promise<boolean> {
  const accessToken = getAccessToken();
  if (!accessToken) return false;

  try {
    const res = await fetch(`${getBaseUrl()}/subscriptions/${id}`, {
      method: "DELETE",
      headers: { access_token: accessToken, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao cancelar assinatura:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[asaas] Falha ao cancelar assinatura:", err);
    return false;
  }
}

export type CobrancaAsaas = { id: string; subscription: string | null; valueCentavos: number; invoiceUrl: string; status: string };

export async function buscarCobranca(id: string): Promise<CobrancaAsaas | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/payments/${id}`, {
      headers: { access_token: accessToken, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[asaas] Falha ao buscar cobrança:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id: string; subscription?: string | null; value: number; invoiceUrl: string; status: string };
    return { id: data.id, subscription: data.subscription ?? null, valueCentavos: Math.round(data.value * 100), invoiceUrl: data.invoiceUrl, status: data.status };
  } catch (err) {
    console.error("[asaas] Falha ao buscar cobrança:", err);
    return null;
  }
}

export function verificarWebhookAsaas(token: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
