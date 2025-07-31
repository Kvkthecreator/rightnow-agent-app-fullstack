"use client";

import { BookOpen, Clock, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressiveDisclosure } from "../narrative/ProgressiveDisclosure";
import type { ContextItem } from "@/types";

interface ProjectContextProps {
  items: ContextItem[];
  onAddKnowledge?: () => void;
  isExpanded?: boolean;
}

interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  type: 'document' | 'conversation' | 'insight' | 'reference';
  lastUpdated?: Date;
  connections?: number;
}

export default function ProjectContext({ items, onAddKnowledge, isExpanded = false }: ProjectContextProps) {
  
  const transformContextToKnowledge = (contextItems: ContextItem[]): KnowledgeItem[] => {
    return contextItems.map(item => ({
      id: item.id,
      title: item.title || 'Untitled Knowledge',
      summary: item.summary,
      type: determineKnowledgeType(item),
      lastUpdated: (item as any).updated_at ? new Date((item as any).updated_at) : undefined,
      connections: (item as any).connections_count || 0
    }));
  };

  const determineKnowledgeType = (item: ContextItem): KnowledgeItem['type'] => {
    const summary = item.summary?.toLowerCase() || '';
    if (summary.includes('document') || summary.includes('file')) return 'document';
    if (summary.includes('conversation') || summary.includes('chat')) return 'conversation';
    if (summary.includes('insight') || summary.includes('idea')) return 'insight';
    return 'reference';
  };

  const getTypeIcon = (type: KnowledgeItem['type']) => {
    switch (type) {
      case 'document': return '📄';
      case 'conversation': return '💬';
      case 'insight': return '💡';
      case 'reference': return '🔗';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: KnowledgeItem['type']) => {
    switch (type) {
      case 'document': return 'Document';
      case 'conversation': return 'Discussion';
      case 'insight': return 'Insight';
      case 'reference': return 'Reference';
      default: return 'Knowledge';
    }
  };

  const knowledgeItems = transformContextToKnowledge(items);
  const knowledgeCount = knowledgeItems.length;
  const recentItems = knowledgeItems.sort((a, b) => 
    (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0)
  ).slice(0, 5);

  if (!knowledgeItems.length) {
    return (
      <div className="p-6 text-center border rounded-lg bg-muted/30">
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-medium mb-2">No project knowledge yet</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Share documents, ideas, or context to help me understand your project better
        </p>
        {onAddKnowledge && (
          <Button 
            onClick={onAddKnowledge} 
            size="sm" 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Share Knowledge
          </Button>
        )}
      </div>
    );
  }

  const storyContent = knowledgeCount === 1 
    ? "I have one piece of knowledge about your project"
    : `I know about ${knowledgeCount} different aspects of your project`;

  const reasoningContent = `This knowledge comes from everything you've shared with me - documents, conversations, and insights. I use this context to understand your goals and provide relevant suggestions.`;

  const substrateContent = {
    total_items: knowledgeCount,
    items_by_type: {
      documents: knowledgeItems.filter(item => item.type === 'document').length,
      conversations: knowledgeItems.filter(item => item.type === 'conversation').length,
      insights: knowledgeItems.filter(item => item.type === 'insight').length,
      references: knowledgeItems.filter(item => item.type === 'reference').length
    },
    recent_activity: recentItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      last_updated: item.lastUpdated?.toISOString()
    })),
    original_context_items: items
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">What I Know About Your Project</h3>
        </div>
        {onAddKnowledge && (
          <Button 
            onClick={onAddKnowledge} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Knowledge
          </Button>
        )}
      </div>

      <ProgressiveDisclosure
        story={storyContent}
        reasoning={reasoningContent}
        substrate={substrateContent}
      >
        <div className="space-y-3 mt-4">
          {(isExpanded ? knowledgeItems : recentItems).map((item) => (
            <div 
              key={item.id} 
              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{getTypeIcon(item.type)}</span>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {item.connections && item.connections > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {item.connections}
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                  
                  {item.lastUpdated && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.lastUpdated.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {!isExpanded && knowledgeItems.length > recentItems.length && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                View all {knowledgeItems.length} items
              </Button>
            </div>
          )}
        </div>
      </ProgressiveDisclosure>
    </div>
  );
}