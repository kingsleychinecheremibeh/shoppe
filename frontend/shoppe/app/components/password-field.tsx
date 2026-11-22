"use client";

import { InputHTMLAttributes, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { ui } from "@/lib/ui";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function PasswordField({ label, error, className = "", id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`${ui.input} pr-14 ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-1.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-ink transition hover:bg-gray-100"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
        >
          <HugeiconsIcon icon={visible ? ViewOffSlashIcon : ViewIcon} size={22} strokeWidth={1.6} />
        </button>
      </div>
      {error && (
        <p id={errorId} className={ui.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}
