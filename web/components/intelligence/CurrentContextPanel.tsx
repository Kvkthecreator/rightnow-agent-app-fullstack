"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useBasketIntelligence } from "@/lib/intelligence/useBasketIntelligence";
import { useDocumentContext } from "@/lib/intelligence/useDocumentContext";
import { TriggerEvent } from "@/lib/intelligence/useBehavioralTriggers";
// Local type definition for ContextualInsight
interface ContextualInsight {
  insight_id: string;
  insight_title: string;
  insight_content: string;
  insight_type: string;
  confidence_score: number;
  relevance: number;
  description: string;
}

interface CurrentContextPanelProps {
  basketId: string;
  documentId?: string;
  focusMode: "document" | "basket";
  cursorPosition?: number;
  recentTriggers?: TriggerEvent[];
  contextualInsights?: ContextualInsight[];
}

export default function CurrentContextPanel({ 
  basketId, 
  documentId, 
  focusMode,
  cursorPosition,
  recentTriggers = [],
  contextualInsights = []
}: CurrentContextPanelProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">👁️ What I'm seeing</h3>
          <p className="text-xs text-muted-foreground">
            Real-time context analysis
          </p>
        </div>
        <ContextConfidenceIndicator 
          basketId={basketId}
          documentId={documentId}
        />
      </div>

      {/* Current Focus */}
      <FocusAreaCard 
        basketId={basketId}
        documentId={documentId}
        focusMode={focusMode}
      />

      {/* Active Themes */}
      <ActiveThemesCard 
        basketId={basketId}
        documentId={documentId}
        focusMode={focusMode}
      />

      {/* Context Items */}
      <ContextItemsCard 
        basketId={basketId}
        documentId={documentId}
        focusMode={focusMode}
      />

      {/* Real-time Activity */}
      {(recentTriggers.length > 0 || contextualInsights.length > 0) && (
        <RealtimeActivityCard 
          cursorPosition={cursorPosition}
          recentTriggers={recentTriggers}
          contextualInsights={contextualInsights}
        />
      )}

      {/* Attention Areas */}
      <AttentionAreasCard 
        basketId={basketId}
        documentId={documentId}
      />
    </div>
  );
}

function FocusAreaCard({ 
  basketId, 
  documentId, 
  focusMode 
}: { 
  basketId: string; 
  documentId?: string; 
  focusMode: "document" | "basket";
}) {
  const { data: intelligence, isLoading } = useBasketIntelligence(basketId);
  const { data: docContext, isLoading: docLoading } = useDocumentContext(documentId);

  if (isLoading || docLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Spinner className="w-4 h-4" />
          <span className="text-sm text-muted-foreground">
            Analyzing context...
          </span>
        </div>
      </Card>
    );
  }

  const focusArea = focusMode === "document" && docContext?.focus_area 
    ? docContext.focus_area 
    : intelligence?.thematic_analysis?.dominant_themes?.[0] || "General exploration";

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Current Focus
        </span>
        <Badge variant="secondary" className="text-xs">
          {focusMode === "document" ? "Doc" : "Basket"}
        </Badge>
      </div>
      <p className="text-sm font-medium">{focusArea}</p>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">
          Live analysis active
        </span>
      </div>
    </Card>
  );
}

