import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { MessagesInbox, type PortalThread } from "@/components/portal/messages-inbox";

export default async function MessagesPage() {
  const user = await requireUser();
  const rows = await prisma.messageThread
    .findMany({
      where: { userId: user.id },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true } } },
        },
        _count: {
          select: {
            messages: {
              where: { authorId: { not: user.id }, readAt: null },
            },
          },
        },
      },
    })
    .catch(() => []);
  const threads: PortalThread[] = rows.map((thread) => ({
    id: thread.id,
    subject: thread.subject,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    unread: thread._count.messages,
    messages: thread.messages.map((message) => ({
      id: message.id,
      body: message.body,
      authorId: message.authorId,
      authorName: message.author?.name ?? null,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt ? message.readAt.toISOString() : null,
    })),
  }));

  return (
    <div>
      <PortalPageHeader
        title="Messages"
        description="Communicate with the SPAK Innovation Hub support team."
      />
      <MessagesInbox threads={threads} userId={user.id} />
    </div>
  );
}
