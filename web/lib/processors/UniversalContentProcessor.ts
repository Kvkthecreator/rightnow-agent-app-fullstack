/**
 * Universal Content Processor
 * 
 * Main orchestrator for processing multiple types of content through
 * the modular processor system. Handles mixed content (text + files),
 * combines results into cohesive interpretations, and provides the
 * main interface for the intelligence system.
 */

import { DataTypeIdentifier } from './types';
import type {
  SubstrateOutput,
  CohesiveSubstrateOutput,
  PatternData,
  StructuralElement
} from './types';
import { DataTypeRegistry } from './DataTypeRegistry';
import { processingErrorHandler } from './ErrorHandler';
import type { QualityAssessment } from './ErrorHandler';

export interface ProcessingOptions {
  // Individual processor options
  textOptions?: {
    enhancedStructure?: boolean;
    languageDetection?: boolean;
  };
  pdfOptions?: {
    extractMetadata?: boolean;
    preserveFormatting?: boolean;
  };
  
  // Global processing options
  combineThemes?: boolean;
  confidenceThreshold?: number;
  maxProcessingTime?: number;
}

export interface ProcessingResult {
  success: boolean;
  results?: CohesiveSubstrateOutput;
  errors?: Array<{
    input: any;
    error: string;
    processorType?: DataTypeIdentifier;
  }>;
  processingStats: {
    totalInputs: number;
    successfullyProcessed: number;
    totalProcessingTime: number;
    averageQuality: number;
  };
  qualityAssessment?: QualityAssessment;
  errorStats?: any;
}

export class UniversalContentProcessor {
  constructor(private registry: DataTypeRegistry) {}
  
  /**
   * Process multiple individual inputs
   */
  async processMultipleInputs(
    inputs: Array<string | File>, 
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    const results: SubstrateOutput[] = [];
    const errors: Array<{input: any; error: string; processorType?: DataTypeIdentifier}> = [];

    for (const input of inputs) {
      try {
        const processor = this.registry.findProcessorForInput(input);
        if (!processor) {
          errors.push({
            input: this.getInputDescription(input),
            error: 'No compatible processor found',
          });
          continue;
        }
        
        // Apply processing timeout if specified
        const processingPromise = processor.process(input);
        const result = options.maxProcessingTime
          ? await this.withTimeout(processingPromise, options.maxProcessingTime)
          : await processingPromise;
        
        // Apply confidence threshold filtering
        if (!options.confidenceThreshold || result.analysis.confidence >= options.confidenceThreshold) {
          results.push(result);
        } else {
          errors.push({
            input: this.getInputDescription(input),
            error: `Confidence ${result.analysis.confidence} below threshold ${options.confidenceThreshold}`,
            processorType: processor.type
          });
        }
        
      } catch (error) {
        const processor = this.registry.findProcessorForInput(input);
        
        // Use error handler for comprehensive error processing
        const processingError = processingErrorHandler.handleError(
          error instanceof Error ? error : new Error('Unknown processing error'),
          {
            processorType: processor?.type,
            input,
            operation: 'content_processing'
          }
        );

        // Attempt recovery if possible
        if (processingError.recoverable && processor) {
          try {
            const recoveredResult = await processingErrorHandler.attemptRecovery(
              processingError,
              input,
              processor.process.bind(processor)
            );
            
            if (recoveredResult) {
              results.push(recoveredResult);
              continue;
            }
          } catch (recoveryError) {
            console.warn('Recovery failed for input:', this.getInputDescription(input));
          }
        }

        errors.push({
          input: this.getInputDescription(input),
          error: processingError.message,
          processorType: processor?.type
        });
      }
    }
    
    const totalProcessingTime = performance.now() - startTime;
    
    // Create processing stats
    const processingStats = {
      totalInputs: inputs.length,
      successfullyProcessed: results.length,
      totalProcessingTime,
      averageQuality: results.length > 0 
        ? results.reduce((sum, r) => sum + r.processing.extractionQuality, 0) / results.length
        : 0
    };

    // Create processing result object
    const processingResult: ProcessingResult = {
      success: results.length > 0,
      processingStats,
      errors: errors.length > 0 ? errors : undefined
    };

    if (results.length === 0) {
      processingResult.qualityAssessment = processingErrorHandler.assessQuality(processingResult);
      processingResult.errorStats = processingErrorHandler.getErrorStats();
      return processingResult;
    }

    // Create cohesive interpretation
    const cohesiveResult = this.createCohesiveInterpretation(results, options);
    processingResult.results = cohesiveResult;
    
    // Assess quality and add error statistics
    processingResult.qualityAssessment = processingErrorHandler.assessQuality(processingResult);
    processingResult.errorStats = processingErrorHandler.getErrorStats();
    
    return processingResult;
  }
  
