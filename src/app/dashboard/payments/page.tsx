import Link from "next/link";
import { CreditCard, Info } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toPortalBooking } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PortalPageHeader } from "@/components/portal/portal-page-header";

export default async function PaymentsPage() {
  const user = await requireUser();
  const rows = await prisma.booking
    .findMany({
      where: {
        userId: user.id,
        OR: [
          { amountToPay: { not: null } },
          { accountDetails: { not: null } },
          { paymentInstructions: { not: null } },
        ],
      },
      include: {
        service: { select: { name: true } },
        facility: { select: { name: true } },
      },
      orderBy: { submittedAt: "desc" },
    })
    .catch(() => []);
  const payments = rows.map(toPortalBooking);

  return (
    <div>
      <PortalPageHeader
        title="Payments"
        description="View payment instructions and the payment status of your bookings."
      />
      <div className="mb-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Only make payments using official SPAK payment instructions. Amounts and account details
          below are issued by the administrator on your booking. SPAK does not currently store
          separate transaction references or proof-of-payment records.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <CreditCard className="h-4 w-4 text-blue-600" aria-hidden />
          <h2 className="text-sm font-semibold text-ink">Payment Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Booking Reference</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment Date</th>
                <th className="px-4 py-3 font-semibold">Payment Status</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No payment details have been issued yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const complete = payment.status === "COMPLETED";
                  return (
                    <tr key={payment.id} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-blue-700">
                        {payment.reference}
                      </td>
                      <td className="px-4 py-3.5">
                        <b className="block text-ink">{payment.serviceName}</b>
                        <small className="text-[10px] text-slate-500">
                          {formatDate(payment.date)}
                        </small>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-ink">
                        {payment.amount !== null
                          ? formatCurrency(payment.amount, payment.currency)
                          : "On request"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {complete ? formatDate(payment.statusChangedAt) : "Not recorded"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            complete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {complete ? "Completed" : "Awaiting confirmation"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/bookings/${payment.id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          View instructions
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
