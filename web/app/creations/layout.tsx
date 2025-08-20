"use client";

import type { ReactNode } from "react";

interface CreationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout for the Creations pages: applies the main Shell (sidebar + header).
 */
export default function Layout({ children }: CreationsLayoutProps) {
  return <>{children}</>;
}