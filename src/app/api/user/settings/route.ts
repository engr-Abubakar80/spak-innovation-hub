import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/db";

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  bookingNotifications: z.boolean(),
  messageNotifications: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = preferencesSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 422 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: {
      emailNotifications: true,
      bookingNotifications: true,
      messageNotifications: true,
    },
  });
  return NextResponse.json(updated);
}
