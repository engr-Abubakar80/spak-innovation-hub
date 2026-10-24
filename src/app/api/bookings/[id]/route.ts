import { NextRequest, NextResponse } from "next/server";
import { changeBookingStatus, cancelBookingAsUser } from "@/services/booking-service";
import { bookingStatusSchema, bookingCancelSchema } from "@/lib/validation";
import { getApiAdmin, getApiUser } from "@/lib/api";
import { recordAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({}));
  const admin = await getApiAdmin();
  if (admin) {
    const parsed = bookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    }
    try {
      const booking = await changeBookingStatus(params.id, parsed.data.status, admin.id, parsed.data.reason);
      await recordAudit({
        actorId: admin.id,
        action: `booking.status.${parsed.data.status.toLowerCase()}`,
        entity: "Booking",
        entityId: booking.id,
        metadata: { reference: booking.reference, reason: parsed.data.reason },
      });
      return NextResponse.json(booking);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Could not update booking" },
        { status: err.status || 500 },
      );
    }
  }

  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedCancel = bookingCancelSchema.safeParse(body);
  if (!parsedCancel.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }
  if (parsedCancel.data.reason && parsedCancel.data.reason.toLowerCase().includes("cancel")) {
    // ensure not rejecting
  }
  try {
    const booking = await cancelBookingAsUser(params.id, user.id, parsedCancel.data.reason);
    return NextResponse.json(booking);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Could not cancel booking" },
      { status: err.status || 500 },
    );
  }
}
