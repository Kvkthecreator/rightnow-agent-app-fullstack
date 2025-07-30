"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import CurrentContextPanel from "./CurrentContextPanel";
import IntelligentSuggestionsPanel from "./IntelligentSuggestionsPanel";
import MemoryInsightsPanel from "./MemoryInsightsPanel";

interface BrainSidebarProps {
  basketId: string;
  currentDocumentId?: string;
  focusMode: "document" | "basket";
  className?: string;
}

type PanelType = "context" | "suggestions" | "memory";

export default function BrainSidebar({ 
  basketId, 
  currentDocumentId, 
  focusMode,
  className 
}: BrainSidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("context");
  const [collapsed, setCollapsed] = useState(false);

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
          />
          <PanelButton
            type="suggestions"
            active={activePanel === "suggestions"}
            onClick={setActivePanel}
            collapsed={true}
          />
          <PanelButton
            type="memory"
            active={activePanel === "memory"}
            onClick={setActivePanel}
            collapsed={true}
          />
        </div>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 border-l bg-background flex flex-col", className)}>
      {/* Brain Sidebar Header */}
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

        {/* Focus Mode Indicator */}
        <div className="mt-3 flex items-center gap-2">
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
      </div>

      {/* Panel Navigation */}
      <div className="p-2 border-b bg-muted/20">
        <div className="flex gap-1">
          <PanelButton
            type="context"
            active={activePanel === "context"}
            onClick={setActivePanel}
          />
          <PanelButton
            type="suggestions"
            active={activePanel === "suggestions"}
            onClick={setActivePanel}
          />
          <PanelButton
            type="memory"
            active={activePanel === "memory"}
            onClick={setActivePanel}
          />
        </div>
      </div>

      {/* Active Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {activePanel === "context" && (
          <div data-discovery="brain-context">
            <CurrentContextPanel 
              basketId={basketId}
              documentId={currentDocumentId}
              focusMode={focusMode}
            />
          </div>
        )}
        {activePanel === "suggestions" && (
          <div data-discovery="brain-suggestions">
            <IntelligentSuggestionsPanel 
              basketId={basketId}
              documentId={currentDocumentId}
              focusMode={focusMode}
            />
          </div>
        )}
        {activePanel === "memory" && (
          <div data-discovery="brain-memory">
            <MemoryInsightsPanel 
              basketId={basketId}
              documentId={currentDocumentId}
              focusMode={focusMode}
            />
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="p-3 border-t bg-muted/10">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            💡 Quick Insight
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
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
}

function PanelButton({ type, active, onClick, collapsed = false }: PanelButtonProps) {
  const config = {
    context: {
      icon: "👁️",
      label: "Context",
      description: "What I'm seeing"
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
    }
  };

  const panel = config[type];

  if (collapsed) {
    return (
      <Button
        variant={active ? "default" : "ghost"}
        size="sm"
        onClick={() => onClick(type)}
        className="w-full h-8 px-0 flex flex-col gap-0.5"
        title={`${panel.label} - ${panel.description}`}
      >
        <span className="text-xs">{panel.icon}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={() => onClick(type)}
      className="flex-1 flex flex-col items-start p-2 h-auto"
    >
      <div className="flex items-center gap-1.5 w-full">
        <span className="text-sm">{panel.icon}</span>
        <span className="text-xs font-medium">{panel.label}</span>
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
}

function IntelligenceStatusIndicator({ basketId, documentId }: IntelligenceStatusIndicatorProps) {
  // This would integrate with real intelligence status
  const status = "active"; // "active" | "loading" | "error" | "idle"
  
  const statusConfig = {
    active: { color: "bg-green-500", label: "Active" },
    loading: { color: "bg-yellow-500 animate-pulse", label: "Analyzing" },
    error: { color: "bg-red-500", label: "Error" },
    idle: { color: "bg-gray-400", label: "Idle" }
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