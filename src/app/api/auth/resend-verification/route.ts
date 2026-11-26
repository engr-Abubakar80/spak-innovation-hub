import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { issueVerificationOtp } from "@/lib/verification-otp";

export const dynamic = "force-dynamic";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`resend-otp:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many code requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const parsed = resendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await issueVerificationOtp(email, user.name).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
