"use client";

import { useState } from "react";
import {
  Building2,
  GraduationCap,
  Landmark,
  Laptop,
  Presentation,
  Users,
} from "lucide-react";
import type { ServiceOption } from "@/types";
import { BookingForm } from "@/components/bookings/booking-form";
import { cn, formatCurrency } from "@/lib/utils";

const CATALOG: {
  label: string;
  slug: string;
  description: string;
  category: string;
  icon: typeof Laptop;
  accent: string;
}[] = [
  {
    label: "Co-working Space",
    slug: "co-working-space",
    description: "Flexible shared workspace for individuals, freelancers and teams.",
    category: "Workspace access",
    icon: Laptop,
    accent: "from-sky-100 to-teal-100 text-blue-700",
  },
  {
    label: "Virtual Office",
    slug: "virtual-office",
    description: "Professional business address and virtual office support.",
    category: "Business services",
    icon: Building2,
    accent: "from-orange-100 to-amber-100 text-amber-700",
  },
  {
    label: "Training Room",
    slug: "training-workshop",
    description: "A focused environment for classes, learning and capacity building.",
    category: "Training facility",
    icon: GraduationCap,
    accent: "from-violet-100 to-blue-100 text-violet-700",
  },
  {
    label: "Conference Hall",
    slug: "conference-event-hall",
    description: "Spacious venue for conferences, seminars and large events.",
    category: "Events & conferences",
    icon: Landmark,
    accent: "from-emerald-100 to-sky-100 text-emerald-700",
  },
  {
    label: "Meeting Room",
    slug: "meeting-room",
    description: "Private meeting space for teams, partners and client discussions.",
    category: "Meetings",
    icon: Users,
    accent: "from-rose-100 to-fuchsia-100 text-rose-700",
  },
  {
    label: "Training & Workshop",
    slug: "training-workshop",
    description: "Join or request practical workshops and innovation programmes.",
    category: "Programmes",
    icon: Presentation,
    accent: "from-slate-100 to-teal-100 text-teal-700",
  },
];

export function NewBookingView({
  services,
  userInfo,
}: {
  services: ServiceOption[];
  userInfo: { name?: string | null; email?: string | null; phone?: string | null };
}) {
  const available = CATALOG.map((item, index) => ({
    ...item,
    key: `${item.slug}-${index}`,
    service: services.find((service) => service.slug === item.slug),
  })).filter((item) => item.service);
  const [selectedKey, setSelectedKey] = useState(available[0]?.key ?? "");
  const selected = available.find((item) => item.key === selectedKey) ?? available[0];

  if (!selected || !selected.service) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No bookable services are currently available. Please contact SPAK Innovation Hub.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
        <b>Booking approval:</b> Submitting this form creates a booking request. Your reservation
        remains <b>Pending</b> until approved by SPAK.
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {available.map((item) => {
          const Icon = item.icon;
          const active = item.key === selected.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedKey(item.key)}
              aria-pressed={active}
              className={cn(
                "overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200",
              )}
            >
              <span className={`flex h-24 items-center justify-center bg-gradient-to-br ${item.accent}`}>
                <Icon className="h-9 w-9" aria-hidden />
              </span>
              <span className="block p-4">
                <b className="block text-sm text-ink">{item.label}</b>
                <span className="mt-1 block min-h-[34px] text-[11px] leading-relaxed text-slate-500">
                  {item.description}
                </span>
                <span className="mt-3 flex items-center justify-between">
                  <small className="text-[10px] text-slate-500">{item.category}</small>
                  <small className="font-semibold text-blue-700">
                    {formatCurrency(item.service?.basePrice ?? null, item.service?.currency)}
                  </small>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">New Booking Request</h2>
          <p className="text-xs text-slate-500">Selected: {selected.label}</p>
        </div>
        <a href="/dashboard/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
          View my bookings
        </a>
      </div>
      <BookingForm
        key={selected.key}
        services={selected.service ? [selected.service] : services}
        defaultServiceId={selected.service?.id}
        isAuthenticated
        userInfo={userInfo}
        onSuccessHref="/dashboard/bookings"
      />
    </div>
  );
}
