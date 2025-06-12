"use client";

import { Menu } from "lucide-react";

export default function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-md border border-border bg-background"
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
