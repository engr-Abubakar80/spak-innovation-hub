import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EnquiryStatusBadge } from "@/components/ui/badge";
import { TableWrapper, Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminEnquiriesPage() {
  const user = await requireAdmin();
  const enquiries = await prisma.enquiry.findMany({
    include: { service: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Enquiries" description="Review and manage contact enquiries." />
      <TableWrapper>
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Subject</TH>
              <TH>Service</TH>
              <TH>Status</TH>
              <TH>Received</TH>
            </tr>
          </THead>
          <TBody>
            {enquiries.map((e) => (
              <TR key={e.id}>
                <TD>{e.name}</TD>
                <TD>{e.email}</TD>
                <TD>{e.subject ?? "—"}</TD>
                <TD>{e.service?.name ?? "General"}</TD>
                <TD><EnquiryStatusBadge status={e.status} /></TD>
                <TD>{formatDate(e.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrapper>
    </div>
  );
}
