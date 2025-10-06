// components/StatusBadge.tsx
import React from "react";
import clsx from "clsx";

type StatusType = "draft" | "active" | "publish" | "non-active";

interface Props {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className }) => {
  const isBlue = status === "draft" || status === "active";
  const isYellow = status === "publish" || status === "non-active";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium",
        isBlue &&
          "border border-[#2563EB] text-[#2563EB] bg-white hover:bg-blue-50",
        isYellow &&
          "border border-[#FDECCE] text-[#C47E09] bg-[#FDECCE]/30 hover:bg-[#FDECCE]/60",
        className
      )}
    >
      {status === "draft" && "Draft"}
      {status === "active" && "Active"}
      {status === "publish" && "Publish"}
      {status === "non-active" && "Non Active"}
    </span>
  );
};