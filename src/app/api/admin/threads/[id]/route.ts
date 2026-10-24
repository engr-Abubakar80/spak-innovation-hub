import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/threads/[id] — full thread, marks user messages as read. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, phone: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.updateMany({
    where: { threadId: thread.id, authorId: thread.userId, readAt: null },
    data: { readAt: new Date() },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { adminReadAt: new Date() },
  });

  return NextResponse.json(thread);
}
