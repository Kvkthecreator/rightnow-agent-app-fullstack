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
import { Textarea } from "@/components/ui/textarea";
import { ProgressiveDisclosure } from "@/components/narrative/ProgressiveDisclosure";
import { Lightbulb, Sparkles, Link, FileText } from "lucide-react";
import { transformToNarrativeLanguage, createProgressiveStory } from "@/lib/narrative/utils/languageTransformation";

interface InsightCaptureModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCapture: (data: {
    type: string;
    title: string;
    content: string;
    discoveredByAI?: boolean;
    context?: string;
  }) => Promise<void>;
  basketId: string;
  aiSuggestion?: boolean;
}

const INSIGHT_TYPES = [
  {
    value: "discovery",
    label: "Key Discovery",
    description: "Something important you learned or realized",
    icon: <Lightbulb className="h-4 w-4" />,
    color: "amber"
  },
  {
    value: "connection",
    label: "New Connection",
    description: "How different ideas or concepts relate",
    icon: <Link className="h-4 w-4" />,
    color: "blue"
  },
  {
    value: "idea",
    label: "Creative Idea",
    description: "An innovative thought or possibility",
    icon: <Sparkles className="h-4 w-4" />,
    color: "purple"
  },
  {
    value: "information",
    label: "Important Information",
    description: "Facts, data, or details worth remembering",
    icon: <FileText className="h-4 w-4" />,
    color: "green"
  }
];

export function InsightCaptureModal({
  open,
  onOpenChange,
  onCapture,
  basketId,
  aiSuggestion = false,
}: InsightCaptureModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [insightType, setInsightType] = useState("discovery");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setInsightType("discovery");
      setContext("");
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    
    try {
      await onCapture({
        type: insightType,
        title: title.trim() || "Untitled insight",
        content: content.trim(),
        discoveredByAI: aiSuggestion,
        context: context.trim() || undefined
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to capture insight:", error);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  const selectedType = INSIGHT_TYPES.find(t => t.value === insightType) || INSIGHT_TYPES[0];

  const progressiveStory = createProgressiveStory(
    aiSuggestion 
      ? "I'll help you capture this insight and understand how it fits with your project"
      : "I'll understand this insight and help you see how it connects to your work",
    "Based on the content you share, I'll analyze patterns, themes, and relationships to provide strategic guidance about your project's direction.",
    {
      basketId,
      insightType,
      aiAssisted: aiSuggestion,
      analysisMode: "narrative_intelligence"
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType.icon}
            Capture Your {selectedType.label}
          </DialogTitle>
          <DialogDescription>
            {aiSuggestion 
              ? "I noticed something interesting and wanted to help you capture it."
              : "Share what you've discovered and I'll help you understand how it fits with your project."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Insight Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">
              What kind of insight is this?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {INSIGHT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInsightType(type.value)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    insightType === type.value
                      ? `border-${type.color}-300 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`text-${type.color}-600`}>
                      {type.icon}
                    </div>
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-900">
              Give it a name (optional)
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Quick name for this ${selectedType.label.toLowerCase()}...`}
              className="w-full"
            />
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-gray-900">
              What did you discover? <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Describe your ${selectedType.label.toLowerCase()}...`}
              rows={4}
              className="w-full resize-none"
              required
            />
          </div>

          {/* Context Field */}
          <div className="space-y-2">
            <label htmlFor="context" className="text-sm font-medium text-gray-900">
              Any additional context? (optional)
            </label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Where did this come from? What led to this insight?"
              rows={2}
              className="w-full resize-none"
            />
          </div>

          {/* Progressive Disclosure */}
          <ProgressiveDisclosure
            story={progressiveStory.story}
            reasoning={progressiveStory.reasoning}
            substrate={progressiveStory.substrate}
            className="bg-gray-50 rounded-lg p-4"
          />

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Never mind
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Capturing...
                </>
              ) : (
                <>
                  {selectedType.icon}
                  Capture {selectedType.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}