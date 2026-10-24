import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { UsersManager } from "@/components/admin/users-manager";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  return (
    <div>
      <PageHeader
        title="Users & Account Management"
        description="View user login details, create/add users directly, edit roles/status, reset passwords, send messages, suspend or delete accounts."
      />
      <div className="mb-4 flex gap-2">
        <Link href="/admin/users/manage">
          <Button variant="outline">Full user management</Button>
        </Link>
        <Link href="/admin/messages">
          <Button>Send message to user</Button>
        </Link>
      </div>
      <UsersManager />
    </div>
  );
}
