import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/auth";
import { gerarUrlAutorizacao } from "@/lib/mercadoPagoMarketplace";

export async function GET(request: Request) {
  await requireAuthor();

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${siteUrl}/api/auth/mercadopago/callback`;

  const url = gerarUrlAutorizacao(redirectUri, state);
  if (!url) {
    return NextResponse.json({ error: "Conexão com Mercado Pago não está configurada." }, { status: 500 });
  }

  return NextResponse.redirect(url);
}
