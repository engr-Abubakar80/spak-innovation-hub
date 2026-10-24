import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`rpwd:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const token = parsed.data.token;
  const tokens = await prisma.passwordResetToken.findMany({
    where: { usedAt: null, expires: { gt: new Date() } },
    include: { user: true },
  });
  let match = null;
  for (const t of tokens) {
    if (await bcrypt.compare(token, t.tokenHash)) {
      match = t;
      break;
    }
  }
  if (!match) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: match.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: match.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
