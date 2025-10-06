import React from "react";
import { Pencil } from "lucide-react";

type Props = {
  label?: string;
  onClick?: () => void;
  className?: string;
};

export const EditButton: React.FC<Props> = ({
  label = "Edit",
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-[#D97706] hover:text-[#b46305] transition-colors ${className}`}
    >
      <Pencil className="w-4 h-4" />
      {label}
    </button>
  );
};