"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Home, Brain, Clock, Lightbulb, BookOpen, Target } from "lucide-react";

interface NavigationTab {
  key: string;
  label: string;
  narrativeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  comingSoon?: boolean;
}

const NARRATIVE_NAVIGATION_TABS: NavigationTab[] = [
  {
    key: "memory",
    label: "Memory", // Primary operating surface (Canon v1.3)
    narrativeLabel: "Strategic Intelligence",
    icon: Home,
    description: "Your project overview and AI partnership dashboard"
  },
  {
    key: "insights",
    label: "Blocks", // Legacy
    narrativeLabel: "Insights & Ideas",
    icon: Lightbulb,
    description: "Captured insights, ideas, and discoveries"
  },
  {
    key: "understanding",
    label: "Context", // Legacy
    narrativeLabel: "My Understanding",
    icon: Brain,
    description: "What I know about your project and goals"
  },
  {
    key: "graph",
    label: "Graph", // Canon v1.3
    narrativeLabel: "Project Knowledge",
    icon: BookOpen,
    description: "Explore context items and substrate relationships",
    comingSoon: true
  },
  {
    key: "reflections",
    label: "Reflections", // Canon v1.3
    narrativeLabel: "Strategic Planning",
    icon: Target,
    description: "Durable snapshots of basket insights over time",
    comingSoon: true
  },
  {
    key: "timeline",
    label: "Timeline", // Canon v1.3
    narrativeLabel: "Evolution",
    icon: Clock,
    description: "Append-only stream of basket activity with filters",
    comingSoon: true
  }
];

interface NarrativeNavigationProps {
  basketId: string;
  currentTab?: string;
  variant?: "tabs" | "sidebar" | "breadcrumb";
  showDescriptions?: boolean;
  useNarrativeLabels?: boolean;
}

export function NarrativeNavigation({ 
  basketId, 
  currentTab = "memory", 
  variant = "tabs",
  showDescriptions = false,
  useNarrativeLabels = true 
}: NarrativeNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tabKey: string) => {
    // Navigate to the appropriate page based on the tab key
    const routeMap: Record<string, string> = {
      memory: 'memory',
      insights: 'memory?tab=insights', // Legacy tab support
      understanding: 'memory?tab=understanding', // Legacy tab support
      graph: 'graph',
      reflections: 'reflections',
      timeline: 'timeline'
    };
    
    const route = routeMap[tabKey] || 'memory';
    router.push(`/baskets/${basketId}/${route}`);
  };

  const getCurrentTab = () => {
    return NARRATIVE_NAVIGATION_TABS.find(tab => tab.key === currentTab) || NARRATIVE_NAVIGATION_TABS[0];
  };

  if (variant === "breadcrumb") {
    const current = getCurrentTab();
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Project</span>
        <span>/</span>
        <span className="text-foreground font-medium">
          {useNarrativeLabels ? current.narrativeLabel : current.label}
        </span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <nav className="space-y-1">
        {NARRATIVE_NAVIGATION_TABS.map((tab) => {
          const isActive = tab.key === currentTab;
          const Icon = tab.icon;
          
          return (
            <Button
              key={tab.key}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-auto p-3 ${
                isActive ? "" : "hover:bg-muted/60"
              }`}
              onClick={() => handleTabChange(tab.key)}
              disabled={tab.comingSoon}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {useNarrativeLabels ? tab.narrativeLabel : tab.label}
                  </span>
                  {tab.comingSoon && (
                    <Badge variant="outline" className="text-xs">
                      Soon
                    </Badge>
                  )}
                </div>
                {showDescriptions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tab.description}
                  </p>
                )}
              </div>
            </Button>
          );
        })}
      </nav>
    );
  }

  // Default tabs variant
  return (
    <div className="border-b border-border">
      <div className="flex items-center space-x-1 overflow-x-auto">
        {NARRATIVE_NAVIGATION_TABS.map((tab) => {
          const isActive = tab.key === currentTab;
          const Icon = tab.icon;
          
          return (
            <Button
              key={tab.key}
              variant="ghost"
              className={`flex items-center gap-2 h-12 px-4 rounded-none border-b-2 transition-colors ${
                isActive 
                  ? "border-primary text-primary bg-primary/5" 
                  : "border-transparent hover:bg-muted/60"
              }`}
              onClick={() => handleTabChange(tab.key)}
              disabled={tab.comingSoon}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium whitespace-nowrap">
                {useNarrativeLabels ? tab.narrativeLabel : tab.label}
              </span>
              {tab.comingSoon && (
                <Badge variant="outline" className="text-xs ml-1">
                  Soon
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Utility function to get narrative label for any navigation key
export function getNarrativeLabel(key: string, fallback?: string): string {
  const tab = NARRATIVE_NAVIGATION_TABS.find(t => t.key === key);
  return tab ? tab.narrativeLabel : (fallback || key);
}

// Utility function to transform legacy navigation terms
export function transformNavigationLanguage(text: string): string {
  const transformations: Record<string, string> = {
    'Dashboard': 'Strategic Intelligence',
    'Blocks': 'Insights & Ideas',
    'Context': 'My Understanding', 
    'Memory': 'Project Knowledge',
    'Analysis': 'Strategic Planning',
    'Timeline': 'Evolution',
    'Create Block': 'Capture Insight',
    'Block List': 'Insights List',
    'Context Items': 'Project Knowledge',
    'Memory Items': 'What I Remember',
    'Block Editor': 'Insight Editor',
    'Context Panel': 'Knowledge Panel',
    'Analysis Results': 'My Discoveries',
    'Confidence Score': 'Understanding Level'
  };

  let transformed = text;
  Object.entries(transformations).forEach(([old, narrative]) => {
    transformed = transformed.replace(new RegExp(old, 'gi'), narrative);
  });

  return transformed;
}