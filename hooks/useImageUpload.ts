"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/upload-client";

// Lê a largura/altura reais do arquivo antes do upload — usado por quem precisa exibir a
// imagem na proporção verdadeira dela depois (ex.: capa de livro) em vez de forçar um
// formato fixo. Resolve null se o navegador não conseguir decodificar a imagem.
function lerDimensoesImagem(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

export function useImageUpload(folder: string, initialUrl = "") {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        setError("A imagem deve ter até 5MB.");
        return;
      }
      setError("");
      setUploading(true);
      try {
        const [uploadedUrl, dimensoes] = await Promise.all([uploadImage(file, folder), lerDimensoesImagem(file)]);
        setUrl(uploadedUrl);
        setWidth(dimensoes?.width ?? null);
        setHeight(dimensoes?.height ?? null);
      } catch {
        setError("Não foi possível enviar a imagem. Tente novamente.");
      } finally {
        setUploading(false);
      }
    },
    [folder]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0]);
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return { url, setUrl, uploading, error, width, height, setWidth, setHeight, onInputChange, onDrop, onDragOver };
}
