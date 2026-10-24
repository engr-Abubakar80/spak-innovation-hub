import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";
import { saveUpload, UploadError } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const LOGO_MIME = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

export async function GET() {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const setting = await prisma.organizationSetting.findUnique({ where: { key: "branding.logo" } });
  const assets = await prisma.mediaAsset.findMany({
    where: { folder: "branding" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ logoUrl: setting?.value || null, assets });
}

export async function POST(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A logo file is required" }, { status: 422 });
  }
  if (!LOGO_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Logo must be a PNG, JPG or SVG file" },
      { status: 422 },
    );
  }
  try {
    const saved = await saveUpload(file, "branding");
    await prisma.organizationSetting.upsert({
      where: { key: "branding.logo" },
      update: { value: saved.url, category: "branding" },
      create: { key: "branding.logo", value: saved.url, category: "branding" },
    });
    await prisma.mediaAsset.create({
      data: {
        filename: saved.filename,
        url: saved.url,
        mimeType: saved.mimeType,
        size: saved.size,
        alt: "Site logo",
        folder: "branding",
        uploadedById: admin.id,
      },
    });
    await recordAudit({
      actorId: admin.id,
      action: "branding.logo.update",
      entity: "OrganizationSetting",
      entityId: "branding.logo",
      metadata: { url: saved.url },
    });
    return NextResponse.json({ logoUrl: saved.url });
  } catch (err: any) {
    const status = err instanceof UploadError ? err.status : 422;
    return NextResponse.json({ error: err.message || "Upload failed" }, { status });
  }
}
