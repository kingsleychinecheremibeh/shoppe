"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const verifySchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6 digit code."),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Email verification failed. Please try again.";
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialEmail ? "We sent a 6 digit verification code to your email." : null
  );
  const [resendCooldown, setResendCooldown] = useState(initialEmail ? 60 : 0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: initialEmail, code: "" },
  });

  const onSubmit = async (data: VerifyFormData) => {
    try {
      setStatusMessage(null);
      await api.verifyEmail(data.email.trim(), data.code.trim());
      setStatusMessage("Email verified. Redirecting you to login...");
      window.setTimeout(() => window.location.assign("/login"), 1200);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  const onResend = async () => {
    const email = getValues("email").trim();
    if (!email) {
      setError("email", { message: "Enter your email before resending." });
      return;
    }

    try {
      setIsResending(true);
      setStatusMessage(null);
      await api.resendVerification(email);
      setStatusMessage("Verification code sent. Check your email for the new code.");
      setResendCooldown(60);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-950">
              <MailCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950">Verify Email</h1>
            <p className="mt-2 text-gray-600">Enter the 6 digit code sent to your email</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {statusMessage ? <AlertBanner variant="info" message={statusMessage} /> : null}
            {errors.root ? <AlertBanner variant="error" message={errors.root.message} /> : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder="you@example.com"
              />
              {errors.email ? <p className="mt-1 text-sm text-red-500">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-900">
                Verification Code
              </label>
              <input
                {...register("code")}
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder="000000"
              />
              {errors.code ? <p className="mt-1 text-sm text-red-500">{errors.code.message}</p> : null}
            </div>

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="w-full rounded-lg bg-gray-950 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify Email
            </LoadingButton>
          </form>

          <button
            type="button"
            onClick={onResend}
            disabled={isResending || resendCooldown > 0}
            className="mt-4 w-full text-sm font-medium text-gray-950 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {isResending
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already verified?{" "}
            <Link href="/login" className="font-medium text-gray-950 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
