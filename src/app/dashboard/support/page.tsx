import Link from "next/link";
import { MessageSquare, Phone, Mail } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { SupportForm } from "@/components/portal/support-form";

export default async function SupportPage() {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);

  return (
    <div>
      <PortalPageHeader
        title="Help & Support"
        description="Need assistance? Contact the SPAK Innovation Hub team."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Send a support request</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              We will respond using the contact details below.
            </p>
          </div>
          <div className="p-5">
            <SupportForm
              user={{
                name: user.name || "",
                email: user.email,
                phone: user.phone || "",
              }}
            />
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Other ways to get help</h2>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex gap-2.5">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                <p>
                  For booking-related conversations, use{" "}
                  <Link href="/dashboard/messages" className="font-semibold text-blue-600 hover:underline">
                    Messages
                  </Link>
                  .
                </p>
              </div>
              <div className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                <p>
                  Email{" "}
                  <a
                    href={`mailto:${settings["org.email"]}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {settings["org.email"]}
                  </a>
                </p>
              </div>
              {settings["org.phone"] && (
                <div className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  <a
                    href={`tel:${settings["org.phone"]}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {settings["org.phone"]}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Response times</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Support requests are reviewed during SPAK working hours. Urgent booking issues should
              be raised through Messages so the team can see your conversation history.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
