// components/NewNounButton.tsx
import React from "react";
import { cn } from "@/lib/cn";

type Props = {
  noun?: string;                // kata setelah "New", default: "article"
  onClick?: () => void;
  className?: string;           // opsional, untuk override tambahan
  disabled?: boolean;
};

export const NewNounButton: React.FC<Props> = ({
  noun = "article",
  onClick,
  className,
  disabled,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // shape & spacing
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold",
        // colors (base: #003663)
        "text-white",
        "bg-[#003663]",
        "hover:bg-[#002e55] disabled:bg-[#003663]/60",
        // focus ring
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#003663]",
        // smooth
        "transition-colors duration-150",
        className
      )}
    >
      {`New ${noun}`}
    </button>
  );
};