  /**
   * Process mixed content (text and files together)
   */
  async processMixedContent(content: {
    text?: string;
    files?: File[];
  }, options: ProcessingOptions = {}): Promise<ProcessingResult> {
    const allInputs: Array<string | File> = [];
    
    if (content.text && content.text.trim()) {
      allInputs.push(content.text);
    }
    
    if (content.files && content.files.length > 0) {
      allInputs.push(...content.files);
    }
    
    if (allInputs.length === 0) {
      return {
        success: false,
        errors: [{ input: 'mixed_content', error: 'No valid input provided' }],
        processingStats: {
          totalInputs: 0,
          successfullyProcessed: 0,
          totalProcessingTime: 0,
          averageQuality: 0
        }
      };
    }
    
    return this.processMultipleInputs(allInputs, options);
  }
  
  /**
   * Process content with intelligent type detection
   */
  async processWithAutoDetection(
    inputs: unknown[],
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const validInputs: Array<string | File> = [];
    const invalidInputs = [];
    
    for (const input of inputs) {
      if (this.registry.canProcessInput(input)) {
        validInputs.push(input as string | File);
      } else {
        invalidInputs.push(input);
      }
    }
    
    // Process valid inputs
    const result = await this.processMultipleInputs(validInputs, options);
    
    // Add errors for invalid inputs
    if (invalidInputs.length > 0) {
      const invalidErrors = invalidInputs.map(input => ({
        input: this.getInputDescription(input),
        error: 'Input type not supported by any registered processor'
      }));
      
      result.errors = [...(result.errors || []), ...invalidErrors];
    }
    
    return result;
  }
  
  /**
   * Create cohesive interpretation from multiple substrate outputs
   */
  private createCohesiveInterpretation(
    results: SubstrateOutput[], 
    options: ProcessingOptions
  ): CohesiveSubstrateOutput {
    // Combine themes from all results
    const combinedThemes = options.combineThemes !== false 
      ? this.mergeThemes(results.map(r => r.analysis.themes))
      : results.flatMap(r => r.analysis.themes);
    
    // Combine patterns
    const combinedPatterns = this.mergePatterns(results.map(r => r.analysis.patterns));
    
    // Combine structural elements
    const combinedStructure = this.mergeStructure(results.map(r => r.analysis.structure));
    
    // Calculate cohesive confidence
    const cohesiveConfidence = this.calculateCohesiveConfidence(results);
    
    // Generate interpretation summary
    const interpretation = this.generateCohesiveInterpretation(
      combinedThemes, 
      combinedPatterns, 
      results
    );

    return {
      components: results,
      cohesive: {
        themes: combinedThemes,
        patterns: combinedPatterns,
        structure: combinedStructure,
        confidence: cohesiveConfidence,
        interpretation
      },
      metadata: {
        inputTypes: results.map(r => r.processing.processorType),
        totalProcessingTime: results.reduce((sum, r) => sum + r.processing.processingTime, 0),
        averageQuality: results.reduce((sum, r) => sum + r.processing.extractionQuality, 0) / results.length
      }
    };
  }
  
  private mergeThemes(themeArrays: string[][]): string[] {
    const themeCount = new Map<string, number>();
    
    // Count theme occurrences across all results
    for (const themes of themeArrays) {
      for (const theme of themes) {
        themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
      }
    }
    
    // Return themes sorted by frequency, with a reasonable limit
    return Array.from(themeCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([theme]) => theme);
  }
  
