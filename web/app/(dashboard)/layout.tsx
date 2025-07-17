// web/app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import Shell from "@/components/layout/Shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
