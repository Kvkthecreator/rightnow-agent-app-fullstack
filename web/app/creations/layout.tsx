"use client";

import { ReactNode } from "react";
import Shell from "@/components/layout/Shell";

interface CreationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout for the Creations pages: applies the main Shell (sidebar + header).
 */
export default function Layout({ children }: CreationsLayoutProps) {
  return <Shell>{children}</Shell>;
}