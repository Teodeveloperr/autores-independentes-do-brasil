"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartBadge({ style }: { style?: React.CSSProperties }) {
  const { totalItens } = useCart();

  return (
    <Link href="/carrinho" style={{ position: "relative", display: "inline-flex", alignItems: "center", color: "#262626", ...style }}>
      🛒 Carrinho
      {totalItens > 0 && (
        <span
          style={{
            marginLeft: "6px",
            background: "#009B3A",
            color: "white",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "10px",
            padding: "1px 7px",
            minWidth: "18px",
            textAlign: "center",
          }}
        >
          {totalItens}
        </span>
      )}
    </Link>
  );
}
