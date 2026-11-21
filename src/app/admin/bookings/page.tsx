import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { AdminBookingManager } from "@/components/admin/admin-booking-manager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireSuperAdmin();
  const bookings = await prisma.booking.findMany({
    include: {
      service: { select: { name: true } },
      facility: { select: { name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Approve, reject, suggest another date/time, add account details and total amount to pay. Users see updates in their profile."
      />
      <AdminBookingManager bookings={JSON.parse(JSON.stringify(bookings))} />
    </div>
  );
}
