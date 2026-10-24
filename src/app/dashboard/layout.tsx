import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  UserCircle,
  LogOut,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { UserMenu } from "@/components/layout/user-menu";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCircle },
  { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/dashboard/messages", label: "Messages", icon: Mail },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/" className="text-sm font-bold text-ink">
            SPAK Innovation Hub
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
          {isAdmin(user.role) && (
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              <Shield className="h-4 w-4" aria-hidden />
              Admin Dashboard
            </Link>
          )}
        </nav>
        <div className="border-t border-slate-200 p-3 text-xs text-ink-muted">
          Signed in as {user.name}
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <Link href="/" className="lg:hidden">
            SPAK
          </Link>
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
