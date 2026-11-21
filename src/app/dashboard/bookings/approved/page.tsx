import { requireUser } from "@/lib/session";
import { getPortalBookings } from "@/lib/portal-data";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { BookingsTable } from "@/components/portal/bookings-table";

export default async function ApprovedBookingsPage() {
  const user = await requireUser();
  const bookings = await getPortalBookings(user.id, ["APPROVED"]);
  return (
    <div>
      <PortalPageHeader
        title="Approved Bookings"
        description="Your confirmed reservations and upcoming visits."
      />
      <BookingsTable bookings={bookings} initialFilter="APPROVED" showFilters={false} />
    </div>
  );
}
