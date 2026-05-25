"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
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
    role?: "USER" | "ADMIN";
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Login failed. Please check your credentials.";
};

export default function LoginPage() {
  const router = useRouter();

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
      window.location.assign(result.user?.role === "ADMIN" ? "/admin" : "/account");
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
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-gray-950">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder="Password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="rememberMe" className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-gray-950"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>

              <Link href="/forgot-password" className="text-sm font-medium text-gray-950 hover:underline">
                Forgot password?
              </Link>
            </div>

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="w-full rounded-lg bg-gray-950 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Login
            </LoadingButton>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-gray-950 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-gray-950"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  );
}
