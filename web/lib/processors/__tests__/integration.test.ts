/**
 * Integration Tests
 * 
 * End-to-end tests for the complete modular data processing system
 * including real-world scenarios and complex workflows.
 */

import { 
  processContent, 
  processInputs,
  canProcessInput,
  getProcessorInfo,
  getSupportedTypes,
  getRegistryStats,
  dataTypeRegistry,
  universalProcessor
} from '../index';
import { DataTypeIdentifier } from '../types';

describe('Modular Data Processing System Integration', () => {
  
  describe('System initialization', () => {
    test('initializes with expected processors', () => {
      const supportedTypes = getSupportedTypes();
      
      expect(supportedTypes).toContain(DataTypeIdentifier.TEXT);
      expect(supportedTypes).toContain(DataTypeIdentifier.PDF_DOCUMENT);
      expect(supportedTypes.length).toBeGreaterThanOrEqual(2);
    });

    test('provides processor information', () => {
      const info = getProcessorInfo();
      
      expect(info.length).toBeGreaterThanOrEqual(2);
      expect(info.some(p => p.type === DataTypeIdentifier.TEXT)).toBe(true);
      expect(info.some(p => p.type === DataTypeIdentifier.PDF_DOCUMENT)).toBe(true);
    });

    test('reports system statistics', () => {
      const stats = getRegistryStats();
      
      expect(stats.totalProcessors).toBeGreaterThanOrEqual(2);
      expect(stats.totalCapabilities).toBeGreaterThan(0);
      expect(stats.avgCapabilitiesPerProcessor).toBeGreaterThan(0);
    });
  });

  describe('Real-world content processing', () => {
    test('processes business document scenario', async () => {
      const businessContent = {
        text: `Business Strategy Document
        
Our company is developing a comprehensive business strategy focused on:
- Customer experience improvement
- Product development acceleration  
- Market expansion through technology
- Data-driven decision making

The strategic approach includes:
1. Market analysis and competitive positioning
2. Technology platform modernization
3. Customer feedback integration
4. Performance metrics and analytics

Key success factors:
- Cross-functional collaboration
- Agile development methodologies
- Customer-centric design thinking
- Continuous improvement processes`,
        files: [] as File[]
      };

      const result = await processContent(businessContent);
      
      expect(result.success).toBe(true);
      expect(result.results!.cohesive.themes).toContain('business-strategy');
      expect(result.results!.cohesive.themes).toContain('product-development');
      expect(result.results!.cohesive.themes).toContain('customer-experience');
      
      // Should detect structured content
      const structuredPattern = result.results!.cohesive.patterns.find(
        p => p.pattern_type === 'well_structured'
      );
      expect(structuredPattern).toBeDefined();
      
      // Should have high confidence due to comprehensive content
      expect(result.results!.cohesive.confidence).toBeGreaterThan(0.7);
    });

    test('processes technical documentation scenario', async () => {
      const technicalContent = `# System Architecture Documentation

## Overview
This document describes the modular data processing architecture implemented for intelligent content analysis.

## Core Components

### Data Type Processors
Each processor implements the DataTypeProcessor interface:
- TextProcessor: Handles plain text and structured documents
- PDFProcessor: Extracts content from PDF files
- Future processors: Image, Audio, Video

### Processing Pipeline
1. Input validation and type detection
2. Processor selection and execution
3. Quality assessment and error handling
4. Cohesive interpretation generation

## Implementation Details

### Error Handling
The system includes comprehensive error handling:
- Automatic recovery strategies
- Quality assessment metrics
- Graceful degradation

### Performance Considerations
- Parallel processing support
- Timeout handling
- Memory management`;

      const result = await processInputs([technicalContent]);
      
      expect(result.success).toBe(true);
      expect(result.results!.cohesive.themes).toContain('technology-implementation');
      
      // Should detect technical documentation patterns
      const comprehensivePattern = result.results!.cohesive.patterns.find(
        p => p.pattern_type === 'comprehensive_content'
      );
      expect(comprehensivePattern).toBeDefined();
      
      // Should detect structured content with headings
      const structuredPattern = result.results!.cohesive.patterns.find(
        p => p.pattern_type === 'well_structured'
      );
      expect(structuredPattern).toBeDefined();
    });

    test('processes mixed content scenario', async () => {
      const projectOverview = 'Project overview: Building a universal content processing system';
      const requirements = `Requirements:
1. Support multiple file types
2. Provide real-time processing
3. Include quality assessment
4. Enable error recovery`;
      
      const mockPdfFile = new File(
        ['Technical specifications and detailed implementation guidelines'],
        'specs.pdf',
        { type: 'application/pdf' }
      );

      const result = await processContent({
        text: [projectOverview, requirements].join('\n\n'),
        files: [mockPdfFile]
      });
      
      expect(result.success).toBe(true);
      expect(result.results!.components.length).toBeGreaterThanOrEqual(2);
      
      // Should detect multi-modal content
      const multiModalPattern = result.results!.cohesive.patterns.find(
        p => p.pattern_type === 'multi_modal_content'
      );
      expect(multiModalPattern).toBeDefined();
      
      // Should have comprehensive themes from multiple sources
      expect(result.results!.cohesive.themes.length).toBeGreaterThan(2);
    });
  });

  describe('Input compatibility', () => {
    test('correctly identifies processable inputs', () => {
      expect(canProcessInput('Text content')).toBe(true);
      expect(canProcessInput(new File(['content'], 'doc.pdf', { type: 'application/pdf' }))).toBe(true);
      expect(canProcessInput(123)).toBe(false);
      expect(canProcessInput(null)).toBe(false);
      expect(canProcessInput({})).toBe(false);
    });

    test('handles edge case inputs', () => {
      expect(canProcessInput('')).toBe(false); // Empty string
      expect(canProcessInput('   ')).toBe(false); // Whitespace only
      expect(canProcessInput(new File([], 'empty.txt', { type: 'text/plain' }))).toBe(true);
    });
  });

  describe('Quality and performance', () => {
    test('maintains quality across different content types', async () => {
      const highQualityText = `Comprehensive Analysis Report

Executive Summary
This report provides a detailed analysis of our current market position and strategic recommendations for future growth.

Market Analysis
Our analysis reveals significant opportunities in the technology sector, particularly in areas of:
- Cloud computing services
- Data analytics platforms
- Customer experience optimization
- Digital transformation consulting

Strategic Recommendations
Based on our findings, we recommend:
1. Immediate investment in cloud infrastructure
2. Development of advanced analytics capabilities
3. Customer experience improvement initiatives
4. Strategic partnerships with technology providers

Implementation Timeline
Phase 1 (Q1-Q2): Infrastructure development
Phase 2 (Q3): Analytics platform deployment
Phase 3 (Q4): Customer experience rollout

Success Metrics
- Revenue growth: 25% year-over-year
- Customer satisfaction: >90%
- Market share: Top 3 in segment
- Technology adoption: 100% cloud migration`;

      const result = await processInputs([highQualityText]);
      
      expect(result.success).toBe(true);
      expect(result.qualityAssessment!.overall).toBeGreaterThan(0.8);
      expect(result.qualityAssessment!.factors.extractionQuality).toBeGreaterThan(0.9);
      expect(result.qualityAssessment!.factors.contentIntegrity).toBeGreaterThan(0.8);
      expect(result.qualityAssessment!.factors.structureDetection).toBeGreaterThan(0.7);
    });

    test('handles large content efficiently', async () => {
      const largeContent = 'This is a large document with extensive content. '.repeat(1000);
      
      const startTime = performance.now();
      const result = await processInputs([largeContent]);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should process within 10 seconds
      expect(result.results!.components[0].content.metadata.wordCount).toBeGreaterThan(8000);
    });

    test('provides meaningful quality recommendations', async () => {
      const lowQualityContent = 'Short text.';
      
      const result = await processInputs([lowQualityContent]);
      
      expect(result.qualityAssessment!.recommendations.length).toBeGreaterThan(0);
      expect(result.qualityAssessment!.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Error resilience', () => {
    test('gracefully handles processor failures', async () => {
      // Simulate a scenario where one processor might fail
      const validContent = 'This content should process successfully';
      const problematicFile = new File([''], 'problematic.pdf', { type: 'application/pdf' });
      
      // Mock the PDF processor to fail
      const originalPdfProcessor = dataTypeRegistry.getProcessor(DataTypeIdentifier.PDF_DOCUMENT);
      if (originalPdfProcessor) {
        const mockFailingProcessor = {
          ...originalPdfProcessor,
          process: jest.fn().mockRejectedValue(new Error('Simulated processing failure'))
        };
        dataTypeRegistry.register(mockFailingProcessor as any);
      }
      
      const result = await processContent({
        text: validContent,
        files: [problematicFile]
      });
      
      // Should succeed with partial results
      expect(result.processingStats.successfullyProcessed).toBe(1);
      expect(result.errors?.length).toBe(1);
      
      // Restore original processor
      if (originalPdfProcessor) {
        dataTypeRegistry.register(originalPdfProcessor);
      }
    });

    test('provides comprehensive error reporting', async () => {
      const unsupportedInputs = [123, null, { invalid: 'data' }];
      
      const result = await processInputs(unsupportedInputs as any);
      
      expect(result.success).toBe(false);
      expect(result.errors!.length).toBe(3);
      expect(result.errorStats).toBeDefined();
    });
  });

  describe('Development utilities', () => {
    test('provides development environment utilities', () => {
      if (process.env.NODE_ENV === 'development') {
        expect((globalThis as any).__dataTypeRegistry).toBeDefined();
        expect((globalThis as any).__universalProcessor).toBeDefined();
      }
    });

    test('allows runtime processor inspection', () => {
      const capabilities = universalProcessor.getProcessingCapabilities();
      
      for (const [type, caps] of capabilities) {
        expect(type).toBeDefined();
        expect(caps).toBeInstanceOf(Array);
        expect(caps.length).toBeGreaterThan(0);
        
        caps.forEach(cap => {
          expect(cap.name).toBeDefined();
          expect(cap.description).toBeDefined();
          expect(['basic', 'good', 'excellent']).toContain(cap.quality);
        });
      }
    });
  });

  describe('Future extensibility', () => {
    test('system supports adding new processor types', () => {
      const initialTypes = getSupportedTypes();
      const initialCount = initialTypes.length;
      
      // Mock adding a new processor type
      const mockImageProcessor = {
        type: DataTypeIdentifier.IMAGE,
        supportedFormats: ['image/jpeg', 'image/png'],
        processingCapabilities: [
          { name: 'ocr', description: 'OCR text extraction', quality: 'good' as const }
        ],
        canProcess: (input: unknown) => input instanceof File && input.type.startsWith('image/'),
        process: async () => ({} as any),
        getProcessingInfo: () => ({
          version: '1.0.0',
          author: 'Test',
          description: 'Mock image processor',
          lastUpdated: '2025-01-01'
        })
      };
      
      dataTypeRegistry.register(mockImageProcessor as any);
      
      const newTypes = getSupportedTypes();
      expect(newTypes.length).toBe(initialCount + 1);
      expect(newTypes).toContain(DataTypeIdentifier.IMAGE);
      
      // Clean up
      dataTypeRegistry.unregister(DataTypeIdentifier.IMAGE);
    });

    test('new processors integrate seamlessly', async () => {
      // This test verifies that the architecture supports extension
      const mockProcessor = {
        type: 'mock_type' as DataTypeIdentifier,
        supportedFormats: ['application/mock'],
        processingCapabilities: [
          { name: 'mock_processing', description: 'Mock processing', quality: 'excellent' as const }
        ],
        canProcess: (input: unknown) => typeof input === 'number',
        process: async (input: number) => ({
          content: {
            raw: `Processed number: ${input}`,
            structured: { metadata: {} },
            metadata: { originalValue: input }
          },
          analysis: {
            themes: ['number-processing'],
            patterns: [],
            structure: [],
            confidence: 0.9
          },
          processing: {
            processorType: 'mock_type' as DataTypeIdentifier,
            processingTime: 10,
            extractionQuality: 0.95
          }
        }),
        getProcessingInfo: () => ({
          version: '1.0.0',
          author: 'Test',
          description: 'Mock number processor',
          lastUpdated: '2025-01-01'
        })
      };
      
      dataTypeRegistry.register(mockProcessor as any);
      
      const result = await processInputs([42] as any);
      
      expect(result.success).toBe(true);
      expect(result.results!.components[0].content.raw).toContain('42');
      
      // Clean up
      dataTypeRegistry.unregister('mock_type' as DataTypeIdentifier);
    });
  });
});