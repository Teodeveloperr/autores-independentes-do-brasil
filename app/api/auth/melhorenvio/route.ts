import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

const SCOPES = [
  "shipping-calculate",
  "shipping-cancel",
  "shipping-checkout",
  "shipping-companies",
  "shipping-generate",
  "shipping-preview",
  "shipping-print",
  "shipping-share",
  "shipping-tracking",
  "cart-read",
  "cart-write",
].join(" ");

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Melhor Envio não está configurado." }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("melhorenvio_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${siteUrl}/api/auth/melhorenvio/callback`;
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL || "https://sandbox.melhorenvio.com.br";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${baseUrl}/oauth/authorize?${params.toString()}`);
}
