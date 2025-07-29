"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useBasketIntelligence } from "@/lib/intelligence/useBasketIntelligence";
import { useMemoryInsights } from "@/lib/intelligence/useMemoryInsights";
import { useState } from "react";

interface MemoryInsightsPanelProps {
  basketId: string;
  documentId?: string;
  focusMode: "document" | "basket";
}

export default function MemoryInsightsPanel({ 
  basketId, 
  documentId, 
  focusMode 
}: MemoryInsightsPanelProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Panel Header */}
      <div>
        <h3 className="font-medium text-sm">🧩 Connections from your past</h3>
        <p className="text-xs text-muted-foreground">
          Relevant memories and patterns
        </p>
      </div>

      {/* Related Documents */}
      <RelatedDocumentsCard basketId={basketId} />

      {/* Forgotten Insights */}
      <ForgottenInsightsCard basketId={basketId} />

      {/* Pattern Evolution */}
      <PatternEvolutionCard basketId={basketId} />

      {/* Memory Connections */}
      <MemoryConnectionsCard basketId={basketId} />
    </div>
  );
}

function RelatedDocumentsCard({ basketId }: { basketId: string }) {
  const { data: intelligence, isLoading } = useBasketIntelligence(basketId);

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Spinner className="w-4 h-4" />
          <span className="text-xs font-medium text-muted-foreground">
            Finding related documents...
          </span>
        </div>
      </Card>
    );
  }

  const relationships = intelligence?.document_relationships?.document_pairs || [];
  const highValueRelationships = relationships.filter(r => r.potential_value === "high");

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Related Documents
        </span>
        <Badge variant="outline" className="text-xs">
          {highValueRelationships.length}
        </Badge>
      </div>

      {highValueRelationships.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No strong document relationships found
        </div>
      ) : (
        <div className="space-y-2">
          {highValueRelationships.slice(0, 3).map((relationship, index) => (
            <RelatedDocumentItem
              key={relationship.relationship_id}
              relationship={relationship}
            />
          ))}
          {highValueRelationships.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-xs">
              +{highValueRelationships.length - 3} more relationships
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

interface RelatedDocumentItemProps {
  relationship: {
    relationship_id: string;
    document_a_id: string;
    document_b_id: string;
    relationship_type: string;
    strength: number;
    relationship_description: string;
    potential_value: string;
  };
}

function RelatedDocumentItem({ relationship }: RelatedDocumentItemProps) {
  const [expanded, setExpanded] = useState(false);

  const typeIcons = {
    thematic_overlap: "🎨",
    sequential: "➡️",
    complementary: "🤝",
    conflicting: "⚡",
    foundational: "🏗️",
    exploratory: "🔍"
  };

  const typeIcon = typeIcons[relationship.relationship_type as keyof typeof typeIcons] || "🔗";
  const strengthPercent = Math.round(relationship.strength * 100);

  return (
    <div className="border rounded p-2 bg-muted/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-sm">{typeIcon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {relationship.relationship_description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {relationship.relationship_type.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {strengthPercent}% match
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs h-auto p-1 flex-shrink-0"
        >
          {expanded ? "Less" : "More"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          <p>Documents: {relationship.document_a_id.slice(0, 8)}... ↔ {relationship.document_b_id.slice(0, 8)}...</p>
          <p className="mt-1">Value: {relationship.potential_value}</p>
        </div>
      )}
    </div>
  );
}

function ForgottenInsightsCard({ basketId }: { basketId: string }) {
  const { data: memoryInsights, isLoading } = useMemoryInsights(basketId);

  // Mock forgotten insights - would come from actual memory analysis
  const forgottenInsights = [
    {
      id: "1",
      insight: "Key constraint mentioned in early documents",
      lastSeen: "3 days ago",
      relevance: 0.8,
      context: "Initial project scoping"
    },
    {
      id: "2", 
      insight: "Alternative approach explored previously",
      lastSeen: "1 week ago",
      relevance: 0.6,
      context: "Research phase"
    }
  ];

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Forgotten Insights
        </div>
        <div className="space-y-1">
          {[1, 2].map(i => (
            <div key={i} className="h-3 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Forgotten Insights
        </span>
        <Badge variant="outline" className="text-xs">
          {forgottenInsights.length}
        </Badge>
      </div>

      {forgottenInsights.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No forgotten insights to surface
        </div>
      ) : (
        <div className="space-y-2">
          {forgottenInsights.map((insight) => (
            <div key={insight.id} className="border rounded p-2 bg-yellow-50/30 border-yellow-200">
              <div className="flex items-start gap-2">
                <span className="text-sm">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{insight.insight}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {insight.context}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {insight.lastSeen}
                      </span>
                      <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PatternEvolutionCard({ basketId }: { basketId: string }) {
  const { data: intelligence, isLoading } = useBasketIntelligence(basketId);

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Pattern Evolution
        </div>
        <div className="space-y-1">
          {[1, 2].map(i => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const patterns = intelligence?.thematic_analysis?.discovered_patterns || [];
  const strongPatterns = patterns.filter(p => p.pattern_strength === "strong");

  return (
    <Card className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Pattern Evolution
      </div>

      {strongPatterns.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          Patterns are still emerging
        </div>
      ) : (
        <div className="space-y-2">
          {strongPatterns.slice(0, 2).map((pattern) => (
            <div key={pattern.pattern_id} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium">{pattern.theme_name}</span>
              </div>
              <div className="flex-1 h-px bg-muted" />
              <div className="text-xs text-muted-foreground">
                {Math.round(pattern.confidence * 100)}%
              </div>
            </div>
          ))}

          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            📈 These patterns have strengthened over time
          </div>
        </div>
      )}
    </Card>
  );
}

function MemoryConnectionsCard({ basketId }: { basketId: string }) {
  // Mock memory connections - would be from intelligent memory analysis
  const memoryConnections = [
    {
      id: "1",
      type: "concept_bridge",
      description: "Similar concept explored in previous project",
      confidence: 0.7,
      timeframe: "2 months ago"
    },
    {
      id: "2",
      type: "solution_pattern", 
      description: "This approach worked well before",
      confidence: 0.8,
      timeframe: "6 weeks ago"
    }
  ];

  const typeIcons = {
    concept_bridge: "🌉",
    solution_pattern: "🔧", 
    learning_connection: "📚",
    mistake_avoidance: "⚠️"
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Memory Connections
        </span>
        <Badge variant="outline" className="text-xs">
          {memoryConnections.length}
        </Badge>
      </div>

      {memoryConnections.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No memory connections found
        </div>
      ) : (
        <div className="space-y-2">
          {memoryConnections.map((connection) => {
            const icon = typeIcons[connection.type as keyof typeof typeIcons] || "🔗";
            const confidencePercent = Math.round(connection.confidence * 100);
            
            return (
              <div key={connection.id} className="border rounded p-2 bg-blue-50/30 border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-sm">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{connection.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {connection.timeframe}
                      </span>
                      <span className="text-xs text-blue-600">
                        {confidencePercent}% relevant
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
        🧠 Connections from your memory substrate
      </div>
    </Card>
  );
}