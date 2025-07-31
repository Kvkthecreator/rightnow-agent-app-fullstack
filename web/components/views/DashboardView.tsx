"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Plus, 
  FileText, 
  Brain, 
  Network, 
  TrendingUp,
  Lightbulb,
  Target,
  Sparkles,
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";

// Integrate our narrative intelligence hooks
import { useProjectUnderstanding } from "@/lib/narrative/hooks/useProjectUnderstanding";
import { useIntelligentGuidance } from "@/lib/narrative/hooks/useIntelligentGuidance";
import { useProjectHealth } from "@/lib/narrative/hooks/useProjectHealth";

// Import our narrative components
import { ProgressiveDisclosure } from "@/components/narrative/ProgressiveDisclosure";
import { InsightCaptureModalWrapper } from "@/components/insights/InsightCaptureModalWrapper";

interface DashboardViewProps {
  basketId: string;
  basketName: string;
}

export function DashboardView({ basketId, basketName }: DashboardViewProps) {
  const router = useRouter();
  const [showInsightCapture, setShowInsightCapture] = useState(false);

  // Integrate our narrative intelligence APIs
  const { understanding, isLoading: understandingLoading } = useProjectUnderstanding(basketId);
  const { guidance, isLoading: guidanceLoading } = useIntelligentGuidance(basketId);
  const { health, isLoading: healthLoading } = useProjectHealth(basketId);

  const isLoading = understandingLoading || guidanceLoading || healthLoading;

  const handleCreateDocument = () => {
    router.push(`/baskets/${basketId}/work?tab=documents`);
  };

  const handleCaptureInsight = () => {
    setShowInsightCapture(true);
  };

  if (isLoading) {
    return (
      <div className="dashboard-view p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium text-gray-900 mb-2">Building your strategic intelligence...</p>
          <p className="text-gray-600">I'm analyzing your project to provide insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view p-6 space-y-8 max-w-7xl mx-auto">
      {/* Strategic Intelligence Hero - Commands Attention */}
      <section className="intelligence-overview">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Strategic Intelligence</h1>
            <p className="text-lg text-gray-600 mt-1">AI insights and project understanding for {basketName}</p>
          </div>
          
          {/* Primary Content Creation Entry Points */}
          <div className="content-creation-actions flex gap-3">
            <Button 
              onClick={handleCaptureInsight}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Capture Insight
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCreateDocument}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>

        {/* Strategic Intelligence Metrics - Rich, Data-Dense */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <IntelligenceMetricCard
            icon={<Brain className="h-6 w-6 text-blue-600" />}
            title="Project Understanding"
            primaryValue={understanding?.intelligence_level?.stage || "Building"}
            secondaryValue={understanding?.confidence?.explanation || "Developing insights"}
            trend={understanding?.confidence?.level === 'comprehensive_knowledge' ? 'strong' : 'growing'}
            description="I'm analyzing your work patterns and building strategic comprehension"
          />
          
          <IntelligenceMetricCard
            icon={<Network className="h-6 w-6 text-green-600" />}
            title="Knowledge Connections"
            primaryValue={`${understanding?.discovered_themes?.length || 0} patterns discovered`}
            secondaryValue={`${guidance?.length || 0} strategic recommendations`}
            trend="discovering"
            description="Cross-document themes and strategic relationships emerging"
          />
          
          <IntelligenceMetricCard
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            title="Strategic Momentum"
            primaryValue={health?.overall_health || "Building momentum"}
            secondaryValue="Consistent engagement detected"
            trend="positive"
            description="Your work is developing coherent strategic direction"
          />
        </div>

        {/* Progressive Understanding Display */}
        {understanding && (
          <div className="understanding-showcase mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="h-5 w-5" />
                  My Current Understanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressiveDisclosure
                  story={understanding.current_understanding || "I'm building understanding of your project direction and strategic goals."}
                  reasoning={understanding.confidence?.explanation || "Based on the patterns I've identified in your content and work patterns, I can see emerging themes and strategic directions."}
                  substrate={{
                    confidence_level: understanding.confidence?.level,
                    intelligence_stage: understanding.intelligence_level?.stage,
                    themes_discovered: understanding.discovered_themes?.length || 0,
                    last_analysis: new Date().toISOString()
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Active Strategic Recommendations - High Visual Priority */}
      {guidance && guidance.length > 0 && (
        <section className="strategic-recommendations">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Strategic Recommendations</h2>
              <p className="text-gray-600">AI-driven guidance for your next strategic moves</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {guidance.length} recommendations ready
            </Badge>
          </div>
          
          <div className="space-y-4">
            {guidance.slice(0, 3).map((rec, index) => (
              <StrategicRecommendationCard 
                key={index}
                recommendation={rec}
                onTakeAction={(action) => handleRecommendationAction(rec, action)}
                priority={index === 0 ? 'high' : 'medium'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Creation Opportunities */}
      <section className="creation-opportunities">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ready to Create</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreationOpportunityCard 
            icon={<Lightbulb className="h-6 w-6 text-yellow-600" />}
            title="Capture New Insights"
            description="Share discoveries, connections, or breakthrough ideas you've had about your project"
            actionLabel="Capture Insight"
            onAction={handleCaptureInsight}
            suggestions={[
              "Key discovery or realization",
              "Important connection between ideas", 
              "Strategic question that emerged",
              "Creative breakthrough moment"
            ]}
          />
          
          <CreationOpportunityCard 
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            title="Start Writing"
            description="Create documents to develop your strategic thinking and capture detailed analysis"
            actionLabel="New Document"
            onAction={handleCreateDocument}
            suggestions={[
              "Strategic analysis document",
              "Project planning outline",
              "Research findings summary",
              "Decision framework"
            ]}
          />
        </div>
      </section>

      {/* Project Health Overview */}
      {health && (
        <section className="project-health">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Health</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {health.strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Growth Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {health.improvement_areas?.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Insight Capture Modal */}
      {showInsightCapture && (
        <InsightCaptureModalWrapper 
          basketId={basketId}
          onClose={() => setShowInsightCapture(false)}
          onInsightCaptured={() => {
            setShowInsightCapture(false);
            // Refresh intelligence data
            window.location.reload(); // Simple refresh - could be optimized
          }}
        />
      )}
    </div>
  );
}

// Supporting Components

interface IntelligenceMetricCardProps {
  icon: React.ReactNode;
  title: string;
  primaryValue: string;
  secondaryValue: string;
  trend: 'strong' | 'growing' | 'discovering' | 'positive';
  description: string;
}

function IntelligenceMetricCard({
  icon,
  title,
  primaryValue,
  secondaryValue,
  trend,
  description
}: IntelligenceMetricCardProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'strong': return 'text-green-600 bg-green-50';
      case 'growing': return 'text-blue-600 bg-blue-50';
      case 'discovering': return 'text-purple-600 bg-purple-50';
      case 'positive': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xl font-semibold text-gray-900">{primaryValue}</p>
            <p className="text-sm text-gray-600">{secondaryValue}</p>
          </div>
          
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(trend)}`}>
            {trend === 'strong' && '📈 Strong insights'}
            {trend === 'growing' && '📊 Growing understanding'}
            {trend === 'discovering' && '🔍 Discovering patterns'}
            {trend === 'positive' && '⚡ Building momentum'}
          </div>
          
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StrategicRecommendationCardProps {
  recommendation: any; // From useIntelligentGuidance
  onTakeAction: (action: string) => void;
  priority: 'high' | 'medium' | 'low';
}

function StrategicRecommendationCard({ 
  recommendation, 
  onTakeAction, 
  priority 
}: StrategicRecommendationCardProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50/30';
      case 'medium': return 'border-l-yellow-400 bg-yellow-50/30';
      default: return 'border-l-gray-400 bg-gray-50/30';
    }
  };

  return (
    <Card className={`border-l-4 ${getPriorityStyles(priority)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">{recommendation.title}</CardTitle>
            <p className="text-gray-600 mt-1">{recommendation.description}</p>
          </div>
          <Badge variant="outline" className={
            priority === 'high' ? 'border-red-200 text-red-700' :
            priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
            'border-gray-200 text-gray-700'
          }>
            {priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ProgressiveDisclosure
          story={recommendation.recommendation}
          reasoning={recommendation.reasoning}
          substrate={{
            expected_outcome: recommendation.expected_outcome,
            timeframe: recommendation.timeframe,
            difficulty: recommendation.difficulty,
            action_plan: recommendation.action_plan
          }}
        />
        
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => onTakeAction('implement')}
            size="sm"
          >
            <Target className="h-3 w-3 mr-1" />
            Take Action
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onTakeAction('learn_more')}
            size="sm"
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreationOpportunityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  suggestions: string[];
}

function CreationOpportunityCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  suggestions
}: CreationOpportunityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border-dashed border-2 border-gray-200 hover:border-blue-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
        
        <Button onClick={onAction} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper function for recommendation actions
function handleRecommendationAction(recommendation: any, action: string) {
  if (action === 'implement') {
    // Could open a workflow to implement the recommendation
    console.log('Implementing recommendation:', recommendation.title);
  } else if (action === 'learn_more') {
    // Could show detailed analysis or related resources
    console.log('Learning more about:', recommendation.title);
  }
}