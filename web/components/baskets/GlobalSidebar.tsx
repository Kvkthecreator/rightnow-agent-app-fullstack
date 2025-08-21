"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Plus, Menu, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { getAllBaskets } from "@/lib/baskets/getAllBaskets";
import type { BasketOverview } from "@/lib/baskets/getAllBaskets";

interface GlobalSidebarProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function GlobalSidebar({ 
  className,
  isMobile = false,
  isOpen = true,
  onClose 
}: GlobalSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [baskets, setBaskets] = useState<BasketOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("yarnnn:sidebar:visible") !== "false";
  });

  // Extract current basket ID from pathname
  const currentBasketId = pathname.match(/\/baskets\/([^\/]+)/)?.[1];

  // Persist sidebar visibility state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yarnnn:sidebar:visible", isVisible.toString());
    }
  }, [isVisible]);

  useEffect(() => {
    getAllBaskets()
      .then(setBaskets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBasket = () => {
    router.push("/create");
  };

  const handleBasketClick = (basketId: string) => {
    router.push(`/baskets/${basketId}/memory`);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Soft cap: disable new basket creation if ≥3 baskets
  const canCreateBasket = baskets.length < 3;
  const softCapMessage = "Keep focus — Yarnnn works best with a few baskets.";

  if (isMobile && !isOpen) {
    return null;
  }

  // Collapsed state for desktop
  if (!isMobile && !isVisible) {
    return (
      <div className={cn("w-12 border-r shrink-0 flex flex-col bg-background", className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(true)}
            className="w-8 h-8 p-0"
            title="Show sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-background border-r shrink-0 flex flex-col h-full",
          isMobile 
            ? "fixed left-0 top-0 z-50 w-72 lg:hidden" 
            : "w-56 hidden lg:flex",
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link 
              href="/baskets" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-lg">🧺</span>
              <span className="font-medium text-sm">Memory Baskets</span>
            </Link>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="p-1 h-8 w-8"
                  title="Hide sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              )}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* New Basket Button */}
        <div className="p-4 border-b">
          {canCreateBasket ? (
            <Button 
              onClick={handleCreateBasket}
              className="w-full justify-start gap-2 h-9 text-sm font-medium"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Basket
            </Button>
          ) : (
            <div className="relative">
              <Button 
                disabled
                className="w-full justify-start gap-2 h-9 text-sm font-medium opacity-50 cursor-not-allowed"
                size="sm"
                title={softCapMessage}
              >
                <Plus className="h-4 w-4" />
                New Basket
              </Button>
              <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black text-white text-xs p-2 rounded text-center">
                  {softCapMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Baskets List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : baskets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No baskets yet</p>
                <Button size="sm" onClick={handleCreateBasket}>
                  Create your first basket
                </Button>
              </div>
            ) : (
              baskets.map((basket) => {
                const isActive = basket.id === currentBasketId;
                return (
                  <button
                    key={basket.id}
                    onClick={() => handleBasketClick(basket.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-muted",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                        : "text-muted-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="truncate">
                      {basket.name || "Untitled"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* User Identity Placeholder */}
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {baskets.length} basket{baskets.length !== 1 ? 's' : ''}
          </div>
        </div>
      </aside>
    </>
  );
}