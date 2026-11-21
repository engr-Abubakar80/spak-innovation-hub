import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { ProfileForm } from "@/components/portal/profile-form";
import { initials, formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireUser();
  const record = await prisma.user
    .findUnique({ where: { id: user.id }, select: { createdAt: true } })
    .catch(() => null);
  const profile = {
    name: user.name || "",
    email: user.email,
    phone: user.phone || "",
    organization: user.organization || "",
    createdAt: record?.createdAt.toISOString() ?? "",
  };

  return (
    <div>
      <PortalPageHeader
        title="My Profile"
        description="Manage your personal and professional information."
      />
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-800">
            {initials(profile.name)}
          </div>
          <h2 className="mt-3 text-sm font-bold text-ink">{profile.name || "SPAK Member"}</h2>
          <p className="text-[11px] text-slate-500">SPAK Hub Member</p>
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-left text-[11px] text-slate-500">
            <div>
              EMAIL
              <b className="mt-0.5 block break-all text-[11px] text-ink">{profile.email}</b>
            </div>
            <div>
              PHONE
              <b className="mt-0.5 block text-[11px] text-ink">{profile.phone || "—"}</b>
            </div>
            <div>
              MEMBER SINCE
              <b className="mt-0.5 block text-[11px] text-ink">
                {profile.createdAt ? formatDate(profile.createdAt, { month: "long", year: "numeric" }) : "—"}
              </b>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Personal & Professional Details</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Keep your account information up to date.</p>
          </div>
          <div className="p-5">
            <ProfileForm profile={profile} />
          </div>
        </section>
      </div>
    </div>
  );
}
