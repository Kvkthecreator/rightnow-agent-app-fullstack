"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { IntelligenceUnderstanding } from "./IntelligenceUnderstanding";
import { StrategicGuidance } from "./StrategicGuidance";
import { SimpleActions } from "./SimpleActions";
import { UnderstandingProgress } from "../understanding/UnderstandingProgress";
import { ProgressIndicators } from "../narrative/ProgressIndicators";
import { useBasketIntelligenceDashboard } from "@/lib/baskets/useBasketIntelligenceDashboard";
import { useProjectUnderstanding } from "@/lib/narrative/hooks/useProjectUnderstanding";
import { useIntelligentGuidance } from "@/lib/narrative/hooks/useIntelligentGuidance";
import { useProjectHealth } from "@/lib/narrative/hooks/useProjectHealth";
import { Loader2, Brain, Lightbulb } from "lucide-react";

interface IntelligenceDashboardProps {
  basketId: string;
}

export function IntelligenceDashboard({ basketId }: IntelligenceDashboardProps) {
  // Use the existing dashboard hook for backward compatibility
  const { data: intelligence, isLoading: legacyLoading, error: legacyError } = useBasketIntelligenceDashboard(basketId);
  
  // Use new narrative intelligence hooks
  const { understanding, isLoading: understandingLoading } = useProjectUnderstanding(basketId);
  const { guidance, isLoading: guidanceLoading } = useIntelligentGuidance(basketId);
  const { health, isLoading: healthLoading } = useProjectHealth(basketId);

  const isLoading = legacyLoading || understandingLoading || guidanceLoading || healthLoading;

  if (isLoading && !intelligence) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Understanding your project...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (legacyError && !intelligence) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">Ready to understand your project</p>
            <p className="text-sm">Add some content and I'll start developing insights about your work.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!intelligence && !understanding) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">Let's start understanding your project</p>
            <p className="text-sm">Share documents, ideas, or thoughts to begin building strategic insights together.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine data from both sources for a smooth transition
  const combinedData = {
    understanding: understanding?.current_understanding || intelligence?.understanding || "Building understanding...",
    themes: understanding?.discovered_themes?.length || intelligence?.themes?.length || 0,
    confidenceScore: (understanding?.confidence ? 
      (understanding.confidence.level === 'comprehensive_knowledge' ? 90 :
       understanding.confidence.level === 'solid_grasp' ? 70 :
       understanding.confidence.level === 'building_understanding' ? 50 : 30) :
      intelligence?.confidenceScore || 0),
    memoryGrowth: intelligence?.memoryGrowth || 0,
    lastUpdated: intelligence?.lastUpdated,
    nextSteps: understanding?.next_steps || intelligence?.nextSteps || [],
    actions: intelligence?.actions || [],
    health: health?.overall_health,
    insights: 0 // TODO: Get from insights API when available
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-6">
        {/* Progress Indicators */}
        <ProgressIndicators
          confidence={understanding?.confidence?.level || combinedData.confidenceScore}
          health={health?.overall_health}
          themes={combinedData.themes}
          insights={combinedData.insights}
        />

        {/* Understanding Section */}
        <IntelligenceUnderstanding
          understanding={combinedData.understanding}
          themes={understanding?.discovered_themes?.map(t => t.name) || intelligence?.themes || []}
        />
        
        {/* Strategic Guidance */}
        {(guidance?.length > 0 || combinedData.nextSteps?.length > 0) && (
          <StrategicGuidance
            nextSteps={Array.isArray(combinedData.nextSteps) 
              ? combinedData.nextSteps.map((step, index) => 
                  typeof step === 'string' 
                    ? { description: step, priority: index + 1 }
                    : step
                )
              : []
            }
            guidance={guidance?.slice(0, 3)} // Show top 3 guidance items
          />
        )}
        
        {/* Simple Actions */}
        <SimpleActions
          basketId={basketId}
          actions={combinedData.actions}
        />
        
        {/* Understanding Progress */}
        <UnderstandingProgress
          confidenceScore={combinedData.confidenceScore}
          memoryGrowth={combinedData.memoryGrowth}
          lastUpdated={combinedData.lastUpdated}
          stage={understanding?.intelligence_level?.stage}
          themes={combinedData.themes}
          insights={combinedData.insights}
          health={health?.overall_health}
        />
      </CardContent>
    </Card>
  );
}