import type { Metadata } from "next";
import {
  Clock,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/public/contact-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact Us",
    description:
      "Contact SPAK Innovation Hub in Kano, Nigeria — address, email, phone, operating hours and enquiry form.",
  };
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: Twitter,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

export default async function ContactPage() {
  const [settings, services, socials] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.socialMediaLink.findMany({
      where: { published: true, url: { not: null } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const mapQuery = encodeURIComponent(settings["org.address"]);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        title="Contact Us"
        description="We would love to hear from you. Reach out with questions about our spaces, programmes or partnerships."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-6">
            <h2 className="panel-title">Contact information</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="font-medium text-ink">{settings["org.name"]}</p>
                  <p className="text-ink-muted">{settings["org.address"]}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <a href={`mailto:${settings["org.email"]}`} className="text-ink-soft hover:text-brand-700">
                  {settings["org.email"]}
                </a>
              </li>
              {settings["org.phone"] && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                  <a href={`tel:${settings["org.phone"]}`} className="text-ink-soft hover:text-brand-700">
                    {settings["org.phone"]}
                  </a>
                </li>
              )}
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <span className="text-ink-soft">{settings["org.hours"]}</span>
              </li>
            </ul>

            {socials.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-ink">Follow us</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => {
                    const Icon = ICONS[s.platform] ?? MessageCircle;
                    return (
                      <li key={s.id}>
                        <a
                          href={s.url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-ink-soft hover:bg-brand-700 hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="panel-title">Find us</h2>
            </div>
            <iframe
              title="SPAK Innovation Hub location"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            />
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <h2 className="panel-title">Send us an enquiry</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>
          <div className="mt-5">
            <ContactForm services={services} />
          </div>
        </div>
      </div>
    </div>
  );
}
