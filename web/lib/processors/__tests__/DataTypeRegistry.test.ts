/**
 * Data Type Registry Tests
 * 
 * Tests for the central registry system including processor registration,
 * discovery, and management functionality.
 */

import { DataTypeRegistry } from '../DataTypeRegistry';
import { TextProcessor } from '../TextProcessor';
import { PDFProcessor } from '../PDFProcessor';
import { DataTypeIdentifier } from '../types';

// Mock processors for testing
class MockProcessor {
  readonly type = DataTypeIdentifier.IMAGE;
  readonly supportedFormats = ['image/jpeg', 'image/png'];
  readonly processingCapabilities = [
    { name: 'mock_capability', description: 'Mock capability', quality: 'basic' as const }
  ];

  canProcess(input: unknown): input is File {
    return input instanceof File && input.type.startsWith('image/');
  }

  async process(input: File) {
    return {} as any;
  }

  getProcessingInfo() {
    return {
      version: '1.0.0',
      author: 'Test',
      description: 'Mock processor',
      lastUpdated: '2025-01-01'
    };
  }
}

describe('DataTypeRegistry', () => {
  let registry: DataTypeRegistry;

  beforeEach(() => {
    registry = new DataTypeRegistry();
  });

  describe('Processor registration', () => {
    test('registers processors successfully', () => {
      const textProcessor = new TextProcessor();
      
      expect(() => registry.register(textProcessor)).not.toThrow();
      expect(registry.isTypeSupported(DataTypeIdentifier.TEXT)).toBe(true);
    });

    test('warns when replacing existing processor', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const processor1 = new TextProcessor();
      const processor2 = new TextProcessor();
      
      registry.register(processor1);
      registry.register(processor2);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processor for type text is being replaced')
      );
      
      consoleSpy.mockRestore();
    });

    test('logs successful registration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Registered processor: text'),
        expect.any(Array)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Processor retrieval', () => {
    test('retrieves registered processor by type', () => {
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      const retrieved = registry.getProcessor(DataTypeIdentifier.TEXT);
      expect(retrieved).toBe(textProcessor);
    });

    test('returns undefined for unregistered type', () => {
      const retrieved = registry.getProcessor(DataTypeIdentifier.IMAGE);
      expect(retrieved).toBeUndefined();
    });

    test('finds processor for valid input', () => {
      const textProcessor = new TextProcessor();
      const pdfProcessor = new PDFProcessor();
      
      registry.register(textProcessor);
      registry.register(pdfProcessor);
      
      const textInput = 'Hello world';
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      
      expect(registry.findProcessorForInput(textInput)).toBe(textProcessor);
      expect(registry.findProcessorForInput(pdfFile)).toBe(pdfProcessor);
    });

    test('returns undefined when no processor can handle input', () => {
      const registry = new DataTypeRegistry();
      
      const unknownInput = { unknown: 'data' };
      expect(registry.findProcessorForInput(unknownInput)).toBeUndefined();
    });

    test('finds all compatible processors for input', () => {
      const textProcessor = new TextProcessor();
      const mockProcessor = new MockProcessor();
      
      registry.register(textProcessor);
      registry.register(mockProcessor);
      
      const textInput = 'Hello world';
      const processors = registry.findAllProcessorsForInput(textInput);
      
      expect(processors).toHaveLength(1);
      expect(processors[0]).toBe(textProcessor);
    });
  });

  describe('Registry information', () => {
    test('returns supported types', () => {
      const textProcessor = new TextProcessor();
      const pdfProcessor = new PDFProcessor();
      
      registry.register(textProcessor);
      registry.register(pdfProcessor);
      
      const supportedTypes = registry.getSupportedTypes();
      expect(supportedTypes).toContain(DataTypeIdentifier.TEXT);
      expect(supportedTypes).toContain(DataTypeIdentifier.PDF_DOCUMENT);
      expect(supportedTypes).toHaveLength(2);
    });

    test('returns processing capabilities', () => {
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      const capabilities = registry.getProcessingCapabilities();
      expect(capabilities.has(DataTypeIdentifier.TEXT)).toBe(true);
      expect(capabilities.get(DataTypeIdentifier.TEXT)).toHaveLength(3);
    });

    test('returns processor information', () => {
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      const info = registry.getProcessorInfo();
      expect(info).toHaveLength(1);
      expect(info[0].type).toBe(DataTypeIdentifier.TEXT);
      expect(info[0].supportedFormats).toContain('text/plain');
      expect(info[0].capabilities).toHaveLength(3);
      expect(info[0].metadata).toBeDefined();
    });

    test('checks input compatibility', () => {
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      expect(registry.canProcessInput('Hello world')).toBe(true);
      expect(registry.canProcessInput(123)).toBe(false);
      expect(registry.canProcessInput(null)).toBe(false);
    });
  });

  describe('Registry statistics', () => {
    test('provides accurate statistics', () => {
      const textProcessor = new TextProcessor();
      const pdfProcessor = new PDFProcessor();
      
      registry.register(textProcessor);
      registry.register(pdfProcessor);
      
      const stats = registry.getRegistryStats();
      
      expect(stats.totalProcessors).toBe(2);
      expect(stats.supportedTypes).toHaveLength(2);
      expect(stats.totalCapabilities).toBeGreaterThan(0);
      expect(stats.avgCapabilitiesPerProcessor).toBeGreaterThan(0);
    });

    test('handles empty registry statistics', () => {
      const stats = registry.getRegistryStats();
      
      expect(stats.totalProcessors).toBe(0);
      expect(stats.supportedTypes).toHaveLength(0);
      expect(stats.totalCapabilities).toBe(0);
      expect(stats.avgCapabilitiesPerProcessor).toBe(0);
    });
  });

  describe('Registry management', () => {
    test('unregisters processors successfully', () => {
      const textProcessor = new TextProcessor();
      registry.register(textProcessor);
      
      expect(registry.isTypeSupported(DataTypeIdentifier.TEXT)).toBe(true);
      
      const wasRemoved = registry.unregister(DataTypeIdentifier.TEXT);
      expect(wasRemoved).toBe(true);
      expect(registry.isTypeSupported(DataTypeIdentifier.TEXT)).toBe(false);
    });

    test('returns false when unregistering non-existent processor', () => {
      const wasRemoved = registry.unregister(DataTypeIdentifier.IMAGE);
      expect(wasRemoved).toBe(false);
    });

    test('clears all processors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const textProcessor = new TextProcessor();
      const pdfProcessor = new PDFProcessor();
      
      registry.register(textProcessor);
      registry.register(pdfProcessor);
      
      expect(registry.getSupportedTypes()).toHaveLength(2);
      
      registry.clear();
      
      expect(registry.getSupportedTypes()).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('Cleared 2 processors from registry');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    test('handles duplicate processor types gracefully', () => {
      const processor1 = new TextProcessor();
      const processor2 = new TextProcessor();
      
      registry.register(processor1);
      registry.register(processor2);
      
      // Should have only one processor registered (the second one replaces the first)
      expect(registry.getSupportedTypes()).toHaveLength(1);
      expect(registry.getProcessor(DataTypeIdentifier.TEXT)).toBe(processor2);
    });

    test('handles processors with same capabilities', () => {
      const mockProcessor1 = new MockProcessor();
      const mockProcessor2 = new MockProcessor();
      
      registry.register(mockProcessor1);
      registry.register(mockProcessor2);
      
      const capabilities = registry.getProcessingCapabilities();
      expect(capabilities.size).toBe(1);
    });

    test('maintains registry integrity after errors', () => {
      const textProcessor = new TextProcessor();
      const mockProcessor = new MockProcessor();
      
      registry.register(textProcessor);
      
      // Simulate an error during registration
      const originalRegister = registry.register.bind(registry);
      registry.register = jest.fn().mockImplementation((processor) => {
        if (processor === mockProcessor) {
          throw new Error('Registration failed');
        }
        return originalRegister(processor);
      });
      
      expect(() => registry.register(mockProcessor)).toThrow();
      
      // Registry should still work for existing processors
      expect(registry.isTypeSupported(DataTypeIdentifier.TEXT)).toBe(true);
      expect(registry.getSupportedTypes()).toHaveLength(1);
    });
  });
});