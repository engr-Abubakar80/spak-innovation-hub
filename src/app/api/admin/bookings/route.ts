import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiAdmin } from "@/lib/api";
import type { BookingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = request.nextUrl;
  const status = url.searchParams.get("status") as BookingStatus | null;
  const q = url.searchParams.get("q") || "";
  const where: { status?: BookingStatus; OR?: Array<{ reference?: { contains: string; mode: string }; guestName?: { contains: string; mode: string }; guestEmail?: { contains: string; mode: string } }> } = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { guestName: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
    ];
  }
  const bookings = await prisma.booking.findMany({
    where,
    include: { service: { select: { name: true } }, facility: { select: { name: true } }, user: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
    take: 500,
  });
  return NextResponse.json(bookings);
}
