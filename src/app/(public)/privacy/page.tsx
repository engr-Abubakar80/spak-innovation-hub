import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SPAK Innovation Hub collects, uses and protects your personal information.",
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
        title="Privacy Policy"
      />
      <div className="prose-spak">
        <p>{settings["privacy.content"]}</p>
        <h2>Information we collect</h2>
        <p>
          When you register an account, submit a booking request or send an enquiry, we collect the
          details you provide such as your name, email address, phone number, organisation and the
          details of your request.
        </p>
        <h2>How we use your information</h2>
        <p>
          We use your information solely to process booking requests, respond to enquiries, deliver
          our services and communicate with you about your account. We do not sell your data.
        </p>
        <h2>Data security</h2>
        <p>
          Passwords are stored using a strong one-way hashing algorithm and are never stored in
          plain text. Access to personal data is restricted to authorised personnel.
        </p>
        <h2>Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting
          us at {settings["org.email"]}.
        </p>
      </div>
    </div>
  );
}
