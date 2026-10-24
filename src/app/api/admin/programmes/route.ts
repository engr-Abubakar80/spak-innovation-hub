import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { saveUpload, UploadError } from "@/lib/uploads";
import { programmeSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const programmes = await prisma.programme.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { registrations: true } } },
  });
  return NextResponse.json(programmes);
}

export async function POST(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const raw: Record<string, string> = {};
  for (const entry of Array.from(form.entries())) { const key = entry[0] as string; const value = entry[1];
    if (typeof value === "string") raw[key] = value;
  }
  const parsed = programmeSchema.safeParse({
    ...raw,
    registrationOpen: raw.registrationOpen === "true",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  let coverImageUrl = data.coverImageUrl || null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveUpload(file, "programmes");
      coverImageUrl = saved.url;
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

  const programme = await prisma.programme.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      coverImageUrl,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || null,
      format: data.format || "In-person",
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      registrationOpen: data.registrationOpen ?? false,
      registrationUrl: data.registrationUrl || null,
      status: data.status || "DRAFT",
    },
  });
  await recordAudit({
    actorId: admin.id,
    action: "programme.create",
    entity: "Programme",
    entityId: programme.id,
    metadata: { title: programme.title },
  });
  return NextResponse.json(programme, { status: 201 });
}
