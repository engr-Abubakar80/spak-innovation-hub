import { describe, expect, it } from "vitest";
import type { BookingStatus } from "@prisma/client";
import {
  filterPortalBookings,
  getBookingCounts,
  toPortalBooking,
  type PortalBookingRow,
} from "@/lib/portal";

function row(id: string, status: BookingStatus, reference: string): PortalBookingRow {
  return {
    id,
    reference,
    date: new Date("2026-12-01T00:00:00.000Z"),
    startMinute: 570,
    endMinute: 660,
    status,
    submittedAt: new Date("2026-11-20T10:00:00.000Z"),
    statusChangedAt: new Date("2026-11-20T10:00:00.000Z"),
    currency: "NGN",
    amountToPay: "25000",
    attendees: 4,
    service: { name: "Meeting Room" },
    facility: { name: "Room 1" },
  };
}

describe("portal booking helpers", () => {
  it("maps stored rows to portal bookings", () => {
    const result = toPortalBooking(row("1", "PENDING", "SPAK-001"));
    expect(result.timeLabel).toBe("9:30 AM – 11:00 AM");
    expect(result.amount).toBe(25000);
    expect(result.statusChangedAt).toBe("2026-11-20T10:00:00.000Z");
    expect(result.serviceName).toBe("Meeting Room");
    expect(result.facilityName).toBe("Room 1");
  });

  it("filters by status, history and search text", () => {
    const bookings = [
      toPortalBooking(row("1", "PENDING", "SPAK-001")),
      toPortalBooking(row("2", "APPROVED", "SPAK-002")),
      toPortalBooking(row("3", "COMPLETED", "SPAK-003")),
    ];
    expect(filterPortalBookings(bookings, "PENDING")).toHaveLength(1);
    expect(filterPortalBookings(bookings, "HISTORY")).toHaveLength(1);
    expect(filterPortalBookings(bookings, "ALL", "spak-002")).toHaveLength(1);
    expect(filterPortalBookings(bookings, "ALL", "missing")).toHaveLength(0);
  });

  it("counts dashboard booking states", () => {
    const bookings = [
      toPortalBooking(row("1", "PENDING", "SPAK-001")),
      toPortalBooking(row("2", "PENDING", "SPAK-002")),
      toPortalBooking(row("3", "COMPLETED", "SPAK-003")),
    ];
    expect(getBookingCounts(bookings)).toEqual({
      total: 3,
      pending: 2,
      approved: 0,
      completed: 1,
    });
  });
});
