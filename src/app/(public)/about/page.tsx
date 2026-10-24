import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Quote, Target } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";
import { DynamicIcon } from "@/components/public/dynamic-icon";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About Us",
    description:
      "Learn about SPAK Innovation Hub Ltd/GTE — an innovation enabler established in 2024 to serve underserved communities through inclusive innovation.",
  };
}

export default async function AboutPage() {
  const [settings, values, objectives, activities, projects] = await Promise.all([
    getSettings(),
    prisma.coreValue.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.objective.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.keyActivity.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.project.findMany({ where: { published: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="container-page py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        title="About SPAK Innovation Hub"
        description={settings["org.tagline"]}
      />

      {/* Overview + history */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-ink">Who we are</h2>
          <div className="prose-spak mt-3">
            <p>{settings["about.overview"]}</p>
            <p>{settings["about.history"]}</p>
          </div>
        </div>
        <aside className="card h-fit p-6">
          <h2 className="panel-title">At a glance</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink-muted">Registered name</dt>
              <dd className="font-medium text-ink">{settings["org.name"]}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Established</dt>
              <dd className="font-medium text-ink">{settings["org.established"]}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Primary focus</dt>
              <dd className="font-medium text-ink">{settings["about.focus"]}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Head office</dt>
              <dd className="font-medium text-ink">{settings["org.address"]}</dd>
            </div>
          </dl>
        </aside>
      </section>

      {/* Vision & Mission */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card p-8">
          <Quote className="h-7 w-7 text-brand-600" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-ink">Vision</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">{settings["about.vision"]}</p>
        </div>
        <div className="card p-8">
          <Target className="h-7 w-7 text-accent-600" aria-hidden />
          <h2 className="mt-4 text-xl font-bold text-ink">Mission</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">{settings["about.mission"]}</p>
        </div>
      </section>

      {/* Objectives */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Our Objectives</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {objectives.map((o) => (
            <li key={o.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <span className="text-sm text-ink-soft">{o.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Core values */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Core Values</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.id} className="card p-5">
              <h3 className="font-semibold text-brand-800">{v.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key activities */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Key Activities</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <div key={a.id} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <DynamicIcon name={a.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{a.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink">Flagship Projects</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="card flex h-full flex-col overflow-hidden">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    width={600}
                    height={340}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-white">
                    <span className="text-lg font-semibold">{p.title}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {p.category}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {p.status === "COMPLETED" ? "Completed" : "Ongoing"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-muted">{p.summary}</p>
                  {p.focusAreas.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {p.focusAreas.map((f) => (
                        <li
                          key={f}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-ink-soft"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.startDate && (
                    <p className="mt-3 text-xs text-ink-muted">Since {formatDate(p.startDate)}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-ink-muted">
        This page is managed by SPAK Innovation Hub administrators. Where organisational details,
        images or figures are not yet verified, they remain configurable and are published once
        confirmed by the organisation.
      </section>
    </div>
  );
}
