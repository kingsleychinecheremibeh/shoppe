import { Suspense } from "react";
import { AuthShell } from "@/app/components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 6 characters. You'll be asked to log in again." accent="leaf">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-canvas" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
