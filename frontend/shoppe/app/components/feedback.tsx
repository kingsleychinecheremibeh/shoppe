"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

type AlertVariant = "error" | "success" | "info" | "warning";

const alertStyles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function AlertBanner({
    variant = "info",
    message,
}: {
    variant?: AlertVariant;
    message?: string;
}) {
    if (!message) return null;

    const Icon = variant === "error" ? AlertTriangle : variant === "success" ? CheckCircle2 : Info;

    return (
        <div className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${alertStyles[variant]}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
        </div>
    );
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p className="mt-1 text-sm text-red-600">
            {message}
        </p>
    );
}

export function EmptyState({
    title,
    message,
    action,
}: {
    title: string;
    message: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 max-w-md text-sm text-gray-600">{message}</p>
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}

export function LoadingButton({
    loading,
    children,
    className = "",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
}) {
    return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>

          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
