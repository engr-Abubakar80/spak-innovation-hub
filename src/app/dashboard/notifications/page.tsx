import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import {
  NotificationsList,
  type PortalNotification,
} from "@/components/portal/notifications-list";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await prisma.notification
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .catch(() => []);
  const notifications: PortalNotification[] = rows.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  }));

  return (
    <div>
      <PortalPageHeader
        title="Notifications"
        description="Stay informed about your bookings and account activity."
      />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
