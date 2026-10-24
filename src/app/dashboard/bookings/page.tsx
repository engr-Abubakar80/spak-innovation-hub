import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStatusBadge } from "@/components/ui/badge";
import { formatDate, formatTimeLabel } from "@/lib/utils";

export default async function DashboardBookingsPage() {
  const user = await requireUser();
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { service: { select: { name: true } }, facility: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="My bookings" description="Track your booking requests and payment details from the admin." />
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-ink-muted">You have no bookings yet.</div>
        ) : (
          bookings.map((b: any) => (
            <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{b.service.name}</p>
                  <p className="text-sm text-ink-muted">
                    {b.facility?.name ?? "—"} · {formatDate(b.date)} · {formatTimeLabel(b.startMinute)} – {formatTimeLabel(b.endMinute)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Reference: {b.reference}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              {(b.amountToPay || b.accountDetails || b.paymentInstructions) && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-ink">Payment details</p>
                  {b.amountToPay && (
                    <p className="mt-1 text-sm text-ink">
                      Amount to pay: <span className="font-semibold">{b.currency || "NGN"} {Number(b.amountToPay).toLocaleString()}</span>
                    </p>
                  )}
                  {b.accountDetails && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-ink-muted">Account details</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{b.accountDetails}</p>
                    </div>
                  )}
                  {b.paymentInstructions && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-ink-muted">Payment instructions</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{b.paymentInstructions}</p>
                    </div>
                  )}
                </div>
              )}
              {b.statusReason && (
                <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-medium text-ink-muted">Admin note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{b.statusReason}</p>
                </div>
              )}
              {(b.suggestedDate || b.suggestedStartMinute) && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">Suggested alternative</p>
                  <p className="mt-1 text-sm text-amber-900">
                    {b.suggestedDate ? formatDate(b.suggestedDate) : ""} {b.suggestedStartMinute !== null ? `· ${formatTimeLabel(b.suggestedStartMinute)}` : ""}
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
