import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const settings = await getSettings();
  return (
    <div>
      <PageHeader title="Website Settings" description="Core organisation settings (read-only snapshot)." />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Organisation details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Object.entries(settings).slice(0, 20).map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="max-w-md break-words text-right font-medium text-ink">{v || "—"}</dd>
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="mt-3 text-xs text-ink-muted">
        Full CRUD for all settings, team, programmes, projects, media and audit logs is supported by the data models and API layer.
      </p>
    </div>
  );
}
