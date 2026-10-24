import { NextRequest, NextResponse } from "next/server";
import { programmeRegistrationSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = programmeRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details" }, { status: 422 });
  }
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`prog:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many submissions. Please try again shortly." }, { status: 429 });
  }
  const programme = await prisma.programme.findUnique({ where: { id: parsed.data.programmeId } });
  if (!programme || programme.status !== "PUBLISHED" || !programme.registrationOpen) {
    return NextResponse.json({ error: "Registration is not currently open." }, { status: 409 });
  }
  const reg = await prisma.programmeRegistration.upsert({
    where: { programmeId_email: { programmeId: programme.id, email: parsed.data.email } },
    update: { phone: parsed.data.phone || null, organization: parsed.data.organization || null },
    create: {
      programmeId: programme.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      organization: parsed.data.organization || null,
    },
  });
  return NextResponse.json({ ok: true, id: reg.id }, { status: 201 });
}
