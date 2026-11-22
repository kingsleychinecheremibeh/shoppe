"use client";

import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
import { AuthShell } from "@/app/components/auth-shell";
import { ui } from "@/lib/ui";
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
    <AuthShell
      title="Create your account"
      subtitle="Save addresses, check out faster and track every order."
      accent="pink"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={ui.link}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errors.root ? <AlertBanner variant="error" message={errors.root.message} /> : null}

        <div>
          <label htmlFor="name" className={ui.label}>
            Full name
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={ui.input}
          />
          {errors.name && (
            <p id="name-error" className={ui.fieldError}>
              {errors.name.message}
            </p>
          )}
        </div>

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

        <PasswordField {...register("password")} id="password" label="Password" autoComplete="new-password" error={errors.password?.message} />

        <PasswordField
          {...register("confirmPassword")}
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />

        <label htmlFor="terms" className="flex items-start gap-3 text-[15px] text-gray-700">
          <input id="terms" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink accent-ink" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className={ui.link}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className={ui.link}>
              Privacy Policy
            </Link>
          </span>
        </label>

        <LoadingButton type="submit" loading={isSubmitting} className={`${ui.primary} h-14 w-full text-base`}>
          Create account
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
