import type { Metadata } from "next";
import { CalendarX2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ProgrammeCard } from "@/components/public/programme-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Programmes & Events",
    description:
      "Upcoming and previous programmes, trainings, workshops and events at SPAK Innovation Hub.",
  };
}

export default async function ProgrammesPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.programme.findMany({
      where: { status: "PUBLISHED", startDate: { gte: now } },
      orderBy: { startDate: "asc" },
    }).catch(() => []),
    prisma.programme.findMany({
      where: { status: { in: ["PUBLISHED", "COMPLETED"] }, startDate: { lt: now } },
      orderBy: { startDate: "desc" },
      take: 12,
    }).catch(() => []),
  ]);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Programmes" }]}
        title="Programmes & Events"
        description="Trainings, workshops, bootcamps and community events hosted by SPAK Innovation Hub."
      />

      <section>
        <h2 className="text-xl font-bold text-ink">Upcoming programmes</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={CalendarX2}
            title="No upcoming programmes published"
            description="We publish new programmes as they are confirmed. Follow our social channels or check back soon."
          />
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((p) => (
              <ProgrammeCard key={p.id} programme={p} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-ink">Previous programmes</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((p) => (
              <ProgrammeCard key={p.id} programme={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
