import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using the SPAK Innovation Hub platform and facilities.",
};

export default async function TermsPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
        title="Terms & Conditions"
      />
      <div className="prose-spak">
        <p>{settings["terms.content"]}</p>
        <h2>Booking requests and confirmation</h2>
        <p>{settings["booking.policy"]}</p>
        <h2>Cancellations</h2>
        <p>{settings["booking.cancellationPolicy"]}</p>
        <h2>Acceptable use</h2>
        <p>
          Users agree not to misuse the platform, submit false information, or use the Hub's
          facilities for unlawful purposes. Accounts found in breach may be suspended.
        </p>
      </div>
    </div>
  );
}
