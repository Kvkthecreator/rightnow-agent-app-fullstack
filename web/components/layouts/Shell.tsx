"use client";
import React, { ReactNode, useState } from "react";
import MainNav from "./MainNav";
import SidebarNav from "./SidebarNav";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showNav, setShowNav] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Overlay for mobile nav */}
      {showNav && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setShowNav(false)}
        />
      )}
      <div className="md:grid md:grid-cols-[240px_1fr]">
        {/* Sidebar navigation */}
        <div
          className={
            `fixed inset-y-0 left-0 z-50 transform ${
              showNav ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-200 ease-in-out md:static md:translate-x-0`
          }
        >
          <SidebarNav
            collapsed={collapsed}
            onCollapseToggle={() => setCollapsed((prev) => !prev)}
          />
        </div>
        {/* Main content area */}
        <div className="flex flex-col flex-1">
          <MainNav onNavToggle={() => setShowNav((prev) => !prev)} />
          <main className="px-2 py-6 md:px-6 md:py-4">{children}</main>
        </div>
      </div>
    </div>
  );
}