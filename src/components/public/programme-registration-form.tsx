"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { programmeRegistrationSchema } from "@/lib/validation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";

type FormValues = z.infer<typeof programmeRegistrationSchema>;

export function ProgrammeRegistrationForm({
  programmeId,
  externalUrl,
}: {
  programmeId: string;
  externalUrl?: string | null;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(programmeRegistrationSchema),
    defaultValues: { programmeId },
  });

  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer">
        <Button className="w-full">
          Register on external page <ExternalLink className="h-4 w-4" aria-hidden />
        </Button>
      </a>
    );
  }

  if (done) {
    return (
      <Alert variant="success" title="Registration received">
        Thank you. We have recorded your interest and will contact you with further details.
      </Alert>
    );
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await fetch("/api/programme-registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "We could not record your registration. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <input type="hidden" {...register("programmeId")} />
      <Field label="Full name" htmlFor="reg-name" required error={errors.name?.message}>
        <Input id="reg-name" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="reg-email" required error={errors.email?.message}>
        <Input id="reg-email" type="email" {...register("email")} />
      </Field>
      <Field label="Phone (optional)" htmlFor="reg-phone" error={errors.phone?.message}>
        <Input id="reg-phone" type="tel" {...register("phone")} />
      </Field>
      <Field label="Organization (optional)" htmlFor="reg-org" error={errors.organization?.message}>
        <Input id="reg-org" {...register("organization")} />
      </Field>
      <Button type="submit" loading={isSubmitting} className="w-full">
        Register interest
      </Button>
    </form>
  );
}
