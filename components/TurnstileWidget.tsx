"use client";

import Script from "next/script";

// Widget do Cloudflare Turnstile — precisa estar dentro de um <form>: o próprio script
// injeta um campo escondido "cf-turnstile-response" nesse form com o token de verificação,
// que sobe junto com o resto dos dados sem precisar de nenhum JS adicional nosso.
export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Sem chave configurada ainda (painel da Cloudflare não criado) — não renderiza nada,
  // não trava o formulário.
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
  );
}
