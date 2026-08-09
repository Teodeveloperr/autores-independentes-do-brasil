"use client";

import { useState } from "react";

function copiarViaTextarea(texto: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let sucesso = false;
  try {
    sucesso = document.execCommand("copy");
  } catch {
    sucesso = false;
  }
  document.body.removeChild(textarea);
  return sucesso;
}

export default function CompartilharPerfilButton({ nome }: { nome: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: nome, text: `Confira o perfil de ${nome} no Autores Independentes do Brasil`, url });
      } catch {
        // Usuário cancelou o compartilhamento — não faz nada.
      }
      return;
    }

    let sucesso = false;
    try {
      await navigator.clipboard.writeText(url);
      sucesso = true;
    } catch {
      sucesso = copiarViaTextarea(url);
    }

    if (sucesso) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      style={{ background: "white", border: "2px solid #262626", color: "#262626", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px", marginBottom: "12px", cursor: "pointer" }}
    >
      {copiado ? "✓ Link copiado!" : "Compartilhar perfil"}
    </button>
  );
}
