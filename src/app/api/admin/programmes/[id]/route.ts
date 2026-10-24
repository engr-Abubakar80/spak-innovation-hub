import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { saveUpload, UploadError } from "@/lib/uploads";
import { programmeSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const programme = await prisma.programme.findUnique({
    where: { id: params.id },
    include: { _count: { select: { registrations: true, applications: true } } },
  });
  if (!programme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(programme);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.programme.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const raw: Record<string, string> = {};
  for (const entry of Array.from(form.entries())) { const key = entry[0] as string; const value = entry[1];
    if (typeof value === "string") raw[key] = value;
  }
  const parsed = programmeSchema.partial().safeParse({
    ...raw,
    registrationOpen: raw.registrationOpen === undefined ? undefined : raw.registrationOpen === "true",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const update: any = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.description !== undefined) update.description = data.description;
  if (data.startDate !== undefined) update.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) update.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.location !== undefined) update.location = data.location || null;
  if (data.format !== undefined) update.format = data.format;
  if (data.registrationDeadline !== undefined) {
    update.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
  }
  if (data.registrationOpen !== undefined) update.registrationOpen = data.registrationOpen;
  if (data.registrationUrl !== undefined) update.registrationUrl = data.registrationUrl || null;
  if (data.status !== undefined) update.status = data.status;
  if (data.coverImageUrl !== undefined) update.coverImageUrl = data.coverImageUrl || null;

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveUpload(file, "programmes");
      update.coverImageUrl = saved.url;
      await prisma.mediaAsset.create({
        data: {
          filename: saved.filename,
          url: saved.url,
          mimeType: saved.mimeType,
          size: saved.size,
          folder: "programmes",
          uploadedById: admin.id,
        },
      });
    } catch (err: any) {
      const status = err instanceof UploadError ? err.status : 422;
      return NextResponse.json({ error: err.message || "Upload failed" }, { status });
    }
  }

  const programme = await prisma.programme.update({ where: { id: params.id }, data: update });
  await recordAudit({
    actorId: admin.id,
    action: "programme.update",
    entity: "Programme",
    entityId: programme.id,
    metadata: { title: programme.title },
  });
  return NextResponse.json(programme);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const existing = await prisma.programme.findUnique({
    where: { id: params.id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.programme.delete({ where: { id: params.id } });
  await recordAudit({
    actorId: admin.id,
    action: "programme.delete",
    entity: "Programme",
    entityId: params.id,
    metadata: { title: existing.title },
  });
  return NextResponse.json({ ok: true });
}
