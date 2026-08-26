"use client";

import { useState, useCallback } from "react";
import { uploadImage } from "@/lib/upload-client";

const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}

export function useVideoUpload(folder: string, initialUrl = "") {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      if (file.size > MAX_VIDEO_BYTES) {
        setError(`O vídeo deve ter até ${MAX_VIDEO_BYTES / (1024 * 1024)}MB.`);
        return;
      }
      setError("");
      setUploading(true);

      const duration = await readVideoDuration(file);
      if (duration > 0 && duration > MAX_VIDEO_SECONDS + 0.5) {
        setError(`O vídeo deve ter até ${MAX_VIDEO_SECONDS} segundos.`);
        setUploading(false);
        return;
      }

      try {
        const uploadedUrl = await uploadImage(file, folder);
        setUrl(uploadedUrl);
      } catch {
        setError("Não foi possível enviar o vídeo. Tente novamente.");
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

  const remove = useCallback(() => {
    setUrl("");
    setError("");
  }, []);

  return { url, setUrl, uploading, error, onInputChange, onDrop, onDragOver, remove };
}
