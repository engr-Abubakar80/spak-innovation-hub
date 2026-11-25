import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";

const userMessageSchema = z.object({
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(5000),
});

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = userMessageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a subject and message." }, { status: 422 });
  }
  const thread = await prisma.messageThread.create({
    data: { userId: user.id, subject: parsed.data.subject },
  });
  const message = await prisma.message.create({
    data: {
      userId: user.id,
      threadId: thread.id,
      subject: thread.subject,
      body: parsed.data.body,
      authorId: user.id,
    },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date(), adminReadAt: null },
  });
  await notifyAdmins({
    title: "New message from a portal user",
    body: `${user.name || user.email}: ${parsed.data.body.slice(0, 160)}`,
    link: `/admin/messages`,
  });
  await recordAudit({
    actorId: user.id,
    action: "user.message.create",
    entity: "MessageThread",
    entityId: thread.id,
  });
  return NextResponse.json({ message, threadId: thread.id }, { status: 201 });
}

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
