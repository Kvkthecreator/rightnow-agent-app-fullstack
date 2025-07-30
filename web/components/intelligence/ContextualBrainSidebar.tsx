"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import BrainSidebar from "./BrainSidebar";
import type { ContextType, IntelligenceMode } from "@/components/basket/StandardizedBasketLayout";

interface ContextualBrainSidebarProps {
  basketId: string;
  currentDocumentId?: string;
  contextType: ContextType;
  intelligenceMode: IntelligenceMode;
  className?: string;
}

interface ContextualContent {
  title: string;
  description: string;
  suggestions: string[];
  memoryFocus: string;
  quickActions: Array<{
    label: string;
    icon: string;
    action: () => void;
  }>;
}

export default function ContextualBrainSidebar({
  basketId,
  currentDocumentId,
  contextType,
  intelligenceMode,
  className
}: ContextualBrainSidebarProps) {
  
  // Get contextual content based on current context
  const contextualContent = useMemo((): ContextualContent => {
    switch (contextType) {
      case "dashboard":
        return {
          title: "Basket Intelligence",
          description: "Overview and strategic insights for your project",
          suggestions: [
            "Key themes emerging across documents",
            "Missing connections to explore",
            "Next strategic priorities to consider"
          ],
          memoryFocus: "Project patterns and strategic evolution",
          quickActions: [
            { label: "Project Summary", icon: "📊", action: () => console.log("Generate project summary") },
            { label: "Find Gaps", icon: "🔍", action: () => console.log("Analyze gaps") },
            { label: "Next Steps", icon: "➡️", action: () => console.log("Suggest next steps") }
          ]
        };
        
      case "document":
        return {
          title: "Document Intelligence",
          description: "Focused analysis and writing assistance",
          suggestions: [
            "Improve clarity and structure",
            "Connect to related ideas",
            "Strengthen key arguments"
          ],
          memoryFocus: "Document content and related context",
          quickActions: [
            { label: "Enhance", icon: "✨", action: () => console.log("Enhance document") },
            { label: "Connect", icon: "🔗", action: () => console.log("Find connections") },
            { label: "Review", icon: "👁️", action: () => console.log("Review content") }
          ]
        };
        
      case "insights":
        return {
          title: "Deep Intelligence",
          description: "Full analytical power and strategic thinking",
          suggestions: [
            "Cross-project pattern analysis",
            "Strategic opportunity mapping",
            "Innovation potential assessment"
          ],
          memoryFocus: "Comprehensive cross-basket intelligence",
          quickActions: [
            { label: "Deep Dive", icon: "🎯", action: () => console.log("Deep analysis") },
            { label: "Strategy", icon: "🗺️", action: () => console.log("Strategic view") },
            { label: "Innovate", icon: "💡", action: () => console.log("Innovation ideas") }
          ]
        };
        
      case "settings":
        return {
          title: "Configuration Assistant",
          description: "Help optimize your workspace setup",
          suggestions: [
            "Workspace optimization tips",
            "Integration recommendations",
            "Workflow improvements"
          ],
          memoryFocus: "Usage patterns and optimization opportunities",
          quickActions: [
            { label: "Optimize", icon: "⚡", action: () => console.log("Optimize setup") },
            { label: "Tutorial", icon: "🎓", action: () => console.log("Show tutorial") },
            { label: "Help", icon: "❓", action: () => console.log("Get help") }
          ]
        };
        
      default:
        return {
          title: "AI Assistant",
          description: "Intelligent support for your work",
          suggestions: ["Context-aware assistance", "Smart recommendations", "Proactive insights"],
          memoryFocus: "General intelligence support",
          quickActions: [
            { label: "Assist", icon: "🤝", action: () => console.log("General assistance") }
          ]
        };
    }
  }, [contextType]);

  // Determine focus mode based on context and intelligence mode
  const focusMode = contextType === "document" ? "document" : "basket";

  // Enhanced BrainSidebar with contextual header
  return (
    <div className={cn("w-80 border-l bg-background flex flex-col", className)}>
      {/* Contextual Header */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-lg">🧠</div>
            <div>
              <h2 className="font-medium text-sm">{contextualContent.title}</h2>
              <p className="text-xs text-muted-foreground">
                {contextualContent.description}
              </p>
            </div>
          </div>
          <IntelligenceModeIndicator mode={intelligenceMode} />
        </div>

        {/* Context-specific quick actions */}
        <div className="flex gap-1 flex-wrap">
          {contextualContent.quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="text-xs h-7 px-2"
            >
              <span className="mr-1">{action.icon}</span>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Standard BrainSidebar with enhanced context */}
      <div className="flex-1 overflow-hidden">
        <BrainSidebar
          basketId={basketId}
          currentDocumentId={currentDocumentId}
          focusMode={focusMode}
          className="border-none"
        />
      </div>

      {/* Contextual hints footer */}
      <div className="p-3 border-t bg-muted/10">
        <div className="text-xs text-muted-foreground mb-2">
          💡 <strong>Focus:</strong> {contextualContent.memoryFocus}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            📚 Learn Mode
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            🎯 Focus
          </Button>
        </div>
      </div>
    </div>
  );
}

interface IntelligenceModeIndicatorProps {
  mode: IntelligenceMode;
}

function IntelligenceModeIndicator({ mode }: IntelligenceModeIndicatorProps) {
  const modeConfig = {
    ambient: {
      color: "bg-blue-500",
      label: "Ambient",
      description: "Background intelligence"
    },
    active: {
      color: "bg-green-500",
      label: "Active", 
      description: "Engaged assistance"
    },
    detailed: {
      color: "bg-purple-500",
      label: "Deep",
      description: "Full analytical power"
    }
  };

  const config = modeConfig[mode];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", config.color)} />
      <Badge variant="outline" className="text-xs">
        {config.label}
      </Badge>
    </div>
  );
}