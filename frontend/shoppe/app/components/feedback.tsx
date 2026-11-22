"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

type AlertVariant = "error" | "success" | "info" | "warning";

const alertStyles: Record<AlertVariant, string> = {
  error: "bg-red-50 text-ink",
  success: "bg-leaf-soft text-ink",
  info: "bg-blue-soft text-ink",
  warning: "bg-sun-soft text-ink",
};

const alertIconColor: Record<AlertVariant, string> = {
  error: "text-danger",
  success: "text-leaf",
  info: "text-blue",
  warning: "text-ink",
};

export function AlertBanner({ variant = "info", message }: { variant?: AlertVariant; message?: string }) {
  if (!message) return null;

  const icon =
    variant === "error" || variant === "warning" ? Alert02Icon : variant === "success" ? CheckmarkCircle02Icon : InformationCircleIcon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border-[1.5px] border-ink px-4 py-3 text-[15px] ${alertStyles[variant]}`}
    >
      <HugeiconsIcon icon={icon} size={24} strokeWidth={1.7} className={`shrink-0 ${alertIconColor[variant]}`} />
      <p className="pt-0.5">{message}</p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-sm font-medium text-danger">{message}</p>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-16 text-center">
      <h2 className="text-3xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-base text-gray-700">{message}</p>
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
      {loading ? <HugeiconsIcon icon={Loading03Icon} size={20} className="animate-spin" /> : null}
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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-lg border-[1.5px] border-ink bg-paper p-6 shadow-sticker"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-title" className="text-2xl font-extrabold text-ink">
              {title}
            </h2>
            <p id="confirm-message" className="mt-2 text-[15px] text-gray-700">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-gray-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-lg border-[1.5px] border-ink bg-white px-4 text-[15px] font-semibold text-ink transition hover:bg-gray-100"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-danger px-5 text-[15px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <HugeiconsIcon icon={Loading03Icon} size={20} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
