import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const current = body.currentPassword;
  const next = body.newPassword;
  if (!current || !next || next.length < 8) {
    return NextResponse.json({ error: "Invalid password" }, { status: 422 });
  }
  if (user.passwordHash && !(await bcrypt.compare(current, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 409 });
  }
  const hash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  return NextResponse.json({ ok: true });
}
