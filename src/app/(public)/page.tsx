import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Handshake,
  Lightbulb,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/public/section-heading";
import { ServiceCard } from "@/components/public/service-card";
import { ProgrammeCard } from "@/components/public/programme-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services, upcoming] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      take: 6,
    }).catch(() => []),
    prisma.programme.findMany({
      where: { status: "PUBLISHED", startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 3,
    }).catch(() => []),
  ]);

  const benefits = [
    { icon: Users, title: "Inclusive by design", text: "We prioritise underserved people and communities, widening access to opportunity." },
    { icon: Lightbulb, title: "Practical innovation", text: "We turn ideas into working solutions for real health, environmental and socioeconomic challenges." },
    { icon: Handshake, title: "Strong partnerships", text: "We collaborate with institutions, businesses and development organisations to scale impact." },
    { icon: ShieldCheck, title: "Integrity & accountability", text: "We act with honesty, transparency and a focus on measurable impact." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-900">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_10%,rgba(20,184,166,0.25),transparent),radial-gradient(50%_50%_at_10%_90%,rgba(245,158,11,0.15),transparent)]"
        />
        <div className="container-page relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-300 ring-1 ring-inset ring-white/15">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {settings["org.tagline"]}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {settings["org.shortName"]}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
              {settings["org.description"]}
            </p>
            <p className="mt-3 text-sm font-medium text-brand-300">{settings["org.slogan"]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services">
                <Button size="lg" variant="accent">
                  <CalendarCheck className="h-5 w-5" aria-hidden /> Book a Space
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Explore Our Services
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: "Coworking", value: "Flexible workspace" },
                { icon: Users, label: "Community", value: "Connect & collaborate" },
                { icon: Lightbulb, label: "Innovation", value: "Practical solutions" },
                { icon: Target, label: "Impact", value: "Measurable change" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <c.icon className="h-6 w-6 text-brand-400" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-white">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="About SPAK" title="An innovation enabler for people and planet" />
            <div className="prose-spak mt-4">
              <p>{settings["about.overview"]}</p>
            </div>
            <Link href="/about" className="link mt-2 inline-flex items-center gap-1">
              Read More <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Established", value: settings["org.established"] },
              { label: "Focus", value: "Inclusive innovation" },
              { label: "Flagship projects", value: "3" },
              { label: "Location", value: "Kano, Nigeria" },
            ].map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{s.label}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Our Services" title="Spaces and services built for productivity" />
            <Link href="/services" className="link inline-flex items-center gap-1">
              View all services <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <Quote className="h-7 w-7 text-brand-600" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-ink">Our Vision</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{settings["about.vision"]}</p>
          </div>
          <div className="card p-8">
            <Target className="h-7 w-7 text-accent-600" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-ink">Our Mission</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{settings["about.mission"]}</p>
          </div>
        </div>
      </section>

      {/* Upcoming programmes */}
      {upcoming.length > 0 && (
        <section className="border-y border-slate-200 bg-slate-50 py-16">
          <div className="container-page">
            <SectionHeading eyebrow="Programmes & Events" title="Upcoming at SPAK Innovation Hub" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((p) => (
                <ProgrammeCard key={p.id} programme={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why choose */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="Why teams and talents choose SPAK Innovation Hub"
          align="center"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <b.icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-2xl bg-brand-800 px-8 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to connect, collaborate and create?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-brand-100">
            Book a facility, register for a programme or reach out to our team — we would love to hear
            about your ideas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/services">
              <Button size="lg" variant="accent">
                Book a Facility
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                Make an Enquiry
              </Button>
            </Link>
            <Link href="/programmes">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                View Programmes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
