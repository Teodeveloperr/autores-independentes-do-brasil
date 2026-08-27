"use server";

import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { processarRepasse } from "@/lib/repasse";

export async function confirmarRecebimento(formData: FormData) {
  const token = (formData.get("token") as string) || "";
  if (!token) return;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const order = await prisma.order.findUnique({
    where: { confirmacaoTokenHash: tokenHash },
    include: { author: true },
  });

  if (order && order.repasseStatus !== "transferido") {
    await processarRepasse(order, order.author);
    await prisma.order.update({ where: { id: order.id }, data: { confirmadoEm: new Date(), status: "Entregue" } });
  }

  redirect(`/pedido/confirmar?token=${token}`);
}
