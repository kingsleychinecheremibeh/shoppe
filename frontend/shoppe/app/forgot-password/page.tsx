import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { storeConfig } from "@/lib/store-config";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  const whatsappDigits = storeConfig.whatsappNumber.replace(/[^\d]/g, "");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the email on your account and we&apos;ll send you a link to choose a new password.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-8 text-center text-sm text-gray-500">
          No email?{" "}
          <a
            href={`mailto:${storeConfig.supportEmail}?subject=${encodeURIComponent("Password reset")}`}
            className="font-medium text-gray-950 underline-offset-4 hover:underline"
          >
            Email support
          </a>
          {whatsappDigits && (
            <>
              {" "}or{" "}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-950 underline-offset-4 hover:underline"
              >
                WhatsApp us
              </a>
            </>
          )}
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to log in
          </Link>
        </div>
      </div>
    </main>
  );
}
