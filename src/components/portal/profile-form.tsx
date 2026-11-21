"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validation";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  organization: string;
  createdAt: string;
}

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      organization: profile.organization,
    },
  });

  async function onSubmit(values: ProfileUpdateInput) {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, message: body.error || "Could not update your profile." });
        return;
      }
      setStatus({ ok: true, message: "Your profile has been updated." });
      router.refresh();
    } catch {
      setStatus({ ok: false, message: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status && (
        <Alert variant={status.ok ? "success" : "error"}>{status.message}</Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="profile-name" required error={errors.name?.message}>
          <Input id="profile-name" {...register("name")} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email address" htmlFor="profile-email">
          <Input id="profile-email" value={profile.email} readOnly disabled />
        </Field>
        <Field label="Phone number" htmlFor="profile-phone" error={errors.phone?.message}>
          <Input id="profile-phone" {...register("phone")} aria-invalid={!!errors.phone} />
        </Field>
        <Field
          label="Organisation / Company"
          htmlFor="profile-organization"
          error={errors.organization?.message}
        >
          <Input
            id="profile-organization"
            {...register("organization")}
            aria-invalid={!!errors.organization}
          />
        </Field>
      </div>
      <p className="text-[11px] text-slate-500">
        To change your email address, contact SPAK support so your account can be verified again.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </button>
    </form>
  );
}
