"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export type ApplicationStatus = "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface AdminApplication {
  id: string;
  reference: string;
  applicantName: string;
  applicantEmail: string;
  phone: string | null;
  organization: string | null;
  title: string;
  summary: string;
  details: string | null;
  status: ApplicationStatus;
  reviewNote: string | null;
  statusChangedAt: string;
  createdAt: string;
  programme?: { id: string; title: string } | null;
  service?: { id: string; name: string } | null;
  statusChangedBy?: { id: string; name: string | null; email: string } | null;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const statusTone: Record<ApplicationStatus, "warning" | "success" | "danger"> = {
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const emptyForm = {
  applicantName: "",
  applicantEmail: "",
  phone: "",
  organization: "",
  programmeId: "",
  serviceId: "",
  title: "",
  summary: "",
  details: "",
};

export function ApplicationsManager({
  applications,
  programmes,
  services,
}: {
  applications: AdminApplication[];
  programmes: { id: string; title: string }[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(applications);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminApplication | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => setItems(applications), [applications]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "Approved" && a.status === "APPROVED") ||
        (statusFilter === "Rejected" && a.status === "REJECTED") ||
        (statusFilter === "Under Review" && a.status === "UNDER_REVIEW");
      const qOk =
        !q ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicantEmail.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q);
      return statusOk && qOk;
    });
  }, [items, statusFilter, search]);

  async function changeStatus(app: AdminApplication, status: string, reviewNote?: string) {
    setBusyId(app.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update application");
      setItems((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: data.status, reviewNote: data.reviewNote ?? a.reviewNote, statusChangedAt: data.statusChangedAt }
            : a,
        ),
      );
      setNotice(`Application ${app.reference} marked as ${status}.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not update application");
    } finally {
      setBusyId(null);
    }
  }

  async function removeApp(app: AdminApplication) {
    if (!window.confirm(`Delete application ${app.reference}? This cannot be undone.`)) return;
    setBusyId(app.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete application");
      setItems((prev) => prev.filter((a) => a.id !== app.id));
      setNotice(`Application ${app.reference} deleted.`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not delete application");
    } finally {
      setBusyId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(app: AdminApplication) {
    setEditing(app);
    setForm({
      applicantName: app.applicantName,
      applicantEmail: app.applicantEmail,
      phone: app.phone ?? "",
      organization: app.organization ?? "",
      programmeId: app.programme?.id ?? "",
      serviceId: app.service?.id ?? "",
      title: app.title,
      summary: app.summary,
      details: app.details ?? "",
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        phone: form.phone || null,
        organization: form.organization || null,
        programmeId: form.programmeId || null,
        serviceId: form.serviceId || null,
        details: form.details || null,
      };
      const res = await fetch(
        editing ? `/api/admin/applications/${editing.id}` : "/api/admin/applications",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save application");
      setShowForm(false);
      setEditing(null);
      setNotice(editing ? "Application updated." : "Application created.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not save application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search" className="min-w-[220px] flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, title or reference"
          />
        </Field>
        <Field label="Status" className="w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </Select>
        </Field>
        <Button onClick={openCreate}>New application</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      {showForm && (
        <form onSubmit={save} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-ink">
            {editing ? `Edit ${editing.reference}` : "New application"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Applicant name" required>
              <Input
                required
                value={form.applicantName}
                onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
              />
            </Field>
            <Field label="Applicant email" required>
              <Input
                required
                type="email"
                value={form.applicantEmail}
                onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Organisation">
              <Input
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />
            </Field>
            <Field label="Title" required>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Programme">
              <Select
                value={form.programmeId}
                onChange={(e) => setForm({ ...form, programmeId: e.target.value })}
              >
                <option value="">None</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Service">
              <Select
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              >
                <option value="">None</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Summary" required>
            <Textarea
              required
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </Field>
          <Field label="Details">
            <Textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create application"}
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
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Changed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-xs">{a.reference}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{a.applicantName}</div>
                  <div className="text-xs text-ink-muted">{a.applicantEmail}</div>
                </td>
                <td className="px-4 py-3 text-ink">{a.title}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[a.status]}>{a.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {formatDate(a.statusChangedAt)}
                  {a.statusChangedBy?.name ? ` · ${a.statusChangedBy.name}` : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Select
                      aria-label={`Status for ${a.reference}`}
                      className="h-8 w-36 text-xs"
                      value={a.status}
                      disabled={busyId === a.id}
                      onChange={(e) => changeStatus(a, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === a.id}
                      onClick={() => removeApp(a)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No applications match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
