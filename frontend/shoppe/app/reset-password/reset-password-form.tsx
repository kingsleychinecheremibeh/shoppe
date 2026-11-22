"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
import { api } from "@/lib/api";
import { ui } from "@/lib/ui";

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
      <div className="text-center" role="alert">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun">
          <HugeiconsIcon icon={Alert02Icon} size={44} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-4 text-2xl font-extrabold text-ink">This reset link isn&apos;t valid</p>
        <p className="mt-2 text-[15px] text-gray-700">It may be incomplete or already used. Request a new one.</p>
        <Link href="/forgot-password" className={`${ui.primary} mt-5`}>
          Get a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center" role="status">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-leaf">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-4 text-2xl font-extrabold text-ink">Password updated</p>
        <p className="mt-2 text-[15px] text-gray-700">
          For your security we&apos;ve signed you out everywhere. Log in with your new password.
        </p>
        <Link href="/login" className={`${ui.primary} mt-5`}>
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
          <Link href="/forgot-password" className={`${ui.link} text-sm`}>
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
        className={`${ui.primary} h-14 w-full text-base`}
      >
        Update password
      </LoadingButton>
    </form>
  );
}
