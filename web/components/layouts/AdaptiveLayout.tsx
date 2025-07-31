"use client";

import { ReactNode, useState, useEffect } from "react";
import { NavigationHub } from "../panels/NavigationHub";
import { ComplementaryContext } from "../panels/ComplementaryContext";
import { AmbientAssistance } from "../ambient/AmbientAssistance";
import { useAttentionManagement } from "@/lib/layout/attentionManager";
import { useContextualAwareness } from "@/lib/layout/contextualAwareness";
import { useActivityDetection } from "@/lib/ambient/activityDetection";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdaptiveLayoutProps {
  children: ReactNode;
  view: 'dashboard' | 'documents' | 'insights' | 'understanding';
  basketId?: string;
  basketName?: string;
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
  basketName,
  className = "" 
}: AdaptiveLayoutProps) {
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  const attentionConfig = useAttentionManagement(view, false);
  const contextualContent = useContextualAwareness(view, basketId);
  const userActivity = useActivityDetection();
  
  // Auto-collapse right panel on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setRightPanelVisible(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getViewTitle = (view: string): string => {
    switch (view) {
      case 'dashboard': return 'Strategic Intelligence';
      case 'documents': return 'Document Workspace';
      case 'insights': return 'Insights & Ideas';
      case 'understanding': return 'Project Understanding';
      default: return 'Project Workspace';
    }
  };

  return (
    <div className={`adaptive-layout h-screen flex overflow-hidden bg-background ${className}`}>
      {/* Left Navigation Hub - Minimal, efficient */}
      <NavigationHub 
        minimized={false}
        className={`${attentionConfig.navigation.classes} transition-all duration-300`}
        basketId={basketId}
        basketName={basketName}
      />
      
      {/* Middle Panel - 80% attention focus */}
      <div className={`${attentionConfig.primary.classes} flex-1 flex flex-col transition-all duration-300`}>
        {/* Panel header with controls */}
        <div className="panel-header p-4 border-b flex items-center justify-between bg-background">
          <div className="panel-title">
            <h1 className="text-xl font-semibold text-gray-900">
              {getViewTitle(view)}
            </h1>
          </div>
          
          <div className="panel-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelVisible(!rightPanelVisible)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {rightPanelVisible ? (
                <><PanelRightClose className="h-4 w-4" /> Hide Context</>
              ) : (
                <><PanelRightOpen className="h-4 w-4" /> Show Context</>
              )}
            </Button>
          </div>
        </div>
        
        {/* Clean content area */}
        <div className="panel-content flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Right Panel - 20% complementary context */}
      {rightPanelVisible && (
        <ComplementaryContext
          view={view}
          basketId={basketId}
          content={contextualContent}
          priority={attentionConfig.complementary.priority}
          className="h-full"
        />
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