// components/DeleteButton.tsx
import React from "react";
import { Trash2 } from "lucide-react";

type Props = {
  label?: string;
  onClick?: () => void;
  className?: string;
};

export const DeleteButton: React.FC<Props> = ({
  label = "Delete",
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-[#DC2626] hover:text-[#b91c1c] transition-colors ${className}`}
    >
      <Trash2 className="w-4 h-4" />
      {label}
    </button>
  );
};