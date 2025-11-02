import React from "react";

interface PageHeaderProps {
  emoji: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ emoji, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold font-brand">
          {emoji} {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
