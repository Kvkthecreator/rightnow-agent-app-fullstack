import React from "react";

interface TextareaInlineProps {
  value: string;
  readOnly?: boolean;
}

export const TextareaInline: React.FC<TextareaInlineProps> = ({ value, readOnly = false }) => {
  return (
    <textarea
      value={value}
      readOnly={readOnly}
      rows={3}
      className="w-full bg-transparent border-b border-muted px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
    />
  );
};
