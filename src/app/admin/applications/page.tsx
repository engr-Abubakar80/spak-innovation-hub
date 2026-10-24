import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationsManager } from "@/components/admin/applications-manager";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireSuperAdmin();

  const [applications, programmes, services] = await Promise.all([
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        programme: { select: { id: true, title: true } },
        service: { select: { id: true, name: true } },
        statusChangedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.programme.findMany({ select: { id: true, title: true }, orderBy: { startDate: "desc" } }),
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Review, approve, reject or delete applications. Every status change is recorded with a timestamp and the administrator who made it."
      />
      <ApplicationsManager
        applications={JSON.parse(JSON.stringify(applications))}
        programmes={programmes}
        services={services}
      />
    </div>
  );
}
