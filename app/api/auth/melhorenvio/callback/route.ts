import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("melhorenvio_oauth_state")?.value;
  cookieStore.delete("melhorenvio_oauth_state");

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/admin?erro=melhorenvio", request.url));
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${siteUrl}/api/auth/melhorenvio/callback`;
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL || "https://sandbox.melhorenvio.com.br";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/admin?erro=melhorenvio", request.url));
  }

  try {
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[melhorenvio] Token exchange failed:", tokenRes.status, errBody);
      return NextResponse.redirect(new URL("/admin?erro=melhorenvio", request.url));
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.melhorEnvioToken.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
    });

    return NextResponse.redirect(new URL("/admin?melhorenvio=conectado", request.url));
  } catch (err) {
    console.error("[melhorenvio] Falha ao trocar código por token:", err);
    return NextResponse.redirect(new URL("/admin?erro=melhorenvio", request.url));
  }
}
