import * as React from "react";
import type { BookingStatus, EnquiryStatus, ProgrammeStatus, Role } from "@prisma/client";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const bookingTone: Record<BookingStatus, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  COMPLETED: "info",
};

const bookingLabel: Record<BookingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={bookingTone[status]}>
      <span className="sr-only">Status:</span>
      {bookingLabel[status]}
    </Badge>
  );
}

const enquiryTone: Record<EnquiryStatus, Tone> = {
  NEW: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  return <Badge tone={enquiryTone[status]}>{status.replace("_", " ").toLowerCase()}</Badge>;
}

const programmeTone: Record<ProgrammeStatus, Tone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CANCELLED: "danger",
  COMPLETED: "info",
};

export function ProgrammeStatusBadge({ status }: { status: ProgrammeStatus }) {
  return <Badge tone={programmeTone[status]}>{status.toLowerCase()}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  const tone: Tone = role === "SUPER_ADMIN" ? "brand" : role === "ADMIN" ? "info" : "neutral";
  return <Badge tone={tone}>{role.replace("_", " ").toLowerCase()}</Badge>;
}

const applicationTone: Record<"UNDER_REVIEW" | "APPROVED" | "REJECTED", Tone> = {
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED";
}) {
  const labels: Record<string, string> = {
    UNDER_REVIEW: "Under Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return (
    <Badge tone={applicationTone[status]}>
      <span className="sr-only">Status:</span>
      {labels[status] ?? status}
    </Badge>
  );
}
