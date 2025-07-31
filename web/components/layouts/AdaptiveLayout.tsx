"use client";

import { ReactNode, useState, useEffect } from "react";
import { NavigationHub } from "../panels/NavigationHub";
import { PrimaryWorkspace } from "../panels/PrimaryWorkspace";
import { ComplementaryContext } from "../panels/ComplementaryContext";
import { AmbientAssistance } from "../ambient/AmbientAssistance";
import { useAttentionManagement } from "@/lib/layout/attentionManager";
import { useContextualAwareness } from "@/lib/layout/contextualAwareness";
import { useActivityDetection } from "@/lib/ambient/activityDetection";
import { Focus, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdaptiveLayoutProps {
  children: ReactNode;
  view: 'dashboard' | 'documents' | 'insights' | 'understanding';
  basketId?: string;
  className?: string;
}

const REVELATION_RULES = {
  active_work: 'wait',           // Don't interrupt active editing/thinking
  exploring: 'gentle_notification', // Subtle indicators of new insights
  paused: 'immediate',           // Natural break point for revelation
  idle: 'ambient_update'         // Gentle background updates
} as const;

export function AdaptiveLayout({ 
  children, 
  view, 
  basketId,
  className = "" 
}: AdaptiveLayoutProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  const attentionConfig = useAttentionManagement(view, focusMode);
  const contextualContent = useContextualAwareness(view, basketId);
  const userActivity = useActivityDetection();
  
  // Auto-collapse right panel on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setRightPanelCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    if (!focusMode) {
      // Entering focus mode
      document.body.classList.add('focus-mode');
    } else {
      // Exiting focus mode
      document.body.classList.remove('focus-mode');
    }
  };

  return (
    <div className={`adaptive-layout h-screen flex overflow-hidden bg-background ${className}`}>
      {/* Left Navigation Hub - Minimal, efficient */}
      <NavigationHub 
        minimized={focusMode}
        className={`${attentionConfig.navigation.classes} transition-all duration-300`}
        basketId={basketId}
      />
      
      {/* Middle Panel - 80% attention focus */}
      <PrimaryWorkspace 
        className={`${attentionConfig.primary.classes} ${
          focusMode ? 'w-full' : ''
        } transition-all duration-300 relative`}
      >
        {/* Focus Mode Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFocusMode}
            className="flex items-center gap-2 text-xs"
            title={focusMode ? "Exit focus mode" : "Enter focus mode"}
          >
            <Focus className="h-4 w-4" />
            {focusMode ? "Exit Focus" : "Focus Mode"}
          </Button>
        </div>
        
        {children}
      </PrimaryWorkspace>
      
      {/* Right Panel - 20% complementary context */}
      {!focusMode && (
        <div className={`relative transition-all duration-300 ${
          rightPanelCollapsed ? 'w-0' : attentionConfig.complementary.classes
        }`}>
          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="absolute -left-6 top-1/2 -translate-y-1/2 bg-background border rounded-l-lg p-1 hover:bg-muted transition-colors z-20"
            aria-label={rightPanelCollapsed ? "Show context panel" : "Hide context panel"}
          >
            {rightPanelCollapsed ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          
          {!rightPanelCollapsed && (
            <ComplementaryContext
              view={view}
              basketId={basketId}
              content={contextualContent}
              priority={attentionConfig.complementary.priority}
              className="h-full"
            />
          )}
        </div>
      )}
      
      {/* Ambient Assistance Layer */}
      <AmbientAssistance
        userActivity={userActivity}
        revelationStrategy={REVELATION_RULES[userActivity]}
        view={view}
        basketId={basketId}
      />
    </div>
  );
}