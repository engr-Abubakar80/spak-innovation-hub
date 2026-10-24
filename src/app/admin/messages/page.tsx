import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { MessagesInbox } from "@/components/admin/messages-inbox";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: { userId?: string; email?: string };
}) {
  await requireSuperAdmin();
  return (
    <div>
      <PageHeader
        title="Messages"
        description="Send messages to users from here. Inbox-style messaging with one thread per user, unread indicators and timestamps."
      />
      <MessagesInbox prefillUserId={searchParams?.userId} prefillEmail={searchParams?.email} />
    </div>
  );
}
