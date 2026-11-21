"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import {
  filterPortalBookings,
  type BookingFilter,
  type PortalBooking,
} from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookingStatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const HISTORY_STATUSES: BookingStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];

export function BookingsTable({
  bookings,
  initialFilter = "ALL",
  showFilters = true,
  showSearch = true,
  compact = false,
}: {
  bookings: PortalBooking[];
  initialFilter?: BookingFilter;
  showFilters?: boolean;
  showSearch?: boolean;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<BookingFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => filterPortalBookings(bookings, filter, query),
    [bookings, filter, query],
  );

  return (
    <div>
      {(showFilters || showSearch) && (
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          {showFilters ? (
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
                    filter === item.value
                      ? "border-blue-200 bg-blue-50 font-bold text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          {showSearch && (
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search booking or service…"
                aria-label="Search bookings"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Booking Reference</th>
                <th className="px-4 py-3 font-semibold">Facility / Service</th>
                <th className="px-4 py-3 font-semibold">Booking Date</th>
                {!compact && <th className="px-4 py-3 font-semibold">Time</th>}
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={compact ? 6 : 7} className="px-4 py-12 text-center">
                    <span className="mb-2 block text-2xl text-slate-300" aria-hidden>
                      ▤
                    </span>
                    <span className="text-sm text-slate-500">No bookings found.</span>
                  </td>
                </tr>
              ) : (
                rows.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <b className="font-mono text-[11px] text-ink">{booking.reference}</b>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-ink">{booking.serviceName}</span>
                      {booking.facilityName && (
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {booking.facilityName}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {formatDate(booking.date)}
                    </td>
                    {!compact && (
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {booking.timeLabel}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {booking.amount !== null
                        ? formatCurrency(booking.amount, booking.currency)
                        : "To be confirmed"}
                    </td>
                    <td className="px-4 py-3.5">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="whitespace-nowrap text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {initialFilter === "ALL" && showFilters && (
        <p className="sr-only">
          Showing {rows.length} of {bookings.length} bookings
        </p>
      )}
      {initialFilter === "HISTORY" && (
        <p className="sr-only">
          History includes {HISTORY_STATUSES.join(", ")} bookings
        </p>
      )}
    </div>
  );
}
