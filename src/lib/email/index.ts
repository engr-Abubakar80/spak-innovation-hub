import nodemailer, { type Transporter } from "nodemailer";
import { getSettings } from "../settings";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailResult {
  delivered: boolean;
  skipped: boolean;
  reason?: string;
}

function isEmailEnabled(): boolean {
  return (
    String(process.env.EMAIL_ENABLED).toLowerCase() === "true" &&
    !!process.env.EMAIL_SERVER_HOST
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: process.env.EMAIL_SERVER_USER
      ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
      : undefined,
  });
  return transporter;
}

/**
 * Send an email. When email delivery is not configured, the message is logged
 * to the server console and the function reports `skipped`, so callers never
 * claim delivery succeeded when it did not.
 */
export async function sendMail(options: MailOptions): Promise<MailResult> {
  const from =
    process.env.EMAIL_FROM || "SPAK Innovation Hub <spakhub@gmail.com>";

  if (!isEmailEnabled()) {
    console.info(
      `[email:dev] (not delivered — EMAIL_ENABLED is false) to=${options.to} subject="${options.subject}"`,
    );
    return { delivered: false, skipped: true, reason: "Email delivery is not configured." };
  }

  try {
    await getTransporter().sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { delivered: true, skipped: false };
  } catch (error) {
    console.error("[email] delivery failed", error);
    return {
      delivered: false,
      skipped: false,
      reason: "Email delivery failed. Our team has been notified.",
    };
  }
}

function wrap(title: string, body: string, cta?: { label: string; url: string }) {
  const org = "SPAK Innovation Hub";
  const ctaHtml = cta
    ? `<p style="margin:24px 0"><a href="${cta.url}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:18px">${org}</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.9">Innovating for People and Planet</p>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
      <h2 style="font-size:18px;margin-top:0">${title}</h2>
      ${body}
      ${ctaHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="font-size:12px;color:#64748b">This is an automated message from ${org}, Kano, Nigeria. Please do not reply directly to this email.</p>
    </div>
  </div>
</body></html>`;
}

export async function sendBookingAcknowledgement(params: {
  to: string;
  name: string;
  reference: string;
  serviceName: string;
  date: string;
  time: string;
  requiresApproval: boolean;
}) {
  const settings = await getSettings();
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const body = `
    <p>Dear ${params.name},</p>
    <p>Thank you for your booking request. We have received the following request and it is currently <strong>pending review</strong>:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b">Reference</td><td style="padding:6px 0;font-weight:600">${params.reference}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Service</td><td style="padding:6px 0">${params.serviceName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Date</td><td style="padding:6px 0">${params.date}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Time</td><td style="padding:6px 0">${params.time}</td></tr>
    </table>
    <p style="margin-top:16px">${
      params.requiresApproval
        ? "This request requires administrative approval. You will be notified once its status changes."
        : "Your request has been received."
    }</p>
    <p style="color:#64748b;font-size:13px">${settings["booking.policy"] ?? ""}</p>`;
  return sendMail({
    to: params.to,
    subject: `Booking request received — ${params.reference}`,
    html: wrap("Booking request received", body, {
      label: "Track my booking",
      url: `${base}/dashboard/bookings`,
    }),
  });
}

export async function sendBookingStatusUpdate(params: {
  to: string;
  name: string;
  reference: string;
  status: string;
  serviceName: string;
  date: string;
  reason?: string | null;
}) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const statusLabel = params.status.charAt(0) + params.status.slice(1).toLowerCase();
  const body = `
    <p>Dear ${params.name},</p>
    <p>The status of your booking <strong>${params.reference}</strong> (${params.serviceName}) on ${params.date} has been updated to: <strong>${statusLabel}</strong>.</p>
    ${params.reason ? `<p><em>Note from our team:</em> ${params.reason}</p>` : ""}`;
  return sendMail({
    to: params.to,
    subject: `Booking ${params.reference} — ${statusLabel}`,
    html: wrap("Booking status update", body, {
      label: "View details",
      url: `${base}/dashboard/bookings`,
    }),
  });
}

export async function sendEnquiryAcknowledgement(params: {
  to: string;
  name: string;
  subject?: string | null;
}) {
  const body = `<p>Dear ${params.name},</p><p>Thank you for contacting SPAK Innovation Hub. We have received your enquiry${
    params.subject ? ` regarding “${params.subject}”` : ""
  } and our team will respond shortly.</p>`;
  return sendMail({
    to: params.to,
    subject: "We received your enquiry — SPAK Innovation Hub",
    html: wrap("Enquiry received", body),
  });
}

export async function sendPasswordReset(params: {
  to: string;
  name: string;
  token: string;
}) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const url = `${base}/reset-password?token=${encodeURIComponent(params.token)}`;
  const body = `<p>Hello ${params.name},</p><p>We received a request to reset your password. This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>`;
  return sendMail({
    to: params.to,
    subject: "Reset your SPAK Innovation Hub password",
    html: wrap("Password reset requested", body, { label: "Reset password", url }),
    text: `Reset your password: ${url}`,
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const url = `${base}/api/auth/verify-email?token=${encodeURIComponent(params.token)}`;
  const body = `<p>Welcome ${params.name},</p><p>Please confirm your email address to complete your SPAK Innovation Hub account setup.</p>`;
  return sendMail({
    to: params.to,
    subject: "Verify your SPAK Innovation Hub email",
    html: wrap("Verify your email", body, { label: "Verify email", url }),
    text: `Verify your email: ${url}`,
  });
}

/**
 * Sends a temporary password to a user created/reset by an admin.
 * The user must change it at next login (mustChangePassword flag).
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  temporaryPassword: string;
}) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const body = `<p>Hello ${params.name},</p><p>An administrator has created or reset your account. Your temporary password is:</p><p style="font-size:18px;font-weight:700;letter-spacing:1px;padding:12px 16px;background:#f1f5f9;border-radius:8px;display:inline-block;">${params.temporaryPassword}</p><p>Please sign in and change it immediately — you will be required to set a new password.</p><p><a href="${base}/login">Sign in</a></p>`;
  return sendMail({
    to: params.to,
    subject: "Your temporary SPAK Innovation Hub password",
    html: wrap("Temporary password", body, { label: "Sign in", url: `${base}/login` }),
    text: `Your temporary password is: ${params.temporaryPassword}\nSign in: ${base}/login`,
  });
}

export async function sendGenericMessage(params: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) {
  const body = `<p>Dear ${params.name},</p><p>${params.message.replace(/\n/g, "<br/>")}</p>`;
  return sendMail({
    to: params.to,
    subject: params.subject,
    html: wrap(params.subject, body),
  });
}

export { isEmailEnabled };
