"use client";
import { ReactNode } from "react";
import Shell from "@/components/layouts/Shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
