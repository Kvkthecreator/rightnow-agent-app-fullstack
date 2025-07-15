"use client";
import { ReactNode } from "react";
import Shell from "@/components/layout/Shell";

export default function IntegrationsLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
