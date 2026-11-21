"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CalendarCheck, CreditCard, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICONS = {
  booking: CalendarCheck,
  payment: CreditCard,
  message: MessageSquare,
  system: Bell,
};

export function NotificationsList({
  notifications,
}: {
  notifications: PortalNotification[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const unread = notifications.filter((notification) => !notification.readAt).length;

  async function markAllRead() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError("Could not mark notifications as read.");
        return;
      }
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You are all caught up"}
        </p>
        <button
          type="button"
          onClick={markAllRead}
          disabled={loading || unread === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Mark all as read
        </button>
      </div>
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No notifications yet. Booking updates and messages will appear here.
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = ICONS[notification.type as keyof typeof ICONS] ?? Bell;
            const content = (
              <div className="flex gap-3 px-5 py-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    notification.readAt ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-xs text-ink">{notification.title}</b>
                  {notification.body && (
                    <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                      {notification.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </span>
                {!notification.readAt && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />
                )}
              </div>
            );
            return notification.link ? (
              <Link
                key={notification.id}
                href={notification.link}
                className="block border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                {content}
              </Link>
            ) : (
              <div key={notification.id} className="border-b border-slate-100 last:border-0">
                {content}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
