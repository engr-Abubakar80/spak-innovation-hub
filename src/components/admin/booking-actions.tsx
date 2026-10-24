"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Action = "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

const LABELS: Record<Action, string> = {
  APPROVED: "Approve",
  REJECTED: "Reject",
  CANCELLED: "Cancel",
  COMPLETED: "Mark complete",
};

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Action | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsReason, setNeedsReason] = React.useState<Action | null>(null);
  const [reason, setReason] = React.useState("");

  async function run(action: Action, why?: string) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, reason: why }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update the booking");
      setNeedsReason(null);
      setReason("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not update the booking");
    } finally {
      setBusy(null);
    }
  }

  const isPending = status === "PENDING";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <Button
            size="sm"
            loading={busy === "APPROVED"}
            disabled={busy !== null}
            onClick={() => run("APPROVED")}
          >
            Approve
          </Button>
        )}
        {status !== "REJECTED" && (
          <Button
            size="sm"
            variant="danger"
            loading={busy === "REJECTED"}
            disabled={busy !== null}
            onClick={() => setNeedsReason("REJECTED")}
          >
            Reject
          </Button>
        )}
        {status !== "COMPLETED" && (
          <Button
            size="sm"
            variant="secondary"
            loading={busy === "COMPLETED"}
            disabled={busy !== null}
            onClick={() => run("COMPLETED")}
          >
            Mark complete
          </Button>
        )}
        {isPending && (
          <Button
            size="sm"
            variant="outline"
            loading={busy === "CANCELLED"}
            disabled={busy !== null}
            onClick={() => setNeedsReason("CANCELLED")}
          >
            Cancel
          </Button>
        )}
      </div>

      {needsReason && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="mb-1 block text-xs font-medium text-ink" htmlFor={`reason-${bookingId}`}>
            Reason for {LABELS[needsReason].toLowerCase()}
          </label>
          <textarea
            id={`reason-${bookingId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            placeholder="This is shared with the user."
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={busy === needsReason}
              onClick={() => run(needsReason, reason)}
            >
              Confirm {LABELS[needsReason]}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNeedsReason(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
