import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/auth";
import { trocarCodigoPorToken, salvarTokenAutor } from "@/lib/mercadoPagoMarketplace";

export async function GET(request: Request) {
  const author = await requireAuthor();

  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("mp_oauth_state")?.value;
  cookieStore.delete("mp_oauth_state");

  if (oauthError || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${siteUrl}/painel?mercadopago=erro`);
  }

  const redirectUri = `${siteUrl}/api/auth/mercadopago/callback`;
  const token = await trocarCodigoPorToken(code, redirectUri);
  if (!token) {
    return NextResponse.redirect(`${siteUrl}/painel?mercadopago=erro`);
  }

  await salvarTokenAutor(author.id, token);

  return NextResponse.redirect(`${siteUrl}/painel?mercadopago=conectado`);
}
