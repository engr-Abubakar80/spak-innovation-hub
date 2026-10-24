"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  organization: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

const roleTone: Record<string, "neutral" | "brand" | "warning"> = {
  USER: "neutral",
  ADMIN: "brand",
  SUPER_ADMIN: "warning",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  role: "USER" as User["role"],
  password: "",
};

export function UsersManager() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [tempPass, setTempPass] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json().catch(() => []);
    setUsers(data);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setTempPass(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          organization: form.organization || null,
          password: form.password || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create user");
      setTempPass(data.temporaryPassword);
      setNotice("User created. Share the temporary password once — it must be changed at next login.");
      setForm(emptyForm);
      load();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not create user");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(id: string, patch: Partial<User>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update user");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
      setNotice("User updated.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not update user");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(id: string) {
    if (!window.confirm("Reset this user's password to a temporary password that must be changed at next login?")) return;
    setBusyId(id);
    setError(null);
    setTempPass(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reset password");
      setTempPass(data.temporaryPassword);
      setNotice("Password reset. Temporary password shown below — share it once.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not reset password");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(id: string, email: string) {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete user");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setNotice("User deleted.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not delete user");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-ink-muted">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create user"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-ink">Create user</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Login email" required hint="Never shown as plain text elsewhere except here">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Temporary password" hint="Leave blank to auto-generate. Minimum 8 chars.">
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          </div>
          <Button type="submit" loading={saving}>
            Create user
          </Button>
        </form>
      )}

      {tempPass && (
        <Alert variant="warning">
          Temporary password (copy now — never stored in plain text after):{" "}
          <span className="font-mono font-semibold">{tempPass}</span>
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{u.name ?? "—"}</div>
                  <div className="text-xs text-ink-muted">{u.organization ?? ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{u.email}</div>
                  <div className="text-xs text-ink-muted">Login email</div>
                </td>
                <td className="px-4 py-3">
                  <Select
                    className="h-8 w-36 text-xs"
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => updateUser(u.id, { role: e.target.value as User["role"] })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select
                    className="h-8 w-32 text-xs"
                    value={u.status}
                    disabled={busyId === u.id}
                    onChange={(e) => updateUser(u.id, { status: e.target.value as User["status"] })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  {u.mustChangePassword ? " · must change pwd" : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === u.id}
                      onClick={() => {
                        window.open(`/admin/messages?userId=${u.id}&email=${encodeURIComponent(u.email)}`, "_self");
                      }}
                    >
                      Send message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === u.id}
                      onClick={() => resetPassword(u.id)}
                    >
                      Reset password
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyId === u.id}
                      onClick={() => removeUser(u.id, u.email)}
                    >
                      Delete user
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

