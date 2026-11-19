import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-500">Use at least 6 characters. You&apos;ll be asked to log in again.</p>
        </div>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-gray-100" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
