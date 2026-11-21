"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export interface NotificationPreferences {
  emailNotifications: boolean;
  bookingNotifications: boolean;
  messageNotifications: boolean;
}

const OPTIONS: { key: keyof NotificationPreferences; title: string; hint: string }[] = [
  {
    key: "emailNotifications",
    title: "Email notifications",
    hint: "Receive important account updates by email.",
  },
  {
    key: "bookingNotifications",
    title: "Booking updates",
    hint: "Get notified when a booking is approved or rejected.",
  },
  {
    key: "messageNotifications",
    title: "Messages and announcements",
    hint: "Receive messages from the SPAK team.",
  },
];

export function SettingsForm({ initial }: { initial: NotificationPreferences }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  async function save() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setStatus({ ok: false, message: "Could not save your preferences." });
        return;
      }
      setStatus({ ok: true, message: "Your preferences have been saved." });
      router.refresh();
    } catch {
      setStatus({ ok: false, message: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Notification Preferences</h2>
        </div>
        <div className="divide-y divide-slate-100 px-5">
          {OPTIONS.map((option) => (
            <label
              key={option.key}
              className="flex cursor-pointer items-center justify-between gap-4 py-4"
            >
              <span>
                <b className="block text-xs text-ink">{option.title}</b>
                <small className="text-[11px] text-slate-500">{option.hint}</small>
              </span>
              <input
                type="checkbox"
                checked={values[option.key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [option.key]: event.target.checked }))
                }
                className="h-5 w-5 shrink-0 rounded border-slate-300 accent-blue-600"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
          <span className="text-xs text-slate-500">
            {status?.message || "Preferences are saved to your account."}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save preferences
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Account Security</h2>
        </div>
        <div className="divide-y divide-slate-100 px-5">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span>
              <b className="block text-xs text-ink">Change password</b>
              <small className="text-[11px] text-slate-500">Update your account password regularly.</small>
            </span>
            <Link
              href="/dashboard/password"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              Change Password
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span>
              <b className="block text-xs text-ink">Two-factor authentication</b>
              <small className="text-[11px] text-slate-500">
                Contact SPAK support to arrange additional account protection.
              </small>
            </span>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Contact support
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Account Management</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span>
            <b className="block text-xs text-ink">Deactivate account</b>
            <small className="text-[11px] text-slate-500">
              Request temporary deactivation of your account.
            </small>
          </span>
          <Link
            href="/dashboard/support"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Request
          </Link>
        </div>
      </section>
    </div>
  );
}
