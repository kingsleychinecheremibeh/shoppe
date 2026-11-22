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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginResponse = {
  user?: {
    role?: "USER" | "MANAGER" | "ADMIN";
    managerPermissions?: string[];
  };
};

const getStaffLandingPath = (user?: LoginResponse["user"]) => {
  if (user?.role === "ADMIN") return "/admin";
  if (user?.role !== "MANAGER") return "/account";

  const permissions = user.managerPermissions || [];
  if (permissions.includes("ANALYTICS")) return "/admin";
  if (permissions.includes("ORDER_MANAGEMENT")) return "/admin/orders";
  if (permissions.includes("PRODUCT_MANAGEMENT")) return "/admin/products";
  if (permissions.includes("SHIPPING_MANAGEMENT")) return "/admin/shipping";
  return "/account";
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Login failed. Please check your credentials.";
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = (await api.login(data.email.trim(), data.password)) as LoginResponse;
      toast.success("Welcome back!");
      window.location.assign(getStaffLandingPath(result.user));
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to check out faster and track your orders."
      accent="sun"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className={ui.link}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

        <div>
          <PasswordField
            {...register("password")}
            id="password"
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-gray-700 underline-offset-4 hover:text-ink hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <LoadingButton type="submit" loading={isSubmitting} className={`${ui.primary} h-14 w-full text-base`}>
          Log in
        </LoadingButton>
      </form>
    </AuthShell>
  );
}
