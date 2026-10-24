"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";

type Setting = { key: string; value: string; category: string };

export function EditableContentManager({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(settings);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<string, Setting[]>();
    for (const s of items) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save content");
      setNotice("Content updated. Changes apply across the site.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not save content");
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string) {
    setItems((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  }

  return (
    <div className="space-y-6">
      {groups.map(([category, group]) => (
        <div key={category} className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-base font-semibold capitalize text-ink">{category}</h2>
          </div>
          <div className="space-y-4 p-5">
            {group.map((s) => (
              <div key={s.key}>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={s.key}>
                  {s.key}
                </label>
                <Textarea
                  id={s.key}
                  value={s.value}
                  onChange={(e) => update(s.key, e.target.value)}
                  rows={s.key.includes("description") || s.key.includes("about") ? 4 : 2}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <Button onClick={save} loading={saving}>
        Save all changes
      </Button>
    </div>
  );
}
