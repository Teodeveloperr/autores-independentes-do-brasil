"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/upload-client";

export function useImageUpload(folder: string, initialUrl = "") {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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
        const uploadedUrl = await uploadImage(file, folder);
        setUrl(uploadedUrl);
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

  return { url, setUrl, uploading, error, onInputChange, onDrop, onDragOver };
}
