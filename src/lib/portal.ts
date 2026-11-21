import type { BookingStatus } from "@prisma/client";
import { formatTimeLabel, toNumber } from "@/lib/utils";

export type BookingFilter = BookingStatus | "ALL" | "HISTORY";

export const HISTORY_STATUSES: BookingStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];

export interface PortalBooking {
  id: string;
  reference: string;
  serviceName: string;
  facilityName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  amount: number | null;
  currency: string;
  status: BookingStatus;
  submittedAt: string;
  statusChangedAt: string;
  statusReason: string | null;
  adminNote: string | null;
  accountDetails: string | null;
  paymentInstructions: string | null;
  suggestedDate: string | null;
  suggestedTime: string | null;
  attendees: number;
  purpose: string | null;
  requirements: string | null;
  organization: string | null;
}

export interface PortalBookingRow {
  id: string;
  reference: string;
  date: Date;
  startMinute: number;
  endMinute: number;
  status: BookingStatus;
  submittedAt: Date;
  statusChangedAt: Date;
  currency: string;
  amountToPay: unknown;
  statusReason?: string | null;
  adminNote?: string | null;
  accountDetails?: string | null;
  paymentInstructions?: string | null;
  suggestedDate?: Date | null;
  suggestedStartMinute?: number | null;
  suggestedEndMinute?: number | null;
  attendees: number;
  purpose?: string | null;
  requirements?: string | null;
  organization?: string | null;
  service?: { name: string } | null;
  facility?: { name: string } | null;
}

export function toPortalBooking(row: PortalBookingRow): PortalBooking {
  return {
    id: row.id,
    reference: row.reference,
    serviceName: row.service?.name ?? "Service",
    facilityName: row.facility?.name ?? null,
    date: row.date.toISOString(),
    startTime: formatTimeLabel(row.startMinute),
    endTime: formatTimeLabel(row.endMinute),
    timeLabel: `${formatTimeLabel(row.startMinute)} – ${formatTimeLabel(row.endMinute)}`,
    amount: toNumber(row.amountToPay),
    currency: row.currency || "NGN",
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    statusChangedAt: row.statusChangedAt.toISOString(),
    statusReason: row.statusReason ?? null,
    adminNote: row.adminNote ?? null,
    accountDetails: row.accountDetails ?? null,
    paymentInstructions: row.paymentInstructions ?? null,
    suggestedDate: row.suggestedDate ? row.suggestedDate.toISOString() : null,
    suggestedTime:
      row.suggestedStartMinute !== null && row.suggestedStartMinute !== undefined
        ? formatTimeLabel(row.suggestedStartMinute)
        : null,
    attendees: row.attendees,
    purpose: row.purpose ?? null,
    requirements: row.requirements ?? null,
    organization: row.organization ?? null,
  };
}

export function filterPortalBookings(
  bookings: PortalBooking[],
  filter: BookingFilter,
  query = "",
): PortalBooking[] {
  const search = query.trim().toLowerCase();
  return bookings.filter((booking) => {
    const matchesStatus =
      filter === "ALL" ||
      (filter === "HISTORY" ? HISTORY_STATUSES.includes(booking.status) : booking.status === filter);
    if (!matchesStatus) return false;
    if (!search) return true;
    return [
      booking.reference,
      booking.serviceName,
      booking.facilityName ?? "",
      booking.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export function getBookingCounts(bookings: PortalBooking[]) {
  return {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
  };
}
