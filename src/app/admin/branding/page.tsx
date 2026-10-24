import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { BrandingManager } from "@/components/admin/branding-manager";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  await requireSuperAdmin();
  const setting = await prisma.organizationSetting.findUnique({ where: { key: "branding.logo" } });
  return (
    <div>
      <PageHeader
        title="Site branding"
        description="Upload and replace the site logo. Changes apply immediately across the public site."
      />
      <BrandingManager logoUrl={setting?.value ?? null} />
    </div>
  );
}
