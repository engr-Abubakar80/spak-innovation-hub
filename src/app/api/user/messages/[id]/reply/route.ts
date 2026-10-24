import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/api";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

/** POST /api/user/messages/[id]/reply — user replies to an admin thread. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = replySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const thread = await prisma.messageThread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (thread.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "message",
      title: "Reply sent to support",
      body: parsed.data.body.slice(0, 180),
      link: "/dashboard/messages",
    },
  });
  await recordAudit({
    actorId: user.id,
    action: "message.reply",
    entity: "MessageThread",
    entityId: thread.id,
  });
  return NextResponse.json(message, { status: 201 });
}
