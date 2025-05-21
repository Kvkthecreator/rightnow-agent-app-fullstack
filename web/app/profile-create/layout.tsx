"use client";
import React, { ReactNode } from "react";
import Shell from "@/components/layouts/Shell";

interface ProfileCreateLayoutProps {
  children: ReactNode;
}

export default function ProfileCreateLayout({ children }: ProfileCreateLayoutProps) {
  return <Shell>{children}</Shell>;
}