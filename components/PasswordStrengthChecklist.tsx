"use client";

import { senhaChecks } from "@/lib/password";

const REGRAS = [
  { key: "tamanho" as const, label: "Pelo menos 8 caracteres" },
  { key: "letra" as const, label: "Uma letra" },
  { key: "numero" as const, label: "Um número" },
  { key: "especial" as const, label: "Um caractere especial (ex: !@#$%)" },
];

export default function PasswordStrengthChecklist({ senha }: { senha: string }) {
  const checks = senhaChecks(senha);

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "flex", flexDirection: "column", gap: "3px" }}>
      {REGRAS.map((regra) => {
        const ok = checks[regra.key];
        return (
          <li key={regra.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: ok ? "#009B3A" : "#999" }}>
            <span style={{ fontWeight: 700 }}>{ok ? "✓" : "○"}</span>
            {regra.label}
          </li>
        );
      })}
    </ul>
  );
}
