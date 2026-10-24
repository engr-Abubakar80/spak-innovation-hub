import Link from "next/link";
import { Facebook, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { LogoMark } from "@/components/brand/logo";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: Twitter,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

const QUICK_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/programmes", label: "Programmes & Events" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Contact" },
  { href: "/signup", label: "Create an Account" },
];

export async function PublicFooter() {
  const [settings, socials] = await Promise.all([
    getSettings(),
    prisma.socialMediaLink.findMany({
      where: { published: true, url: { not: null } },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const name = settings["org.shortName"];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="bg-brand-600" />
            <span className="text-base font-bold text-white">{name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            {settings["footer.about"]}
          </p>
          <p className="mt-3 text-sm font-medium text-brand-400">{settings["org.tagline"]}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-slate-400 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-400">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
              <span>{settings["org.address"]}</span>
            </li>
            {settings["org.email"] && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
                <a href={`mailto:${settings["org.email"]}`} className="hover:text-white">
                  {settings["org.email"]}
                </a>
              </li>
            )}
            {settings["org.phone"] && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
                <a href={`tel:${settings["org.phone"]}`} className="hover:text-white">
                  {settings["org.phone"]}
                </a>
              </li>
            )}
            <li className="text-slate-400">{settings["org.hours"]}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Follow Us</h2>
          {socials.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Social media links will be published soon.
            </p>
          ) : (
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
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-brand-600 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row">
          <p>
            © {year} {settings["org.name"]}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
