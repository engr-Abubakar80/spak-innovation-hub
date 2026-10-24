import { prisma } from "./db";
import { toDateOnly } from "./utils";

export interface AvailabilityQuery {
  serviceId: string;
  facilityId?: string | null;
  date: Date | string;
  startMinute: number;
  endMinute: number;
  attendees?: number;
  excludeBookingId?: string;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0 = Sunday
  openMinute: number;
  closeMinute: number;
  isClosed: boolean;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

/** Statuses that occupy a slot exclusively once confirmed. */
export const BLOCKING_STATUSES = ["APPROVED"] as const;

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Resolve effective opening hours for a facility on a given weekday.
 * Falls back to the parent service hours (open every day) when the facility
 * does not define its own weekly availability.
 */
export async function getWeeklyAvailability(
  facilityId: string | null | undefined,
  serviceId: string,
): Promise<AvailabilityWindow[] | null> {
  if (facilityId) {
    const rows = await prisma.facilityAvailability.findMany({
      where: { facilityId },
      orderBy: { dayOfWeek: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        openMinute: r.openMinute,
        closeMinute: r.closeMinute,
        isClosed: r.isClosed,
      }));
    }
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return null;

  return Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    openMinute: service.operatingStart,
    closeMinute: service.operatingEnd,
    isClosed: false,
  }));
}

export async function checkAvailability(
  query: AvailabilityQuery,
  client: typeof prisma = prisma,
): Promise<AvailabilityResult> {
  const { serviceId, facilityId, startMinute, endMinute, attendees, excludeBookingId } =
    query;
  const date = toDateOnly(query.date);

  if (startMinute >= endMinute) {
    return { available: false, reason: "End time must be after start time." };
  }

  const service = await client.service.findUnique({
    where: { id: serviceId },
    include: { facilities: true },
  });
  if (!service || !service.published) {
    return { available: false, reason: "This service is not currently available." };
  }

  if (endMinute - startMinute < service.minDuration) {
    return {
      available: false,
      reason: `Minimum booking duration is ${service.minDuration} minutes.`,
    };
  }

  let capacity = service.facilities.length === 0 ? Number.MAX_SAFE_INTEGER : 0;
  if (facilityId) {
    const facility = service.facilities.find((f) => f.id === facilityId);
    if (!facility || !facility.published) {
      return { available: false, reason: "The selected facility is unavailable." };
    }
    capacity = facility.capacity ?? Number.MAX_SAFE_INTEGER;
  } else if (service.facilities.length > 0) {
    // Service has facilities; caller must choose one.
    return { available: false, reason: "Please select a facility." };
  }

  if (attendees && attendees > capacity) {
    return {
      available: false,
      reason: `This facility accommodates a maximum of ${capacity} attendees.`,
    };
  }

  const today = toDateOnly(new Date());
  if (date.getTime() < today.getTime()) {
    return { available: false, reason: "The selected date is in the past." };
  }

  const windows = await getWeeklyAvailability(facilityId, serviceId);
  if (windows) {
    const day = windows.find((w) => w.dayOfWeek === date.getUTCDay());
    if (!day || day.isClosed) {
      return { available: false, reason: "The facility is closed on the selected day." };
    }
    if (startMinute < day.openMinute || endMinute > day.closeMinute) {
      return {
        available: false,
        reason: "The selected time falls outside operating hours.",
      };
    }
  }

  if (facilityId) {
    const blackout = await client.facilityBlackout.findFirst({
      where: {
        facilityId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
    if (blackout) {
      return { available: false, reason: "The facility is unavailable on this date." };
    }

    const conflict = await client.booking.findFirst({
      where: {
        facilityId,
        date,
        status: { in: [...BLOCKING_STATUSES] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        startMinute: { lt: endMinute },
        endMinute: { gt: startMinute },
      },
      select: { reference: true },
    });
    if (conflict) {
      return {
        available: false,
        reason: "This time slot is already reserved. Please choose another time.",
      };
    }
  }

  return { available: true };
}

/**
 * List taken (confirmed) slots for a facility on a date, so the UI can grey out
 * unavailable times. Returns minute ranges.
 */
export async function getBookedSlots(
  facilityId: string,
  date: Date | string,
): Promise<Array<{ startMinute: number; endMinute: number }>> {
  const d = toDateOnly(date);
  const rows = await prisma.booking.findMany({
    where: {
      facilityId,
      date: d,
      status: { in: [...BLOCKING_STATUSES] },
    },
    select: { startMinute: true, endMinute: true },
    orderBy: { startMinute: "asc" },
  });
  return rows;
}

export { overlaps };
