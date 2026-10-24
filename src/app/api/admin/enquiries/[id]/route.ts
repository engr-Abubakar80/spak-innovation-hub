import { NextRequest, NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({}));
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.adminReply !== undefined) data.adminReply = body.adminReply;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;
  if (body.status === "RESOLVED") data.resolvedAt = new Date();
  const enquiry = await prisma.enquiry.update({ where: { id: params.id }, data });
  await recordAudit({ actorId: admin.id, action: "enquiry.update", entity: "Enquiry", entityId: enquiry.id, metadata: { status: enquiry.status } });
  return NextResponse.json(enquiry);
}
