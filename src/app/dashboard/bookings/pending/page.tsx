import { requireUser } from "@/lib/session";
import { getPortalBookings } from "@/lib/portal-data";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { BookingsTable } from "@/components/portal/bookings-table";

export default async function PendingBookingsPage() {
  const user = await requireUser();
  const bookings = await getPortalBookings(user.id, ["PENDING"]);
  return (
    <div>
      <PortalPageHeader
        title="Pending Bookings"
        description="Reservations waiting for review by the SPAK administration team."
      />
      <BookingsTable bookings={bookings} initialFilter="PENDING" showFilters={false} />
    </div>
  );
}
