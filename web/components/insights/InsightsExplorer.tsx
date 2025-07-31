"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { ProgressiveDisclosure } from "@/components/narrative/ProgressiveDisclosure";
import { 
  Lightbulb, 
  Link, 
  Sparkles, 
  FileText, 
  Clock, 
  TrendingUp,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { 
  transformToNarrativeLanguage, 
  createProgressiveStory,
  transformTimeframe,
  transformDifficulty
} from "@/lib/narrative/utils/languageTransformation";

interface Insight {
  id: string;
  title: string;
  content: string;
  type: 'discovery' | 'connection' | 'idea' | 'information';
  discovered_at: string;
  discovered_by_ai?: boolean;
  confidence?: number;
  connections?: string[];
  themes?: string[];
  status: 'discovered' | 'valuable' | 'important' | 'foundational';
  context?: string;
  technical_details?: any;
}

interface InsightsExplorerProps {
  insights: Insight[];
  basketId: string;
  onInsightClick?: (insight: Insight) => void;
  onCaptureInsight?: () => void;
}

const INSIGHT_ICONS = {
  discovery: <Lightbulb className="h-4 w-4" />,
  connection: <Link className="h-4 w-4" />,
  idea: <Sparkles className="h-4 w-4" />,
  information: <FileText className="h-4 w-4" />
};

const INSIGHT_COLORS = {
  discovery: 'amber',
  connection: 'blue', 
  idea: 'purple',
  information: 'green'
};

const STATUS_LABELS = {
  discovered: { label: 'Recently discovered', color: 'blue' },
  valuable: { label: 'Valuable insight', color: 'green' },
  important: { label: 'Important finding', color: 'orange' },
  foundational: { label: 'Core to your project', color: 'purple' }
};

export function InsightsExplorer({ 
  insights, 
  basketId, 
  onInsightClick,
  onCaptureInsight 
}: InsightsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filter insights based on search and filters
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchQuery === "" || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || insight.type === selectedType;
    const matchesStatus = selectedStatus === "all" || insight.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const groupedInsights = {
    recent: filteredInsights.filter(i => i.status === 'discovered').slice(0, 3),
    valuable: filteredInsights.filter(i => i.status === 'valuable'),
    important: filteredInsights.filter(i => i.status === 'important'),
    foundational: filteredInsights.filter(i => i.status === 'foundational')
  };

  if (insights.length === 0) {
    return (
      <div className="insights-explorer-empty p-8 text-center">
        <div className="max-w-md mx-auto">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to capture your first insight
          </h3>
          <p className="text-gray-600 mb-6">
            As you explore and develop your project, I'll help you capture and organize your discoveries, ideas, and connections.
          </p>
          <Button onClick={onCaptureInsight} className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Capture Your First Insight
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-explorer space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Insights</h2>
          <p className="text-sm text-gray-600">
            {insights.length} {insights.length === 1 ? 'insight' : 'insights'} discovered
          </p>
        </div>
        <Button onClick={onCaptureInsight} className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Capture New Insight
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All types</option>
          <option value="discovery">Discoveries</option>
          <option value="connection">Connections</option>
          <option value="idea">Ideas</option>
          <option value="information">Information</option>
        </select>

        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All insights</option>
          <option value="discovered">Recently discovered</option>
          <option value="valuable">Valuable</option>
          <option value="important">Important</option>
          <option value="foundational">Foundational</option>
        </select>
      </div>

      {/* Insights Groups */}
      <div className="space-y-8">
        {/* Recent Discoveries */}
        {groupedInsights.recent.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Recent Discoveries</h3>
            </div>
            <div className="grid gap-4">
              {groupedInsights.recent.map(insight => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight} 
                  onClick={() => onInsightClick?.(insight)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Other Insights */}
        {filteredInsights.length > groupedInsights.recent.length && (
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Insights</h3>
            <div className="grid gap-4">
              {filteredInsights
                .filter(insight => !groupedInsights.recent.includes(insight))
                .map(insight => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    onClick={() => onInsightClick?.(insight)}
                  />
                ))}
            </div>
          </section>
        )}
      </div>

      {/* No Results */}
      {filteredInsights.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No insights match your current filters.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSelectedStatus("all");
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: Insight;
  onClick?: () => void;
}

function InsightCard({ insight, onClick }: InsightCardProps) {
  const icon = INSIGHT_ICONS[insight.type];
  const color = INSIGHT_COLORS[insight.type];
  const statusInfo = STATUS_LABELS[insight.status];

  const progressiveStory = createProgressiveStory(
    insight.content,
    insight.context || `This ${insight.type} was ${insight.discovered_by_ai ? 'identified by AI analysis' : 'captured from your work'}. ${insight.connections?.length ? `It connects to ${insight.connections.length} other insights.` : ''}`,
    insight.technical_details
  );

  return (
    <Card 
      className="insight-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
              <div className={`text-${color}-600`}>
                {icon}
              </div>
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {insight.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-${statusInfo.color}-700 border-${statusInfo.color}-200`}
                >
                  {statusInfo.label}
                </Badge>
                {insight.discovered_by_ai && (
                  <Badge variant="outline" className="text-purple-700 border-purple-200">
                    AI discovered
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(insight.discovered_at).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ProgressiveDisclosure
          story={progressiveStory.story}
          reasoning={progressiveStory.reasoning}
          substrate={progressiveStory.substrate}
          defaultLevel="story"
        />
        
        {insight.themes && insight.themes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {insight.themes.map(theme => (
              <Badge key={theme} variant="secondary" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InsightsExplorer;