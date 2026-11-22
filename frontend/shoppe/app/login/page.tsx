"use client";

import Link from "next/link";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { PasswordField } from "@/app/components/password-field";
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
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">Log in to check out faster and track your orders.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          <div>
            <PasswordField
              {...register("password")}
              id="password"
              label="Password"
              autoComplete="current-password"
              error={errors.password?.message}
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-gray-500 transition hover:text-gray-950">
                Forgot password?
              </Link>
            </div>
          </div>

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Log in
          </LoadingButton>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          New here?{" "}
          <Link href="/register" className="font-medium text-gray-950 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
