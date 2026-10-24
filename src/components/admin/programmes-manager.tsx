"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export interface AdminProgramme {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  registrationDeadline: string | null;
  registrationOpen: boolean;
  registrationUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  _count?: { registrations: number };
}

const STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;

const statusTone: Record<string, "neutral" | "success" | "danger" | "info"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CANCELLED: "danger",
  COMPLETED: "info",
};

function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  startDate: "",
  endDate: "",
  location: "",
  format: "In-person",
  registrationDeadline: "",
  registrationOpen: false,
  registrationUrl: "",
  status: "DRAFT" as AdminProgramme["status"],
};

export function ProgrammesManager({ programmes }: { programmes: AdminProgramme[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(programmes);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminProgramme | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => setItems(programmes), [programmes]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setShowForm(true);
  }

  function openEdit(p: AdminProgramme) {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description,
      coverImageUrl: p.coverImageUrl ?? "",
      startDate: toDateInput(p.startDate),
      endDate: toDateInput(p.endDate),
      location: p.location ?? "",
      format: p.format,
      registrationDeadline: toDateInput(p.registrationDeadline),
      registrationOpen: p.registrationOpen,
      registrationUrl: p.registrationUrl ?? "",
      status: p.status,
    });
    setFile(null);
    setPreview(p.coverImageUrl);
    setShowForm(true);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("title", form.title);
      body.set("slug", form.slug);
      body.set("description", form.description);
      body.set("coverImageUrl", form.coverImageUrl);
      body.set("startDate", form.startDate);
      body.set("endDate", form.endDate);
      body.set("location", form.location);
      body.set("format", form.format);
      body.set("registrationDeadline", form.registrationDeadline);
      body.set("registrationOpen", String(form.registrationOpen));
      body.set("registrationUrl", form.registrationUrl);
      body.set("status", form.status);
      if (file) body.set("file", file);

      const res = await fetch(
        editing ? `/api/admin/programmes/${editing.id}` : "/api/admin/programmes",
        { method: editing ? "PATCH" : "POST", body },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save programme");
      setShowForm(false);
      setEditing(null);
      setFile(null);
      setNotice(editing ? "Programme updated." : "Programme created.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not save programme");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: AdminProgramme) {
    if (!window.confirm(`Delete programme "${p.title}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/programmes/${p.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete programme");
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      setNotice("Programme deleted.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not delete programme");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublish(p: AdminProgramme) {
    setBusyId(p.id);
    setError(null);
    try {
      const next = p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const body = new FormData();
      body.set("status", next);
      const res = await fetch(`/api/admin/programmes/${p.id}`, { method: "PATCH", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update programme");
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
      setNotice(`Programme ${next === "PUBLISHED" ? "published" : "unpublished"}.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not update programme");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>New programme</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      {showForm && (
        <form onSubmit={save} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-ink">
            {editing ? `Edit: ${editing.title}` : "Create programme"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Slug" required hint="Lowercase, hyphen separated, e.g. youth-hackathon">
              <Input
                required
                pattern="[a-z0-9-]+"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Start date" required>
              <Input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. SPAK Innovation Hub, Kano"
              />
            </Field>
            <Field label="Format">
              <Select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
              >
                <option>In-person</option>
                <option>Online</option>
                <option>Hybrid</option>
              </Select>
            </Field>
            <Field label="Registration deadline">
              <Input
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
              />
            </Field>
            <Field label="Registration URL">
              <Input
                type="url"
                value={form.registrationUrl}
                onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdminProgramme["status"] })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cover image URL" hint="Optional. Upload a file to override this.">
              <Input
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description" required>
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Upload image or document" hint="PNG, JPG, SVG or PDF up to 5MB.">
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,application/pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-slate-200"
            />
          </Field>

          {preview && (
            <div>
              <p className="mb-2 text-xs font-medium text-ink-muted">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Programme cover preview"
                className="h-32 w-auto rounded-lg border border-slate-200 object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create programme"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registrations</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{p.title}</div>
                  <div className="text-xs text-ink-muted">/{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-ink">{formatDate(p.startDate)}</td>
                <td className="px-4 py-3 text-ink">{p.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[p.status] ?? "neutral"}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-ink">{p._count?.registrations ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busyId === p.id}
                      onClick={() => togglePublish(p)}
                    >
                      {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === p.id}
                      onClick={() => remove(p)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No programmes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
