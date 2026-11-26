import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyVerificationOtp } from "@/lib/verification-otp";

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=missing-token", request.url));

  const v = await prisma.verificationToken.findFirst({ where: { token } });
  if (!v || v.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=token-expired", request.url));
  }

  const user = await prisma.user.findUnique({ where: { email: v.identifier } });
  if (!user) return NextResponse.redirect(new URL("/login?error=invalid-token", request.url));

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { token: v.token } });
  return NextResponse.redirect(new URL("/login?verified=1", request.url));
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`verify:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const parsed = otpSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid 6-digit code." }, { status: 422 });
  }

  const verified = await verifyVerificationOtp(parsed.data.email, parsed.data.otp);
  if (!verified) {
    return NextResponse.json(
      { error: "That code is invalid or has expired." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
