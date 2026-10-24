"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function BrandingManager({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(logoUrl);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => setPreview(logoUrl), [logoUrl]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a logo file first.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/branding", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not upload the logo");
      setPreview(data.logoUrl);
      setFile(null);
      setNotice("Logo updated. It is now live across the public site.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not upload the logo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-ink">Current logo</h2>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Current site logo" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <span className="text-xs text-ink-muted">No logo</span>
            )}
          </div>
          <p className="max-w-sm text-sm text-ink-muted">
            Uploading a new logo replaces it immediately on the header, footer and public pages — no
            redeploy required. Accepted formats: PNG, JPG, SVG. Maximum size 5MB.
          </p>
        </div>
      </div>

      <form onSubmit={upload} className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-ink">Upload new logo</h2>
        <div className="mt-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={onFileChange}
            className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-slate-200"
          />
        </div>
        <div className="mt-4">
          <Button type="submit" loading={saving} disabled={!file}>
            Upload logo
          </Button>
        </div>
      </form>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
    </div>
  );
}
