import { Prisma, type Booking, type BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkAvailability } from "@/lib/availability";
import { timeToMinutes, generateBookingReference, minutesToTime, formatTimeLabel } from "@/lib/utils";
import type { BookingCreateInput } from "@/lib/validation";
import { sendBookingAcknowledgement, sendBookingStatusUpdate } from "@/lib/email";

export interface BookingActor {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export class BookingError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "BOOKING_ERROR", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function uniqueReference(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const ref = generateBookingReference();
    const clash = await prisma.booking.findUnique({ where: { reference: ref } });
    if (!clash) return ref;
  }
  return `SPAK-${Date.now().toString(36).toUpperCase()}`;
}

/** Retry wrapper for serializable transactions that hit write conflicts. */
async function withSerializableRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!isConflict) throw error;
    }
  }
  throw lastError;
}

export async function createBooking(
  input: BookingCreateInput,
  actor: BookingActor | null,
): Promise<Booking> {
  const startMinute = timeToMinutes(input.startTime);
  const endMinute = timeToMinutes(input.endTime);
  if (startMinute === null || endMinute === null) {
    throw new BookingError("Invalid time supplied.", "INVALID_TIME", 422);
  }

  const isGuest = !actor?.userId;
  if (isGuest) {
    if (!input.guestName || !input.guestEmail || !input.guestPhone) {
      throw new BookingError(
        "Name, email and phone number are required for guest bookings.",
        "GUEST_DETAILS_REQUIRED",
        422,
      );
    }
  }

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { facilities: true },
  });
  if (!service || !service.published) {
    throw new BookingError("The selected service is not available.", "SERVICE_UNAVAILABLE", 404);
  }

  const facilityId = input.facilityId || null;
  const reference = await uniqueReference();

  const booking = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const availability = await checkAvailability(
          {
            serviceId: service.id,
            facilityId,
            date: input.date,
            startMinute,
            endMinute,
            attendees: input.attendees,
          },
          tx as typeof prisma,
        );
        if (!availability.available) {
          throw new BookingError(availability.reason || "Slot unavailable.", "SLOT_UNAVAILABLE", 409);
        }

        return tx.booking.create({
          data: {
            reference,
            userId: actor?.userId ?? null,
            guestName: isGuest ? input.guestName : actor?.name ?? null,
            guestEmail: isGuest ? input.guestEmail : actor?.email ?? null,
            guestPhone: isGuest ? input.guestPhone : actor?.phone ?? null,
            organization: input.organization || null,
            serviceId: service.id,
            facilityId,
            date: new Date(`${input.date}T00:00:00.000Z`),
            startMinute,
            endMinute,
            attendees: input.attendees,
            purpose: input.purpose || null,
            requirements: input.requirements || null,
            eventType: input.eventType || null,
            preferredContact: input.preferredContact,
            status: "PENDING",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );

  const email = actor?.userId ? actor?.email : input.guestEmail;
  const name = actor?.userId ? actor?.name : input.guestName;
  if (email) {
    void sendBookingAcknowledgement({
      to: email,
      name: name || "there",
      reference: booking.reference,
      serviceName: service.name,
      date: input.date,
      time: `${formatTimeLabel(startMinute)} – ${formatTimeLabel(endMinute)}`,
      requiresApproval: service.requiresApproval,
    }).catch(() => undefined);
  }

  return booking;
}

/**
 * Change a booking status. Approval re-verifies availability inside a
 * serializable transaction to guarantee no two overlapping bookings are ever
 * confirmed for the same exclusive facility.
 */
export async function changeBookingStatus(
  bookingId: string,
  status: BookingStatus,
  actorId: string | null,
  reason?: string | null,
): Promise<Booking> {
  const updated = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { service: true },
        });
        if (!booking) throw new BookingError("Booking not found.", "NOT_FOUND", 404);

        if (status === "APPROVED") {
          const availability = await checkAvailability(
            {
              serviceId: booking.serviceId,
              facilityId: booking.facilityId,
              date: booking.date,
              startMinute: booking.startMinute,
              endMinute: booking.endMinute,
              attendees: booking.attendees,
              excludeBookingId: booking.id,
            },
            tx as typeof prisma,
          );
          if (!availability.available) {
            throw new BookingError(
              availability.reason || "Cannot approve — the slot is no longer available.",
              "SLOT_UNAVAILABLE",
              409,
            );
          }
        }

        return tx.booking.update({
          where: { id: bookingId },
          data: {
            status,
            statusReason: reason || null,
            statusChangedAt: new Date(),
          },
          include: { service: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );

  const recipientEmail = updated.userId ? null : updated.guestEmail;
  const email = recipientEmail ?? (await userEmail(updated.userId));
  if (email) {
    void sendBookingStatusUpdate({
      to: email,
      name: updated.userId ? await userName(updated.userId) : updated.guestName || "there",
      reference: updated.reference,
      status: updated.status,
      serviceName: updated.service.name,
      date: updated.date.toISOString().slice(0, 10),
      reason: updated.statusReason,
    }).catch(() => undefined);
  }

  return updated;
}

async function userEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email ?? null;
}

async function userName(userId: string | null): Promise<string> {
  if (!userId) return "there";
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name ?? "there";
}

/** Allow an authenticated owner to cancel their own eligible booking. */
export async function cancelBookingAsUser(
  bookingId: string,
  userId: string,
  reason?: string | null,
): Promise<Booking> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError("Booking not found.", "NOT_FOUND", 404);
  if (booking.userId !== userId) {
    throw new BookingError("You cannot modify this booking.", "FORBIDDEN", 403);
  }
  if (booking.status === "COMPLETED") {
    throw new BookingError("Completed bookings cannot be cancelled.", "INVALID_STATE", 409);
  }
  if (booking.status === "CANCELLED") {
    throw new BookingError("This booking is already cancelled.", "INVALID_STATE", 409);
  }
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      statusReason: reason || "Cancelled by user.",
      statusChangedAt: new Date(),
    },
  });
}

export { minutesToTime };
