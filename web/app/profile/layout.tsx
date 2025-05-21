"use client";
import React, { ReactNode } from "react";
import Shell from "@/components/layouts/Shell";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <Shell>{children}</Shell>;
}