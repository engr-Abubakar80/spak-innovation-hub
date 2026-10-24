import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceCard } from "@/components/public/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Services & Facilities",
    description:
      "Explore coworking space, virtual office, conference hall, meeting room and training facility bookings at SPAK Innovation Hub.",
  };
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    prisma.service.findMany({ where: { published: true }, orderBy: { displayOrder: "asc" } }),
    getSettings(),
  ]);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
        title="Services & Facilities"
        description="Book a space or make an enquiry. Every booking request is reviewed by our team and confirmed subject to availability."
      />

      {services.length === 0 ? (
        <EmptyState
          title="No services are published yet"
          description="Our team is preparing the list of available facilities. Please check back soon."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-ink">Need something bespoke?</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Virtual office packages, bespoke events and long-term workspace arrangements are arranged
            on request. Send us an enquiry and our team will get back to you.
          </p>
          <Link href="/contact" className="mt-4 inline-block">
            <Button>
              Make an Enquiry <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-ink">Contact our team</p>
          <p className="flex items-center gap-2 text-ink-soft">
            <Mail className="h-4 w-4 text-brand-600" aria-hidden />
            <a href={`mailto:${settings["org.email"]}`} className="hover:text-brand-700">
              {settings["org.email"]}
            </a>
          </p>
          {settings["org.phone"] && (
            <p className="flex items-center gap-2 text-ink-soft">
              <Phone className="h-4 w-4 text-brand-600" aria-hidden />
              {settings["org.phone"]}
            </p>
          )}
          <p className="text-ink-muted">{settings["org.hours"]}</p>
        </div>
      </div>
    </div>
  );
}
