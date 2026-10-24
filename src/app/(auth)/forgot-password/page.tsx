"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation";
import type { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: FormValues) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => undefined);
    setDone(true);
  }

  return (
    <div className="card w-full max-w-md p-6">
      <div className="flex flex-col items-center">
        <Logo name="SPAK Innovation Hub" href="/" />
        <h1 className="mt-5 text-xl font-bold text-ink">Reset your password</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          Enter the email address associated with your account. If that address exists, we'll send
          you a link to reset your password.
        </p>
      </div>

      {done && (
        <Alert variant="success" className="mt-5">
          If an account exists for this email, a password reset link has been sent. Please check
          your inbox and spam folder.
        </Alert>
      )}

      {!done && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-ink-muted">
        <Link href="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
