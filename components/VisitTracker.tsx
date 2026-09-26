"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_FLAG = "aib_visit_counted";

// Conta só a área pública (não admin/painel, que é uso interno, não tráfego de visitante) —
// e só uma vez por sessão do navegador (sessionStorage), pra representar "visitas" de
// verdade em vez de inflar o número a cada página que a pessoa navega no mesmo site.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/painel")) return;
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
      sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      // Sem acesso a sessionStorage (aba privada bloqueando, etc.) — segue sem contar,
      // não é crítico o suficiente pra travar a navegação por causa disso.
      return;
    }
    fetch("/api/track-visit", { method: "POST", keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
