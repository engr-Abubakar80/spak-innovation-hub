import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  applicantName: z.string().min(2).optional(),
  applicantEmail: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  programmeId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  title: z.string().min(2).optional(),
  summary: z.string().min(5).optional(),
  details: z.string().optional().nullable(),
  status: z.enum(["Approved", "Rejected", "Under Review"]).optional(),
  reviewNote: z.string().optional().nullable(),
});

const STATUS_MAP: Record<string, "APPROVED" | "REJECTED" | "UNDER_REVIEW"> = {
  Approved: "APPROVED",
  Rejected: "REJECTED",
  "Under Review": "UNDER_REVIEW",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      programme: true,
      service: true,
      statusChangedBy: { select: { id: true, name: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
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
  const existing = await prisma.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  for (const key of ["applicantName", "applicantEmail", "phone", "organization", "programmeId", "serviceId", "title", "summary", "details", "reviewNote"] as const) {
    if (body[key] !== undefined) data[key] = body[key] === "" ? null : body[key];
  }
  if (body.applicantEmail) data.applicantEmail = body.applicantEmail.toLowerCase();

  if (body.status) {
    const nextStatus = STATUS_MAP[body.status];
    if (nextStatus && nextStatus !== existing.status) {
      data.status = nextStatus;
      data.statusChangedAt = new Date();
      data.statusChangedById = admin.id;
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: existing.id,
          fromStatus: existing.status,
          toStatus: nextStatus,
          changedById: admin.id,
          reason: body.reviewNote || null,
        },
      });
    }
  }

  const application = await prisma.application.update({ where: { id: params.id }, data });
  await recordAudit({
    actorId: admin.id,
    action: body.status ? `application.status.${body.status.replace(/\s+/g, "_").toLowerCase()}` : "application.update",
    entity: "Application",
    entityId: application.id,
    metadata: { reference: application.reference, note: body.reviewNote || null },
  });
  return NextResponse.json(application);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const existing = await prisma.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.application.delete({ where: { id: params.id } });
  await recordAudit({
    actorId: admin.id,
    action: "application.delete",
    entity: "Application",
    entityId: params.id,
    metadata: { reference: existing.reference },
  });
  return NextResponse.json({ ok: true });
}
