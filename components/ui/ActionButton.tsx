import * as React from "react";

type CommonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Teks default bila tidak memakai children */
  label?: string;
  /** Icon opsional di kiri */
  leadingIcon?: React.ReactNode;
  /** Tambahan class Tailwind opsional */
  className?: string;
};

const base =
  "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

/* GREEN — Publish */
export function PublishButton({
  label = "Publish",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} text-white`}
      style={{
        backgroundColor: "#16A34A",
      }}
      onMouseDown={(e) => e.currentTarget.classList.add("brightness-95")}
      onMouseUp={(e) => e.currentTarget.classList.remove("brightness-95")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("brightness-95")}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}

/* BLACK — Draft */
export function DraftButton({
  label = "Draft",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} text-white`}
      style={{ backgroundColor: "#252C32" }}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}

/* BLUE — Create */
export function CreateButton({
  label = "Create",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} text-white`}
      style={{
        backgroundColor: "#16A34A",
      }}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}

/* GRAY — Create & create another */
export function CreateAndContinueButton({
  label = "Create & create another",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} text-white`}
      style={{
        backgroundColor: "#6B7280",
      }}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}

/* WHITE — Cancel */
export function CancelButton({
  label = "Cancel",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} border text-sm`}
      style={{
        backgroundColor: "#FFFFFF",
        color: "#262626",
        borderColor: "#E5E7EB",
      }}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}

/* RED — Delete */
export function DeleteButton({
  label = "Delete",
  children,
  leadingIcon,
  className = "",
  ...props
}: CommonProps) {
  return (
    <button
      className={`${base} text-white`}
      style={{
        backgroundColor: "#DC2626",
      }}
      onMouseDown={(e) => e.currentTarget.classList.add("brightness-95")}
      onMouseUp={(e) => e.currentTarget.classList.remove("brightness-95")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("brightness-95")}
      {...props}
    >
      {leadingIcon}
      <span>{children ?? label}</span>
    </button>
  );
}