function ActiveThemesCard({ 
  basketId, 
  documentId, 
  focusMode 
}: { 
  basketId: string; 
  documentId?: string; 
  focusMode: "document" | "basket";
}) {
  const { data: intelligence, isLoading } = useBasketIntelligence(basketId);
  const { data: docContext, isLoading: docLoading } = useDocumentContext(documentId);

  if (isLoading || docLoading) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Active Themes
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const themes = focusMode === "document" && docContext?.current_themes 
    ? docContext.current_themes 
    : intelligence?.thematic_analysis?.dominant_themes || [];

  if (themes.length === 0) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Active Themes
        </div>
        <EmptyState title="No themes detected yet" />
      </Card>
    );
  }

  return (
    <Card className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Active Themes
      </div>
      <div className="space-y-1">
        {themes.slice(0, 4).map((theme, index) => (
          <div key={theme} className="flex items-center justify-between">
            <span className="text-sm">{theme}</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-xs text-muted-foreground">
                #{index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
      {themes.length > 4 && (
        <Button variant="ghost" size="sm" className="w-full text-xs mt-2">
          +{themes.length - 4} more themes
        </Button>
      )}
    </Card>
  );
}

function ContextItemsCard({ 
  basketId, 
  documentId, 
  focusMode 
}: { 
  basketId: string; 
  documentId?: string; 
  focusMode: "document" | "basket";
}) {
  const { data: docContext, isLoading } = useDocumentContext(documentId);

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Context Items
        </div>
        <div className="space-y-1">
          {[1, 2].map(i => (
            <div key={i} className="h-3 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const contextItems = docContext?.active_context_items || [];

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Context Items
        </span>
        <Badge variant="outline" className="text-xs">
          {contextItems.length}
        </Badge>
      </div>
      
      {contextItems.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No active context items
        </div>
      ) : (
        <div className="space-y-1">
          {contextItems.slice(0, 3).map((item, index) => (
            <div key={index} className="text-xs p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {item.type || "context"}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-2">
                {item.content || item.summary || "Context item"}
              </p>
            </div>
          ))}
          {contextItems.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-xs">
              +{contextItems.length - 3} more items
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function AttentionAreasCard({ 
  basketId, 
  documentId 
}: { 
  basketId: string; 
  documentId?: string;
}) {
  // Mock attention areas - would be derived from real intelligence analysis
  const attentionAreas = [
    {
      area: "Missing context",
      description: "Some themes need more context",
      urgency: "medium" as const
    },
    {
      area: "Potential connections",
      description: "Similar patterns in other documents",
      urgency: "low" as const
    }
  ];

  const urgencyColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500", 
    low: "bg-blue-500"
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Attention Areas
      </div>
      
      {attentionAreas.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No attention areas
        </div>
      ) : (
        <div className="space-y-2">
          {attentionAreas.map((area, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 ${urgencyColors[area.urgency]} rounded-full mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{area.area}</p>
                <p className="text-xs text-muted-foreground">
                  {area.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface ContextConfidenceIndicatorProps {
  basketId: string;
  documentId?: string;
}

function ContextConfidenceIndicator({ basketId, documentId }: ContextConfidenceIndicatorProps) {
  const { data: docContext } = useDocumentContext(documentId);
  
  const confidence = docContext?.confidence_score || 0.75; // Mock fallback
  const confidencePercent = Math.round(confidence * 100);
  
  const confidenceColor = confidence > 0.8 ? "text-green-600" : 
                         confidence > 0.6 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="text-right">
      <div className={`text-xs font-medium ${confidenceColor}`}>
        {confidencePercent}%
      </div>
      <div className="text-xs text-muted-foreground">
        confidence
      </div>
    </div>
  );
}

function RealtimeActivityCard({ 
  cursorPosition,
  recentTriggers,
  contextualInsights
}: { 
  cursorPosition?: number;
  recentTriggers: TriggerEvent[];
  contextualInsights: ContextualInsight[];
}) {
  const getTriggerIcon = (type: string) => {
    const icons: Record<string, string> = {
      typing_pause: "⏸️",
      text_selection: "📝",
      focus_change: "🎯",
      extended_pause: "💭",
      default: "⚡"
    };
    return icons[type] || icons.default;
  };

  const getInsightIcon = (type: string) => {
    const icons: Record<string, string> = {
      pattern: "🔍",
      connection: "🔗",
      opportunity: "💡",
      concern: "⚠️",
      default: "💭"
    };
    return icons[type] || icons.default;
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Real-time Activity
      </div>
      
      {cursorPosition !== undefined && (
        <div className="text-xs text-muted-foreground">
          Cursor at position {cursorPosition}
        </div>
      )}

      {recentTriggers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Recent Triggers</div>
          {recentTriggers.slice(-2).map((trigger, index) => (
            <div key={`${trigger.type}-${trigger.timestamp}`} className="flex items-center gap-2 text-xs">
              <span>{getTriggerIcon(trigger.type)}</span>
              <span className="capitalize">{trigger.type.replace('_', ' ')}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {Math.round(trigger.confidence * 100)}%
              </Badge>
            </div>
          ))}
        </div>
      )}

      {contextualInsights.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Live Insights</div>
          {contextualInsights.slice(0, 2).map((insight, index) => (
            <div key={insight.insight_id} className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <span>{getInsightIcon(insight.insight_type)}</span>
                <span className="text-xs font-medium capitalize">
                  {insight.insight_type} insight
                </span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {Math.round(insight.relevance * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}