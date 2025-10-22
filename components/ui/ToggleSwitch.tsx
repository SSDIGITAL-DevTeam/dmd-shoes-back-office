// components/ui/ToggleSwitch.tsx
"use client";
import React from "react";
import clsx from "clsx";

export type ToggleSwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "checked"
> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  className,
  ...rest
}: ToggleSwitchProps) {
  return (
    <label
      className={clsx(
        "inline-flex items-center gap-2 select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;
          onChange(e.target.checked);
        }}
        {...rest} // termasuk aria-busy, aria-label, data-*, dll
      />
      <span
        aria-hidden="true"
        className={clsx(
          "relative inline-flex h-6 w-11 rounded-full transition-colors",
          checked ? "bg-green-500" : "bg-gray-300"
        )}
      >
        <span
          className={clsx(
            "pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-0.5"
          )}
        />
      </span>
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
    </label>
  );
}
