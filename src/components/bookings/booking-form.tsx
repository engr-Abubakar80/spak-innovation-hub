"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { bookingCreateSchema, type BookingCreateInput } from "@/lib/validation";
import type { AvailabilityResponse, ServiceOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn, formatCurrency, formatTimeLabel, minutesToTime } from "@/lib/utils";

const STEPS = ["Booking details", "Your details", "Review & submit"] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingForm({
  services,
  defaultServiceId,
  isAuthenticated,
  userInfo,
  onSuccessHref = "/dashboard/bookings",
}: {
  services: ServiceOption[];
  defaultServiceId?: string;
  isAuthenticated: boolean;
  userInfo?: { name?: string | null; email?: string | null; phone?: string | null };
  onSuccessHref?: string;
}) {
  const [step, setStep] = useState(0);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const initialService = defaultServiceId ?? services[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BookingCreateInput>({
    resolver: zodResolver(bookingCreateSchema),
    mode: "onTouched",
    defaultValues: {
      serviceId: initialService,
      facilityId: "",
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      attendees: 1,
      preferredContact: "email",
      agreeTerms: undefined as unknown as true,
      guestName: userInfo?.name ?? "",
      guestEmail: userInfo?.email ?? "",
      guestPhone: userInfo?.phone ?? "",
    },
  });

  const serviceId = watch("serviceId");
  const facilityId = watch("facilityId");
  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const attendees = watch("attendees");

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? services[0],
    [services, serviceId],
  );

  const facilityOptions = selectedService?.facilities ?? [];

  // Reset facility when service changes and auto-select if only one.
  useEffect(() => {
    if (!selectedService) return;
    if (selectedService.facilities.length === 1) {
      setValue("facilityId", selectedService.facilities[0]!.id);
    } else {
      setValue("facilityId", "");
    }
  }, [selectedService, setValue]);

  // Fetch availability whenever the relevant inputs change.
  useEffect(() => {
    if (!serviceId || !date) {
      setAvailability(null);
      return;
    }
    if (facilityOptions.length > 1 && !facilityId) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setLoadingAvail(true);
    const params = new URLSearchParams({ serviceId, date });
    if (facilityId) params.set("facilityId", facilityId);
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, facilityId, date, facilityOptions.length]);

  // Times available for selection.
  const timeOptions = useMemo(() => {
    const open = availability?.window?.openMinute ?? selectedService?.operatingStart ?? 480;
    const close = availability?.window?.closeMinute ?? selectedService?.operatingEnd ?? 1080;
    const slot = availability?.slotMinutes ?? selectedService?.slotMinutes ?? 30;
    const out: number[] = [];
    for (let m = open; m <= close; m += slot) out.push(m);
    return out;
  }, [availability, selectedService]);

  const conflictWarning = useMemo(() => {
    if (!availability || !startTime || !endTime) return null;
    const s = timeOptions.length ? timeOptions : [0];
    const start = Number(watch("startTime").split(":")[0]) * 60 + Number(watch("startTime").split(":")[1]);
    const end = Number(watch("endTime").split(":")[0]) * 60 + Number(watch("endTime").split(":")[1]);
    void s;
    const clash = availability.booked.find((b) => start < b.endMinute && b.startMinute < end);
    if (clash) {
      return `The slot ${formatTimeLabel(clash.startMinute)} – ${formatTimeLabel(clash.endMinute)} is already reserved. Please choose another time.`;
    }
    return null;
  }, [availability, startTime, endTime, timeOptions, watch]);

  async function goNext() {
    const fieldsByStep: Array<Array<keyof BookingCreateInput>> = [
      ["serviceId", "facilityId", "date", "startTime", "endTime", "attendees"],
      isAuthenticated
        ? ["organization", "preferredContact"]
        : ["guestName", "guestEmail", "guestPhone"],
      ["agreeTerms"],
    ];
    const valid = await trigger(fieldsByStep[step] as never);
    if (!valid) return;
    if (step === 0 && conflictWarning) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(data: BookingCreateInput) {
    setFormError(null);
    if (conflictWarning) {
      setFormError(conflictWarning);
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          facilityId: data.facilityId || null,
          guestName: isAuthenticated ? undefined : data.guestName,
          guestEmail: isAuthenticated ? undefined : data.guestEmail,
          guestPhone: isAuthenticated ? undefined : data.guestPhone,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(body.error || "We could not submit your booking. Please review and try again.");
        return;
      }
      setSuccessRef(body.reference);
    } catch {
      setFormError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successRef) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink">Booking request received</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your request has been submitted with reference{" "}
          <span className="font-mono font-semibold text-ink">{successRef}</span>. It is now{" "}
          <strong>pending administrative review</strong>.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {selectedService?.requiresApproval
            ? "Our team will verify availability and confirm your booking. You will be notified once the status changes."
            : "Our team will be in touch shortly."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={onSuccessHref}>
            <Button>View my bookings</Button>
          </Link>
          <Link href="/services">
            <Button variant="outline">Book another space</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedService) {
    return <Alert variant="warning">No bookable services are currently available.</Alert>;
  }

  return (
    <div className="card overflow-hidden">
      {/* Step indicator */}
      <ol className="flex divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex flex-1 items-center gap-2 px-4 py-3 text-xs font-medium sm:text-sm",
              i === step ? "bg-white text-brand-800" : "text-ink-muted",
            )}
            aria-current={i === step ? "step" : undefined}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-brand-600 text-white"
                  : i === step
                    ? "bg-brand-700 text-white"
                    : "bg-slate-200 text-slate-600",
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {formError && (
          <Alert variant="error" className="mb-5">
            {formError}
          </Alert>
        )}

        {/* Step 0: booking details */}
        {step === 0 && (
          <div className="space-y-5">
            {services.length > 1 && (
              <Field label="Service" htmlFor="serviceId" required error={errors.serviceId?.message}>
                <Select id="serviceId" {...register("serviceId")} aria-invalid={!!errors.serviceId}>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {facilityOptions.length > 0 && (
              <Field
                label="Facility"
                htmlFor="facilityId"
                required={facilityOptions.length > 1}
                error={errors.facilityId?.message}
                hint={
                  facilityOptions.length === 1
                    ? undefined
                    : "Select the specific room or space you would like to reserve."
                }
              >
                <Select
                  id="facilityId"
                  {...register("facilityId")}
                  disabled={facilityOptions.length === 1}
                  aria-invalid={!!errors.facilityId}
                >
                  {facilityOptions.length > 1 && <option value="">Select a facility…</option>}
                  {facilityOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {f.capacity ? ` · up to ${f.capacity} people` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Date" htmlFor="date" required error={errors.date?.message}>
                <Input
                  id="date"
                  type="date"
                  min={todayISO()}
                  {...register("date")}
                  aria-invalid={!!errors.date}
                />
              </Field>
              <Field label="Start time" htmlFor="startTime" required error={errors.startTime?.message}>
                <Select id="startTime" {...register("startTime")}>
                  {timeOptions.map((m) => (
                    <option key={m} value={minutesToTime(m)}>
                      {formatTimeLabel(m)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="End time" htmlFor="endTime" required error={errors.endTime?.message}>
                <Select id="endTime" {...register("endTime")}>
                  {timeOptions.map((m) => (
                    <option key={m} value={minutesToTime(m)}>
                      {formatTimeLabel(m)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {loadingAvail && (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking availability…
              </p>
            )}
            {availability?.window?.isClosed && (
              <Alert variant="warning">
                The facility is closed on the selected date. Please choose another day.
              </Alert>
            )}
            {conflictWarning && <Alert variant="warning">{conflictWarning}</Alert>}
            {!conflictWarning && date && availability && availability.booked.length > 0 && !loadingAvail && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-ink-soft">
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> Already reserved today:
                </p>
                <p className="mt-1">
                  {availability.booked
                    .map((b) => `${formatTimeLabel(b.startMinute)}–${formatTimeLabel(b.endMinute)}`)
                    .join(", ")}
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Number of attendees"
                htmlFor="attendees"
                required
                error={errors.attendees?.message}
              >
                <Input
                  id="attendees"
                  type="number"
                  min={1}
                  max={availability?.capacity ?? 10000}
                  {...register("attendees")}
                  aria-invalid={!!errors.attendees}
                />
              </Field>
              <Field label="Preferred contact" htmlFor="preferredContact" error={errors.preferredContact?.message}>
                <Select id="preferredContact" {...register("preferredContact")}>
                  <option value="email">Email</option>
                  <option value="phone">Phone call</option>
                  <option value="whatsapp">WhatsApp</option>
                </Select>
              </Field>
            </div>

            <Field label="Purpose of booking" htmlFor="purpose" error={errors.purpose?.message}>
              <Textarea id="purpose" placeholder="Briefly describe what the booking is for." {...register("purpose")} />
            </Field>
            <Field
              label="Additional requirements"
              htmlFor="requirements"
              error={errors.requirements?.message}
              hint="Equipment, layout, accessibility needs or anything else we should arrange."
            >
              <Textarea id="requirements" {...register("requirements")} />
            </Field>
          </div>
        )}

        {/* Step 1: contact details */}
        {step === 1 && (
          <div className="space-y-5">
            {isAuthenticated ? (
              <>
                <Alert variant="info">
                  You are booking as <strong>{userInfo?.name}</strong> ({userInfo?.email}). We will use
                  your account details for this booking.
                </Alert>
                <Field label="Organization / company (optional)" htmlFor="organization" error={errors.organization?.message}>
                  <Input id="organization" {...register("organization")} />
                </Field>
              </>
            ) : (
              <>
                <Alert variant="info">
                  You are booking as a guest. To track your booking status online,{" "}
                  <Link href="/signup" className="link">
                    create an account
                  </Link>{" "}
                  or{" "}
                  <Link href="/login" className="link">
                    log in
                  </Link>
                  .
                </Alert>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="guestName" required error={errors.guestName?.message}>
                    <Input id="guestName" autoComplete="name" {...register("guestName")} />
                  </Field>
                  <Field label="Email address" htmlFor="guestEmail" required error={errors.guestEmail?.message}>
                    <Input id="guestEmail" type="email" autoComplete="email" {...register("guestEmail")} />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone number" htmlFor="guestPhone" required error={errors.guestPhone?.message}>
                    <Input id="guestPhone" type="tel" autoComplete="tel" {...register("guestPhone")} />
                  </Field>
                  <Field label="Organization / company (optional)" htmlFor="organization" error={errors.organization?.message}>
                    <Input id="organization" {...register("organization")} />
                  </Field>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: review */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="panel-title">Review your request</h2>
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {[
                ["Service", selectedService.name],
                [
                  "Facility",
                  facilityOptions.find((f) => f.id === facilityId)?.name ??
                    (facilityOptions.length ? "Not selected" : "—"),
                ],
                ["Date", date],
                [
                  "Time",
                  `${formatTimeLabel(
                    Number(startTime.split(":")[0]) * 60 + Number(startTime.split(":")[1]),
                  )} – ${formatTimeLabel(Number(endTime.split(":")[0]) * 60 + Number(endTime.split(":")[1]))}`,
                ],
                ["Attendees", String(attendees)],
                ["Price", formatCurrency(selectedService.basePrice, selectedService.currency) + (selectedService.priceUnit ? ` ${selectedService.priceUnit}` : "")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <p>
                Submitting this request does not confirm your booking. Confirmation is subject to
                administrative approval and facility availability.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                {...register("agreeTerms")}
              />
              <span>
                I agree to the booking terms and privacy notice, and consent to SPAK Innovation Hub
                processing this request.
              </span>
            </label>
            {errors.agreeTerms && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button type="submit" loading={submitting}>
              Submit booking request
            </Button>
          )}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {selectedService.name} ·{" "}
          <Users className="h-3.5 w-3.5" aria-hidden /> min {selectedService.minDuration} minutes ·
          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {selectedService.category}
        </p>
      </form>
    </div>
  );
}
