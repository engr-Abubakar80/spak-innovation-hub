import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingStatusBadge } from "@/components/ui/badge";
import { TableWrapper, Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { CalendarCheck, Clock, XCircle, CheckCircle2, Mail } from "lucide-react";
import { formatDate, formatTimeLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [bookings, messagesUnread] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      include: { service: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.message.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name || "there"}`}
        description="Track your bookings, messages and account activity in one place."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={counts.total} icon={CalendarCheck} tone="brand" />
        <StatCard label="Pending" value={counts.pending} icon={Clock} tone="amber" />
        <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Unread messages" value={messagesUnread} icon={Mail} tone="sky" />
      </div>

      <div className="mt-8 card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="panel-title">Recent bookings</h2>
        </div>
        <TableWrapper>
          <Table>
            <THead>
              <tr>
                <TH>Reference</TH>
                <TH>Service</TH>
                <TH>Date</TH>
                <TH>Time</TH>
                <TH>Status</TH>
                <TH>Submitted</TH>
              </tr>
            </THead>
            <TBody>
              {bookings.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center text-ink-muted">
                    No bookings yet.
                  </TD>
                </TR>
              ) : (
                bookings.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-mono text-xs">{b.reference}</TD>
                    <TD>{b.service.name}</TD>
                    <TD>{formatDate(b.date)}</TD>
                    <TD>{`${formatTimeLabel(b.startMinute)} – ${formatTimeLabel(b.endMinute)}`}</TD>
                    <TD>
                      <BookingStatusBadge status={b.status} />
                    </TD>
                    <TD>{formatDate(b.submittedAt)}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrapper>
      </div>
    </div>
  );
}
