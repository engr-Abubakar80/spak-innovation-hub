import type { Booking, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const STATUS_TITLES: Record<BookingStatus, string> = {
  PENDING: "Booking request received",
  APPROVED: "Your booking has been approved",
  REJECTED: "Your booking was not approved",
  CANCELLED: "Your booking was cancelled",
  COMPLETED: "Your booking is complete",
};

export async function createNotification(input: {
  userId: string;
  type: "booking" | "payment" | "message" | "system";
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch {
    return;
  }
}

export async function notifyBookingCreated(booking: Booking, serviceName: string): Promise<void> {
  if (!booking.userId) return;
  const user = await prisma.user
    .findUnique({
      where: { id: booking.userId },
      select: { bookingNotifications: true },
    })
    .catch(() => null);
  if (user && !user.bookingNotifications) return;
  await createNotification({
    userId: booking.userId,
    type: "booking",
    title: STATUS_TITLES.PENDING,
    body: `Your ${serviceName} request (${booking.reference}) is awaiting administrator review.`,
    link: `/dashboard/bookings/${booking.id}`,
  });
}

export async function notifyBookingStatus(
  booking: Booking,
  serviceName: string,
): Promise<void> {
  if (!booking.userId) return;
  const user = await prisma.user
    .findUnique({
      where: { id: booking.userId },
      select: { bookingNotifications: true },
    })
    .catch(() => null);
  if (user && !user.bookingNotifications) return;
  await createNotification({
    userId: booking.userId,
    type: "booking",
    title: STATUS_TITLES[booking.status],
    body: `${serviceName} (${booking.reference}) is now ${booking.status.toLowerCase()}.${booking.statusReason ? ` ${booking.statusReason}` : ""}`,
    link: `/dashboard/bookings/${booking.id}`,
  });
}

export async function notifyPaymentDetails(
  booking: Booking,
  serviceName: string,
): Promise<void> {
  if (!booking.userId) return;
  await createNotification({
    userId: booking.userId,
    type: "payment",
    title: "Payment details added",
    body: `Payment instructions for ${serviceName} (${booking.reference}) are now available in your payments section.`,
    link: "/dashboard/payments",
  });
}

export async function notifyAdmins(input: {
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<void> {
  const admins = await prisma.user
    .findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
      select: { id: true, messageNotifications: true },
    })
    .catch(() => []);
  await Promise.all(
    admins.filter((admin) => admin.messageNotifications).map((admin) =>
      createNotification({
        userId: admin.id,
        type: "message",
        title: input.title,
        body: input.body,
        link: input.link,
      }),
    ),
  );
}
