/**
 * Universal Content Processor Tests
 * 
 * Tests for the main orchestrator including mixed content processing,
 * error handling, quality assessment, and cohesive interpretation.
 */

import { UniversalContentProcessor } from '../UniversalContentProcessor';
import { DataTypeRegistry } from '../DataTypeRegistry';
import { TextProcessor } from '../TextProcessor';
import { DataTypeIdentifier } from '../types';

// Mock PDF processor for testing
class MockPDFProcessor {
  readonly type = DataTypeIdentifier.PDF_DOCUMENT;
  readonly supportedFormats = ['application/pdf'];
  readonly processingCapabilities = [
    { name: 'text_extraction', description: 'Extract text from PDF', quality: 'good' as const }
  ];

  canProcess(input: unknown): input is File {
    return input instanceof File && input.type === 'application/pdf';
  }

  async process(input: File) {
    return {
      content: {
        raw: `Extracted text from ${input.name}`,
        structured: { metadata: {} },
        metadata: {
          fileName: input.name,
          fileSize: input.size,
          originalFormat: 'pdf',
          wordCount: 10,
          characterCount: 50
        }
      },
      analysis: {
        themes: ['document-processing'],
        patterns: [{
          pattern_type: 'pdf_document',
          description: 'PDF document processed',
          confidence: 0.8
        }],
        structure: [],
        confidence: 0.8
      },
      processing: {
        processorType: this.type,
        processingTime: 100,
        extractionQuality: 0.85
      }
    };
  }

  getProcessingInfo() {
    return {
      version: '1.0.0',
      author: 'Test',
      description: 'Mock PDF processor',
      lastUpdated: '2025-01-01'
    };
  }
}

