import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

type GoogleTokenResponse = { access_token: string };
type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (oauthError || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${siteUrl}/login?erro=google`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${siteUrl}/login?erro=google`);
  }

  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Falha ao trocar o código pelo token.");
    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error("Falha ao buscar o perfil do Google.");
    const profile = (await profileRes.json()) as GoogleProfile;

    if (!profile.email) throw new Error("Google não retornou um e-mail.");
    const email = profile.email.toLowerCase();

    let author = await prisma.author.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email }] },
    });

    if (author) {
      if (!author.googleId) {
        author = await prisma.author.update({
          where: { id: author.id },
          data: {
            googleId: profile.sub,
            fotoUrl: author.fotoUrl ?? profile.picture ?? null,
          },
        });
      }
    } else {
      author = await prisma.author.create({
        data: {
          nome: profile.name || "Autor(a)",
          email,
          googleId: profile.sub,
          fotoUrl: profile.picture || null,
          cidade: "Brasil",
          bio: "Autor(a) independente do coletivo Autores Independentes do Brasil.",
          anoEntrada: new Date().getFullYear(),
          plano: "Gratuito",
        },
      });

      try {
        await sendWelcomeEmail(author.email, author.nome);
      } catch (err) {
        console.error("[email] Falha ao enviar e-mail de boas-vindas (Google):", err);
      }
    }

    if (author.status === "suspenso") {
      return NextResponse.redirect(`${siteUrl}/login?erro=suspenso`);
    }

    await createAuthorSession(author.id);
    return NextResponse.redirect(`${siteUrl}/painel`);
  } catch (err) {
    console.error("[auth] Falha no login com Google:", err);
    return NextResponse.redirect(`${siteUrl}/login?erro=google`);
  }
}
