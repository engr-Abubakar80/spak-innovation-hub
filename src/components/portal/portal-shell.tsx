"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Plus,
  Settings,
  Shield,
  UserCircle,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { SocialLinks } from "@/components/brand/social-links";
import { UserMenu } from "@/components/layout/user-menu";
import { cn, initials } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof NAV_ICONS;
  count?: number;
};

const NAV_ICONS = {
  LayoutDashboard,
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  History,
  Mail,
  UserCircle,
  CreditCard,
  Bell,
  Settings,
  LifeBuoy,
  Shield,
};

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "My Dashboard", icon: "LayoutDashboard" },
  { href: "/dashboard/bookings", label: "My Bookings", icon: "CalendarCheck" },
  { href: "/dashboard/bookings/new", label: "New Booking", icon: "Plus" },
  { href: "/dashboard/bookings/pending", label: "Pending Bookings", icon: "Clock" },
  { href: "/dashboard/bookings/approved", label: "Approved Bookings", icon: "CheckCircle2" },
  { href: "/dashboard/bookings/history", label: "Booking History", icon: "History" },
  { href: "/dashboard/messages", label: "Messages", icon: "Mail" },
];

const ACCOUNT_NAV: NavItem[] = [
  { href: "/dashboard/profile", label: "My Profile", icon: "UserCircle" },
  { href: "/dashboard/payments", label: "Payments", icon: "CreditCard" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "Bell" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
  { href: "/dashboard/support", label: "Help & Support", icon: "LifeBuoy" },
];

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white shadow-[inset_3px_0_0_#38c5bd]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PortalShell({
  children,
  user,
  logoUrl,
  counts,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; isAdmin: boolean };
  logoUrl?: string | null;
  counts: { pending: number; messages: number; notifications: number };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const mainNav = MAIN_NAV.map((item) =>
    item.href === "/dashboard/bookings/pending"
      ? { ...item, count: counts.pending }
      : item.href === "/dashboard/messages"
        ? { ...item, count: counts.messages }
        : item,
  );
  const accountNav = ACCOUNT_NAV.map((item) =>
    item.href === "/dashboard/notifications"
      ? { ...item, count: counts.notifications }
      : item,
  );
  const current = [...mainNav, ...accountNav].find((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-sans">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={close}
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[254px] flex-col overflow-y-auto bg-[#142b4a] px-4 py-6 text-slate-300 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-6">
          <LogoMark logoUrl={logoUrl} className="h-10 w-auto max-w-[112px] border-0 p-0.5 ring-0" imageClassName="h-8" />
          <div className="leading-tight">
            <strong className="block text-sm font-bold tracking-wide text-white">SPAK</strong>
            <small className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Innovation Hub
            </small>
          </div>
        </div>

        <NavGroup title="Main Menu" items={mainNav} pathname={pathname} onNavigate={close} />
        <NavGroup title="Account Management" items={accountNav} pathname={pathname} onNavigate={close} />

        {user.isAdmin && (
          <div className="mt-4">
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 rounded-lg bg-brand-600/20 px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-brand-600/30"
            >
              <Shield className="h-[18px] w-[18px]" aria-hidden />
              Admin Dashboard
            </Link>
          </div>
        )}

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-blue-800">
              {initials(user.name)}
            </span>
            <span className="min-w-0 leading-tight">
              <b className="block truncate text-xs text-white">{user.name}</b>
              <small className="text-[11px] text-slate-400">{user.role === "USER" ? "Member Account" : user.role}</small>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign Out
          </button>
          <div className="mt-3 border-t border-white/10 px-2 pt-4">
            <SocialLinks variant="portal" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[254px]">
        <header className="sticky top-0 z-30 flex h-[65px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-slate-500">
              Portal / <b className="text-ink">{current?.label ?? "My Dashboard"}</b>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/dashboard/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            >
              <Bell className="h-4 w-4" />
              {counts.notifications > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
              )}
            </Link>
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-8 sm:pb-12">
          {children}
          <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} SPAK Innovation Hub. All rights reserved.</p>
            <SocialLinks variant="portal" />
          </footer>
        </main>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={close}
          className="fixed right-5 top-5 z-[60] flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
