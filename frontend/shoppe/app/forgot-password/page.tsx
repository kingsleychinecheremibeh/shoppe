import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { storeConfig } from "@/lib/store-config";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  const whatsappDigits = storeConfig.whatsappNumber.replace(/[^\d]/g, "");

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Online password reset isn&apos;t available yet. Message us from the email on your account and
          we&apos;ll help you get back in.
        </p>

        <div className="mt-8 space-y-3">
          <a
            href={`mailto:${storeConfig.supportEmail}?subject=${encodeURIComponent("Password reset")}`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover"
          >
            <Mail className="h-4 w-4" />
            Email support
          </a>
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 text-sm font-medium text-gray-900 transition hover:border-gray-400"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp us
            </a>
          )}
        </div>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to log in
        </Link>
      </div>
    </main>
  );
}
