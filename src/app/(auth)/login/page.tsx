"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Logo } from "@/components/brand/logo";

function LoginForm() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified");
  const errorParam = params.get("error");
  const reset = params.get("reset");
  const callback = params.get("callbackUrl") || "/dashboard";

  const getError = () => {
    if (error) return error;
    if (errorParam) return "Invalid email or password. Please try again.";
    return null;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: callback,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password, or your account is suspended.");
      return;
    }
    if (res?.ok) router.push(callback);
  }

  return (
    <div className="card w-full max-w-md p-6">
      <div className="flex flex-col items-center">
        <Logo name="SPAK Innovation Hub" href="/" />
        <h1 className="mt-5 text-xl font-bold text-ink">Sign in to your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage bookings and access your dashboard</p>
      </div>

      {verified && (
        <Alert variant="success" className="mt-5">
          Email verified. You may now sign in.
        </Alert>
      )}
      {reset && (
        <Alert variant="success" className="mt-5">
          Password reset successfully. Please sign in with your new password.
        </Alert>
      )}
      {getError() && (
        <Alert variant="error" className="mt-5">
          {getError()}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email" required>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="link">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        New to SPAK Innovation Hub?{" "}
        <Link href="/signup" className="link">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card w-full max-w-md p-6 text-center text-sm text-ink-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
