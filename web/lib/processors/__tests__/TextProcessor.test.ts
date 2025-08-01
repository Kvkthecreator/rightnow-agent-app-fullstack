/**
 * Text Processor Tests
 * 
 * Comprehensive tests for the TextProcessor including structure detection,
 * theme extraction, pattern identification, and error handling.
 */

import { TextProcessor } from '../TextProcessor';
import { DataTypeIdentifier } from '../types';

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  describe('Basic functionality', () => {
    test('can process text input', () => {
      expect(processor.canProcess('Hello world')).toBe(true);
      expect(processor.canProcess('')).toBe(false);
      expect(processor.canProcess('   ')).toBe(false);
      expect(processor.canProcess(123)).toBe(false);
      expect(processor.canProcess(null)).toBe(false);
    });

    test('has correct processor metadata', () => {
      expect(processor.type).toBe(DataTypeIdentifier.TEXT);
      expect(processor.supportedFormats).toContain('text/plain');
      expect(processor.processingCapabilities).toHaveLength(3);
      
      const info = processor.getProcessingInfo();
      expect(info.version).toBeDefined();
      expect(info.description).toBeDefined();
    });
  });

  describe('Text processing', () => {
    test('processes simple text correctly', async () => {
      const text = 'This is a simple test document with some content.';
      const result = await processor.process(text);

      expect(result.content.raw).toBe(text);
      expect(result.content.metadata.wordCount).toBeGreaterThan(0);
      expect(result.content.metadata.characterCount).toBe(text.length);
      expect(result.processing.processorType).toBe(DataTypeIdentifier.TEXT);
      expect(result.processing.extractionQuality).toBe(0.95);
    });

    test('detects headings correctly', async () => {
      const text = `# Main Title
This is some content under the main title.

## Subtitle
More content here.

### Sub-subtitle
Even more content.`;

      const result = await processor.process(text);
      
      expect(result.content.structured.headings).toContain('# Main Title');
      expect(result.content.structured.headings).toContain('## Subtitle');
      expect(result.content.structured.headings).toContain('### Sub-subtitle');
      
      const headingElements = result.analysis.structure.filter(el => el.type === 'heading');
      expect(headingElements).toHaveLength(3);
      expect(headingElements[0].level).toBe(1);
      expect(headingElements[1].level).toBe(2);
    });

    test('detects various heading styles', async () => {
      const text = `INTRODUCTION
This is an all-caps heading.

1. First Section
This is a numbered heading.

Key Concepts
This is a title case heading.`;

      const result = await processor.process(text);
      
      expect(result.content.structured.headings).toContain('INTRODUCTION');
      expect(result.content.structured.headings).toContain('1. First Section');
      expect(result.content.structured.headings).toContain('Key Concepts');
    });

    test('identifies list structures', async () => {
      const text = `Here are some items:
- First item
- Second item
- Third item

And numbered items:
1. First numbered
2. Second numbered`;

      const result = await processor.process(text);
      
      const listElements = result.analysis.structure.filter(el => el.type === 'list');
      expect(listElements.length).toBeGreaterThan(0);
    });

    test('extracts themes from business content', async () => {
      const text = `Business Strategy Document
      
Our company needs to develop a comprehensive business strategy for product development.
We should focus on customer experience and market analysis to drive growth.
Technology implementation will be crucial for our digital transformation.
Data analysis and analytics will provide insights for decision making.`;

      const result = await processor.process(text);
      
      expect(result.analysis.themes).toContain('business-strategy');
      expect(result.analysis.themes).toContain('product-development');
      expect(result.analysis.themes.length).toBeGreaterThan(0);
    });

    test('detects patterns in content', async () => {
      const text = `# Project Overview

This is a comprehensive document with multiple sections and detailed analysis.

## Problem Statement
What are we trying to solve?

## Solution Approach  
How will we address the problem?

## Implementation Plan
Step-by-step execution strategy.

## Success Metrics
How will we measure success?`;

      const result = await processor.process(text);
      
      expect(result.analysis.patterns.length).toBeGreaterThan(0);
      
      const wellStructuredPattern = result.analysis.patterns.find(
        p => p.pattern_type === 'well_structured'
      );
      expect(wellStructuredPattern).toBeDefined();
      
      const inquiryPattern = result.analysis.patterns.find(
        p => p.pattern_type === 'inquiry_focused'
      );
      expect(inquiryPattern).toBeDefined();
    });

    test('calculates confidence scores correctly', async () => {
      const shortText = 'Short text.';
      const longText = 'This is a much longer piece of text with multiple sentences and paragraphs. '.repeat(20);
      
      const shortResult = await processor.process(shortText);
      const longResult = await processor.process(longText);
      
      expect(longResult.analysis.confidence).toBeGreaterThan(shortResult.analysis.confidence);
      expect(shortResult.analysis.confidence).toBeGreaterThan(0);
      expect(longResult.analysis.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe('Content analysis', () => {
    test('detects language correctly', async () => {
      const englishText = 'This is an English document with common English words.';
      const result = await processor.process(englishText);
      
      expect(result.content.metadata.language).toBe('en');
    });

    test('counts words and characters accurately', async () => {
      const text = 'One two three four five';
      const result = await processor.process(text);
      
      expect(result.content.metadata.wordCount).toBe(5);
      expect(result.content.metadata.characterCount).toBe(text.length);
    });

    test('creates structured sections from headings', async () => {
      const text = `Introduction
This is the introduction section.

Methodology
This describes our approach.

Results
Here are the findings.`;

      const result = await processor.process(text);
      
      expect(result.content.structured.sections).toHaveLength(3);
      expect(result.content.structured.sections?.[0].title).toBe('Introduction');
      expect(result.content.structured.sections?.[0].content).toContain('introduction section');
    });
  });

  describe('Error handling', () => {
    test('handles processing errors gracefully', async () => {
      // Simulate error by providing invalid input
      const result = await processor.process('');
      
      expect(result.processing.extractionQuality).toBeLessThan(0.5);
      expect(result.analysis.patterns.some(p => p.pattern_type === 'processing_failed')).toBe(true);
    });

    test('provides fallback output for failed processing', async () => {
      const text = 'Test content';
      
      // Mock a processing failure
      const originalExtractThemes = (processor as any).extractThemes;
      (processor as any).extractThemes = jest.fn().mockRejectedValue(new Error('Mock error'));
      
      const result = await processor.process(text);
      
      expect(result).toBeDefined();
      expect(result.content.raw).toBe(text);
      expect(result.processing.extractionQuality).toBe(0.1);
      
      // Restore original method
      (processor as any).extractThemes = originalExtractThemes;
    });
  });

  describe('Performance', () => {
    test('processes content within reasonable time', async () => {
      const longText = 'This is a performance test with longer content. '.repeat(1000);
      
      const startTime = performance.now();
      const result = await processor.process(longText);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.processing.processingTime).toBeGreaterThan(0);
    });

    test('handles very large text efficiently', async () => {
      const veryLongText = 'Large document content with many words and sentences. '.repeat(5000);
      
      const result = await processor.process(veryLongText);
      
      expect(result.content.metadata.wordCount).toBeGreaterThan(30000);
      expect(result.analysis.confidence).toBeGreaterThan(0.8); // Should be confident with lots of content
    });
  });

  describe('Edge cases', () => {
    test('handles text with special characters', async () => {
      const text = 'Text with émojis 🚀 and spëcial châractërs: @#$%^&*()';
      
      const result = await processor.process(text);
      
      expect(result.content.raw).toBe(text);
      expect(result.content.metadata.wordCount).toBeGreaterThan(0);
    });

    test('handles text with mixed line endings', async () => {
      const text = 'Line 1\nLine 2\r\nLine 3\rLine 4';
      
      const result = await processor.process(text);
      
      expect(result.content.raw).toContain('Line 1');
      expect(result.content.raw).toContain('Line 4');
    });

    test('handles empty headings and malformed structure', async () => {
      const text = `#
## 
Content without proper headings.
###
More content.`;
      
      const result = await processor.process(text);
      
      expect(result).toBeDefined();
      expect(result.analysis.confidence).toBeGreaterThan(0);
    });
  });
});