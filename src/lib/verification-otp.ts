import { createHmac, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { sendVerificationOtp } from "@/lib/email";

const OTP_EXPIRY_MINUTES = 10;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashVerificationOtp(email: string, code: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "spak-verification-otp";
  return createHmac("sha256", secret)
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

export async function issueVerificationOtp(email: string, name?: string | null) {
  const normalized = normalizeEmail(email);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const token = hashVerificationOtp(normalized, code);

  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
  await prisma.verificationToken.create({
    data: { identifier: normalized, token, expires },
  });

  return sendVerificationOtp({
    to: normalized,
    name: name || "there",
    code,
    expiresMinutes: OTP_EXPIRY_MINUTES,
  });
}

export async function verifyVerificationOtp(email: string, code: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const token = hashVerificationOtp(normalized, code);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: normalized, token },
  });
  if (!record || record.expires < new Date()) return false;

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { token: record.token } }),
  ]);
  return true;
}
