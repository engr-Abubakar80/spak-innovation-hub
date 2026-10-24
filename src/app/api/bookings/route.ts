import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/services/booking-service";
import { bookingCreateSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking details", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit(`book:${ip}`, 5, 5 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many booking requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const user = await getCurrentUser();
  try {
    const booking = await createBooking(parsed.data, user ? { userId: user.id, name: user.name, email: user.email, phone: user.phone } : null);
    return NextResponse.json({ ok: true, reference: booking.reference, id: booking.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Booking could not be created" },
      { status: err.status || 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Let dashboard fetch own bookings; admin has separate endpoint.
  const { prisma } = await import("@/lib/db");
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { service: { select: { name: true } }, facility: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(bookings);
}
