"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import BasketSidebar from "@/components/basket/BasketSidebar";
import ContextualBrainSidebar from "@/components/intelligence/ContextualBrainSidebar";

export type ContextType = "dashboard" | "document" | "settings" | "insights";
export type IntelligenceMode = "ambient" | "active" | "detailed";

interface StandardizedBasketLayoutProps {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
  documents?: any[];
  leftPanel?: ReactNode;
  mainContent: ReactNode;
  rightPanel?: ReactNode;
  contextType: ContextType;
  intelligenceMode?: IntelligenceMode;
  currentDocumentId?: string;
  className?: string;
  // Progressive discovery props
  showIntelligenceHints?: boolean;
  onIntelligenceDiscovered?: () => void;
}

export default function StandardizedBasketLayout({
  basketId,
  basketName,
  status,
  scope,
  documents,
  leftPanel,
  mainContent,
  rightPanel,
  contextType,
  intelligenceMode = "ambient",
  currentDocumentId,
  className,
  showIntelligenceHints = true,
  onIntelligenceDiscovered,
}: StandardizedBasketLayoutProps) {
  const [showBrainSidebar, setShowBrainSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [discoveryStage, setDiscoveryStage] = useState(0);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setShowBrainSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Progressive discovery logic
  useEffect(() => {
    if (showIntelligenceHints && discoveryStage === 0) {
      const timer = setTimeout(() => {
        setDiscoveryStage(1);
      }, 5000); // Show hint after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showIntelligenceHints, discoveryStage]);

  const handleToggleBrainSidebar = () => {
    setShowBrainSidebar(!showBrainSidebar);
    if (!showBrainSidebar && discoveryStage === 1) {
      setDiscoveryStage(2);
      onIntelligenceDiscovered?.();
    }
  };

  // Determine focus mode based on context
  const focusMode = contextType === "document" ? "document" : "basket";

  // Default left panel if not provided
  const defaultLeftPanel = (
    <BasketSidebar
      basketId={basketId}
      basketName={basketName}
      status={status}
      scope={scope}
      documents={documents}
      currentDocumentId={currentDocumentId}
    />
  );

  // Default right panel if not provided
  const defaultRightPanel = showBrainSidebar && (
    <ContextualBrainSidebar
      basketId={basketId}
      currentDocumentId={currentDocumentId}
      contextType={contextType}
      intelligenceMode={intelligenceMode}
      className="hidden lg:flex"
      onToggle={(collapsed) => setShowBrainSidebar(!collapsed)}
      defaultCollapsed={!showBrainSidebar}
    />
  );

  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Left Panel - Navigation/Context */}
      {leftPanel || defaultLeftPanel}
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Progressive Discovery Hint */}
        {showIntelligenceHints && discoveryStage === 1 && !showBrainSidebar && (
          <IntelligenceDiscoveryHint
            onDismiss={() => setDiscoveryStage(2)}
            onActivate={handleToggleBrainSidebar}
          />
        )}

        {/* Mobile Brain Sidebar Toggle - Only show if brain sidebar is collapsed */}
        {isMobile && !showBrainSidebar && (
          <button
            onClick={handleToggleBrainSidebar}
            data-discovery="brain-toggle"
            className={cn(
              "fixed bottom-4 right-4 z-20 bg-primary text-primary-foreground hover:opacity-90 p-3 rounded-full shadow-lg transition-all brain-toggle",
              discoveryStage === 1 && "animate-pulse ring-2 ring-primary/50 discovered"
            )}
            title="Show AI Brain"
          >
            🧠
          </button>
        )}

        {/* Main Content */}
        <div className="h-full overflow-y-auto">
          {mainContent}
        </div>

        {/* Mobile Brain Sidebar Overlay */}
        {isMobile && showBrainSidebar && (
          <div className="fixed inset-0 z-10 bg-black/50 lg:hidden" onClick={() => setShowBrainSidebar(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-background" onClick={e => e.stopPropagation()}>
              {rightPanel || defaultRightPanel}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Intelligence (Desktop) */}
      {!isMobile && (rightPanel || defaultRightPanel)}

    </div>
  );
}

interface IntelligenceDiscoveryHintProps {
  onDismiss: () => void;
  onActivate: () => void;
}

function IntelligenceDiscoveryHint({ onDismiss, onActivate }: IntelligenceDiscoveryHintProps) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <div className="text-xl">🧠</div>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">Meet your AI thinking partner</h4>
          <p className="text-xs opacity-90 mb-3">
            Get contextual insights, suggestions, and memory connections as you work.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onActivate}
              className="text-xs bg-primary-foreground text-primary px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              Try it now
            </button>
            <button
              onClick={onDismiss}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-primary-foreground/70 hover:text-primary-foreground text-sm leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}