import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const thread = await prisma.messageThread.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.message.updateMany({
    where: { threadId: thread.id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { userReadAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
