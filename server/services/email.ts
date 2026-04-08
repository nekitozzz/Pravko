import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");

  if (!host) return null;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Resolve "localhost" to 127.0.0.1 — Node.js prefers ::1 (IPv6) which Docker may not bind
  const resolvedHost = host === "localhost" ? "127.0.0.1" : host;

  transporter = nodemailer.createTransport({
    host: resolvedHost,
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });

  return transporter;
}

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendMail(message: MailMessage): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  const from = process.env.SMTP_FROM || "noreply@pravko.ru";

  try {
    await t.sendMail({ from, ...message });
    return true;
  } catch (err) {
    console.error("[email] failed to send:", (err as Error).message);
    return false;
  }
}
