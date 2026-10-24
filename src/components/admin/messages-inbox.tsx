"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Thread = {
  id: string;
  subject: string;
  user: { id: string; name: string | null; email: string; role: string };
  lastMessage: { body: string; createdAt: string; authorId: string | null } | null;
  lastMessageAt: string;
  unread: number;
};

type ThreadDetail = {
  id: string;
  subject: string;
  user: { id: string; name: string | null; email: string; role: string; phone: string | null };
  messages: {
    id: string;
    subject: string;
    body: string;
    createdAt: string;
    authorId: string | null;
    author: { id: string; name: string | null; role: string } | null;
  }[];
};

export function MessagesInbox({
  prefillUserId,
  prefillEmail,
}: {
  prefillUserId?: string;
  prefillEmail?: string;
} = {}) {
  const router = useRouter();
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ThreadDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [composer, setComposer] = React.useState(false);

  async function loadThreads() {
    const res = await fetch("/api/admin/threads");
    const data = await res.json().catch(() => []);
    setThreads(data);
    setLoading(false);
  }

  React.useEffect(() => {
    loadThreads();
  }, []);

  async function openThread(id: string) {
    setSelected(id);
    setComposer(false);
    setError(null);
    const res = await fetch(`/api/admin/threads/${id}`);
    const data = await res.json().catch(() => null);
    setDetail(data);
    loadThreads();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: detail.user.id,
          subject,
          message: reply,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send message");
      setReply("");
      setSubject("");
      setComposer(false);
      setNotice("Message sent.");
      await openThread(detail.id);
      loadThreads();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-ink-muted">Loading…</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <p className="text-sm font-medium text-ink">Threads</p>
        </div>
        <div className="divide-y divide-slate-100">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={`w-full p-3 text-left transition-colors hover:bg-slate-50 ${selected === t.id ? "bg-slate-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{t.user.name ?? t.user.email}</p>
                {t.unread > 0 && (
                  <Badge tone="warning">
                    {t.unread} unread
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">{t.subject}</p>
              {t.lastMessage && (
                <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{t.lastMessage.body}</p>
              )}
              <p className="mt-1 text-[11px] text-ink-muted">{formatDate(t.lastMessageAt)}</p>
            </button>
          ))}
          {threads.length === 0 && (
            <p className="p-4 text-center text-sm text-ink-muted">No threads yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {!detail && (
          <div className="flex h-64 items-center justify-center text-sm text-ink-muted">
            Select a thread to read and reply.
          </div>
        )}
        {detail && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <p className="font-medium text-ink">{detail.user.name ?? detail.user.email}</p>
                <p className="text-sm text-ink-muted">
                  {detail.user.email}
                  {detail.user.phone ? ` · ${detail.user.phone}` : ""}
                </p>
              </div>
              <Button size="sm" onClick={() => setComposer(true)}>
                Send message
              </Button>
            </div>
            <div className="max-h-[480px] space-y-3 overflow-y-auto p-4">
              {detail.messages.map((m) => {
                const fromUser = m.authorId === detail.user.id;
                return (
                  <div key={m.id} className={`flex ${fromUser ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        fromUser ? "bg-slate-100 text-ink" : "bg-brand-700 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[11px] ${fromUser ? "text-ink-muted" : "text-white/80"}`}
                      >
                        {formatDate(m.createdAt)} · {fromUser ? detail.user.name ?? "User" : "Admin"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {composer && (
              <form onSubmit={sendMessage} className="space-y-3 border-t border-slate-200 p-4">
                <Field label="Subject">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={detail.subject}
                  />
                </Field>
                <Field label="Message">
                  <Textarea
                    required
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                  />
                </Field>
                {error && <Alert variant="error">{error}</Alert>}
                <div className="flex gap-2">
                  <Button type="submit" loading={sending}>
                    Send
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setComposer(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
      {notice && (
        <div className="lg:col-span-2">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}
    </div>
  );
}
