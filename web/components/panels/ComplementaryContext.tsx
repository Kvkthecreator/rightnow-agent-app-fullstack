"use client";

import type { ReactNode } from "react";
import { Sparkles, Brain, BookOpen, PenTool, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressiveDisclosure } from "../narrative/ProgressiveDisclosure";
import { useSubstrate } from "@/lib/substrate/useSubstrate";
import { useMemoryInsights } from "@/lib/intelligence/useMemoryInsights";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

interface ComplementaryContextProps {
  view: 'dashboard' | 'documents' | 'insights' | 'understanding';
  basketId?: string;
  content?: any;
  priority?: 'ambient' | 'supportive' | 'hidden';
  className?: string;
}

interface ContextSection {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  priority: number;
}

export function ComplementaryContext({ 
  view, 
  basketId,
  content,
  priority = 'supportive',
  className = "" 
}: ComplementaryContextProps) {
  
  const workspaceId = useWorkspaceId(basketId || '');
  const basketIntelligence = useSubstrate(basketId || '', workspaceId || 'default');
  const memoryInsights = useMemoryInsights(basketId || '');
  
  if (priority === 'hidden') return null;
  
  // Define context sections based on view
  const getContextSections = (): ContextSection[] => {
    switch (view) {
      case 'dashboard':
        return [
          {
            id: 'recent-discoveries',
            title: 'Recent Discoveries',
            icon: <Sparkles className="h-4 w-4" />,
            content: <RecentDiscoveries insights={undefined} />,
            priority: 1
          },
          {
            id: 'memory-growth',
            title: 'My Understanding',
            icon: <Brain className="h-4 w-4" />,
            content: <MemoryGrowth progress={undefined} />,
            priority: 2
          },
          {
            id: 'suggested-actions',
            title: 'Suggested Next Steps',
            icon: <Target className="h-4 w-4" />,
            content: <SuggestedActions actions={undefined} />,
            priority: 3
          }
        ];
      
      case 'documents':
        return [
          {
            id: 'writing-assistant',
            title: 'Writing Assistant',
            icon: <PenTool className="h-4 w-4" />,
            content: <WritingAssistant suggestions={content?.writingHelp} />,
            priority: 1
          },
          {
            id: 'related-insights',
            title: 'Related Insights',
            icon: <BookOpen className="h-4 w-4" />,
            content: <RelatedKnowledge connections={content?.relatedInsights} />,
            priority: 2
          }
        ];
      
      case 'insights':
        return [
          {
            id: 'connection-opportunities',
            title: 'Connection Opportunities',
            icon: <Sparkles className="h-4 w-4" />,
            content: <ConnectionOpportunities suggestions={content?.connectionSuggestions} />,
            priority: 1
          },
          {
            id: 'theme-patterns',
            title: 'Emerging Patterns',
            icon: <TrendingUp className="h-4 w-4" />,
            content: <ThemePatterns patterns={content?.themePatterns} />,
            priority: 2
          }
        ];
      
      default:
        return [];
    }
  };
  
  const sections = getContextSections();
  
  // Ambient priority: show only most important section
  if (priority === 'ambient') {
    const topSection = sections.sort((a, b) => a.priority - b.priority)[0];
    if (!topSection) return null;
    
    return (
      <aside className={`complementary-context-ambient w-80 p-4 bg-muted/10 ${className}`}>
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          {topSection.icon}
          <h3 className="text-sm font-medium">{topSection.title}</h3>
        </div>
        <div className="text-sm">{topSection.content}</div>
      </aside>
    );
  }
  
  // Supportive priority: show all relevant sections
  return (
    <aside className={`complementary-context w-80 bg-muted/20 border-l overflow-y-auto ${className}`}>
      <div className="p-6 space-y-6">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              {section.icon}
              <h3 className="text-sm font-medium">{section.title}</h3>
            </div>
            <div className="text-sm space-y-2">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

// Context Components
function RecentDiscoveries({ insights }: { insights?: any[] }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-muted-foreground">
        No recent discoveries yet. Keep exploring!
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {insights.slice(0, 3).map((insight, idx) => (
        <div key={idx} className="p-2 bg-background/50 rounded-lg">
          <div className="font-medium text-xs mb-1">{insight.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {insight.summary}
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoryGrowth({ progress }: { progress?: any }) {
  const level = progress?.level || 'emerging';
  const percentage = progress?.percentage || 25;
  
  return (
    <ProgressiveDisclosure
      story={
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Understanding Level</span>
            <Badge variant="secondary" className="text-xs">
              {level}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            I'm building a {level} understanding of your project
          </p>
        </div>
      }
      reasoning="As we work together, I learn patterns from your insights, documents, and decisions to better understand your goals and preferences."
      substrate={{ level, percentage, metrics: progress }}
    />
  );
}

function SuggestedActions({ actions }: { actions?: any[] }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="text-muted-foreground text-xs">
        Actions will appear based on your current work
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {actions.slice(0, 2).map((action, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
        >
          <action.icon className="h-3 w-3 mr-2" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function WritingAssistant({ suggestions }: { suggestions?: any }) {
  if (!suggestions) {
    return (
      <div className="text-muted-foreground text-xs">
        Start writing to see AI suggestions
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="p-2 bg-primary/5 border-l-2 border-primary rounded-r">
        <p className="text-xs">{suggestions.nextSentence}</p>
      </div>
      <div className="flex gap-1">
        {suggestions.keywords?.map((keyword: string, idx: number) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RelatedKnowledge({ connections }: { connections?: any[] }) {
  if (!connections || connections.length === 0) {
    return (
      <div className="text-muted-foreground text-xs">
        Related insights will appear as you work
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {connections.map((connection, idx) => (
        <div key={idx} className="text-xs">
          <div className="font-medium">{connection.title}</div>
          <div className="text-muted-foreground">{connection.relevance}</div>
        </div>
      ))}
    </div>
  );
}

function ConnectionOpportunities({ suggestions }: { suggestions?: any[] }) {
  return (
    <div className="space-y-2">
      {suggestions?.map((suggestion, idx) => (
        <div key={idx} className="p-2 border rounded text-xs">
          {suggestion.description}
        </div>
      )) || (
        <div className="text-muted-foreground text-xs">
          I'll suggest connections as patterns emerge
        </div>
      )}
    </div>
  );
}

function ThemePatterns({ patterns }: { patterns?: any[] }) {
  return (
    <div className="space-y-1">
      {patterns?.map((pattern, idx) => (
        <Badge key={idx} variant="secondary" className="text-xs mr-1">
          {pattern.name} ({pattern.count})
        </Badge>
      )) || (
        <div className="text-muted-foreground text-xs">
          Patterns will emerge from your insights
        </div>
      )}
    </div>
  );
}