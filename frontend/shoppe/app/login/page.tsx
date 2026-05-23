"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { AlertBanner, LoadingButton } from "@/app/components/feedback";
import { api } from "@/lib/api";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginResponse = {
  user?: {
    role?: "USER" | "ADMIN";
  };
};

const initialFormData: LoginFormData = {
  email: "",
  password: "",
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Login failed. Please check your credentials.";
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setLoading(true);

    try {
      const result = (await api.login(formData.email.trim(), formData.password)) as LoginResponse;
      toast.success("Welcome back!");
      window.location.assign(result.user?.role === "ADMIN" ? "/admin" : "/account");
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError ? <AlertBanner variant="error" message={formError} /> : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder="Password"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center">
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
              loading={loading}
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
