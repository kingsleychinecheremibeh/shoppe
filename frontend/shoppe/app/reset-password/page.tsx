"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6 digit code."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormData = z.infer<typeof resetSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Password reset failed. Please try again.";
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialEmail ? "Enter the reset code sent to your email." : null
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: initialEmail, code: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      setStatusMessage(null);
      await api.resetPassword(data.email.trim(), data.code.trim(), data.password);
      setStatusMessage("Password reset successful. Redirecting you to login...");
      window.setTimeout(() => window.location.assign("/login"), 1200);
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
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950">Reset Password</h1>
            <p className="mt-2 text-gray-600">Enter your code and choose a new password</p>
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
                Reset Code
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

            <PasswordField
              {...register("password")}
              id="password"
              label="New Password"
              autoComplete="new-password"
              placeholder="New password"
              error={errors.password?.message}
            />

            <PasswordField
              {...register("confirmPassword")}
              id="confirmPassword"
              label="Confirm Password"
              autoComplete="new-password"
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
            />

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="w-full rounded-lg bg-gray-950 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Password
            </LoadingButton>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-gray-950 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
