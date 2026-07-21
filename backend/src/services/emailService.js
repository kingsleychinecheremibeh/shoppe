import { Resend } from "resend";
import { logger } from "../utils/logger.js";

const sendWithResend = async ({ to, subject, text }) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured to send email");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });

  if (error) {
    throw new Error(error.message || "Email provider rejected request");
  }
};

export const emailService = {
  async sendOtp({ to, code, purpose }) {
    const isVerification = purpose === "EMAIL_VERIFICATION";
    const subject = isVerification ? "Verify your email address" : "Reset your password";
    const text = `${isVerification ? "Your email verification" : "Your password reset"} code is ${code}. It expires in 10 minutes.`;

    if (process.env.NODE_ENV !== "production") {
      logger.info(`OTP email prepared for ${to} (${purpose}): ${code}`);
      return;
    }

    await sendWithResend({ to, subject, text });
  },
};
