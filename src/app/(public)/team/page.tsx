import type { Metadata } from "next";
import { Linkedin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Our Team",
    description: "Meet the people leading SPAK Innovation Hub.",
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TeamPage() {
  const members = await prisma.teamMember.findMany({
    where: { published: true },
    orderBy: { displayOrder: "asc" },
  }).catch(() => []);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Our Team" }]}
        title="Our Team"
        description="The people driving inclusive innovation, entrepreneurship and impact at SPAK Innovation Hub."
      />

      {members.length === 0 ? (
        <EmptyState title="Team profiles coming soon" description="Our team directory is being prepared." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <article key={m.id} className="card flex flex-col items-center p-6 text-center">
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photoUrl}
                  alt={m.name}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-100"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-700 ring-2 ring-brand-100">
                  {initials(m.name)}
                </span>
              )}
              <h3 className="mt-4 text-lg font-semibold text-ink">{m.name}</h3>
              <p className="text-sm font-medium text-brand-700">{m.role}</p>
              {m.bio && <p className="mt-3 text-sm text-ink-muted">{m.bio}</p>}
              <div className="mt-4 flex items-center gap-3 text-sm">
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    className="inline-flex items-center gap-1.5 text-ink-soft hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" aria-hidden /> {m.phone}
                  </a>
                )}
                {m.linkedinUrl && (
                  <a
                    href={m.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} on LinkedIn`}
                    className="text-ink-soft hover:text-brand-700"
                  >
                    <Linkedin className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ink-muted">
        Team contact information is published only with organisational authorisation.
      </p>
    </div>
  );
}
