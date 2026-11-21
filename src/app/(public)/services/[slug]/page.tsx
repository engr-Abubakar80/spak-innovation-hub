import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/session";
import { toServiceOption } from "@/lib/service-mapper";
import { PageHeader } from "@/components/layout/page-header";
import { DynamicIcon } from "@/components/public/dynamic-icon";
import { BookingForm } from "@/components/bookings/booking-form";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTimeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const service = await prisma.service.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!service) return { title: "Service not found" };
  return { title: service.name, description: service.shortDesc };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const [service, settings, user] = await Promise.all([
    prisma.service.findUnique({
      where: { slug: params.slug },
      include: { facilities: { where: { published: true }, orderBy: { displayOrder: "asc" } } },
    }).catch(() => null),
    getSettings(),
    getCurrentUser(),
  ]);

  if (!service || !service.published) notFound();

  const option = toServiceOption(service);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.name },
        ]}
        title={service.name}
        description={service.shortDesc}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand">{service.category}</Badge>
            {service.requiresApproval ? (
              <Badge tone="warning">Subject to approval</Badge>
            ) : (
              <Badge tone="success">Instant request</Badge>
            )}
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-white">
              <DynamicIcon name={service.icon} className="h-12 w-12 opacity-90" />
            </div>
            <div className="p-6">
              <div className="prose-spak">
                {service.description.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Clock className="h-4 w-4 text-brand-600" aria-hidden /> Operating hours
                  </dt>
                  <dd className="font-medium text-ink">
                    {formatTimeLabel(service.operatingStart)} – {formatTimeLabel(service.operatingEnd)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Minimum duration</dt>
                  <dd className="font-medium text-ink">{service.minDuration} minutes</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Indicative price</dt>
                  <dd className="font-medium text-ink">
                    {service.isVirtual
                      ? "Enquiry based"
                      : `${formatCurrency(service.basePrice?.toString(), service.currency)}${
                          service.priceUnit ? ` ${service.priceUnit}` : ""
                        }`}
                  </dd>
                </div>
              </dl>

              {service.facilities.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Users className="h-4 w-4 text-brand-600" aria-hidden /> Facilities
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {service.facilities.map((f) => (
                      <li key={f.id} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden />
                        {f.name}
                        <span className="text-ink-muted">
                          {f.capacity ? `· up to ${f.capacity} ${f.capacityUnit}` : "· capacity to be confirmed"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {service.cancellationPolicy && (
            <div className="card mt-4 p-5 text-sm">
              <p className="font-semibold text-ink">Cancellation policy</p>
              <p className="mt-1 text-ink-muted">{service.cancellationPolicy}</p>
            </div>
          )}
          {!service.cancellationPolicy && settings["booking.cancellationPolicy"] && (
            <div className="card mt-4 p-5 text-sm">
              <p className="font-semibold text-ink">Cancellation policy</p>
              <p className="mt-1 text-ink-muted">{settings["booking.cancellationPolicy"]}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {service.isVirtual ? (
            <AlertWarning />
          ) : (
            <BookingForm
              services={[option]}
              defaultServiceId={option.id}
              isAuthenticated={!!user}
              userInfo={
                user
                  ? { name: user.name, email: user.email, phone: user.phone }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AlertWarning() {
  return (
    <div className="card p-8">
      <AlertTriangle className="h-7 w-7 text-accent-600" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-ink">This is an enquiry-based service</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Virtual Office services are arranged on request. Submit an enquiry and our team will contact
        you to discuss the package that best suits your organisation.
      </p>
      <a
        href="/contact"
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
      >
        Make an Enquiry
      </a>
    </div>
  );
}
