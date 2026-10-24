import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@prisma/client";
import { DynamicIcon } from "./dynamic-icon";
import { formatCurrency } from "@/lib/utils";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="card group flex h-full flex-col p-6 transition-shadow hover:shadow-panel">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <DynamicIcon name={service.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{service.shortDesc}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft">
          {service.isVirtual ? "Enquiry based" : formatCurrency(service.basePrice?.toString(), service.currency)}
        </span>
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          View Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
