import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the details you entered.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      organization: parsed.data.organization || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      organization: true,
      role: true,
      createdAt: true,
    },
  });
  await recordAudit({
    actorId: user.id,
    action: "user.profile.update",
    entity: "User",
    entityId: user.id,
  });
  return NextResponse.json(updated);
}
