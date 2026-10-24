import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api";
import { requireApiSuperAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/** GET /api/user/messages — the signed-in user's threads with admin messages. */
export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threads = await prisma.messageThread.findMany({
    where: { userId: user.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, subject: true, body: true, createdAt: true, authorId: true, readAt: true },
      },
    },
  });
  const withUnread = await Promise.all(
    threads.map(async (t) => {
      const unread = await prisma.message.count({
        where: { threadId: t.id, authorId: { not: user.id }, readAt: null },
      });
      return {
        id: t.id,
        subject: t.subject,
        lastMessage: t.messages[0] || null,
        lastMessageAt: t.lastMessageAt,
        unread,
      };
    }),
  );
  return NextResponse.json(withUnread);
}
