/**
 * Enhanced Universal Intelligence Hook
 * 
 * Integrates the new modular data processor system with the existing
 * intelligence processing pipeline. Provides backward compatibility
 * while leveraging advanced processing capabilities.
 */

"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { processContent, DataTypeIdentifier } from '@/lib/processors';
import type { ProcessingResult } from '@/lib/processors';
import type { ContentInput, IntelligenceResult, ProcessingResponse, BasketInitializationResult } from './useUniversalIntelligence';

export interface EnhancedContentInput extends ContentInput {
  // Add processor-specific metadata
  processorType?: DataTypeIdentifier;
  fileObject?: File; // For binary files like PDFs
  processingQuality?: number;
  extractedMetadata?: Record<string, any>;
}

export interface EnhancedProcessingResponse extends ProcessingResponse {
  // Add enhanced processing information
  processor_metadata: {
    inputTypes: DataTypeIdentifier[];
    averageQuality: number;
    totalProcessingTime: number;
    individualResults: Array<{
      type: DataTypeIdentifier;
      confidence: number;
      extractionQuality: number;
    }>;
  };
  cohesive_analysis: {
    interpretation: string;
    multiModalPatterns: Array<{
      pattern_type: string;
      description: string;
      confidence: number;
    }>;
  };
}

export function useEnhancedUniversalIntelligence() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<EnhancedProcessingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingResult['processingStats'] | null>(null);

  const processContent = async (
    inputs: EnhancedContentInput[],
    processing_intent: 'onboarding' | 'enhancement' = 'onboarding',
    workspace_context?: { basket_id?: string; existing_themes?: string[] }
  ): Promise<EnhancedProcessingResponse | null> => {
    if (!user || !inputs.length) return null;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Process content through the new modular system
      const processorResult = await processContentThroughProcessors(inputs);
      
      if (!processorResult.success) {
        throw new Error('Failed to process content through processors');
      }

      setProcessingStats(processorResult.processingStats);

      // Step 2: Convert processor results to legacy format for API compatibility
      const legacyInputs = await convertToLegacyFormat(inputs, processorResult.results!);

      // Step 3: Send to existing intelligence API for theme analysis and basket suggestions
      const response = await fetchWithToken('/api/intelligence/process-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: legacyInputs,
          workspace_context,
          processing_intent,
          // Add enhanced processing metadata
          enhanced_processing: {
            processor_results: processorResult.results,
            processing_stats: processorResult.processingStats
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process content');
      }

      const result: ProcessingResponse = await response.json();

      // Step 4: Enhance the response with processor-specific information
      const enhancedResult = enhanceWithProcessorData(result, processorResult.results!);
      
      setProcessingResult(enhancedResult);
      return enhancedResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Enhanced content processing error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const createInitialBasket = async (
    intelligence: IntelligenceResult,
    suggested_structure: {
      documents: any[];
      organization: any;
    },
    user_modifications?: {
      basket_name?: string;
      selected_documents?: string[];
      additional_context?: string;
    }
  ): Promise<BasketInitializationResult | null> => {
    if (!user) return null;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetchWithToken('/api/intelligence/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intelligence,
          suggested_structure,
          user_modifications,
          // Include enhanced processing metadata
          enhanced_metadata: processingStats
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize basket');
      }

      const { result } = await response.json();
      return result as BasketInitializationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Enhanced basket initialization error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setProcessingResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStats(null);
  };

  return {
    processContent,
    createInitialBasket,
    reset,
    isProcessing,
    processingResult,
    error,
    processingStats,
    // Computed properties for easier access
    hasResult: !!processingResult,
    themes: processingResult?.intelligence.themes || [],
    confidence: processingResult?.intelligence.confidence_score || 0,
    suggestedDocuments: processingResult?.suggested_structure.documents || [],
    basketName: processingResult?.suggested_structure.organization.suggested_name || '',
    // Enhanced properties
    processorMetadata: processingResult?.processor_metadata,
    cohesiveAnalysis: processingResult?.cohesive_analysis
  };
}

/**
 * Process content through the new modular processor system
 */
async function processContentThroughProcessors(inputs: EnhancedContentInput[]): Promise<ProcessingResult> {
  const processorInputs: Array<string | File> = [];

  for (const input of inputs) {
    if (input.fileObject) {
      // Use the actual File object for binary processing
      processorInputs.push(input.fileObject);
    } else if (input.content && input.type === 'text') {
      // Use text content directly
      processorInputs.push(input.content);
    }
  }

  return processContent({
    text: inputs.filter(i => i.type === 'text' && !i.fileObject).map(i => i.content).join('\n\n'),
    files: inputs.filter(i => i.fileObject).map(i => i.fileObject!)
  });
}

/**
 * Convert processor results to legacy ContentInput format for API compatibility
 */
async function convertToLegacyFormat(
  originalInputs: EnhancedContentInput[],
  processorResults: any
): Promise<ContentInput[]> {
  const legacyInputs: ContentInput[] = [];

  // Convert processor results back to legacy format
  if (processorResults.components) {
    for (let i = 0; i < processorResults.components.length; i++) {
      const component = processorResults.components[i];
      const originalInput = originalInputs[i];

      legacyInputs.push({
        type: originalInput?.type || 'text',
        content: component.content.raw,
        metadata: {
          ...originalInput?.metadata,
          // Add processor-generated metadata
          processingQuality: component.processing.extractionQuality,
          processorType: component.processing.processorType,
          extractedThemes: component.analysis.themes,
          structureElements: component.analysis.structure.length,
          confidence: component.analysis.confidence
        }
      });
    }
  } else {
    // Fallback to original inputs if processing failed
    legacyInputs.push(...originalInputs.map(input => ({
      type: input.type,
      content: input.content,
      metadata: input.metadata
    })));
  }

  return legacyInputs;
}

/**
 * Enhance the API response with processor-specific data
 */
function enhanceWithProcessorData(
  apiResult: ProcessingResponse,
  processorResults: any
): EnhancedProcessingResponse {
  return {
    ...apiResult,
    processor_metadata: {
      inputTypes: processorResults.metadata.inputTypes,
      averageQuality: processorResults.metadata.averageQuality,
      totalProcessingTime: processorResults.metadata.totalProcessingTime,
      individualResults: processorResults.components.map((comp: any) => ({
        type: comp.processing.processorType,
        confidence: comp.analysis.confidence,
        extractionQuality: comp.processing.extractionQuality
      }))
    },
    cohesive_analysis: {
      interpretation: processorResults.cohesive.interpretation,
      multiModalPatterns: processorResults.cohesive.patterns.filter((p: any) => 
        p.pattern_type.includes('multi') || p.pattern_type.includes('cross')
      )
    }
  };
}