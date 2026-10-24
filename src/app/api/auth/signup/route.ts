import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

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
  const raw = randomBytes(32).toString("base64url");
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: raw,
      expires: new Date(Date.now() + 1000 * 60 * 60),
    },
  });
  void sendVerificationEmail({ to: user.email, name: user.name || "there", token: raw }).catch(() => undefined);
  return NextResponse.json({ ok: true }, { status: 201 });
}
