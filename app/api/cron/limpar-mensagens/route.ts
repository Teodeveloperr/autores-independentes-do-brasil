import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.conversation.deleteMany({
    where: { createdAt: { lt: seteDiasAtras } },
  });

  return NextResponse.json({ deleted: result.count });
}
