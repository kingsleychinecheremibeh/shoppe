import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

/**
 * Outgoing email over SMTP. Works with any SMTP provider (Gmail app password, Resend,
 * Brevo, Mailgun, Zoho, ...). Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM.
 * When SMTP is not configured, emails are not sent; in development the message is logged
 * instead so flows like password reset can still be tested locally.
 */

export const isMailerConfigured = () =>
  Boolean(process.env.SMTP_HOST?.trim() && process.env.MAIL_FROM?.trim());

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, text, html }) => {
  if (!isMailerConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      logger.info(`[Mail] SMTP not configured. Would send to ${to}: ${subject}\n${text}`);
    } else {
      logger.warn("[Mail] SMTP not configured; email not sent", { subject });
    }
    return { sent: false };
  }

  await getTransporter().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
  return { sent: true };
};
