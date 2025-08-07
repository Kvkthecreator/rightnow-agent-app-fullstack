"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UniversalContentInput from './UniversalContentInput';
import LiveIntelligencePreview from './LiveIntelligencePreview';
import BasketCreationTrigger from './BasketCreationTrigger';
import { useEnhancedUniversalIntelligence, EnhancedContentInput } from '@/lib/intelligence/useEnhancedUniversalIntelligence';
import { BasketInitializationResult } from '@/lib/intelligence/useUniversalIntelligence';
import { cn } from '@/lib/utils';

interface InitialBasketSetupProps {
  onBasketCreated?: (basketId: string) => void;
  className?: string;
  existingBasketId?: string | null;
  mode?: string | null;
}

export default function InitialBasketSetup({
  onBasketCreated,
  className,
  existingBasketId,
  mode
}: InitialBasketSetupProps) {
  const router = useRouter();
  const [inputs, setInputs] = useState<EnhancedContentInput[]>([]);
  const [isCreatingBasket, setIsCreatingBasket] = useState(false);
  const [creationResult, setCreationResult] = useState<BasketInitializationResult | null>(null);

  const {
    processContent,
    createInitialBasket,
    isProcessing,
    processingResult,
    error,
    reset,
    processingStats
  } = useEnhancedUniversalIntelligence();

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

  const handleCreateBasket = async (modifications?: any) => {
    if (!processingResult) return null;

    setIsCreatingBasket(true);

    try {
      const result = await createInitialBasket(
        processingResult.intelligence,
        processingResult.suggested_structure,
        modifications
      );

      if (result) {
        setCreationResult(result);

        // Redirect after showing success
        setTimeout(() => {
          const basketId = result.basket.id;
          if (onBasketCreated) {
            onBasketCreated(basketId);
          } else {
            router.push(`/baskets/${basketId}/work`);
          }
        }, 3000);
      }

      return result;
    } catch (err) {
      console.error('Basket creation failed:', err);
      return null;
    } finally {
      setIsCreatingBasket(false);
    }
  };

  const handleReset = () => {
    setInputs([]);
    setCreationResult(null);
    setIsCreatingBasket(false);
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
              and create a basket tailored to your needs.
            </p>
          </div>
          
          <UniversalContentInput
            inputs={inputs}
            onInputsChange={setInputs}
            disabled={isCreatingBasket}
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

      {/* Basket Creation */}
      <BasketCreationTrigger
        processingResult={processingResult}
        onCreateBasket={handleCreateBasket}
        isCreating={isCreatingBasket}
        creationResult={creationResult}
        disabled={isProcessing || !!error}
      />

      {/* Help Text */}
      {!creationResult && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Add multiple sources (files, text, URLs) for richer basket intelligence
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
            Create another basket
          </button>
        </div>
      )}
    </div>
  );
}