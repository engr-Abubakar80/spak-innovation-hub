import { NextRequest, NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { sendEnquiryAcknowledgement } from "@/lib/email";
import { getApiAdmin } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enquiry details" }, { status: 422 });
  }
  const { honeypot, ...data } = parsed.data as any;
  if (honeypot && honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`enq:${ip}`, 5, 5 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many enquiries submitted. Please try again shortly." },
      { status: 429 },
    );
  }
  const enquiry = await prisma.enquiry.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      source: "contact",
      serviceId: data.serviceId || null,
    },
  });
  void sendEnquiryAcknowledgement({ to: enquiry.email, name: enquiry.name, subject: enquiry.subject }).catch(() => undefined);
  return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201 });
}

export async function GET() {
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const enquiries = await prisma.enquiry.findMany({
    include: { service: { select: { name: true } }, assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(enquiries);
}
