import React from "react";

interface ReviewRowProps {
  label: string;
  value?: string | React.ReactNode;
}

export const ReviewRow: React.FC<ReviewRowProps> = ({ label, value }) => {
  if (!value || (typeof value === "string" && value.trim() === "")) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
};
