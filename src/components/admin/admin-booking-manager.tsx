"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { BookingStatusBadge } from "@/components/ui/badge";
import { formatDate, formatTimeLabel } from "@/lib/utils";

export type AdminBooking = {
  id: string;
  reference: string;
  status: string;
  date: string;
  startMinute: number;
  endMinute: number;
  attendees: number;
  purpose: string | null;
  requirements: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  adminNote: string | null;
  statusReason: string | null;
  amountToPay: string | number | null;
  accountDetails: string | null;
  paymentInstructions: string | null;
  service: { name: string };
  facility: { name: string } | null;
  user: { id: string; name: string | null; email: string } | null;
  submittedAt: string;
};

export function AdminBookingManager({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(bookings);
  const [selected, setSelected] = React.useState<AdminBooking | null>(null);
  const [status, setStatus] = React.useState<string>("APPROVED");
  const [reason, setReason] = React.useState("");
  const [amountToPay, setAmountToPay] = React.useState("");
  const [accountDetails, setAccountDetails] = React.useState("");
  const [paymentInstructions, setPaymentInstructions] = React.useState("");
  const [suggestDate, setSuggestDate] = React.useState("");
  const [suggestTime, setSuggestTime] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => setItems(bookings), [bookings]);

  function open(b: AdminBooking) {
    setSelected(b);
    setStatus(b.status === "PENDING" ? "APPROVED" : b.status);
    setReason(b.statusReason || "");
    setAmountToPay(b.amountToPay ? String(b.amountToPay) : "");
    setAccountDetails(b.accountDetails || "");
    setPaymentInstructions(b.paymentInstructions || "");
    setSuggestDate("");
    setSuggestTime("");
    setError(null);
    setNotice(null);
  }

  async function update() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/bookings/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: reason || null,
          amountToPay: amountToPay ? Number(amountToPay) : null,
          accountDetails: accountDetails || null,
          paymentInstructions: paymentInstructions || null,
          suggestedDate: suggestDate || null,
          suggestedTime: suggestTime || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update booking");
      setNotice("Booking updated. Account details and amount to pay are visible to the user.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not update booking");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Facility</th>
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                <td className="px-4 py-3 text-ink">{b.service.name}</td>
                <td className="px-4 py-3 text-ink">{b.facility?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink">
                  {formatDate(b.date)} · {formatTimeLabel(b.startMinute)} – {formatTimeLabel(b.endMinute)}
                </td>
                <td className="px-4 py-3">
                  <BookingStatusBadge status={b.status as any} />
                </td>
                <td className="px-4 py-3 text-ink">{b.user?.email ?? b.guestEmail ?? "—"}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => open(b)}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">Booking {selected.reference}</h2>
              <p className="text-sm text-ink-muted">
                {selected.service.name}
                {selected.facility?.name ? ` · ${selected.facility.name}` : ""}
              </p>
            </div>
            <BookingStatusBadge status={selected.status as any} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Update status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </Field>
            <Field label="Amount to pay (NGN)">
              <Input
                value={amountToPay}
                onChange={(e) => setAmountToPay(e.target.value)}
                placeholder="e.g. 15000"
              />
            </Field>
            <Field label="Suggest another date (optional)">
              <Input type="date" value={suggestDate} onChange={(e) => setSuggestDate(e.target.value)} />
            </Field>
            <Field label="Suggest another time (optional)">
              <Input
                type="time"
                value={suggestTime}
                onChange={(e) => setSuggestTime(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Account details to send">
            <Textarea
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder="Bank name, Account name, Account number..."
              rows={3}
            />
          </Field>
          <Field label="Payment instructions">
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="After payment, send proof of payment..."
              rows={3}
            />
          </Field>
          <Field label="Admin note / reason for status change">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </Field>

          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert variant="success">{notice}</Alert>}

          <div className="flex gap-2">
            <Button onClick={update} loading={busy}>
              Save & notify user
            </Button>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
