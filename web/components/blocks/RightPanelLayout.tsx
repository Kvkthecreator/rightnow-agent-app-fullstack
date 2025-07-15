"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RightPanelLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  className?: string;
}

export default function RightPanelLayout({
  children,
  rightPanel,
  className,
}: RightPanelLayoutProps) {
  return (
    <div className={cn("md:flex w-full", className)}>
      <div className="flex-1">{children}</div>
      {rightPanel && (
        <aside className="hidden md:block w-[320px] shrink-0 border-l bg-gray-50 overflow-y-auto">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
