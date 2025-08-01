/**
 * Comprehensive Error Handling and Quality Assessment
 * 
 * Provides robust error handling, quality assessment, and recovery
 * mechanisms for the modular data processing system.
 */

import { DataTypeIdentifier, SubstrateOutput } from './types';
import type { ProcessingResult } from './UniversalContentProcessor';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ProcessingError {
  id: string;
  type: 'input_validation' | 'processor_failure' | 'timeout' | 'quality_threshold' | 'system_error';
  severity: ErrorSeverity;
  message: string;
  details?: any;
  processorType?: DataTypeIdentifier;
  input?: any;
  timestamp: string;
  recoverable: boolean;
  recoveryStrategy?: string;
}

export interface QualityAssessment {
  overall: number; // 0-1 score
  factors: {
    extractionQuality: number;
    contentIntegrity: number;
    structureDetection: number;
    processingSpeed: number;
    errorRate: number;
  };
  issues: Array<{
    type: string;
    severity: ErrorSeverity;
    description: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export class ProcessingErrorHandler {
  private errors: ProcessingError[] = [];
  private errorCount = new Map<string, number>();

  /**
   * Handle a processing error with automatic recovery strategies
   */
  handleError(
    error: Error,
    context: {
      processorType?: DataTypeIdentifier;
      input?: any;
      operation?: string;
    }
  ): ProcessingError {
    const processingError: ProcessingError = {
      id: this.generateErrorId(),
      type: this.classifyError(error, context),
      severity: this.assessSeverity(error, context),
      message: error.message,
      details: {
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      },
      processorType: context.processorType,
      input: this.sanitizeInput(context.input),
      timestamp: new Date().toISOString(),
      recoverable: this.isRecoverable(error, context),
      recoveryStrategy: this.suggestRecoveryStrategy(error, context)
    };

    this.errors.push(processingError);
    this.updateErrorCount(processingError.type);

    // Log based on severity
    if (processingError.severity === ErrorSeverity.CRITICAL) {
      console.error('CRITICAL Processing Error:', processingError);
    } else if (processingError.severity === ErrorSeverity.HIGH) {
      console.error('HIGH Processing Error:', processingError);
    } else {
      console.warn('Processing Error:', processingError);
    }

    return processingError;
  }

  /**
   * Assess the quality of processing results
   */
  assessQuality(results: ProcessingResult): QualityAssessment {
    if (!results.success || !results.results) {
      return this.createFailedQualityAssessment(results.errors || []);
    }

    const { results: substrates, processingStats } = results;
    
    // Calculate quality factors
    const extractionQuality = substrates.metadata.averageQuality;
    const contentIntegrity = this.assessContentIntegrity(substrates);
    const structureDetection = this.assessStructureDetection(substrates);
    const processingSpeed = this.assessProcessingSpeed(processingStats);
    const errorRate = this.calculateErrorRate(results);

    const overall = (
      extractionQuality * 0.3 +
      contentIntegrity * 0.25 +
      structureDetection * 0.2 +
      processingSpeed * 0.15 +
      (1 - errorRate) * 0.1
    );

    // Identify issues and recommendations
    const issues = this.identifyQualityIssues({
      extractionQuality,
      contentIntegrity,
      structureDetection,
      processingSpeed,
      errorRate
    });

    const recommendations = this.generateQualityRecommendations(issues, substrates);

    return {
      overall: Math.max(0, Math.min(1, overall)),
      factors: {
        extractionQuality,
        contentIntegrity,
        structureDetection,
        processingSpeed,
        errorRate
      },
      issues,
      recommendations
    };
  }

  /**
   * Attempt automatic recovery from processing errors
   */
  async attemptRecovery(
    error: ProcessingError,
    originalInput: any,
    processorCallback: (input: any) => Promise<SubstrateOutput>
  ): Promise<SubstrateOutput | null> {
    if (!error.recoverable) {
      return null;
    }

    try {
      switch (error.recoveryStrategy) {
        case 'retry_with_timeout':
          return await this.retryWithTimeout(originalInput, processorCallback, 10000);
        
        case 'fallback_text_extraction':
          return await this.fallbackTextExtraction(originalInput);
        
        case 'partial_processing':
          return await this.partialProcessing(originalInput, processorCallback);
        
        case 'quality_reduction':
          return await this.processWithReducedQuality(originalInput, processorCallback);
        
        default:
          return null;
      }
    } catch (recoveryError) {
      console.warn('Recovery failed:', recoveryError);
      return null;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ProcessingError[];
    errorRate: number;
  } {
    const errorsBySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    this.errors.forEach(error => {
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType: Object.fromEntries(this.errorCount),
      errorsBySeverity,
      recentErrors: this.errors.slice(-10),
      errorRate: this.errors.length / Math.max(1, this.getProcessingAttempts())
    };
  }

  // Private methods

  private classifyError(error: Error, context: any): ProcessingError['type'] {
    if (error.message.includes('timeout')) return 'timeout';
    if (error.message.includes('validation')) return 'input_validation';
    if (error.message.includes('quality') || error.message.includes('threshold')) return 'quality_threshold';
    if (context.processorType) return 'processor_failure';
    return 'system_error';
  }

  private assessSeverity(error: Error, context: any): ErrorSeverity {
    if (error.message.includes('CRITICAL') || error.name === 'TypeError') return ErrorSeverity.CRITICAL;
    if (error.message.includes('timeout') || error.message.includes('memory')) return ErrorSeverity.HIGH;
    if (error.message.includes('quality') || error.message.includes('validation')) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private isRecoverable(error: Error, context: any): boolean {
    const unrecoverablePatterns = ['out of memory', 'access denied', 'file not found'];
    return !unrecoverablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private suggestRecoveryStrategy(error: Error, context: any): string {
    if (error.message.includes('timeout')) return 'retry_with_timeout';
    if (context.processorType === DataTypeIdentifier.PDF_DOCUMENT) return 'fallback_text_extraction';
    if (error.message.includes('quality')) return 'quality_reduction';
    if (error.message.includes('partial')) return 'partial_processing';
    return 'retry_with_timeout';
  }

  private assessContentIntegrity(substrates: any): number {
    let totalIntegrity = 0;
    let count = 0;

    for (const component of substrates.components) {
      const contentLength = component.content.raw.length;
      const structuralElements = component.analysis.structure.length;
      
      // Assess based on content preservation and structure
      const integrity = Math.min(1, (contentLength / 100) * 0.7 + (structuralElements / 5) * 0.3);
      totalIntegrity += integrity;
      count++;
    }

    return count > 0 ? totalIntegrity / count : 0;
  }

  private assessStructureDetection(substrates: any): number {
    let totalStructure = 0;
    let count = 0;

    for (const component of substrates.components) {
      const structureScore = Math.min(1, component.analysis.structure.length / 10);
      totalStructure += structureScore;
      count++;
    }

    return count > 0 ? totalStructure / count : 0;
  }

  private assessProcessingSpeed(stats: any): number {
    const avgTimePerInput = stats.totalProcessingTime / stats.totalInputs;
    // Good performance: < 2s per input, Poor: > 10s per input
    return Math.max(0, Math.min(1, (10000 - avgTimePerInput) / 8000));
  }

  private calculateErrorRate(results: ProcessingResult): number {
    const totalInputs = results.processingStats.totalInputs;
    const errors = results.errors?.length || 0;
    return totalInputs > 0 ? errors / totalInputs : 0;
  }

  private identifyQualityIssues(factors: QualityAssessment['factors']): QualityAssessment['issues'] {
    const issues = [];

    if (factors.extractionQuality < 0.7) {
      issues.push({
        type: 'low_extraction_quality',
        severity: ErrorSeverity.MEDIUM,
        description: 'Content extraction quality is below optimal levels',
        recommendation: 'Consider using different processing parameters or checking input quality'
      });
    }

    if (factors.processingSpeed < 0.5) {
      issues.push({
        type: 'slow_processing',
        severity: ErrorSeverity.LOW,
        description: 'Processing is slower than expected',
        recommendation: 'Consider optimizing input size or using faster processing options'
      });
    }

    if (factors.errorRate > 0.2) {
      issues.push({
        type: 'high_error_rate',
        severity: ErrorSeverity.HIGH,
        description: 'High rate of processing errors detected',
        recommendation: 'Review input validation and error handling procedures'
      });
    }

    return issues;
  }

  private generateQualityRecommendations(issues: any[], substrates: any): string[] {
    const recommendations = [];

    if (issues.some(i => i.type === 'low_extraction_quality')) {
      recommendations.push('Verify input file quality and format compatibility');
    }

    if (substrates.metadata.averageQuality < 0.8) {
      recommendations.push('Consider pre-processing inputs for better quality');
    }

    if (issues.some(i => i.type === 'slow_processing')) {
      recommendations.push('Reduce input size or enable faster processing modes');
    }

    return recommendations;
  }

  private async retryWithTimeout(input: any, processor: Function, timeout: number): Promise<SubstrateOutput | null> {
    return Promise.race([
      processor(input),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Retry timeout')), timeout)
      )
    ]);
  }

  private async fallbackTextExtraction(input: any): Promise<SubstrateOutput | null> {
    // Implement basic text extraction as fallback
    return null; // Placeholder
  }

  private async partialProcessing(input: any, processor: Function): Promise<SubstrateOutput | null> {
    // Implement partial processing logic
    return null; // Placeholder
  }

  private async processWithReducedQuality(input: any, processor: Function): Promise<SubstrateOutput | null> {
    // Implement reduced quality processing
    return null; // Placeholder
  }

  private createFailedQualityAssessment(errors: any[]): QualityAssessment {
    return {
      overall: 0.1,
      factors: {
        extractionQuality: 0,
        contentIntegrity: 0,
        structureDetection: 0,
        processingSpeed: 0,
        errorRate: 1
      },
      issues: [{
        type: 'processing_failure',
        severity: ErrorSeverity.CRITICAL,
        description: 'Processing failed completely',
        recommendation: 'Check input validity and processor configuration'
      }],
      recommendations: ['Verify input format and content', 'Check processor system status']
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeInput(input: any): any {
    if (!input) return null;
    if (typeof input === 'string') return input.substring(0, 100) + '...';
    if (input instanceof File) return { name: input.name, size: input.size, type: input.type };
    return 'sanitized_input';
  }

  private updateErrorCount(errorType: string): void {
    this.errorCount.set(errorType, (this.errorCount.get(errorType) || 0) + 1);
  }

  private getProcessingAttempts(): number {
    // This would be tracked separately in a real implementation
    return Math.max(10, this.errors.length * 2);
  }
}

// Global error handler instance
export const processingErrorHandler = new ProcessingErrorHandler();