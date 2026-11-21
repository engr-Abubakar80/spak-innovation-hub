import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { SettingsForm } from "@/components/portal/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const record = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: {
        emailNotifications: true,
        bookingNotifications: true,
        messageNotifications: true,
      },
    })
    .catch(() => null);

  return (
    <div>
      <PortalPageHeader
        title="Settings"
        description="Manage your account preferences, security and notifications."
      />
      <SettingsForm
        initial={{
          emailNotifications: record?.emailNotifications ?? true,
          bookingNotifications: record?.bookingNotifications ?? true,
          messageNotifications: record?.messageNotifications ?? true,
        }}
      />
    </div>
  );
}
