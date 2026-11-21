"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PortalThreadMessage {
  id: string;
  body: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface PortalThread {
  id: string;
  subject: string;
  lastMessageAt: string;
  unread: number;
  messages: PortalThreadMessage[];
}

export function MessagesInbox({
  threads,
  userId,
}: {
  threads: PortalThread[];
  userId: string;
}) {
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? "");
  const [reply, setReply] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [showCompose, setShowCompose] = useState(threads.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const selected = useMemo(
    () => threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null,
    [threads, selectedId],
  );

  useEffect(() => {
    if (!selected || selected.unread === 0) return;
    const timer = setTimeout(() => {
      void fetch(`/api/user/messages/${selected.id}/read`, { method: "PATCH" })
        .then(() => router.refresh())
        .catch(() => undefined);
    }, 600);
    return () => clearTimeout(timer);
  }, [selected]);

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/user/messages/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Could not send your message.");
        return;
      }
      setReply("");
      setSuccess("Message sent.");
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendNewMessage(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/user/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject.trim(), body: newBody.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Could not send your message.");
        return;
      }
      setNewSubject("");
      setNewBody("");
      setShowCompose(false);
      setSelectedId(body.threadId ?? "");
      setSuccess("Your message has been sent to the SPAK support team.");
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <h2 className="text-sm font-semibold text-ink">Conversations</h2>
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            aria-label="New message"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {threads.length === 0 ? (
          <p className="p-5 text-xs text-slate-500">No conversations yet. Send a message to SPAK support.</p>
        ) : (
          <div className="flex overflow-x-auto lg:block">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedId(thread.id)}
                className={cn(
                  "min-w-[170px] flex-1 border-b border-slate-100 px-4 py-3.5 text-left transition-colors lg:min-w-0",
                  selected?.id === thread.id ? "bg-blue-50" : "hover:bg-slate-50",
                )}
              >
                <b className="block truncate text-xs text-ink">{thread.subject}</b>
                <small className="mt-1 block text-[10px] text-slate-500">
                  {formatDate(thread.lastMessageAt, { day: "numeric", month: "short", year: "numeric" })}
                  {thread.unread > 0 ? ` · ${thread.unread} unread` : ""}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {showCompose ? (
          <form onSubmit={sendNewMessage} className="p-5">
            <h2 className="text-sm font-semibold text-ink">New message to SPAK Support</h2>
            <div className="mt-4 space-y-3">
              <input
                value={newSubject}
                onChange={(event) => setNewSubject(event.target.value)}
                placeholder="Subject"
                aria-label="Subject"
                required
                maxLength={200}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                placeholder="Describe how we can help…"
                aria-label="Message"
                required
                minLength={2}
                maxLength={5000}
                className="min-h-[180px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex justify-end gap-2">
                {threads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send message
                </button>
              </div>
            </div>
          </form>
        ) : selected ? (
          <div className="flex min-h-[440px] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-ink">{selected.subject}</h2>
                <p className="text-[11px] text-slate-500">Usually replies during working hours</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                Support
              </span>
            </div>
            <div className="flex-1 space-y-3 p-5">
              {selected.messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
              ) : (
                selected.messages.map((message) => {
                  const mine = message.authorId === userId;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed",
                        mine ? "ml-auto bg-blue-50 text-blue-900" : "bg-slate-100 text-ink-soft",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {message.authorName || (mine ? "You" : "SPAK Support")} ·{" "}
                        {formatDate(message.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendReply} className="flex gap-2 border-t border-slate-200 p-4">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a message…"
                aria-label="Reply"
                required
                maxLength={5000}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className="flex min-h-[440px] flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm text-slate-500">Start a conversation with SPAK support.</p>
            <button
              type="button"
              onClick={() => setShowCompose(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              New message
            </button>
          </div>
        )}
        {error && <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</p>}
        {success && <p className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-xs text-emerald-700">{success}</p>}
      </div>
    </div>
  );
}
