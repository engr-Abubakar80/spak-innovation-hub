import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersManagePage() {
  await requireSuperAdmin();
  return (
    <div>
      <PageHeader
        title="User management"
        description="Create users, assign roles, reset passwords (forces change at next login), suspend or delete accounts. Only the login email is visible; passwords and hashes are never displayed."
      />
      <UsersManager />
    </div>
  );
}
