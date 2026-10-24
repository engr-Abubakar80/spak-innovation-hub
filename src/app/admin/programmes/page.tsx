import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { ProgrammesManager } from "@/components/admin/programmes-manager";

export const dynamic = "force-dynamic";

export default async function AdminProgrammesPage() {
  await requireSuperAdmin();
  const programmes = await prisma.programme.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { registrations: true } } },
  });
  return (
    <div>
      <PageHeader
        title="Programmes"
        description="Create, edit, publish and delete upcoming programmes including cover images."
      />
      <ProgrammesManager programmes={JSON.parse(JSON.stringify(programmes))} />
    </div>
  );
}
