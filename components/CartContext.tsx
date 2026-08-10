"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type CartItem = {
  bookId: string;
  authorId: string;
  titulo: string;
  autorNome: string;
  precoCentavos: number;
  capaUrl: string | null;
  quantidade: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantidade">) => void;
  removeItem: (bookId: string) => void;
  updateQuantidade: (bookId: string, quantidade: number) => void;
  clearCart: () => void;
  totalItens: number;
  totalCentavos: number;
  drawerOpen: boolean;
  closeDrawer: () => void;
  lastAdded: CartItem | null;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "aib-carrinho";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponível ou dado corrompido — segue com carrinho vazio
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantidade">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bookId === item.bookId);
      if (existing) {
        return prev.map((i) => (i.bookId === item.bookId ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
    setLastAdded({ ...item, quantidade: 1 });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const updateQuantidade = useCallback((bookId: string, quantidade: number) => {
    setItems((prev) =>
      quantidade <= 0
        ? prev.filter((i) => i.bookId !== bookId)
        : prev.map((i) => (i.bookId === bookId ? { ...i, quantidade } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItens = items.reduce((sum, i) => sum + i.quantidade, 0);
  const totalCentavos = items.reduce((sum, i) => sum + i.precoCentavos * i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantidade, clearCart, totalItens, totalCentavos, drawerOpen, closeDrawer, lastAdded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
