"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { temaAtivo } from "@/lib/halloween";
import { ligarIcones } from "@/lib/halloweenIcones";
import "./halloween.css";

// Liga o tema de Halloween quando a data e a rota permitem (ver lib/halloween.ts) e desliga ao
// sair do período ou ao navegar para uma área onde o tema não entra (painel, checkout etc.).
export default function TemaHalloween() {
  const pathname = usePathname();

  useEffect(() => {
    const ativo = temaAtivo(pathname, window.location.search);
    document.documentElement.classList.toggle("tema-halloween", ativo);
    if (!ativo) return;
    return ligarIcones({ home: pathname === "/" });
  }, [pathname]);

  return null;
}
