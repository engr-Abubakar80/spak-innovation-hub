import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function MessagesPage() {
  const user = await requireUser();
  const messages = await prisma.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Messages" description="Messages from the SPAK Innovation Hub team." />
      {messages.length === 0 ? (
        <EmptyState title="No messages" description="You don't have any messages yet." />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{m.subject}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{formatDate(m.createdAt)}</p>
                </div>
                {!m.readAt && <span className="text-xs font-medium text-brand-700">Unread</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
