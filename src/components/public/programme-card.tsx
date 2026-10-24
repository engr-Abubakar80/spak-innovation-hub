import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Programme } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function ProgrammeCard({ programme }: { programme: Programme }) {
  const deadlinePassed =
    programme.registrationDeadline && new Date(programme.registrationDeadline) < new Date();
  const canRegister = programme.registrationOpen && !deadlinePassed;

  return (
    <article className="card group flex h-full flex-col overflow-hidden">
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        {programme.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={programme.coverImageUrl}
            alt={programme.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <CalendarDays className="h-10 w-10 opacity-80" aria-hidden />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge tone={programme.format === "Online" ? "info" : "brand"}>{programme.format}</Badge>
          {canRegister && <Badge tone="success">Registration open</Badge>}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-ink">{programme.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{programme.description}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-ink-soft">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden />
            <span>
              {formatDate(programme.startDate)}
              {programme.endDate && ` – ${formatDate(programme.endDate)}`}
            </span>
          </div>
          {programme.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" aria-hidden />
              <span>{programme.location}</span>
            </div>
          )}
        </dl>
        <Link
          href={`/programmes/${programme.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {canRegister ? "Register / Learn more" : "Learn more"}
        </Link>
      </div>
    </article>
  );
}
