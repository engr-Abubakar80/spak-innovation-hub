import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin } from "@/lib/server-auth";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
        category: z.string().optional(),
      }),
    )
    .min(1),
});

export async function GET() {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await prisma.organizationSetting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const admin = await requireApiSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  for (const item of parsed.data.items) {
    await prisma.organizationSetting.upsert({
      where: { key: item.key },
      update: { value: item.value, category: item.category || item.key.split(".")[0] },
      create: { key: item.key, value: item.value, category: item.category || item.key.split(".")[0] },
    });
  }
  await recordAudit({
    actorId: admin.id,
    action: "content.update",
    entity: "OrganizationSetting",
    metadata: { keys: parsed.data.items.map((i) => i.key) },
  });
  return NextResponse.json({ ok: true });
}
