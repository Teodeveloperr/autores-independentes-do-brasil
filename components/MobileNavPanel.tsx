"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { key: string; label: string; href: string; active?: boolean };

export default function MobileNavPanel({
  links,
  cta,
}: {
  links: NavLink[];
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
        {links.map((l) => (
          <Link key={l.key} href={l.href} onClick={() => setOpen(false)} style={{ color: l.active ? "#009B3A" : "#262626", fontWeight: l.active ? 600 : 500, fontSize: "15px" }}>
            {l.label}
          </Link>
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
