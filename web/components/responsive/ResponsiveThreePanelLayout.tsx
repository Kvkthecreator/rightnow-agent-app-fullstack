"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Panel {
  id: string;
  content: ReactNode;
  title: string;
  icon: string;
  priority: number; // 1 = highest (main content), 2 = secondary (navigation), 3 = tertiary (intelligence)
}

interface ResponsiveThreePanelLayoutProps {
  panels: Panel[];
  className?: string;
  onPanelChange?: (activePanel: string) => void;
}

type LayoutMode = "desktop" | "tablet" | "mobile";

export default function ResponsiveThreePanelLayout({
  panels,
  className,
  onPanelChange
}: ResponsiveThreePanelLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("desktop");
  const [activePanel, setActivePanel] = useState(panels[0]?.id || "");
  const [secondaryPanelOpen, setSecondaryPanelOpen] = useState(false);
  const [tertiaryPanelOpen, setTertiaryPanelOpen] = useState(false);

  // Determine layout mode based on screen size
  useEffect(() => {
    const checkLayoutMode = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setLayoutMode("desktop");
      } else if (width >= 768) {
        setLayoutMode("tablet");
      } else {
        setLayoutMode("mobile");
      }
    };

    checkLayoutMode();
    window.addEventListener('resize', checkLayoutMode);
    return () => window.removeEventListener('resize', checkLayoutMode);
  }, []);

  // Sort panels by priority
  const sortedPanels = [...panels].sort((a, b) => a.priority - b.priority);
  const primaryPanel = sortedPanels[0];
  const secondaryPanel = sortedPanels[1];
  const tertiaryPanel = sortedPanels[2];

  const handlePanelSwitch = (panelId: string) => {
    setActivePanel(panelId);
    onPanelChange?.(panelId);
    
    // Close drawers on mobile when switching
    if (layoutMode === "mobile") {
      setSecondaryPanelOpen(false);
      setTertiaryPanelOpen(false);
    }
  };

  // Desktop Layout: Full three-panel
  if (layoutMode === "desktop") {
    return (
      <div className={cn("flex h-full w-full", className)}>
        {/* Left Panel */}
        <div className="w-64 shrink-0 border-r">
          {secondaryPanel?.content}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {primaryPanel?.content}
        </div>
        
        {/* Right Panel */}
        <div className="w-80 shrink-0 border-l">
          {tertiaryPanel?.content}
        </div>
      </div>
    );
  }

  // Tablet Layout: Main + collapsible panels
  if (layoutMode === "tablet") {
    return (
      <div className={cn("flex h-full w-full relative", className)}>
        {/* Secondary Panel Drawer */}
        <div className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r z-30 transition-transform",
          secondaryPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">{secondaryPanel?.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSecondaryPanelOpen(false)}
            >
              ×
            </Button>
          </div>
          <div className="h-full overflow-y-auto">
            {secondaryPanel?.content}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          {/* Navigation bar */}
          <div className="flex items-center justify-between p-3 border-b bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSecondaryPanelOpen(true)}
              className="flex items-center gap-2"
            >
              <span>{secondaryPanel?.icon}</span>
              <span className="text-sm">{secondaryPanel?.title}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTertiaryPanelOpen(true)}
              className="flex items-center gap-2"
            >
              <span>{tertiaryPanel?.icon}</span>
              <span className="text-sm">{tertiaryPanel?.title}</span>
            </Button>
          </div>
          
          <div className="h-full overflow-y-auto">
            {primaryPanel?.content}
          </div>
        </div>

        {/* Tertiary Panel Drawer */}
        <div className={cn(
          "fixed right-0 top-0 h-full w-80 bg-background border-l z-30 transition-transform",
          tertiaryPanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">{tertiaryPanel?.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTertiaryPanelOpen(false)}
            >
              ×
            </Button>
          </div>
          <div className="h-full overflow-y-auto">
            {tertiaryPanel?.content}
          </div>
        </div>

        {/* Overlay */}
        {(secondaryPanelOpen || tertiaryPanelOpen) && (
          <div 
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => {
              setSecondaryPanelOpen(false);
              setTertiaryPanelOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Mobile Layout: Single panel with bottom navigation
  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Active Panel Content */}
      <div className="flex-1 overflow-hidden">
        {panels.find(p => p.id === activePanel)?.content}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t bg-background">
        <div className="flex">
          {sortedPanels.map((panel) => (
            <Button
              key={panel.id}
              variant={activePanel === panel.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePanelSwitch(panel.id)}
              className="flex-1 flex flex-col items-center gap-1 h-16 rounded-none"
            >
              <span className="text-lg">{panel.icon}</span>
              <span className="text-xs">{panel.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Swipe gesture indicator */}
      <MobileSwipeIndicator
        currentPanel={activePanel}
        panels={sortedPanels}
        onSwipe={handlePanelSwitch}
      />
    </div>
  );
}

interface MobileSwipeIndicatorProps {
  currentPanel: string;
  panels: Panel[];
  onSwipe: (panelId: string) => void;
}

function MobileSwipeIndicator({ currentPanel, panels, onSwipe }: MobileSwipeIndicatorProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = panels.findIndex(p => p.id === currentPanel);
    
    if (isLeftSwipe && currentIndex < panels.length - 1) {
      onSwipe(panels[currentIndex + 1].id);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      onSwipe(panels[currentIndex - 1].id);
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-10"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: 'auto', background: 'transparent' }}
    >
      {/* Visual swipe hint */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-1">
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                panel.id === currentPanel ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}