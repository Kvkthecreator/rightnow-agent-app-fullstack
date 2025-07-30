"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ProcessingResponse, WorkspaceCreationResult } from '@/lib/intelligence/useUniversalIntelligence';

interface WorkspaceCreationTriggerProps {
  processingResult: ProcessingResponse | null;
  onCreateWorkspace: (modifications?: {
    workspace_name?: string;
    selected_documents?: string[];
    additional_context?: string;
  }) => Promise<WorkspaceCreationResult | null>;
  isCreating: boolean;
  creationResult: WorkspaceCreationResult | null;
  disabled?: boolean;
  className?: string;
}

export default function WorkspaceCreationTrigger({
  processingResult,
  onCreateWorkspace,
  isCreating,
  creationResult,
  disabled = false,
  className
}: WorkspaceCreationTriggerProps) {
  const [showCustomization, setShowCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');

  // Initialize selections when processing result changes
  useState(() => {
    if (processingResult) {
      setSelectedDocs(processingResult.suggested_structure.documents.map(doc => doc.title));
      setCustomName(processingResult.suggested_structure.organization.suggested_name);
    }
  });

  const handleCreateWorkspace = async () => {
    const modifications = showCustomization ? {
      workspace_name: customName || undefined,
      selected_documents: selectedDocs.length > 0 ? selectedDocs : undefined,
      additional_context: additionalContext || undefined
    } : undefined;

    await onCreateWorkspace(modifications);
  };

  const toggleDocSelection = (docTitle: string) => {
    setSelectedDocs(prev => 
      prev.includes(docTitle) 
        ? prev.filter(title => title !== docTitle)
        : [...prev, docTitle]
    );
  };

  // Show success state
  if (creationResult) {
    return (
      <Card className={cn("border-green-500 bg-green-50", className)}>
        <CardContent className="text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2 text-green-800">
            Workspace Created Successfully!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Your intelligent workspace "{creationResult.basket.name}" is ready with AI-powered insights
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {creationResult.documents.length} documents
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {creationResult.context_items} context items
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {creationResult.intelligence_summary.themes_count} themes
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {Math.round(creationResult.intelligence_summary.confidence_score * 100)}% confidence
            </Badge>
          </div>

          <div className="space-y-2 text-left max-w-md mx-auto mb-6">
            <h4 className="text-sm font-medium text-green-800">Your Next Steps:</h4>
            {creationResult.next_steps.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1 text-green-600">{index + 1}.</span>
                <span className="text-xs text-green-700">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
            <span>Taking you to your workspace...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show creation progress
  if (isCreating) {
    return (
      <Card className={cn("border-primary bg-primary/5", className)}>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Creating Your Intelligent Workspace</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Setting up your workspace with documents, AI analysis, and intelligent insights. 
            This will just take a moment...
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-primary/10">Setting up structure</Badge>
            <Badge variant="outline" className="bg-primary/10">Creating documents</Badge>
            <Badge variant="outline" className="bg-primary/10">Initializing AI</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show creation trigger
  if (!processingResult) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="text-center py-6">
          <span className="text-2xl mb-2 block opacity-40">✨</span>
          <p className="text-sm text-muted-foreground">
            Add content above to create your workspace
          </p>
        </CardContent>
      </Card>
    );
  }

  const isReady = processingResult.intelligence.confidence_score > 0.3;

  return (
    <Card className={cn(
      "transition-all",
      isReady ? "border-primary/50 bg-primary/5" : "border-muted",
      className
    )}>
      <CardContent className="space-y-4">
        {/* Main Creation Button */}
        <div className="text-center">
          <Button
            onClick={handleCreateWorkspace}
            disabled={disabled || !isReady}
            size="lg"
            className="w-full mb-3"
          >
            <span className="mr-2">✨</span>
            Create My Workspace
          </Button>
          
          {!isReady && (
            <p className="text-xs text-muted-foreground">
              Add more content to improve workspace creation
            </p>
          )}
          
          {isReady && (
            <p className="text-xs text-muted-foreground">
              Ready to create workspace with {processingResult.suggested_structure.documents.length} documents
            </p>
          )}
        </div>

        {/* Customization Toggle */}
        {isReady && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomization(!showCustomization)}
              className="w-full text-xs"
            >
              {showCustomization ? 'Hide' : 'Show'} Customization Options
              <span className="ml-1">{showCustomization ? '▲' : '▼'}</span>
            </Button>
          </div>
        )}

        {/* Customization Panel */}
        {showCustomization && (
          <div className="border-t pt-4 space-y-4">
            {/* Workspace Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Workspace Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={processingResult.suggested_structure.organization.suggested_name}
                className="w-full p-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Document Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Documents to Create
              </label>
              <div className="space-y-2">
                {processingResult.suggested_structure.documents.map(doc => (
                  <div key={doc.title} className="flex items-start gap-3 p-2 border border-border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.title)}
                      onChange={() => toggleDocSelection(doc.title)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{doc.title}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {doc.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Context */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Additional Context (Optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any additional information to help customize your workspace..."
                className="w-full p-2 border border-input rounded-lg text-sm bg-background resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}