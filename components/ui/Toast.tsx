import React, { useEffect } from "react";

type Props = {
  show: boolean;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
  durationMs?: number;
};

export const Toast: React.FC<Props> = ({ show, message, variant = "success", onClose, durationMs = 2500 }) => {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [show, onClose, durationMs]);

  if (!show) return null;

  const color = variant === "success" ? "#16A34A" : "#DC2626";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[60]"
    >
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl backdrop-blur">
        <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-sm text-gray-900">{message}</p>
        <button
          aria-label="Close notification"
          className="ml-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          onClick={onClose}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

