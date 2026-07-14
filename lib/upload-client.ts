"use client";

import { upload } from "@vercel/blob/client";

export async function uploadImage(file: File, folder: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await upload(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}
