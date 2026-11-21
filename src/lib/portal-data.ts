import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toPortalBooking, type PortalBooking } from "@/lib/portal";

export async function getPortalBookings(
  userId: string,
  statuses?: BookingStatus[],
): Promise<PortalBooking[]> {
  const rows = await prisma.booking
    .findMany({
      where: {
        userId,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: {
        service: { select: { name: true } },
        facility: { select: { name: true } },
      },
      orderBy: { submittedAt: "desc" },
    })
    .catch(() => []);
  return rows.map(toPortalBooking);
}
