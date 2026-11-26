"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Logo } from "@/components/brand/logo";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || "Could not verify your email. Please try again.");
      return;
    }
    router.push("/login?verified=1");
  }

  async function onResend() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    setResending(false);
    if (!res.ok) {
      setError(body.error || "Could not send a new code. Please try again.");
      return;
    }
    setMessage("A new verification code has been sent. It expires in 10 minutes.");
  }

  return (
    <div className="card w-full max-w-md p-6">
      <div className="flex flex-col items-center">
        <Logo name="SPAK Innovation Hub" href="/" />
        <h1 className="mt-5 text-xl font-bold text-ink">Verify your email</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          Enter the 6-digit code we sent to your email address.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" className="mt-5">
          {message}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Verification code" htmlFor="otp" required>
          <Input
            id="otp"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            className="text-center text-lg tracking-[0.4em]"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Verify email
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-ink-muted">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="link disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-ink-muted">
        <Link href="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
