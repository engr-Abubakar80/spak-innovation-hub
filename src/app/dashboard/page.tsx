import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBookingCounts, toPortalBooking } from "@/lib/portal";
import { BookingStatusBadge } from "@/components/ui/badge";

const QUICK_ACTIONS = [
  {
    href: "/dashboard/bookings/new",
    label: "New Booking",
    hint: "Request a workspace or service",
    icon: CalendarPlus,
  },
  {
    href: "/dashboard/bookings/pending",
    label: "Pending Bookings",
    hint: "Check requests awaiting approval",
    icon: Clock,
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    hint: "Contact SPAK support",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/payments",
    label: "Payments",
    hint: "View payment details",
    icon: CreditCard,
  },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const [settings, bookingRows] = await Promise.all([
    getSettings(),
    prisma.booking
      .findMany({
        where: { userId: user.id },
        include: {
          service: { select: { name: true } },
          facility: { select: { name: true } },
        },
        orderBy: { submittedAt: "desc" },
      })
      .catch(() => []),
  ]);
  const bookings = bookingRows.map(toPortalBooking);
  const counts = getBookingCounts(bookings);
  const firstName = (user.name || "there").trim().split(/\s+/)[0] || "there";

  const stats = [
    {
      label: "Total Bookings",
      value: counts.total,
      hint: "All reservations on your account",
      icon: ReceiptText,
      color: "bg-sky-50 text-blue-600",
    },
    {
      label: "Pending Bookings",
      value: counts.pending,
      hint: "Awaiting administrator review",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Approved Bookings",
      value: counts.approved,
      hint: "Confirmed reservations",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Completed Bookings",
      value: counts.completed,
      hint: "Successfully completed",
      icon: Sparkles,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">
            Member Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#172b43] sm:text-[25px]">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your workspace reservations and stay connected with SPAK Innovation Hub.
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Make a New Booking
        </Link>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{stat.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
            </div>
            <strong className="mt-3 block text-[27px] font-bold text-[#172b43]">{stat.value}</strong>
            <small className="text-[11px] text-slate-500">{stat.hint}</small>
          </div>
        ))}
      </div>

      <section className="mb-[18px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Quick Actions</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Get things done faster</p>
          </div>
        </div>
        <div className="grid gap-2.5 p-5 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-blue-300 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <action.icon className="h-[17px] w-[17px]" aria-hidden />
              </span>
              <span>
                <b className="block text-xs text-ink">{action.label}</b>
                <small className="text-[10px] text-slate-500">{action.hint}</small>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-[18px] xl:grid-cols-[1.55fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Recent Booking Activity</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Your latest workspace reservations</p>
            </div>
            <Link href="/dashboard/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Booking</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      No booking activity yet. Start with a new booking.
                    </td>
                  </tr>
                ) : (
                  bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="border-t border-slate-100">
                      <td className="px-4 py-3.5">
                        <Link href={`/dashboard/bookings/${booking.id}`} className="font-semibold text-ink hover:text-blue-600">
                          {booking.serviceName}
                        </Link>
                        <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                          {booking.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{formatDate(booking.date)}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {booking.amount !== null
                          ? formatCurrency(booking.amount, booking.currency)
                          : "To be confirmed"}
                      </td>
                      <td className="px-4 py-3.5">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Important Notice</h2>
          <div className="mt-4 space-y-3 text-[11px] leading-relaxed text-slate-600">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <b className="text-blue-900">Booking approval:</b> {settings["booking.policy"]}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <b className="text-blue-900">Need assistance?</b> Send a message through the portal and
              our team will get back to you.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
