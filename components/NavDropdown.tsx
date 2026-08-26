"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { key: string; label: string; href: string };

export default function NavDropdown({ label, items, activeKey }: { label: string; items: Item[]; activeKey?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = items.some((i) => i.key === activeKey);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontFamily: "inherit",
          fontSize: "13px",
          cursor: "pointer",
          color: isActive ? "#009B3A" : "#262626",
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {label}
        <span style={{ fontSize: "10px", transform: open ? "rotate(180deg)" : undefined }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            minWidth: "180px",
            zIndex: 50,
          }}
        >
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                whiteSpace: "nowrap",
                color: item.key === activeKey ? "#009B3A" : "#262626",
                fontWeight: item.key === activeKey ? 600 : 500,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
