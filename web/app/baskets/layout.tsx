"use client";

import { useState } from "react";
import GlobalSidebar from "@/components/baskets/GlobalSidebar";
import { Button } from "@/components/ui/Button";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function BasketsLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <GlobalSidebar />
      
      {/* Mobile Sidebar */}
      <GlobalSidebar 
        isMobile 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-12 border-b flex items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2 mr-2"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="font-medium">🧺 Baskets</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
