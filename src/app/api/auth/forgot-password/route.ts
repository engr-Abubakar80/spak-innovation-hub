import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordReset } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true }, { status: 200 });
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`pwd:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.success) return NextResponse.json({ ok: true }, { status: 200 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const raw = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(raw, 10),
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    void sendPasswordReset({ to: user.email, name: user.name || "there", token: raw }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
