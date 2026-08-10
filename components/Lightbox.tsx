"use client";

import { useEffect, useCallback } from "react";

export type LightboxFoto = { url: string; titulo?: string | null };

export default function Lightbox({
  fotos,
  index,
  onClose,
  onNavigate,
}: {
  fotos: LightboxFoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const total = fotos.length;
  const foto = fotos[index];

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!foto) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        style={{
          position: "absolute",
          top: "20px",
          right: "24px",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          color: "white",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Foto anterior"
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- exibida em tamanho original dentro do lightbox, sem otimização necessária */}
        <img
          src={foto.url}
          alt={foto.titulo || ""}
          style={{ maxWidth: "90vw", maxHeight: "75vh", objectFit: "contain", borderRadius: "4px", display: "block" }}
        />
        <div style={{ color: "white", fontSize: "13px", textAlign: "center" }}>
          {foto.titulo && <span style={{ fontWeight: 600 }}>{foto.titulo}</span>}
          {total > 1 && <span style={{ color: "rgba(255,255,255,0.6)", marginLeft: foto.titulo ? "10px" : 0 }}>{index + 1} / {total}</span>}
        </div>
      </div>

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Próxima foto"
          style={{
            position: "absolute",
            right: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