  private mergePatterns(patternArrays: PatternData[][]): PatternData[] {
    const patternMap = new Map<string, PatternData>();
    
    for (const patterns of patternArrays) {
      for (const pattern of patterns) {
        const existing = patternMap.get(pattern.pattern_type);
        if (existing) {
          // Merge patterns of the same type, taking higher confidence
          patternMap.set(pattern.pattern_type, {
            ...pattern,
            confidence: Math.max(existing.confidence, pattern.confidence),
            description: existing.description + '; ' + pattern.description
          });
        } else {
          patternMap.set(pattern.pattern_type, { ...pattern });
        }
      }
    }
    
    // Add multi-modal patterns
    if (patternArrays.length > 1) {
      patternMap.set('multi_modal_content', {
        pattern_type: 'multi_modal_content',
        description: `Content from ${patternArrays.length} different sources provides comprehensive coverage`,
        confidence: 0.8
      });
    }
    
    return Array.from(patternMap.values());
  }
  
  private mergeStructure(structureArrays: StructuralElement[][]): StructuralElement[] {
    const merged: StructuralElement[] = [];
    let positionOffset = 0;
    
    for (let i = 0; i < structureArrays.length; i++) {
      const structures = structureArrays[i];
      
      for (const element of structures) {
        merged.push({
          ...element,
          position: (element.position || 0) + positionOffset,
          metadata: {
            ...element.metadata,
            sourceIndex: i
          }
        });
      }
      
      positionOffset += structures.length;
    }
    
    return merged;
  }
  
  private calculateCohesiveConfidence(results: SubstrateOutput[]): number {
    if (results.length === 0) return 0;
    
    // Base confidence from individual results
    const avgConfidence = results.reduce((sum, r) => sum + r.analysis.confidence, 0) / results.length;
    
    // Boost confidence for multiple consistent sources
    const multiSourceBoost = results.length > 1 ? 0.1 : 0;
    
    // Quality factor from extraction quality
    const avgQuality = results.reduce((sum, r) => sum + r.processing.extractionQuality, 0) / results.length;
    const qualityFactor = avgQuality * 0.1;
    
    return Math.min(avgConfidence + multiSourceBoost + qualityFactor, 0.95);
  }
  
  private generateCohesiveInterpretation(
    themes: string[], 
    patterns: PatternData[], 
    results: SubstrateOutput[]
  ): string {
    const components = [];
    
    // Describe content types
    const contentTypes = [...new Set(results.map(r => r.processing.processorType))];
    if (contentTypes.length > 1) {
      components.push(`Analysis of ${contentTypes.join(' and ')} content`);
    } else {
      components.push(`Analysis of ${contentTypes[0]} content`);
    }
    
    // Describe themes
    if (themes.length > 0) {
      components.push(`revealing ${themes.length} key themes: ${themes.slice(0, 3).join(', ')}`);
    }
    
    // Describe patterns
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.7);
    if (highConfidencePatterns.length > 0) {
      components.push(`with ${highConfidencePatterns.length} significant patterns identified`);
    }
    
    // Describe structure
    const totalStructure = results.reduce((sum, r) => sum + r.analysis.structure.length, 0);
    if (totalStructure > 5) {
      components.push(`showing well-structured organization (${totalStructure} structural elements)`);
    }
    
    return components.join(' ') + '.';
  }
  
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Processing timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  private getInputDescription(input: unknown): string {
    if (typeof input === 'string') {
      return `text (${input.length} chars)`;
    }
    if (input instanceof File) {
      return `file: ${input.name} (${input.type})`;
    }
    return `unknown input type: ${typeof input}`;
  }
  
  /**
   * Get detailed processing capabilities
   */
  getProcessingCapabilities() {
    return this.registry.getProcessingCapabilities();
  }
  
  /**
   * Get supported input types
   */
  getSupportedTypes() {
    return this.registry.getSupportedTypes();
  }
  
  /**
   * Check if specific input can be processed
   */
  canProcess(input: unknown): boolean {
    return this.registry.canProcessInput(input);
  }
}