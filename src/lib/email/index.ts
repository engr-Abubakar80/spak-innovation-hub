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

const RESEND_SMTP_HOST = "smtp.resend.com";
const RESEND_SMTP_USER = "resend";
const RESEND_FROM = "SPAK Innovation Hub <onboarding@resend.dev>";

function usesResend(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function isEmailEnabled(): boolean {
  if (usesResend()) return true;
  return (
    String(process.env.EMAIL_ENABLED).toLowerCase() === "true" &&
    !!process.env.EMAIL_SERVER_HOST
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const resend = usesResend();
  const host = process.env.EMAIL_SERVER_HOST || (resend ? RESEND_SMTP_HOST : undefined);
  const port = Number(process.env.EMAIL_SERVER_PORT || (resend ? 465 : 587));
  const secure = port === 465 || port === 2465;
  const user = process.env.EMAIL_SERVER_USER || (resend ? RESEND_SMTP_USER : undefined);
  const pass = process.env.EMAIL_SERVER_PASSWORD || process.env.RESEND_API_KEY;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

function getFrom(): string {
  const configured = process.env.EMAIL_FROM;
  if (usesResend() && (!configured || /@gmail\.com\b/i.test(configured))) {
    return RESEND_FROM;
  }
  return configured || RESEND_FROM;
}

/**
 * Send an email. When email delivery is not configured, the message is logged
 * to the server console and the function reports `skipped`, so callers never
 * claim delivery succeeded when it did not.
 */
export async function sendMail(options: MailOptions): Promise<MailResult> {
  const from = getFrom();

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

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]!);
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

export async function sendVerificationOtp(params: {
  to: string;
  name: string;
  code: string;
  expiresMinutes?: number;
}) {
  const minutes = params.expiresMinutes ?? 10;
  const body = `
    <p>Hello ${escapeHtml(params.name)},</p>
    <p>Use this one-time code to verify your SPAK Innovation Hub email address:</p>
    <p style="margin:24px 0;text-align:center">
      <span style="display:inline-block;padding:16px 24px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;font-size:32px;font-weight:700;letter-spacing:8px">${params.code}</span>
    </p>
    <p style="font-size:13px;color:#64748b">This code expires in ${minutes} minutes. If you did not request it, you can ignore this email.</p>
    <p style="font-size:13px;color:#64748b">Never share this code. SPAK staff will never ask you for it.</p>`;
  return sendMail({
    to: params.to,
    subject: "Your SPAK Innovation Hub verification code",
    html: wrap("Verify your email", body),
    text: `Your SPAK Innovation Hub verification code is ${params.code}. It expires in ${minutes} minutes. If you did not request it, you can ignore this email.`,
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
