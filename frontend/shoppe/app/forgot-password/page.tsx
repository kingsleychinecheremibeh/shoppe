import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { AuthShell } from "@/app/components/auth-shell";
import { storeConfig } from "@/lib/store-config";
import { ui } from "@/lib/ui";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  const whatsappDigits = storeConfig.whatsappNumber.replace(/[^\d]/g, "");

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a link to choose a new password."
      accent="blue"
      footer={
        <div className="space-y-4">
          <p>
            No email?{" "}
            <a href={`mailto:${storeConfig.supportEmail}?subject=${encodeURIComponent("Password reset")}`} className={ui.link}>
              Email support
            </a>
            {whatsappDigits && (
              <>
                {" "}or{" "}
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className={ui.link}>
                  WhatsApp us
                </a>
              </>
            )}
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} strokeWidth={1.8} />
            Back to log in
          </Link>
        </div>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
