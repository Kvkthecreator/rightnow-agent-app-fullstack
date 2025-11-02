"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Lightbulb, BookOpen, Sparkles, Target, PlusCircle, FileSearch, Brain } from "lucide-react";
import { ProgressiveDisclosure } from "./ProgressiveDisclosure";

interface StrategicAction {
  type: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
  description?: string;
}

interface StrategicActionsProps {
  basketId: string;
  actions: StrategicAction[];
  intelligentSuggestions?: boolean;
}

export function StrategicActions({ basketId, actions, intelligentSuggestions = true }: StrategicActionsProps) {
  const router = useRouter();

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'capture_insight':
      case 'add_first_content':
      case 'add_content':
      case 'share_knowledge':
      case 'import_files':
      case 'start_with_template':
      case 'start_template':
        router.push(`/baskets/${basketId}/overview#add`);
        break;
      case 'create_new_document':
      case 'create_document':
        router.push(`/baskets/${basketId}/documents/new`);
        break;
      case 'explore_discoveries':
      case 'analyze_deeper':
        router.push(`/baskets/${basketId}/documents`);
        break;
      case 'create_synthesis':
        router.push(`/baskets/${basketId}/documents/new?type=synthesis`);
        break;
      case 'find_opportunities':
      case 'find_gaps':
        router.push(`/baskets/${basketId}/dashboard`);
        break;
      case 'strategic_planning':
        router.push(`/baskets/${basketId}/strategy`);
        break;
      case 'review_understanding':
      case 'strategic_analysis':
        router.push(`/baskets/${basketId}/documents`);
        break;
      default:
        console.warn('Unknown action type:', actionType);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'capture_insight':
      case 'add_first_content':
      case 'add_content':
        return <PlusCircle className="h-4 w-4" />;
      case 'share_knowledge':
      case 'import_files':
        return <BookOpen className="h-4 w-4" />;
      case 'start_with_template':
      case 'start_template':
        return <Sparkles className="h-4 w-4" />;
      case 'create_new_document':
      case 'create_synthesis':
        return <FileSearch className="h-4 w-4" />;
      case 'explore_discoveries':
      case 'find_opportunities':
      case 'analyze_deeper':
      case 'find_gaps':
        return <Brain className="h-4 w-4" />;
      case 'strategic_planning':
        return <Target className="h-4 w-4" />;
      case 'review_understanding':
      case 'strategic_analysis':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  // Transform technical actions to narrative equivalents
  const narrativeActions = actions?.map(action => ({
    ...action,
    label: transformActionLabel(action.type, action.label),
    description: getActionDescription(action.type)
  })) || [
    { type: "capture_insight", label: "Capture New Insight", enabled: true, primary: true, description: "Share something new you're thinking about" },
    { type: "create_new_document", label: "Create Something", enabled: true, description: "Start building on your ideas" },
    { type: "review_understanding", label: "Explore My Understanding", enabled: true, description: "See what I've learned from your work" }
  ];

  function transformActionLabel(type: string, originalLabel: string): string {
    const labelMap: Record<string, string> = {
      'add_first_content': 'Share Your First Idea',
      'add_content': 'Capture New Insight',
      'import_files': 'Share Your Knowledge',
      'start_template': 'Start with Template',
      'create_document': 'Create Something New',
      'analyze_deeper': 'Explore My Discoveries',
      'create_synthesis': 'Build a Synthesis',
      'find_gaps': 'Find New Opportunities',
      'strategic_planning': 'Strategic Planning',
      'strategic_analysis': 'Review My Understanding'
    };
    
    return labelMap[type] || originalLabel;
  }

  function getActionDescription(type: string): string {
    const descriptionMap: Record<string, string> = {
      'add_first_content': 'Let me help you get started by understanding what you\'re working on',
      'add_content': 'Share new ideas, documents, or thoughts for me to understand',
      'capture_insight': 'Add something new you\'re thinking about',
      'import_files': 'Upload documents or files for me to learn from',
      'share_knowledge': 'Share existing work or knowledge with me',
      'start_template': 'Begin with a structured template I can help you fill out',
      'create_document': 'Start building something new based on what I understand',
      'create_new_document': 'Create a new document or deliverable',
      'analyze_deeper': 'See what patterns and insights I\'ve discovered',
      'explore_discoveries': 'Explore the connections and themes I\'ve found',
      'create_synthesis': 'Let me help you synthesize your ideas into something cohesive',
      'find_gaps': 'Identify opportunities and gaps I can help you address',
      'find_opportunities': 'Discover new possibilities in your work',
      'strategic_planning': 'Work together on strategic planning and direction',
      'strategic_analysis': 'Review and refine my understanding of your goals',
      'review_understanding': 'See how well I understand your project and priorities'
    };
    
    return descriptionMap[type] || 'Take action on your project';
  }

  const storyContent = intelligentSuggestions 
    ? "I can see some clear next steps that would help move your project forward"
    : "Here are some ways we can work together";

  const reasoningContent = intelligentSuggestions
    ? "Based on what you've shared so far, these actions align with your goals and will help me understand your project better. I'm prioritizing the most impactful next steps."
    : "These actions represent different ways we can collaborate - from sharing new ideas to building on what we've already discussed.";

  const substrateContent = {
    actions: narrativeActions,
    actionTypes: narrativeActions.map(a => a.type),
    enabledCount: narrativeActions.filter(a => a.enabled).length,
    intelligentSuggestions
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">What We Can Do Next</h3>
      </div>
      
      <ProgressiveDisclosure
        story={storyContent}
        reasoning={reasoningContent}
        substrate={substrateContent}
      >
        <div className="flex flex-wrap gap-3 mt-4">
          {narrativeActions.slice(0, 3).map((action) => (
            <div key={action.type} className="group">
              <Button
                onClick={() => handleAction(action.type)}
                disabled={!action.enabled}
                variant={action.primary ? "default" : "outline"}
                className="flex items-center gap-2 transition-all duration-200 group-hover:scale-105"
              >
                {getActionIcon(action.type)}
                {action.label}
              </Button>
              {action.description && (
                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {action.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </ProgressiveDisclosure>
    </div>
  );
}