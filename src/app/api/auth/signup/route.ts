import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { issueVerificationOtp } from "@/lib/verification-otp";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details" }, { status: 422 });
  }
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`signup:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many signups. Please try again shortly." },
      { status: 429 },
    );
  }
  const { name, email, phone, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
    },
  });
  void issueVerificationOtp(user.email, user.name).catch(() => undefined);
  return NextResponse.json({ ok: true }, { status: 201 });
}
