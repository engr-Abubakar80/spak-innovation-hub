import { requireUser } from "@/lib/session";
import { getPortalBookings } from "@/lib/portal-data";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { BookingsTable } from "@/components/portal/bookings-table";

export default async function BookingHistoryPage() {
  const user = await requireUser();
  const bookings = await getPortalBookings(user.id, ["COMPLETED", "REJECTED", "CANCELLED"]);
  return (
    <div>
      <PortalPageHeader
        title="Booking History"
        description="Review completed, rejected and cancelled reservations."
      />
      <BookingsTable
        bookings={bookings}
        initialFilter="HISTORY"
        showFilters={false}
        compact
      />
    </div>
  );
}
