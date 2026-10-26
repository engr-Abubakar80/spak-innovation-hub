import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ProgrammeRegistrationForm } from "@/components/public/programme-registration-form";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const programme = await prisma.programme.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!programme) return { title: "Programme not found" };
  return { title: programme.title, description: programme.description.slice(0, 160) };
}

export default async function ProgrammeDetailPage({ params }: { params: { slug: string } }) {
  const programme = await prisma.programme.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!programme || programme.status === "DRAFT") notFound();

  const deadlinePassed =
    programme.registrationDeadline && new Date(programme.registrationDeadline) < new Date();
  const canRegister = programme.registrationOpen && !deadlinePassed;

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Programmes", href: "/programmes" },
          { label: programme.title },
        ]}
        title={programme.title}
        actions={
          <div className="flex gap-2">
            <Badge tone={programme.format === "Online" ? "info" : "brand"}>{programme.format}</Badge>
            {canRegister && <Badge tone="success">Registration open</Badge>}
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          {programme.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={programme.coverImageUrl}
              alt={programme.title}
              className="mb-6 h-64 w-full rounded-xl object-cover"
            />
          )}
          <div className="prose-spak">
            {programme.description.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>

        <aside className="space-y-5">
          <div className="card p-6">
            <h2 className="panel-title">Event details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <div>
                  <dt className="text-ink-muted">Date</dt>
                  <dd className="font-medium text-ink">
                    {formatDate(programme.startDate)}
                    {programme.endDate && ` – ${formatDate(programme.endDate)}`}
                  </dd>
                </div>
              </div>
              {programme.location && (
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                  <div>
                    <dt className="text-ink-muted">Location</dt>
                    <dd className="font-medium text-ink">{programme.location}</dd>
                  </div>
                </div>
              )}
              {programme.registrationDeadline && (
                <div className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                  <div>
                    <dt className="text-ink-muted">Registration deadline</dt>
                    <dd className="font-medium text-ink">
                      {formatDate(programme.registrationDeadline)}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="panel-title">Register your interest</h2>
            {canRegister ? (
              <div className="mt-4">
                <ProgrammeRegistrationForm
                  programmeId={programme.id}
                  externalUrl={programme.registrationUrl}
                />
              </div>
            ) : (
              <Alert variant="warning" className="mt-3">
                {deadlinePassed
                  ? "The registration deadline for this programme has passed."
                  : "Registration for this programme is not currently open."}
              </Alert>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
