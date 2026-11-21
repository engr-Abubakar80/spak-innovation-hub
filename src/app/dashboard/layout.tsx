import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  LayoutDashboard,
  Mail,
  Shield,
  UserCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { UserMenu } from "@/components/layout/user-menu";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
  { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dashboard/messages", label: "Messages", icon: Mail },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  const [settings, pending, messages, notifications] = await Promise.all([
    getSettings(),
    prisma.booking.count({ where: { userId: user.id, status: "PENDING" } }).catch(() => 0),
    prisma.message
      .count({
        where: {
          userId: user.id,
          authorId: { not: user.id },
          readAt: null,
        },
      })
      .catch(() => 0),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0),
  ]);

  return (
    <PortalShell
      logoUrl={settings["branding.logo"]}
      user={{
        name: user.name || user.email || "SPAK Member",
        email: user.email,
        role: user.role,
        isAdmin: isAdmin(user.role),
      }}
      counts={{ pending, messages, notifications }}
    >
      {children}
    </PortalShell>
  );
}
