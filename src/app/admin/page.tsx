import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CalendarCheck, Users, Mail, ClipboardList } from "lucide-react";

export default async function AdminOverviewPage() {
  const user = await requireAdmin();
  const [users, bookings, enquiries] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.enquiry.count(),
  ]);
  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Manage bookings, users, enquiries and website content." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users} icon={Users} tone="brand" />
        <StatCard label="Bookings" value={bookings} icon={CalendarCheck} tone="amber" />
        <StatCard label="Enquiries" value={enquiries} icon={Mail} tone="sky" />
        <StatCard label="Status" value="Active" icon={ClipboardList} tone="emerald" />
      </div>
    </div>
  );
}
