import { Facebook, Instagram, Linkedin } from "lucide-react";
import { getSocialLinks, type SocialLink, type SocialPlatform } from "@/lib/social";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  x: XIcon,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
};

const VARIANTS = {
  dark: "bg-slate-800 text-slate-300 hover:bg-brand-600 hover:text-white",
  light: "bg-slate-100 text-ink-soft hover:bg-brand-700 hover:text-white",
  portal: "bg-slate-50 text-ink-soft ring-1 ring-slate-200 hover:bg-brand-600 hover:text-white",
} as const;

export function SocialLinks({
  links,
  variant = "dark",
  className,
}: {
  links?: SocialLink[];
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const items = links ?? getSocialLinks();
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((link) => {
        const Icon = ICONS[link.platform];
        return (
          <li key={link.platform}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                VARIANTS[variant],
              )}
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
