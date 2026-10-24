import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  applicantName: z.string().min(2),
  applicantEmail: z.string().email(),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  programmeId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  title: z.string().min(2),
  summary: z.string().min(5),
  details: z.string().optional().nullable(),
});

function makeReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `APP-${stamp}${rand}`;
}

export async function GET(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || undefined;
  const query = searchParams.get("q") || undefined;

  const where: any = {};
  if (status && status !== "all" && status !== "All") {
    const map: Record<string, string> = {
      Approved: "APPROVED",
      Rejected: "REJECTED",
      "Under Review": "UNDER_REVIEW",
    };
    where.status = map[status] || status;
  }
  if (query) {
    where.OR = [
      { applicantName: { contains: query, mode: "insensitive" } },
      { applicantEmail: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { reference: { contains: query, mode: "insensitive" } },
    ];
  }

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      programme: { select: { id: true, title: true } },
      service: { select: { id: true, name: true } },
      statusChangedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(applications);
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
  const application = await prisma.application.create({
    data: {
      reference: makeReference(),
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail.toLowerCase(),
      phone: data.phone || null,
      organization: data.organization || null,
      programmeId: data.programmeId || null,
      serviceId: data.serviceId || null,
      title: data.title,
      summary: data.summary,
      details: data.details || null,
      statusChangedById: admin.id,
    },
  });
  await recordAudit({
    actorId: admin.id,
    action: "application.create",
    entity: "Application",
    entityId: application.id,
    metadata: { reference: application.reference },
  });
  return NextResponse.json(application, { status: 201 });
}
