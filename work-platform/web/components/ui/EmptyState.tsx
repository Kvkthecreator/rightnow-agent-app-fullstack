"use client";

import React from "react";

/**
 * A simple component for displaying empty or loading states.
 */
export function EmptyState({
  icon,
  title,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      {icon}
      <p>{title}</p>
      {action}
    </div>
  );
}