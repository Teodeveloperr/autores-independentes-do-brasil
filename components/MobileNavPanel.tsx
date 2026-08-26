"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { key: string; label: string; href: string; active?: boolean };
type NavGroup = { label: string; items: NavLink[] };

export default function MobileNavPanel({
  groups,
  cta,
}: {
  groups: NavGroup[];
  cta: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="nav-mobile-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir menu"
        style={{ background: "white", border: "1px solid #DDD", borderRadius: "4px", width: "40px", height: "40px", alignItems: "center", justifyContent: "center", fontSize: "20px" }}
      >
        {open ? "✕" : "☰"}
      </button>
      <div
        className={`nav-mobile-panel${open ? " is-open" : ""}`}
        style={{
          position: "absolute",
          top: "68px",
          left: 0,
          right: 0,
          background: "white",
          borderBottom: "1px solid #E0E0E0",
          padding: "16px 24px",
          flexDirection: "column",
          gap: "14px",
          zIndex: 50,
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
        }}
      >
        {groups.map((group, i) => (
          <div key={group.label || i} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {group.label && (
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999", letterSpacing: "0.5px" }}>{group.label}</div>
            )}
            {group.items.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ color: l.active ? "#009B3A" : "#262626", fontWeight: l.active ? 600 : 500, fontSize: "15px", paddingLeft: group.label ? "8px" : 0 }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
        <Link
          href={cta.href}
          onClick={() => setOpen(false)}
          style={{ background: "#002776", color: "white", padding: "10px 16px", fontSize: "14px", fontWeight: 600, borderRadius: "4px", textAlign: "center" }}
        >
          {cta.label}
        </Link>
      </div>
    </>
  );
}
