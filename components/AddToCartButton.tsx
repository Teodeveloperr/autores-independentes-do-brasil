"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export default function AddToCartButton({
  book,
  style,
}: {
  book: { bookId: string; authorId: string; titulo: string; autorNome: string; precoCentavos: number; capaUrl: string | null };
  style?: React.CSSProperties;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function onClick() {
    addItem(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        background: added ? "#002776" : "#009B3A",
        color: "white",
        padding: "8px",
        fontSize: "13px",
        fontWeight: 600,
        width: "100%",
        borderRadius: "4px",
        ...style,
      }}
    >
      {added ? "Adicionado ✓" : "Comprar"}
    </button>
  );
}
