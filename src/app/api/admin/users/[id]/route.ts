import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { assignableRoles, isSuperAdmin } from "@/lib/permissions";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  mustChangePassword: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await prisma.user.findUnique({
    where: { id: params.id },
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
      _count: { select: { bookings: true, messages: true, enquiriesAssigned: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const body = parsed.data;
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.id === admin.id && body.role && body.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "You cannot remove your own super admin role" }, { status: 409 });
  }
  if (target.id === admin.id && body.status === "SUSPENDED") {
    return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 409 });
  }
  if (body.role && !assignableRoles(admin.role).includes(body.role)) {
    return NextResponse.json({ error: "You cannot assign that role" }, { status: 403 });
  }
  if (body.email && body.email.toLowerCase() !== target.email) {
    const clash = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (clash) return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
  }

  const data: any = {};
  for (const key of ["name", "phone", "organization", "mustChangePassword"] as const) {
    if (body[key] !== undefined) data[key] = body[key] === "" ? null : body[key];
  }
  if (body.email !== undefined) data.email = body.email.toLowerCase().trim();
  if (body.role !== undefined) data.role = body.role;
  if (body.status !== undefined) data.status = body.status;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true, organization: true,
      role: true, status: true, mustChangePassword: true,
    },
  });
  await recordAudit({
    actorId: admin.id,
    action: "user.update",
    entity: "User",
    entityId: user.id,
    metadata: { role: user.role, status: user.status, email: user.email },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (params.id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 409 });
  }
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.user.delete({ where: { id: params.id } });
  await recordAudit({
    actorId: admin.id,
    action: "user.delete",
    entity: "User",
    entityId: params.id,
    metadata: { email: target.email, role: target.role },
  });
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/admin/users/[id]/reset-password
 * Sets a temporary password that the user MUST change at next login.
 * The password is hashed before storage and never returned again by reads.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const provided = typeof body.password === "string" ? body.password : "";
  const temporaryPassword = provided.length >= 8 ? provided : randomPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash, mustChangePassword: true, passwordChangedAt: new Date() },
  });
  await recordAudit({
    actorId: admin.id,
    action: "user.password.reset",
    entity: "User",
    entityId: target.id,
    metadata: { email: target.email, forcedChange: true },
  });
  await sendPasswordResetEmail({
    to: target.email,
    name: target.name || "there",
    temporaryPassword,
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, temporaryPassword, mustChangePassword: true });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
