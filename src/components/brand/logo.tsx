import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  logoUrl,
}: {
  className?: string;
  logoUrl?: string | null;
}) {
  if (logoUrl) {
    return (
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200",
          className,
        )}
        aria-hidden
      >
        <Image
          src={logoUrl}
          alt="Site logo"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 font-bold text-white",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 3c-3 0-5 1.6-5 4 0 2 1.4 3 3 3.4C8.4 11 7 12.2 7 14c0 2.4 2 4 5 4s5-1.6 5-4c0-1.8-1.4-3-3.2-3.6C15.6 10 17 9 17 7c0-2.4-2-4-5-4Z" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  name,
  tagline,
  className,
  onNavigate,
  logoUrl,
}: {
  href?: string;
  name: string;
  tagline?: string;
  className?: string;
  onNavigate?: () => void;
  logoUrl?: string | null;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("flex items-center gap-2.5", className)}
      aria-label={`${name} home`}
    >
      <LogoMark logoUrl={logoUrl} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-ink sm:text-base">{name}</span>
        {tagline && (
          <span className="hidden text-[11px] font-medium text-brand-700 sm:block">{tagline}</span>
        )}
      </span>
    </Link>
  );
}
