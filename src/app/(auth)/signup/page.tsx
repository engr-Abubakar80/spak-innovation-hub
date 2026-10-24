"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { signupSchema } from "@/lib/validation";
import type { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";

type FormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Could not create your account. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          We've sent a verification link to the email address you provided. Please verify your email
          to complete your registration.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-md p-6">
      <div className="flex flex-col items-center">
        <Logo name="SPAK Innovation Hub" href="/" />
        <h1 className="mt-5 text-xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign up to manage your bookings and programme registrations</p>
      </div>

      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email address" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Phone number (optional)" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            At least 8 characters, with at least one letter and one number.
          </p>
        </Field>
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </Field>

        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
            {...register("agreeTerms")}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="link">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="link">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.agreeTerms && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {errors.agreeTerms.message}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
