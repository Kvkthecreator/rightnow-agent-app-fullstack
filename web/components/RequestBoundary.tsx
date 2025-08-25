"use client";
import type { ReactNode } from 'react';

export function RequestBoundary({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children ?? fallback}</>;
}
