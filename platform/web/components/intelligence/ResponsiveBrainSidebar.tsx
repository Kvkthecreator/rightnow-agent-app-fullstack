"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import CurrentContextPanel from "./CurrentContextPanel";
import IntelligentSuggestionsPanel from "./IntelligentSuggestionsPanel";
import MemoryInsightsPanel from "./MemoryInsightsPanel";
import ContextualSuggestionStream from "./ContextualSuggestionStream";
import UserFocusIndicator from "./UserFocusIndicator";
import AnticipatedNeedsPanel from "./AnticipatedNeedsPanel";
// Mock hook for agent coordination with all needed properties
const useIntelligentAgentCoordination = (...args: any[]): any => ({
  isActive: false,
  currentAgents: [],
  insights: [],
  coordinationStatus: 'idle',
  anticipatedNeeds: [],
  contextualInsights: [],
  prioritySuggestions: [],
  suggestedActions: [],
  focusPredictions: [],
  isLoading: false
});
import { useBehavioralTriggers } from "@/lib/intelligence/useBehavioralTriggers";
import { useSmartSuggestionTiming } from "@/lib/intelligence/useSmartSuggestionTiming";

interface ResponsiveBrainSidebarProps {
  basketId: string;
  currentDocumentId?: string;
  focusMode: "document" | "basket";
  documentElementRef?: React.RefObject<HTMLElement | null>;
  cursorPosition?: number;
  textSelection?: { start: number; end: number; text: string } | null;
  className?: string;
}

type PanelType = "context" | "suggestions" | "memory" | "anticipation";

