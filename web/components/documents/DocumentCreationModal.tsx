"use client";
import { useState } from "react";
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
import { FileText, BookOpen, Target, Search, Sparkles } from "lucide-react";

interface DocumentCreationModalProps {
  basketName: string;
  onClose: () => void;
  onCreate: (title: string, template?: string) => Promise<void>;
}

const DOCUMENT_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a clean slate',
    icon: <FileText className="h-5 w-5" />,
    content: ''
  },
  {
    id: 'strategic-analysis',
    name: 'Strategic Analysis',
    description: 'Framework for strategic thinking',
    icon: <Target className="h-5 w-5" />,
    content: `# Strategic Analysis

## Executive Summary
[Brief overview of the strategic situation]

## Current State Assessment
[Analysis of where things stand today]

## Strategic Options
[Different paths forward]

## Recommendations
[Preferred strategic direction]

## Next Steps
[Specific actions to take]
`
  },
  {
    id: 'project-plan',
    name: 'Project Planning',
    description: 'Structure for project organization',
    icon: <BookOpen className="h-5 w-5" />,
    content: `# Project Plan

## Project Overview
[What we're building and why]

## Objectives
[Clear, measurable goals]

## Timeline & Milestones
[Key dates and deliverables]

## Resources Required
[People, tools, budget needed]

## Success Metrics
[How we'll measure progress]
`
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Organize findings and insights',
    icon: <Search className="h-5 w-5" />,
    content: `# Research Notes

## Research Question
[What we're trying to understand]

## Key Findings
[Important discoveries and insights]

## Supporting Evidence
[Data, quotes, references]

## Implications
[What this means for our work]

## Next Research Steps
[What to investigate next]
`
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture discussions and decisions',
    icon: <Sparkles className="h-5 w-5" />,
    content: `# Meeting Notes

**Date:** [Meeting date]
**Attendees:** [Who was there]
**Purpose:** [Why we met]

## Key Discussion Points
[Main topics covered]

## Decisions Made
[What was decided]

## Action Items
- [ ] [Action item with owner]
- [ ] [Action item with owner]

## Next Steps
[What happens next]
`
  }
];

export function DocumentCreationModal({ basketName, onClose, onCreate }: DocumentCreationModalProps) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      const template = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate);
      await onCreate(title, template?.content);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleCreate();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Create New Document
          </DialogTitle>
          <DialogDescription>
            Start writing to develop your strategic thinking for {basketName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-900">
              Document Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter document title..."
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">
              Choose a Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DOCUMENT_TEMPLATES.map((template) => (
                <TemplateOption
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  onSelect={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          </div>

          {/* Template Preview */}
          {selectedTemplate !== 'blank' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Template Preview
              </label>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate)?.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateOptionProps {
  template: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    content: string;
  };
  selected: boolean;
  onSelect: () => void;
}

function TemplateOption({ template, selected, onSelect }: TemplateOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`${selected ? 'text-blue-600' : 'text-gray-500'}`}>
          {template.icon}
        </div>
        <h3 className={`font-medium ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
          {template.name}
        </h3>
      </div>
      <p className={`text-sm ${selected ? 'text-blue-700' : 'text-gray-600'}`}>
        {template.description}
      </p>
    </button>
  );
}