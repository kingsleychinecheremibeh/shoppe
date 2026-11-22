"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
import { api } from "@/lib/api";

const schema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(72, "Password must be at most 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!TOKEN_PATTERN.test(token)) {
    return (
      <div className="rounded-2xl bg-canvas p-6 text-center">
        <p className="text-sm font-medium text-gray-950">This reset link isn&apos;t valid</p>
        <p className="mt-1 text-sm text-gray-600">It may be incomplete or already used. Request a new one.</p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
        >
          Get a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-canvas p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-gray-950">Password updated</p>
        <p className="mt-1 text-sm text-gray-600">
          For your security we&apos;ve signed you out everywhere. Log in with your new password.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
        >
          Log in
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }: FormData) => {
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error && error.message
            ? error.message
            : "We couldn't reset your password. Please request a new link.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errors.root ? (
        <div className="space-y-2">
          <AlertBanner variant="error" message={errors.root.message} />
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-hover">
            Request a new link
          </Link>
        </div>
      ) : null}
      <PasswordField
        {...register("password")}
        id="password"
        label="New password"
        autoComplete="new-password"
        error={errors.password?.message}
      />
      <PasswordField
        {...register("confirmPassword")}
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
      />
      <LoadingButton
        type="submit"
        loading={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
      >
        Update password
      </LoadingButton>
    </form>
  );
}