describe('UniversalContentProcessor', () => {
  let registry: DataTypeRegistry;
  let processor: UniversalContentProcessor;

  beforeEach(() => {
    registry = new DataTypeRegistry();
    registry.register(new TextProcessor());
    registry.register(new MockPDFProcessor());
    processor = new UniversalContentProcessor(registry);
  });

  describe('Single input processing', () => {
    test('processes text input successfully', async () => {
      const textInput = 'This is a test document with some content for analysis.';
      
      const result = await processor.processMultipleInputs([textInput]);
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results!.components).toHaveLength(1);
      expect(result.results!.components[0].content.raw).toBe(textInput);
      expect(result.processingStats.successfullyProcessed).toBe(1);
    });

    test('processes PDF file successfully', async () => {
      const pdfFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      const result = await processor.processMultipleInputs([pdfFile]);
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results!.components).toHaveLength(1);
      expect(result.results!.components[0].content.raw).toContain('Extracted text from test.pdf');
      expect(result.processingStats.successfullyProcessed).toBe(1);
    });

    test('handles unsupported input type', async () => {
      const unsupportedInput = { unknown: 'data' };
      
      const result = await processor.processMultipleInputs([unsupportedInput as any]);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('No compatible processor found');
    });
  });

  describe('Multiple input processing', () => {
    test('processes mixed content types', async () => {
      const textInput = 'This is text content';
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      
      const result = await processor.processMultipleInputs([textInput, pdfFile]);
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results!.components).toHaveLength(2);
      expect(result.results!.metadata.inputTypes).toContain(DataTypeIdentifier.TEXT);
      expect(result.results!.metadata.inputTypes).toContain(DataTypeIdentifier.PDF_DOCUMENT);
    });

    test('creates cohesive interpretation from multiple inputs', async () => {
      const businessText = 'Our business strategy focuses on customer experience and product development';
      const technicalText = 'The technology platform will use data analysis for insights';
      
      const result = await processor.processMultipleInputs([businessText, technicalText]);
      
      expect(result.success).toBe(true);
      expect(result.results!.cohesive.themes.length).toBeGreaterThan(0);
      expect(result.results!.cohesive.interpretation).toContain('Analysis');
      
      // Should detect multi-modal pattern
      const multiModalPattern = result.results!.cohesive.patterns.find(
        p => p.pattern_type === 'multi_modal_content'
      );
      expect(multiModalPattern).toBeDefined();
    });

    test('combines themes intelligently', async () => {
      const text1 = 'Business strategy and market analysis are crucial for growth';
      const text2 = 'Product development requires customer feedback and technology';
      
      const result = await processor.processMultipleInputs([text1, text2]);
      
      expect(result.success).toBe(true);
      expect(result.results!.cohesive.themes).toContain('business-strategy');
      expect(result.results!.cohesive.themes).toContain('product-development');
    });
  });

  describe('Mixed content interface', () => {
    test('processes text and files together', async () => {
      const content = {
        text: 'This is the overview text content',
        files: [new File(['pdf content'], 'details.pdf', { type: 'application/pdf' })]
      };
      
      const result = await processor.processMixedContent(content);
      
      expect(result.success).toBe(true);
      expect(result.results!.components).toHaveLength(2);
    });

    test('handles empty mixed content', async () => {
      const result = await processor.processMixedContent({});
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].error).toContain('No valid input provided');
    });

    test('ignores empty text and null files', async () => {
      const content = {
        text: '   ', // Empty text
        files: undefined
      };
      
      const result = await processor.processMixedContent(content);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Processing options', () => {
    test('applies confidence threshold filtering', async () => {
      const lowQualityText = 'x'; // Very short text should have low confidence
      
      const result = await processor.processMultipleInputs([lowQualityText], {
        confidenceThreshold: 0.8
      });
      
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors![0].error).toContain('below threshold');
    });

    test('handles processing timeout', async () => {
      // Mock a slow processor
      const slowProcessor = new TextProcessor();
      const originalProcess = slowProcessor.process;
      slowProcessor.process = jest.fn().mockImplementation(async (input) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return originalProcess.call(slowProcessor, input);
      });
      
      const slowRegistry = new DataTypeRegistry();
      slowRegistry.register(slowProcessor);
      const slowContentProcessor = new UniversalContentProcessor(slowRegistry);
      
      const result = await slowContentProcessor.processMultipleInputs(['test'], {
        maxProcessingTime: 100 // Very short timeout
      });
      
      expect(result.errors?.length).toBeGreaterThan(0);
    }, 10000);

    test('combines themes when option is enabled', async () => {
      const text1 = 'business strategy development';
      const text2 = 'business strategy implementation';
      
      const result = await processor.processMultipleInputs([text1, text2], {
        combineThemes: true
      });
      
      expect(result.success).toBe(true);
      // Themes should be deduplicated
      const businessThemes = result.results!.cohesive.themes.filter(
        theme => theme.includes('business')
      );
      expect(businessThemes.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Auto-detection interface', () => {
    test('processes valid inputs and reports invalid ones', async () => {
      const validInputs = [
        'Valid text content',
        new File(['content'], 'valid.pdf', { type: 'application/pdf' })
      ];
      const invalidInputs = [123, null, { invalid: 'object' }];
      
      const result = await processor.processWithAutoDetection([
        ...validInputs,
        ...invalidInputs
      ]);
      
      expect(result.success).toBe(true);
      expect(result.results!.components).toHaveLength(2);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Error handling and recovery', () => {
    test('continues processing after individual failures', async () => {
      // Mock a failing processor
      const failingProcessor = new TextProcessor();
      failingProcessor.process = jest.fn().mockRejectedValue(new Error('Processing failed'));
      
      const mixedRegistry = new DataTypeRegistry();
      mixedRegistry.register(failingProcessor);
      mixedRegistry.register(new MockPDFProcessor());
      
      const mixedProcessor = new UniversalContentProcessor(mixedRegistry);
      
      const inputs = [
        'This will fail',
        new File(['content'], 'this-works.pdf', { type: 'application/pdf' })
      ];
      
      const result = await mixedProcessor.processMultipleInputs(inputs);
      
      expect(result.processingStats.successfullyProcessed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    test('provides quality assessment for failed processing', async () => {
      const failingRegistry = new DataTypeRegistry();
      const failingProcessor = new UniversalContentProcessor(failingRegistry);
      
      const result = await failingProcessor.processMultipleInputs(['test']);
      
      expect(result.success).toBe(false);
      expect(result.qualityAssessment).toBeDefined();
      expect(result.qualityAssessment!.overall).toBeLessThan(0.5);
    });

    test('includes error statistics in results', async () => {
      const result = await processor.processMultipleInputs([]);
      
      expect(result.errorStats).toBeDefined();
      expect(result.errorStats.totalErrors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quality assessment', () => {
    test('assesses quality of successful processing', async () => {
      const goodContent = 'This is a comprehensive document with detailed analysis and multiple sections.';
      
      const result = await processor.processMultipleInputs([goodContent]);
      
      expect(result.qualityAssessment).toBeDefined();
      expect(result.qualityAssessment!.overall).toBeGreaterThan(0.5);
      expect(result.qualityAssessment!.factors.extractionQuality).toBeGreaterThan(0.8);
    });

    test('provides recommendations for quality improvement', async () => {
      const shortContent = 'Short.';
      
      const result = await processor.processMultipleInputs([shortContent]);
      
      expect(result.qualityAssessment!.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Utility methods', () => {
    test('reports processing capabilities correctly', () => {
      const capabilities = processor.getProcessingCapabilities();
      
      expect(capabilities.has(DataTypeIdentifier.TEXT)).toBe(true);
      expect(capabilities.has(DataTypeIdentifier.PDF_DOCUMENT)).toBe(true);
    });

    test('reports supported types correctly', () => {
      const types = processor.getSupportedTypes();
      
      expect(types).toContain(DataTypeIdentifier.TEXT);
      expect(types).toContain(DataTypeIdentifier.PDF_DOCUMENT);
    });

    test('checks input compatibility', () => {
      expect(processor.canProcess('text')).toBe(true);
      expect(processor.canProcess(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(true);
      expect(processor.canProcess(123)).toBe(false);
    });
  });

  describe('Performance', () => {
    test('processes multiple inputs efficiently', async () => {
      const inputs = Array.from({ length: 10 }, (_, i) => `Document ${i} content`);
      
      const startTime = performance.now();
      const result = await processor.processMultipleInputs(inputs);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.results!.components).toHaveLength(10);
    });

    test('tracks processing time accurately', async () => {
      const result = await processor.processMultipleInputs(['test content']);
      
      expect(result.results!.metadata.totalProcessingTime).toBeGreaterThan(0);
      expect(result.processingStats.totalProcessingTime).toBeGreaterThan(0);
    });
  });
});