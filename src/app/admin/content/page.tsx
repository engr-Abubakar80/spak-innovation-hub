import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EditableContentManager } from "@/components/admin/editable-content-manager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireSuperAdmin();
  const settings = await prisma.organizationSetting.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  return (
    <div>
      <PageHeader
        title="Editable content"
        description="Edit site text stored in settings. These values are used across the public site and can be changed without a redeploy."
      />
      <EditableContentManager settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
