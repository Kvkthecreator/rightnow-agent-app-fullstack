"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Lightbulb, Sparkles, Tag, Settings } from "lucide-react";
import { ProgressiveDisclosure } from "../narrative/ProgressiveDisclosure";
import { createBrowserClient } from "@/lib/supabase/clients";

interface InsightRefinementProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: {
    type: string;
    label: string;
    content: string;
    auto?: boolean;
    meta_tags?: string;
  }) => Promise<void>;
  includeIntelligentSuggestions?: boolean;
}

const supabase = createBrowserClient();

export default function InsightRefinement({
  open,
  onOpenChange,
  onCreate,
  includeIntelligentSuggestions = true,
}: InsightRefinementProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [insightTypes, setInsightTypes] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [autoRefine, setAutoRefine] = useState(true);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Transform technical block types to narrative insight types
    supabase
      .from("blocks")
      .select("semantic_type")
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const technicalTypes = Array.from(
            new Set(
              data.map((d) => (d as any).semantic_type ?? "UNKNOWN")
            )
          ).sort();
          
          const narrativeTypes = transformToInsightTypes(technicalTypes);
          setInsightTypes(narrativeTypes);
          if (!type) setType(narrativeTypes[0] || "general_insight");
        }
      });
  }, [open]);

  const transformToInsightTypes = (technicalTypes: string[]): string[] => {
    const typeMap: Record<string, string> = {
      'UNKNOWN': 'general_insight',
      'custom': 'personal_insight',
      'analysis': 'strategic_analysis',
      'research': 'research_finding',
      'documentation': 'knowledge_capture',
      'task': 'action_item',
      'note': 'quick_thought',
      'reference': 'external_reference'
    };

    return technicalTypes.map(techType => 
      typeMap[techType] || techType.toLowerCase().replace(/[^a-z0-9]/g, '_')
    );
  };

  const getInsightTypeLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      'general_insight': 'General Insight',
      'personal_insight': 'Personal Insight',
      'strategic_analysis': 'Strategic Analysis',
      'research_finding': 'Research Finding',
      'knowledge_capture': 'Knowledge Capture',
      'action_item': 'Action Item',
      'quick_thought': 'Quick Thought',
      'external_reference': 'External Reference'
    };
    
    return labelMap[type] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'strategic_analysis': return '🎯';
      case 'research_finding': return '🔍';
      case 'knowledge_capture': return '📚';
      case 'action_item': return '✅';
      case 'quick_thought': return '💭';
      case 'external_reference': return '🔗';
      default: return '💡';
    }
  };

  async function handleSave() {
    setSaving(true);
    await onCreate({ 
      type, 
      label: title, 
      content, 
      auto: autoRefine, 
      meta_tags: tags 
    });
    setTitle("");
    setContent("");
    setTags("");
    setAutoRefine(true);
    setType(insightTypes[0] || "general_insight");
    setSaving(false);
    onOpenChange(false);
  }

  const storyContent = "I'll help you capture and refine this insight so it becomes part of your project knowledge";
  
  const reasoningContent = `This insight will be processed and connected to your existing work. ${autoRefine ? "I'll automatically refine it to fit with your other insights and suggest connections." : "I'll store it exactly as you provide it."}`;

  const substrateContent = {
    insight_type: type,
    technical_mapping: transformToInsightTypes([type]),
    auto_refinement_enabled: autoRefine,
    available_types: insightTypes,
    form_data: {
      title,
      content,
      tags,
      type
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <DialogTitle>Capture New Insight</DialogTitle>
          </div>
          <DialogDescription>
            Share something you're thinking about and I'll help integrate it into your project understanding
          </DialogDescription>
        </DialogHeader>

        <ProgressiveDisclosure
          story={storyContent}
          reasoning={reasoningContent}
          substrate={substrateContent}
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Type of Insight
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {insightTypes.slice(0, 6).map((insightType) => (
                  <Badge
                    key={insightType}
                    variant={type === insightType ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1"
                    onClick={() => setType(insightType)}
                  >
                    <span className="text-xs">{getInsightTypeIcon(insightType)}</span>
                    {getInsightTypeLabel(insightType)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                What's your insight about?
              </label>
              <Input 
                placeholder="Give your insight a clear title..."
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tell me more about this insight
              </label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Share your thoughts, observations, or ideas in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags (optional)
              </label>
              <Input 
                placeholder="Add tags to help organize this insight..."
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use comma-separated tags like: strategy, user-research, technical
              </p>
            </div>

            {includeIntelligentSuggestions && (
              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                <input
                  id="auto-refine"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary"
                  checked={autoRefine}
                  onChange={(e) => setAutoRefine(e.target.checked)}
                />
                <div className="flex-1">
                  <label htmlFor="auto-refine" className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Let me help refine and connect this insight
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I'll polish the language and suggest connections to your other work
                  </p>
                </div>
              </div>
            )}
          </div>
        </ProgressiveDisclosure>

        <DialogFooter className="pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Capturing...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                Capture Insight
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}