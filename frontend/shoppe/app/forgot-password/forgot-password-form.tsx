"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MailCheck } from "lucide-react";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";

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
      <div className="rounded-2xl bg-canvas p-6 text-center">
        <MailCheck className="mx-auto h-8 w-8 text-brand" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-gray-950">Check your inbox</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          If an account exists for <span className="font-medium text-gray-900">{sentTo}</span>, we&apos;ve sent a link
          to reset your password. It works for 30 minutes. Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left" noValidate>
      {errors.root ? <AlertBanner variant="error" message={errors.root.message} /> : null}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <LoadingButton
        type="submit"
        loading={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
      >
        Send reset link
      </LoadingButton>
    </form>
  );
}
