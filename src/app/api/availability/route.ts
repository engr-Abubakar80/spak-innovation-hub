import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWeeklyAvailability, getBookedSlots } from "@/lib/availability";
import { toDateOnly } from "@/lib/utils";
import { z } from "zod";

const querySchema = z.object({
  serviceId: z.string().min(1),
  facilityId: z.string().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const { serviceId, facilityId, date } = parsed.data;
  const fId = facilityId || null;
  const d = toDateOnly(date);

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { facilities: true },
  });
  if (!service || !service.published) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 404 });
  }

  let capacity: number | null = null;
  if (fId) {
    const f = service.facilities.find((x) => x.id === fId);
    if (!f || !f.published) {
      return NextResponse.json({ error: "Facility unavailable" }, { status: 404 });
    }
    capacity = f.capacity;
  }

  const windows = await getWeeklyAvailability(fId, serviceId);
  const day = windows?.find((w) => w.dayOfWeek === d.getUTCDay()) ?? null;
  const booked = fId ? await getBookedSlots(fId, d) : [];

  return NextResponse.json({
    window: day
      ? { openMinute: day.openMinute, closeMinute: day.closeMinute, isClosed: day.isClosed }
      : null,
    booked,
    minDuration: service.minDuration,
    slotMinutes: service.slotMinutes,
    capacity,
    requiresApproval: service.requiresApproval,
  });
}
