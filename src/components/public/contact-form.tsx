"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { enquirySchema } from "@/lib/validation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type FormValues = z.infer<typeof enquirySchema>;

export function ContactForm({
  services,
}: {
  services: { id: string; name: string }[];
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(enquirySchema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "We could not send your enquiry. Please try again.");
      return;
    }
    setDone(true);
    reset();
  }

  if (done) {
    return (
      <Alert variant="success" title="Enquiry sent">
        Thank you for contacting SPAK Innovation Hub. Our team will respond to your enquiry shortly.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" required error={errors.name?.message}>
          <Input id="c-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email address" htmlFor="c-email" required error={errors.email?.message}>
          <Input id="c-email" type="email" autoComplete="email" {...register("email")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone number (optional)" htmlFor="c-phone" error={errors.phone?.message}>
          <Input id="c-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field label="Regarding (optional)" htmlFor="c-service" error={errors.serviceId?.message}>
          <Select id="c-service" {...register("serviceId")}>
            <option value="">General enquiry</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Subject (optional)" htmlFor="c-subject" error={errors.subject?.message}>
        <Input id="c-subject" {...register("subject")} />
      </Field>
      <Field label="Message" htmlFor="c-message" required error={errors.message?.message}>
        <Textarea id="c-message" rows={5} {...register("message")} />
      </Field>
      {/* Honeypot: hidden from users, must stay empty. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
      </div>
      <Button type="submit" loading={isSubmitting}>
        <Send className="h-4 w-4" aria-hidden /> Send enquiry
      </Button>
    </form>
  );
}
