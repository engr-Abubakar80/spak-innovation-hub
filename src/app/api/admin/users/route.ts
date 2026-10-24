import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { assignableRoles } from "@/lib/permissions";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).default("USER"),
  password: z.string().min(8).optional(),
});

export async function GET(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || undefined;
  const role = searchParams.get("role") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { organization: { contains: query, mode: "insensitive" } },
    ];
  }
  if (role && role !== "all") where.role = role;
  if (status && status !== "all") where.status = status;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      organization: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { bookings: true, messages: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }
  if (!assignableRoles(admin.role).includes(data.role)) {
    return NextResponse.json({ error: "You cannot assign that role" }, { status: 403 });
  }

  // Temporary password forces a change at next login.
  const temporaryPassword = data.password || randomPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      phone: data.phone || null,
      organization: data.organization || null,
      role: data.role,
      passwordHash,
      mustChangePassword: true,
      emailVerified: new Date(),
    },
    select: { id: true, name: true, email: true, role: true, status: true, mustChangePassword: true },
  });
  await recordAudit({
    actorId: admin.id,
    action: "user.create",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });
  // The temporary password is only shown once to the creating admin, and emailed.
  await sendPasswordResetEmail({
    to: email,
    name: data.name,
    temporaryPassword,
  }).catch(() => undefined);
  return NextResponse.json({ user, temporaryPassword }, { status: 201 });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
