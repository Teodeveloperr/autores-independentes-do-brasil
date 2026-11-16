"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Recarrega os dados da página a cada poucos segundos enquanto o pagamento não aparece como
 * confirmado (o aviso da Asaas pode chegar alguns segundos depois de o comprador voltar ao site).
 */
export default function AtualizarAteConfirmar({ segundos = 4, tentativas = 15 }: { segundos?: number; tentativas?: number }) {
  const router = useRouter();

  useEffect(() => {
    let feitas = 0;
    const timer = setInterval(() => {
      feitas += 1;
      router.refresh();
      if (feitas >= tentativas) clearInterval(timer);
    }, segundos * 1000);
    return () => clearInterval(timer);
  }, [router, segundos, tentativas]);

  return null;
}
