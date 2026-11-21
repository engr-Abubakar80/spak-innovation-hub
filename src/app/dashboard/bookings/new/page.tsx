import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { toServiceOption } from "@/lib/service-mapper";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { NewBookingView } from "@/components/portal/new-booking-view";

export default async function NewBookingPage() {
  const user = await requireUser();
  const services = await prisma.service
    .findMany({
      where: { published: true },
      include: { facilities: { where: { published: true }, orderBy: { displayOrder: "asc" } } },
      orderBy: { displayOrder: "asc" },
    })
    .then((rows) => rows.map(toServiceOption))
    .catch(() => []);

  return (
    <div>
      <PortalPageHeader
        title="Book a Service"
        description="Choose a SPAK facility or service to get started."
      />
      <NewBookingView
        services={services}
        userInfo={{ name: user.name, email: user.email, phone: user.phone }}
      />
    </div>
  );
}
