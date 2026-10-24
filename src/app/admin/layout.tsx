import Link from "next/link";
import { requireSuperAdmin } from "@/lib/session";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileText,
  Settings,
  ClipboardList,
  BookOpen,
  Palette,
  MessageSquare,
} from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link href="/" className="text-sm font-bold text-ink">
            SPAK Super Admin
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Overview
          </Link>
          <Link href="/admin/applications" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <ClipboardList className="h-4 w-4" aria-hidden />
            Applications
          </Link>
          <Link href="/admin/bookings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Bookings
          </Link>
          <Link href="/admin/programmes" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <BookOpen className="h-4 w-4" aria-hidden />
            Programmes
          </Link>
          <Link href="/admin/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <MessageSquare className="h-4 w-4" aria-hidden />
            Messages
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <Users className="h-4 w-4" aria-hidden />
            Users
          </Link>
          <Link href="/admin/enquiries" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <FileText className="h-4 w-4" aria-hidden />
            Enquiries
          </Link>
          <Link href="/admin/branding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <Palette className="h-4 w-4" aria-hidden />
            Branding
          </Link>
          <Link href="/admin/content" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <FileText className="h-4 w-4" aria-hidden />
            Editable Content
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-100">
            <Settings className="h-4 w-4" aria-hidden />
            Settings
          </Link>
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
