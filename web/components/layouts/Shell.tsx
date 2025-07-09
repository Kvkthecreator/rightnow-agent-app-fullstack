"use client";
import React from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { isOpen, collapsible, openSidebar } = useSidebarStore();

  return (
    <div className="relative flex h-full">
      {!isOpen && collapsible && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded bg-black text-white"
          onClick={openSidebar}
        >
          ☰
        </button>
      )}
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
