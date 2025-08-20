"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface BasketTabsProps {
  basketId: string;
  className?: string;
}

interface Tab {
  key: string;
  label: string;
  path: string;
  optional?: boolean;
}

const BASKET_TABS: Tab[] = [
  { key: "memory", label: "Memory", path: "/memory" },
  { key: "documents", label: "Documents", path: "/documents" },
  { key: "blocks", label: "Blocks", path: "/blocks" },
  { key: "graph", label: "Graph", path: "/graph", optional: true },
  { key: "reflections", label: "Reflections", path: "/reflections", optional: true },
  { key: "history", label: "History", path: "/history", optional: true },
];

export default function BasketTabs({ basketId, className }: BasketTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentTab = BASKET_TABS.find(tab => 
    pathname.includes(`/baskets/${basketId}${tab.path}`)
  ) || BASKET_TABS[0];

  const handleTabClick = (tab: Tab) => {
    router.push(`/baskets/${basketId}${tab.path}`);
    if (isMobile) {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: Tab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTabClick(tab);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = BASKET_TABS.findIndex(t => t.key === tab.key);
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const nextIndex = (currentIndex + direction + BASKET_TABS.length) % BASKET_TABS.length;
      const nextTab = BASKET_TABS[nextIndex];
      handleTabClick(nextTab);
      
      // Focus the new tab
      setTimeout(() => {
        const nextTabElement = document.querySelector(`[data-tab-key="${nextTab.key}"]`) as HTMLElement;
        nextTabElement?.focus();
      }, 0);
    }
  };

  if (isMobile) {
    return (
      <div className={cn("px-4 py-2 border-b", className)}>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full justify-between h-9 text-sm font-medium"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-label="Section"
          >
            {currentTab.label}
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
              {BASKET_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted first:rounded-t-md last:rounded-b-md",
                    tab.key === currentTab.key && "bg-primary/10 text-primary font-medium"
                  )}
                  role="option"
                  aria-selected={tab.key === currentTab.key}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("px-4 py-2 border-b", className)}>
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Basket sections"
      >
        {BASKET_TABS.map((tab) => {
          const isActive = tab.key === currentTab.key;
          return (
            <button
              key={tab.key}
              data-tab-key={tab.key}
              onClick={() => handleTabClick(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              className={cn(
                "flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "hover:bg-muted whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground"
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}