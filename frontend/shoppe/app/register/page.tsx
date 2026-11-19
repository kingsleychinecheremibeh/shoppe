"use client";

import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Registration failed. Please try again.";
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await api.register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      toast.success("Account created successfully!");
      window.location.assign("/");
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">Save addresses, check out faster and track every order.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errors.root ? <AlertBanner variant="error" message={errors.root.message} /> : null}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input {...register("name")} id="name" type="text" autoComplete="name" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-brand/10" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

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

          <PasswordField
            {...register("password")}
            id="password"
            label="Password"
            autoComplete="new-password"
            error={errors.password?.message}
          />

          <PasswordField
            {...register("confirmPassword")}
            id="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
          />

          <label htmlFor="terms" className="flex items-start gap-2.5 text-sm text-gray-600">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-brand"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-gray-950 underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-gray-950 underline underline-offset-2">
                Privacy Policy
              </Link>
            </span>
          </label>

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create account
          </LoadingButton>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-950 underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
