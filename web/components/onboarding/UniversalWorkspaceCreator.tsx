"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UniversalContentInput from './UniversalContentInput';
import LiveIntelligencePreview from './LiveIntelligencePreview';
import WorkspaceCreationTrigger from './WorkspaceCreationTrigger';
import { useUniversalIntelligence, ContentInput, WorkspaceCreationResult } from '@/lib/intelligence/useUniversalIntelligence';
import { cn } from '@/lib/utils';

interface UniversalWorkspaceCreatorProps {
  onWorkspaceCreated?: (basketId: string) => void;
  className?: string;
}

export default function UniversalWorkspaceCreator({
  onWorkspaceCreated,
  className
}: UniversalWorkspaceCreatorProps) {
  const router = useRouter();
  const [inputs, setInputs] = useState<ContentInput[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [creationResult, setCreationResult] = useState<WorkspaceCreationResult | null>(null);
  
  const {
    processContent,
    createWorkspace,
    isProcessing,
    processingResult,
    error,
    reset
  } = useUniversalIntelligence();

  // Process content when inputs change (with debouncing)
  useEffect(() => {
    if (inputs.length === 0) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      await processContent(inputs, 'onboarding');
    }, 1500); // 1.5 second debounce for live processing

    return () => clearTimeout(timeoutId);
  }, [inputs, processContent]);

  const handleCreateWorkspace = async (modifications?: any) => {
    if (!processingResult) return null;

    setIsCreatingWorkspace(true);
    
    try {
      const result = await createWorkspace(
        processingResult.intelligence,
        processingResult.suggested_structure,
        modifications
      );
      
      if (result) {
        setCreationResult(result);
        
        // Redirect after showing success
        setTimeout(() => {
          const basketId = result.basket.id;
          if (onWorkspaceCreated) {
            onWorkspaceCreated(basketId);
          } else {
            router.push(`/baskets/${basketId}/work`);
          }
        }, 3000);
      }
      
      return result;
    } catch (err) {
      console.error('Workspace creation failed:', err);
      return null;
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleReset = () => {
    setInputs([]);
    setCreationResult(null);
    setIsCreatingWorkspace(false);
    reset();
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm font-medium text-red-800">Processing Error</span>
          </div>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:text-red-800 underline mt-2"
          >
            Reset and try again
          </button>
        </div>
      )}

      {/* Content Input Section */}
      {!creationResult && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Add Your Content</h2>
            <p className="text-muted-foreground">
              Share your ideas, documents, or requirements. Our AI will analyze them 
              and create an intelligent workspace tailored to your needs.
            </p>
          </div>
          
          <UniversalContentInput
            inputs={inputs}
            onInputsChange={setInputs}
            disabled={isCreatingWorkspace}
          />
        </div>
      )}

      {/* Live Intelligence Preview */}
      {!creationResult && (
        <LiveIntelligencePreview
          processingResult={processingResult}
          isProcessing={isProcessing}
          hasContent={inputs.length > 0}
        />
      )}

      {/* Workspace Creation */}
      <WorkspaceCreationTrigger
        processingResult={processingResult}
        onCreateWorkspace={handleCreateWorkspace}
        isCreating={isCreatingWorkspace}
        creationResult={creationResult}
        disabled={isProcessing || !!error}
      />

      {/* Help Text */}
      {!creationResult && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Add multiple sources (files, text, URLs) for richer workspace intelligence
          </p>
        </div>
      )}

      {/* Reset Option (shown after creation) */}
      {creationResult && (
        <div className="text-center pt-4 border-t">
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Create another workspace
          </button>
        </div>
      )}
    </div>
  );
}