export default function ResponsiveBrainSidebar({ 
  basketId, 
  currentDocumentId, 
  focusMode,
  documentElementRef,
  cursorPosition,
  textSelection,
  className 
}: ResponsiveBrainSidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("context");
  const [collapsed, setCollapsed] = useState(false);
  const [responsiveMode, setResponsiveMode] = useState<'ambient' | 'active' | 'focused'>('ambient');

  // Behavioral intelligence hooks
  const { 
    recentActions, 
    currentPattern, 
    triggerEvents, 
    isTyping 
  } = useBehavioralTriggers(
    documentElementRef || { current: null }, 
    cursorPosition, 
    textSelection
  );

  // Smart suggestion timing
  const { 
    activeSuggestions, 
    dismissSuggestion, 
    isWaitingForOptimalTiming 
  } = useSmartSuggestionTiming(triggerEvents, currentPattern, isTyping);

  // Contextual agent coordination
  const agentCoordination = useIntelligentAgentCoordination(
    currentDocumentId || '',
    triggerEvents,
    currentPattern,
    recentActions,
    cursorPosition,
    textSelection?.text
  );

  // Update responsive mode based on user activity
  useEffect(() => {
    const latestTrigger = triggerEvents[triggerEvents.length - 1];
    
    if (isTyping) {
      setResponsiveMode('focused');
    } else if (latestTrigger && latestTrigger.type === 'text_selection') {
      setResponsiveMode('active');
    } else if (latestTrigger && latestTrigger.type === 'extended_pause') {
      setResponsiveMode('active');
    } else {
      setResponsiveMode('ambient');
    }
  }, [triggerEvents, isTyping]);

  // Auto-switch to suggestions panel when high-priority suggestions appear
  useEffect(() => {
    const highPrioritySuggestions = activeSuggestions.filter(s => s.priority > 0.8);
    if (highPrioritySuggestions.length > 0 && !isTyping) {
      setActivePanel('suggestions');
    }
  }, [activeSuggestions, isTyping]);

  if (collapsed) {
    return (
      <div className={cn("w-12 border-l bg-background flex flex-col", className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="w-full h-8 px-0"
          >
            🧠
          </Button>
        </div>
        <div className="flex-1 flex flex-col gap-1 p-1">
          <PanelButton
            type="context"
            active={activePanel === "context"}
            onClick={setActivePanel}
            collapsed={true}
            hasActivity={responsiveMode === 'active'}
          />
          <PanelButton
            type="suggestions"
            active={activePanel === "suggestions"}
            onClick={setActivePanel}
            collapsed={true}
            hasActivity={activeSuggestions.length > 0}
          />
          <PanelButton
            type="memory"
            active={activePanel === "memory"}
            onClick={setActivePanel}
            collapsed={true}
          />
          <PanelButton
            type="anticipation"
            active={activePanel === "anticipation"}
            onClick={setActivePanel}
            collapsed={true}
            hasActivity={agentCoordination.anticipatedNeeds.length > 0}
          />
        </div>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 border-l bg-background flex flex-col", className)}>
      {/* Enhanced Brain Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg">🧠</div>
            <div>
              <h2 className="font-medium text-sm">Brain</h2>
              <p className="text-xs text-muted-foreground">
                AI thinking alongside you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IntelligenceStatusIndicator 
              basketId={basketId}
              documentId={currentDocumentId}
              isTyping={isTyping}
              responsiveMode={responsiveMode}
              triggerCount={triggerEvents.length}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="h-6 w-6 p-0"
            >
              →
            </Button>
          </div>
        </div>

        {/* Enhanced Focus Mode with User Activity */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={focusMode === "basket" ? "default" : "outline"}
              className="text-xs"
            >
              {focusMode === "basket" ? "🗂️ Basket" : "📄 Document"}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {focusMode === "basket" ? "Full context" : "Focused analysis"}
            </div>
          </div>
          <UserFocusIndicator 
            isTyping={isTyping}
            currentPattern={currentPattern}
            responsiveMode={responsiveMode}
          />
        </div>

        {/* Real-time suggestion stream */}
        {activeSuggestions.length > 0 && (
          <ContextualSuggestionStream 
            suggestions={activeSuggestions}
            onDismiss={dismissSuggestion}
            isWaitingForTiming={isWaitingForOptimalTiming}
          />
        )}
      </div>

      {/* Enhanced Panel Navigation */}
      <div className="p-2 border-b bg-muted/20">
        <div className="flex gap-1">
          <PanelButton
            type="context"
            active={activePanel === "context"}
            onClick={setActivePanel}
            hasActivity={responsiveMode === 'active'}
          />
          <PanelButton
            type="suggestions"
            active={activePanel === "suggestions"}
            onClick={setActivePanel}
            hasActivity={activeSuggestions.length > 0}
          />
          <PanelButton
            type="memory"
            active={activePanel === "memory"}
            onClick={setActivePanel}
          />
          <PanelButton
            type="anticipation"
            active={activePanel === "anticipation"}
            onClick={setActivePanel}
            hasActivity={agentCoordination.anticipatedNeeds.length > 0}
          />
        </div>
      </div>

      {/* Enhanced Active Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {activePanel === "context" && (
          <div>
            <CurrentContextPanel 
              basketId={basketId}
              documentId={currentDocumentId}
              focusMode={focusMode}
            />
            {/* Enhanced contextual intelligence display */}
            {(triggerEvents.length > 0 || agentCoordination.contextualInsights.length > 0) && (
              <div className="p-4 border-t bg-blue-50/30">
                <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Live Intelligence
                </div>
                
                {cursorPosition !== undefined && (
                  <div className="text-xs text-muted-foreground mb-2">
                    📍 Position: {cursorPosition}
                  </div>
                )}

                {triggerEvents.slice(-2).map((trigger: any) => (
                  <div key={`${trigger.type}-${trigger.timestamp}`} className="text-xs mb-2 flex items-center gap-2">
                    <span>{trigger.type === 'typing_pause' ? '⏸️' : trigger.type === 'text_selection' ? '📝' : '⚡'}</span>
                    <span className="capitalize">{trigger.type.replace('_', ' ')}</span>
                    <span className="text-muted-foreground ml-auto">{Math.round(trigger.confidence * 100)}%</span>
                  </div>
                ))}

                {agentCoordination.contextualInsights.slice(0, 2).map((insight: any) => (
                  <div key={insight.insight_id} className="bg-blue-100 border border-blue-200 rounded p-2 mb-2">
                    <div className="text-xs font-medium text-blue-800">{insight.insight_type} insight</div>
                    <div className="text-xs text-blue-700">{insight.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activePanel === "suggestions" && (
          <div>
            <IntelligentSuggestionsPanel 
              basketId={basketId}
              documentId={currentDocumentId}
              focusMode={focusMode}
            />
            {/* Enhanced suggestions display */}
            {agentCoordination.prioritySuggestions.length > 0 && (
              <div className="p-4 border-t bg-green-50/30">
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  🎯 Priority Suggestions
                </div>
                {agentCoordination.prioritySuggestions.slice(0, 3).map((suggestion: any) => (
                  <div key={suggestion.suggestion_id} className="bg-green-100 border border-green-200 rounded p-2 mb-2">
                    <div className="text-xs font-medium text-green-800 capitalize">{suggestion.type}</div>
                    <div className="text-xs text-green-700">{suggestion.content}</div>
                    <div className="text-xs text-green-600 mt-1">Priority: {Math.round(suggestion.priority * 100)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activePanel === "memory" && (
          <MemoryInsightsPanel 
            basketId={basketId}
            documentId={currentDocumentId}
            focusMode={focusMode}
          />
        )}
        {activePanel === "anticipation" && (
          <AnticipatedNeedsPanel
            anticipatedNeeds={agentCoordination.anticipatedNeeds}
            suggestedActions={agentCoordination.suggestedActions}
            focusPredictions={agentCoordination.focusPredictions}
            isLoading={agentCoordination.isLoading}
          />
        )}
      </div>

      {/* Enhanced Quick Actions Footer */}
      <div className="p-3 border-t bg-muted/10">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => agentCoordination.refresh()}
            disabled={isTyping}
          >
            💡 Insight
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => {
              agentCoordination.refresh();
            }}
          >
            🔄 Refresh
          </Button>
        </div>
      </div>
    </aside>
  );
}

interface PanelButtonProps {
  type: PanelType;
  active: boolean;
  onClick: (type: PanelType) => void;
  collapsed?: boolean;
  hasActivity?: boolean;
}

function PanelButton({ type, active, onClick, collapsed = false, hasActivity = false }: PanelButtonProps) {
  const config = {
    context: {
      icon: "📋",
      label: "Context",
      description: "Executive Summary"
    },
    suggestions: {
      icon: "💡",
      label: "Ideas",
      description: "Next moves"
    },
    memory: {
      icon: "🧩",
      label: "Memory",
      description: "Past connections"
    },
    anticipation: {
      icon: "🔮",
      label: "Anticipate",
      description: "Future needs"
    }
  };

  const panel = config[type];

  if (collapsed) {
    return (
      <Button
        variant={active ? "default" : "ghost"}
        size="sm"
        onClick={() => onClick(type)}
        className={cn(
          "w-full h-8 px-0 flex flex-col gap-0.5 relative",
          hasActivity && !active && "ring-2 ring-blue-200 ring-opacity-50"
        )}
        title={`${panel.label} - ${panel.description}`}
      >
        <span className="text-xs">{panel.icon}</span>
        {hasActivity && !active && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={() => onClick(type)}
      className={cn(
        "flex-1 flex flex-col items-start p-2 h-auto relative",
        hasActivity && !active && "ring-1 ring-blue-200"
      )}
    >
      <div className="flex items-center gap-1.5 w-full">
        <span className="text-sm">{panel.icon}</span>
        <span className="text-xs font-medium">{panel.label}</span>
        {hasActivity && !active && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-auto" />
        )}
      </div>
      <span className="text-xs text-muted-foreground font-normal">
        {panel.description}
      </span>
    </Button>
  );
}

interface IntelligenceStatusIndicatorProps {
  basketId: string;
  documentId?: string;
  isTyping: boolean;
  responsiveMode: 'ambient' | 'active' | 'focused';
  triggerCount: number;
}

function IntelligenceStatusIndicator({ 
  basketId, 
  documentId, 
  isTyping, 
  responsiveMode, 
  triggerCount 
}: IntelligenceStatusIndicatorProps) {
  const getStatus = () => {
    if (isTyping) return 'focused';
    if (responsiveMode === 'active') return 'active';
    if (triggerCount > 0) return 'analyzing';
    return 'ambient';
  };

  const status = getStatus();
  
  const statusConfig = {
    focused: { color: "bg-purple-500", label: "Focused" },
    active: { color: "bg-green-500 animate-pulse", label: "Active" },
    analyzing: { color: "bg-yellow-500 animate-pulse", label: "Analyzing" },
    ambient: { color: "bg-blue-400", label: "Ambient" },
    error: { color: "bg-red-500", label: "Error" }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div 
      className="flex items-center gap-1.5"
      title={`Intelligence Status: ${config.label}`}
    >
      <div className={cn("w-2 h-2 rounded-full", config.color)} />
      <span className="text-xs text-muted-foreground">
        {config.label}
      </span>
    </div>
  );
}