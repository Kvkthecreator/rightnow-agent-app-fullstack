import React from "react";

interface InputInlineProps {
  label: string;
  value: string;
  readOnly?: boolean;
}

export const InputInline: React.FC<InputInlineProps> = ({ label, value, readOnly = false }) => {
  return (
    <div className="flex items-center gap-4">
      <label className="w-40 text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        className="flex-1 bg-transparent border-b border-muted px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
};
