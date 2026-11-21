import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const OFFICIAL_LOGO = "/brand/spak-logo.jpg";

export function LogoMark({
  className,
  logoUrl,
  imageClassName,
}: {
  className?: string;
  logoUrl?: string | null;
  imageClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-slate-200",
        className,
      )}
    >
      <Image
        src={logoUrl || OFFICIAL_LOGO}
        alt="SPAK Innovation Hub logo"
        width={533}
        height={229}
        priority
        className={cn("h-8 w-auto max-w-full object-contain", imageClassName)}
      />
    </span>
  );
}

export function Logo({
  href = "/",
  name = "SPAK Innovation Hub",
  tagline,
  className,
  onNavigate,
  logoUrl,
  showName = true,
}: {
  href?: string;
  name?: string;
  tagline?: string;
  className?: string;
  onNavigate?: () => void;
  logoUrl?: string | null;
  showName?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("flex items-center gap-2.5", className)}
      aria-label={`${name} home`}
    >
      <LogoMark logoUrl={logoUrl} />
      {showName && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-ink sm:text-base">{name}</span>
          {tagline && (
            <span className="hidden text-[11px] font-medium text-brand-700 sm:block">{tagline}</span>
          )}
        </span>
      )}
    </Link>
  );
}
