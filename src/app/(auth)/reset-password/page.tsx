"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { resetPasswordSchema } from "@/lib/validation";
import type { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";

type FormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Could not reset your password. The link may have expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login?reset=1"), 1200);
  }

  return (
    <div className="card w-full max-w-md p-6">
      <div className="flex flex-col items-center">
        <Logo name="SPAK Innovation Hub" href="/" />
        <h1 className="mt-5 text-xl font-bold text-ink">Set a new password</h1>
      </div>
      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}
      {done && (
        <Alert variant="success" className="mt-5">
          Password updated. Redirecting to sign in…
        </Alert>
      )}
      {!done && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <input type="hidden" {...register("token")} value={token} />
          <Field label="New password" htmlFor="password" required error={errors.password?.message}>
            <div className="relative">
              <Input id="password" type={show ? "text" : "password"} autoComplete="new-password" {...register("password")} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type={show ? "text" : "password"} autoComplete="new-password" {...register("confirmPassword")} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card w-full max-w-md p-6 text-center text-sm text-ink-muted">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
