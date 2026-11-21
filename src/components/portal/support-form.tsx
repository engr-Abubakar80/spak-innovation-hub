"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { enquirySchema, type EnquiryInput } from "@/lib/validation";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";

export interface SupportUserData {
  name: string;
  email: string;
  phone: string;
}

export function SupportForm({ user }: { user: SupportUserData }) {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      subject: "",
      message: "",
      source: "portal",
      honeypot: "",
    },
  });

  async function onSubmit(values: EnquiryInput) {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, message: body.error || "Could not send your support request." });
        return;
      }
      setStatus({
        ok: true,
        message: "Your support request has been sent to the SPAK team.",
      });
      reset({
        ...values,
        subject: "",
        message: "",
      });
    } catch {
      setStatus({ ok: false, message: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("honeypot")} tabIndex={-1} autoComplete="off" />
      {status && <Alert variant={status.ok ? "success" : "error"}>{status.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="support-name" required error={errors.name?.message}>
          <Input id="support-name" {...register("name")} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email address" htmlFor="support-email" required error={errors.email?.message}>
          <Input id="support-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Phone number" htmlFor="support-phone" error={errors.phone?.message}>
          <Input id="support-phone" {...register("phone")} aria-invalid={!!errors.phone} />
        </Field>
        <Field label="Subject" htmlFor="support-subject" error={errors.subject?.message}>
          <Input id="support-subject" {...register("subject")} aria-invalid={!!errors.subject} />
        </Field>
      </div>
      <Field label="How can we help?" htmlFor="support-message" required error={errors.message?.message}>
        <Textarea
          id="support-message"
          {...register("message")}
          minLength={10}
          maxLength={4000}
          className="min-h-[160px]"
          aria-invalid={!!errors.message}
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Send support request
      </button>
    </form>
  );
}
