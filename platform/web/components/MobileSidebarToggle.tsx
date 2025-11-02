"use client";

import { Menu } from "lucide-react";

interface Props {
  onClick: () => void;
  forceShow?: boolean;
}

export default function MobileSidebarToggle({ onClick, forceShow = false }: Props) {
  return (
    <button
      onClick={onClick}
      className={`${forceShow ? "block" : "md:hidden"} p-2 rounded-md border border-border bg-background`}
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
