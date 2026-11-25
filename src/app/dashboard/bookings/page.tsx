import { requireUser } from "@/lib/session";
import { getPortalBookings } from "@/lib/portal-data";
import type { PortalBooking } from "@/lib/portal";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardBookingsPage() {
  const user = await requireUser();
  const bookings = await getPortalBookings(user.id);

  return (
    <div>
      <PageHeader
        title="My bookings"
        description="Track your booking requests and payment details from the admin."
      />
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-ink-muted">
            You have no bookings yet.
          </div>
        ) : (
          bookings.map((booking: PortalBooking) => (
            <div key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{booking.serviceName}</p>
                  <p className="text-sm text-ink-muted">
                    {booking.facilityName ?? "—"} · {formatDate(booking.date)} · {booking.timeLabel}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Reference: {booking.reference}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
              {(booking.amount !== null || booking.accountDetails || booking.paymentInstructions) && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-ink">Payment details</p>
                  {booking.amount !== null && (
                    <p className="mt-1 text-sm text-ink">
                      Amount to pay:{" "}
                      <span className="font-semibold">
                        {formatCurrency(booking.amount, booking.currency)}
                      </span>
                    </p>
                  )}
                  {booking.accountDetails && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-ink-muted">Account details</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {booking.accountDetails}
                      </p>
                    </div>
                  )}
                  {booking.paymentInstructions && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-ink-muted">Payment instructions</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {booking.paymentInstructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {booking.statusReason && (
                <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-medium text-ink-muted">Admin note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{booking.statusReason}</p>
                </div>
              )}
              {(booking.suggestedDate || booking.suggestedTime) && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">Suggested alternative</p>
                  <p className="mt-1 text-sm text-amber-900">
                    {booking.suggestedDate ? formatDate(booking.suggestedDate) : ""}{" "}
                    {booking.suggestedTime ? `· ${booking.suggestedTime}` : ""}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
