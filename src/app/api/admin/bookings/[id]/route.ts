import { NextRequest, NextResponse } from "next/server";
import { changeBookingStatus } from "@/services/booking-service";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendBookingStatusUpdate } from "@/lib/email";

export const dynamic = "force-dynamic";

function parseTimeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({}));
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = body.status as any;
  const reason = typeof body.reason === "string" ? body.reason : null;
  const amountToPay = body.amountToPay === null || body.amountToPay === undefined ? null : Number(body.amountToPay);
  const accountDetails = typeof body.accountDetails === "string" ? body.accountDetails : null;
  const paymentInstructions = typeof body.paymentInstructions === "string" ? body.paymentInstructions : null;
  const suggestedDate = body.suggestedDate ? new Date(body.suggestedDate) : null;
  const suggestedStartMinute = typeof body.suggestedTime === "string" && body.suggestedTime ? parseTimeToMinutes(body.suggestedTime) : null;

  try {
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        statusReason: reason,
        statusChangedAt: new Date(),
        amountToPay: amountToPay !== null && !isNaN(amountToPay) ? amountToPay : null,
        accountDetails,
        paymentInstructions,
        suggestedDate,
        suggestedStartMinute,
        adminNote: reason,
      },
      include: { service: true, facility: true, user: true },
    });
    await recordAudit({
      actorId: admin.id,
      action: `booking.status.${String(status).toLowerCase()}`,
      entity: "Booking",
      entityId: booking.id,
      metadata: { reference: booking.reference, reason, amountToPay },
    });
    const email = booking.user?.email || booking.guestEmail;
    if (email) {
    void sendBookingStatusUpdate({
      to: email,
      name: booking.user?.name || booking.guestName || "there",
      reference: booking.reference,
      status: status,
      serviceName: booking.service?.name || "Service",
      date: booking.date ? new Date(booking.date).toISOString().slice(0, 10) : "",
      reason: reason || undefined,
    }).catch(() => undefined);
    }
    return NextResponse.json(booking);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not update booking" }, { status: err.status || 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true, facility: true, user: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}
