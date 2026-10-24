import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { sendGenericMessage } from "@/lib/email";
import { messageSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/messages
 * Sends a message from the Super Admin to a user. Creates (or reuses) the
 * one-thread-per-user conversation.
 */
export async function POST(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = messageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { userId, subject, message, bookingId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let thread = await prisma.messageThread.findFirst({ where: { userId } });
  if (!thread) {
    thread = await prisma.messageThread.create({ data: { userId, subject } });
  }

  const msg = await prisma.message.create({
    data: {
      userId,
      threadId: thread.id,
      subject,
      body: message,
      authorId: admin.id,
      bookingId: bookingId || null,
    },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date(), userReadAt: null },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: "message",
      title: subject,
      body: message.slice(0, 180),
      link: "/dashboard/messages",
    },
  });
  await recordAudit({
    actorId: admin.id,
    action: "message.send",
    entity: "Message",
    entityId: msg.id,
    metadata: { userId, threadId: thread.id },
  });
  await sendGenericMessage({
    to: user.email,
    name: user.name || "there",
    subject,
    message,
  }).catch(() => undefined);

  return NextResponse.json({ message: msg, threadId: thread.id }, { status: 201 });
}
