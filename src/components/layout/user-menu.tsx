"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { isAdmin } from "@/lib/permissions";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!session?.user) return null;

  const initials = (session.user.name || session.user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:block">{session.user.name}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-panel"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{session.user.name}</p>
            <p className="truncate text-xs text-ink-muted">{session.user.email}</p>
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden /> Dashboard
          </Link>
          {isAdmin(session.user.role) && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-soft hover:bg-slate-50"
            >
              <Shield className="h-4 w-4" aria-hidden /> Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
