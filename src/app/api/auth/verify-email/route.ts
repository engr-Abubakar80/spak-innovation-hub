import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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
