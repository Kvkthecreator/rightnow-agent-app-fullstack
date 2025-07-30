"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { IntelligenceUnderstanding } from "./IntelligenceUnderstanding";
import { StrategicGuidance } from "./StrategicGuidance";
import { SimpleActions } from "./SimpleActions";
import { MemoryEvolution } from "./MemoryEvolution";
import { useBasketIntelligenceDashboard } from "@/lib/baskets/useBasketIntelligenceDashboard";
import { Loader2 } from "lucide-react";

interface IntelligenceDashboardProps {
  basketId: string;
}

export function IntelligenceDashboard({ basketId }: IntelligenceDashboardProps) {
  const { data: intelligence, isLoading, error } = useBasketIntelligenceDashboard(basketId);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing your project intelligence...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Unable to load intelligence</p>
            <p className="text-sm">Add some content to your basket to see strategic insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!intelligence) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No intelligence available yet</p>
            <p className="text-sm">Add documents or context to generate strategic insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <IntelligenceUnderstanding
          understanding={intelligence.understanding}
          themes={intelligence.themes}
        />
        
        <StrategicGuidance
          nextSteps={intelligence.nextSteps}
        />
        
        <SimpleActions
          basketId={basketId}
          actions={intelligence.actions}
        />
        
        <MemoryEvolution
          confidenceScore={intelligence.confidenceScore}
          memoryGrowth={intelligence.memoryGrowth}
          lastUpdated={intelligence.lastUpdated}
        />
      </CardContent>
    </Card>
  );
}