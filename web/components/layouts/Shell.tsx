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
          aria-label="Open Sidebar"
          className="fixed top-4 left-4 z-50 p-2 rounded border border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-100"
          onClick={openSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
            />
          </svg>
        </button>
      )}
      <Sidebar />
      <main className="flex-1 overflow-auto px-4 pt-16 md:pt-8 md:px-8">{children}</main>
    </div>
  );
}
