import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader title="My Profile" description="View and manage your account details." />
      <div className="card max-w-xl p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Name</dt>
            <dd className="font-medium text-ink">{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Phone</dt>
            <dd className="font-medium text-ink">{user.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Role</dt>
            <dd className="font-medium text-ink">{user.role.toLowerCase()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
