import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Info, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toPortalBooking } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { BookingStatusBadge } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/portal/cancel-booking-button";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const row = await prisma.booking
    .findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        service: { select: { name: true } },
        facility: { select: { name: true } },
      },
    })
    .catch(() => null);
  if (!row) notFound();
  const booking = toPortalBooking(row);
  const canCancel = !["CANCELLED", "COMPLETED"].includes(booking.status);

  return (
    <div>
      <Link href="/dashboard/bookings" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to bookings
      </Link>
      <PortalPageHeader
        title={`Booking ${booking.reference}`}
        description={`Submitted ${formatDate(booking.submittedAt)} · ${booking.serviceName}`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="font-mono text-xs font-semibold text-blue-700">{booking.reference}</p>
              <h2 className="mt-1 text-lg font-bold text-ink">{booking.serviceName}</h2>
              <p className="text-sm text-slate-500">{booking.facilityName ?? "No specific facility"}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Booking date</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDate(booking.date)}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Time</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.timeLabel}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Participants</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.attendees}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">Amount</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {booking.amount !== null
                    ? formatCurrency(booking.amount, booking.currency)
                    : "To be confirmed"}
                </dd>
              </div>
            </div>
          </dl>
          {booking.purpose && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Purpose</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{booking.purpose}</p>
            </div>
          )}
          {booking.requirements && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Requirements</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{booking.requirements}</p>
            </div>
          )}
          {booking.statusReason && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Admin note
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{booking.statusReason}</p>
            </div>
          )}
          {booking.suggestedDate && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="text-[11px] font-medium uppercase tracking-wide">Suggested alternative</p>
              <p className="mt-1">
                {formatDate(booking.suggestedDate)}
                {booking.suggestedTime ? ` · ${booking.suggestedTime}` : ""}
              </p>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Payment details</h2>
            {booking.accountDetails || booking.paymentInstructions ? (
              <div className="mt-3 space-y-3 text-sm">
                {booking.accountDetails && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Account details</p>
                    <p className="mt-1 whitespace-pre-wrap text-ink">{booking.accountDetails}</p>
                  </div>
                )}
                {booking.paymentInstructions && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Instructions</p>
                    <p className="mt-1 whitespace-pre-wrap text-ink">{booking.paymentInstructions}</p>
                  </div>
                )}
                <Link href="/dashboard/payments" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
                  View all payments
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No payment details have been issued for this booking yet.
              </p>
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Need help?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Contact the SPAK team if you need to discuss this booking.
            </p>
            <Link href="/dashboard/messages" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Send a message
            </Link>
          </section>
          {canCancel && <CancelBookingButton bookingId={booking.id} />}
        </div>
      </div>
    </div>
  );
}
