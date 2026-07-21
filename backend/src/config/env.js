const requiredBaseEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "FRONTEND_URL",
  "PAYSTACK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const requiredEmailEnv = ["RESEND_API_KEY", "EMAIL_FROM"];

const requiredStripeEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

export const validateEnv = () => {
  const required = [...requiredBaseEnv];

  if (process.env.STRIPE_ENABLED === "true") {
    required.push(...requiredStripeEnv);
  }

  if (process.env.NODE_ENV === "production") {
    required.push(...requiredEmailEnv);
  }

  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
