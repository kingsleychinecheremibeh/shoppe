"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-950">
            <Mail className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950">
            Password Reset
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Password reset is not enabled yet. Please contact the store admin to reset your account
            password.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
