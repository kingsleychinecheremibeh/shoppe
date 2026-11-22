"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailValidation01Icon } from "@hugeicons/core-free-icons";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";
import { ui } from "@/lib/ui";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    try {
      await api.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (error) {
      setError("root", {
        message: error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.",
      });
    }
  };

  if (sentTo) {
    return (
      <div className="text-center" role="status">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border-[1.5px] border-ink bg-leaf">
          <HugeiconsIcon icon={MailValidation01Icon} size={44} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-4 text-2xl font-extrabold text-ink">Check your inbox</p>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
          If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, we&apos;ve sent a link to reset your
          password. It works for 30 minutes. Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left" noValidate>
      {errors.root ? <AlertBanner variant="error" message={errors.root.message} /> : null}
      <div>
        <label htmlFor="email" className={ui.label}>
          Email
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={ui.input}
        />
        {errors.email && (
          <p id="email-error" className={ui.fieldError}>
            {errors.email.message}
          </p>
        )}
      </div>
      <LoadingButton type="submit" loading={isSubmitting} className={`${ui.primary} h-14 w-full text-base`}>
        Send reset link
      </LoadingButton>
    </form>
  );
}
