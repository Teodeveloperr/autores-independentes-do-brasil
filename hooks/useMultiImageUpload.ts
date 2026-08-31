"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/upload-client";

const MAX_BYTES = 5 * 1024 * 1024;

export function useMultiImageUpload(folder: string, max: number) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      if (urls.length + files.length > max) {
        setError(`Máximo de ${max} fotos.`);
        return;
      }
      if (files.some((f) => f.size > MAX_BYTES)) {
        setError("Cada foto deve ter até 5MB.");
        return;
      }

      setError("");
      setUploading(true);
      try {
        const novasUrls = await Promise.all(files.map((f) => uploadImage(f, folder)));
        setUrls((prev) => [...prev, ...novasUrls]);
      } catch {
        setError("Não foi possível enviar as fotos. Tente novamente.");
      } finally {
        setUploading(false);
      }
    },
    [folder, max, urls.length]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const remove = useCallback((url: string) => {
    setUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const reset = useCallback(() => {
    setUrls([]);
    setError("");
  }, []);

  return { urls, uploading, error, onInputChange, onDrop, onDragOver, remove, reset };
}
