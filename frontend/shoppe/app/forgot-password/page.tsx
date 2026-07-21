"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unable to request password reset. Please try again.";
};

export default function ForgotPasswordPage() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    const email = data.email.trim();

    try {
      setStatusMessage(null);
      await api.forgotPassword(email);
      setStatusMessage("If the account exists, a reset code has been sent. Redirecting...");
      window.setTimeout(() => {
        window.location.assign(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-950">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950">Password Reset</h1>
            <p className="mt-2 text-gray-600">Enter your email to receive a reset code</p>
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

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="w-full rounded-lg bg-gray-950 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Reset Code
            </LoadingButton>
          </form>

          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-950 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
