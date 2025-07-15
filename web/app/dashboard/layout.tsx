import { ReactNode } from "react";
import Shell from "@/components/layout/Shell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Shell>{children}</Shell>;
}