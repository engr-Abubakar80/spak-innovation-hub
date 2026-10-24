import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export default async function DashboardPasswordPage() {
  await requireUser();
  return (
    <div>
      <PageHeader title="Change password" description="Update your account password." />
      <div className="max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
