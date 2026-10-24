import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/threads
 * Inbox-style list: one thread per user, newest activity first,
 * with unread indicators for messages authored by the user.
 */
export async function GET(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || undefined;
  const filter = searchParams.get("filter") || "all";

  const where: any = {};
  if (query) {
    where.OR = [
      { subject: { contains: query, mode: "insensitive" } },
      { user: { name: { contains: query, mode: "insensitive" } } },
      { user: { email: { contains: query, mode: "insensitive" } } },
    ];
  }
  if (filter === "unread") where.adminReadAt = null;

  const threads = await prisma.messageThread.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
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
        where: { threadId: t.id, authorId: t.userId, readAt: null },
      });
      return {
        id: t.id,
        subject: t.subject,
        user: t.user,
        lastMessage: t.messages[0] || null,
        lastMessageAt: t.lastMessageAt,
        unread,
        createdAt: t.createdAt,
      };
    }),
  );
  return NextResponse.json(withUnread);
}
