/**
 * Image Processor Tests
 * 
 * Tests for the ImageProcessor including OCR functionality,
 * image analysis, and error handling. Uses mocked Tesseract.js
 * for reliable testing without actual OCR processing.
 */

import { ImageProcessor } from '../ImageProcessor';
import { DataTypeIdentifier } from '../types';

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
  PSM: { AUTO: 3 },
  OEM: { LSTM_ONLY: 1 }
}));

describe('ImageProcessor', () => {
  let processor: ImageProcessor;
  let mockWorker: any;

  beforeEach(() => {
    processor = new ImageProcessor();
    
    // Setup mock OCR worker
    mockWorker = {
      setParameters: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn(),
      terminate: jest.fn().mockResolvedValue(undefined)
    };

    const { createWorker } = require('tesseract.js');
    createWorker.mockResolvedValue(mockWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    test('can process image files', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(processor.canProcess(jpegFile)).toBe(true);
      expect(processor.canProcess(pngFile)).toBe(true);
      expect(processor.canProcess(textFile)).toBe(false);
      expect(processor.canProcess('text')).toBe(false);
      expect(processor.canProcess(null)).toBe(false);
    });

    test('supports multiple image formats', () => {
      const formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
      
      formats.forEach(format => {
        const file = new File([''], `test.${format.split('/')[1]}`, { type: format });
        expect(processor.canProcess(file)).toBe(true);
      });
    });

    test('has correct processor metadata', () => {
      expect(processor.type).toBe(DataTypeIdentifier.IMAGE);
      expect(processor.supportedFormats).toContain('image/jpeg');
      expect(processor.supportedFormats).toContain('image/png');
      expect(processor.processingCapabilities).toHaveLength(4);
      
      const info = processor.getProcessingInfo();
      expect(info.version).toBeDefined();
      expect(info.description).toContain('OCR');
    });
  });

  describe('OCR Processing', () => {
    test('processes image with high-quality OCR', async () => {
      // Mock high-quality OCR result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'This is extracted text from the image with good quality.',
          confidence: 85,
          blocks: [],
          words: []
        }
      });

      // Mock image loading
      const originalImage = global.Image;
      global.Image = jest.fn().mockImplementation(() => ({
        width: 800,
        height: 600,
        onload: null,
        onerror: null,
        src: null
      }));

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const imageFile = new File(['mock image data'], 'document.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(imageFile);

      expect(result.content.raw).toBe('This is extracted text from the image with good quality.');
      expect(result.content.metadata.ocrConfidence).toBe(0.85);
      expect(result.content.metadata.originalFormat).toBe('image');
      expect(result.content.metadata.fileName).toBe('document.jpg');
      expect(result.processing.processorType).toBe(DataTypeIdentifier.IMAGE);

      // Restore original Image
      global.Image = originalImage;
    });

    test('handles low-quality OCR results', async () => {
      // Mock low-quality OCR result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'blurry text',
          confidence: 35,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 400,
        height: 300,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const blurryImage = new File(['blurry image'], 'blurry.png', { type: 'image/png' });
      
      const result = await processor.process(blurryImage);

      expect(result.content.raw).toBe('blurry text');
      expect(result.content.metadata.ocrConfidence).toBe(0.35);
      expect(result.analysis.confidence).toBeLessThan(0.7);
      
      // Should detect low quality OCR pattern
      const lowQualityPattern = result.analysis.patterns.find(
        p => p.pattern_type === 'low_quality_ocr'
      );
      expect(lowQualityPattern).toBeDefined();
    });

    test('processes empty or minimal text images', async () => {
      // Mock OCR result with minimal text
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: '   \n  ',
          confidence: 60,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 500,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const photoImage = new File(['photo data'], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(photoImage);

      expect(result.content.raw.trim()).toBe('');
      expect(result.content.structured.imageAnalysis?.hasText).toBe(false);
      expect(result.content.structured.imageAnalysis?.imageType).toBe('photo');
    });
  });

  describe('Image Analysis', () => {
    test('identifies document-type images', async () => {
      // Mock document-like OCR result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: `Business Plan Executive Summary
          
          Our company strategy focuses on market expansion through technology innovation.
          Key objectives include customer acquisition, revenue growth, and operational efficiency.
          
          Market Analysis
          The target market shows significant growth potential with emerging opportunities.`,
          confidence: 88,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 1200,
        height: 800,
        onload: null, 
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const documentImage = new File(['document scan'], 'business-plan.png', { type: 'image/png' });
      
      const result = await processor.process(documentImage);

      expect(result.content.structured.imageAnalysis?.imageType).toBe('document');
      expect(result.content.structured.imageAnalysis?.hasText).toBe(true);
      expect(result.content.structured.imageAnalysis?.textDensity).toBeGreaterThan(3);
      
      // Should detect high quality OCR pattern
      const highQualityPattern = result.analysis.patterns.find(
        p => p.pattern_type === 'high_quality_ocr'
      );
      expect(highQualityPattern).toBeDefined();
    });

    test('identifies screenshot-type images', async () => {
      // Mock screenshot-like OCR result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Login Button Submit Form Username Password Click Menu Window Dialog',
          confidence: 75,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 1920,
        height: 1080,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const screenshotImage = new File(['screenshot data'], 'app-screenshot.png', { type: 'image/png' });
      
      const result = await processor.process(screenshotImage);

      expect(result.content.structured.imageAnalysis?.imageType).toBe('screenshot');
      expect(result.content.structured.imageAnalysis?.hasText).toBe(true);
    });

    test('identifies diagram-type images', async () => {
      // Mock diagram-like OCR result
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'System Architecture Data Flow Process Component Analysis Structure Function',
          confidence: 70,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 800,
        height: 600,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const diagramImage = new File(['diagram data'], 'system-diagram.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(diagramImage);

      expect(result.content.structured.imageAnalysis?.imageType).toBe('diagram');
    });
  });

  describe('Text Processing Integration', () => {
    test('processes extracted text through TextProcessor', async () => {
      // Mock substantial text extraction
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: `# Project Overview
          
          This document outlines our business strategy for market expansion.
          
          ## Key Objectives
          - Customer acquisition
          - Revenue growth
          - Market penetration
          
          ## Implementation Plan
          Phase 1: Market research and analysis
          Phase 2: Product development and testing
          Phase 3: Launch and customer onboarding`,
          confidence: 90,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 1000,
        height: 800,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const textRichImage = new File(['text rich image'], 'business-doc.png', { type: 'image/png' });
      
      const result = await processor.process(textRichImage);

      // Should extract themes from the text
      expect(result.analysis.themes.length).toBeGreaterThan(0);
      expect(result.analysis.themes).toContain('business-strategy');
      
      // Should detect structure from the text
      expect(result.analysis.structure.length).toBeGreaterThan(0);
      
      // Should have high confidence due to good OCR and text analysis
      expect(result.analysis.confidence).toBeGreaterThan(0.8);
    });

    test('handles text processing integration gracefully when text is minimal', async () => {
      // Mock minimal text extraction
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Logo',
          confidence: 60,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 300,
        height: 200,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const logoImage = new File(['logo image'], 'company-logo.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(logoImage);

      // Should not crash with minimal text
      expect(result.content.raw).toBe('Logo');
      expect(result.analysis.themes).toEqual([]);
      expect(result.analysis.confidence).toBeLessThan(0.7);
    });
  });

  describe('Quality Assessment', () => {
    test('calculates extraction quality based on OCR confidence', async () => {
      // Test high quality
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'High quality extracted text with excellent clarity and accuracy.',
          confidence: 95,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 800,
        height: 600,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const highQualityImage = new File(['high quality'], 'clear-text.png', { type: 'image/png' });
      
      const result = await processor.process(highQualityImage);

      expect(result.processing.extractionQuality).toBeGreaterThan(0.8);
      expect(result.content.metadata.ocrConfidence).toBe(0.95);
    });

    test('provides quality patterns and recommendations', async () => {
      // Test medium quality
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Medium quality text extraction',
          confidence: 65,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 600,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const mediumQualityImage = new File(['medium quality'], 'scan.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(mediumQualityImage);

      expect(result.analysis.patterns.length).toBeGreaterThan(0);
      
      // Should have image content type pattern
      const contentTypePattern = result.analysis.patterns.find(
        p => p.pattern_type === 'image_content_type'
      );
      expect(contentTypePattern).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles OCR processing errors gracefully', async () => {
      // Mock OCR error
      mockWorker.recognize.mockRejectedValue(new Error('OCR processing failed'));

      global.Image = jest.fn().mockImplementation(() => ({
        width: 500,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const problemImage = new File(['problematic image'], 'error.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(problemImage);

      expect(result.content.raw).toBe('');
      expect(result.processing.extractionQuality).toBe(0.1);
      expect(result.analysis.patterns.some(p => p.pattern_type === 'image_processing_failed')).toBe(true);
    });

    test('handles image loading errors', async () => {
      // Mock image loading error
      global.Image = jest.fn().mockImplementation(() => {
        const img = {
          width: 0,
          height: 0,
          onload: null,
          onerror: null,
          src: null
        };
        
        // Simulate loading error
        setTimeout(() => {
          if (img.onerror) img.onerror(new Error('Image load failed'));
        }, 0);
        
        return img;
      });

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const corruptImage = new File(['corrupt data'], 'corrupt.png', { type: 'image/png' });
      
      const result = await processor.process(corruptImage);

      expect(result.processing.extractionQuality).toBe(0.1);
      expect(result.analysis.patterns.some(p => p.pattern_type === 'image_processing_failed')).toBe(true);
    });
  });

  describe('Performance and Cleanup', () => {
    test('reuses OCR worker for multiple images', async () => {
      const { createWorker } = require('tesseract.js');
      
      // Mock successful OCR for multiple images
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Test text', confidence: 80, blocks: [], words: [] }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 500,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const image1 = new File(['image1'], 'test1.jpg', { type: 'image/jpeg' });
      const image2 = new File(['image2'], 'test2.jpg', { type: 'image/jpeg' });

      await processor.process(image1);
      await processor.process(image2);

      // Worker should be created only once
      expect(createWorker).toHaveBeenCalledTimes(1);
      expect(mockWorker.recognize).toHaveBeenCalledTimes(2);
    });

    test('cleanup method terminates OCR worker', async () => {
      // Process an image to initialize worker
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Test', confidence: 80, blocks: [], words: [] }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 500,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const testImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await processor.process(testImage);

      // Cleanup should terminate worker
      await ImageProcessor.cleanup();
      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles very large images', async () => {
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Large image text', confidence: 75, blocks: [], words: [] }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 4000,
        height: 3000,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const largeImage = new File(['large image data'], 'large.png', { type: 'image/png' });
      
      const result = await processor.process(largeImage);

      expect(result.content.metadata.imageWidth).toBe(4000);
      expect(result.content.metadata.imageHeight).toBe(3000);
      expect(result).toBeDefined();
    });

    test('handles images with special characters in OCR text', async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Special characters: émojis 🚀 and símböls @#$%^&*()',
          confidence: 70,
          blocks: [],
          words: []
        }
      });

      global.Image = jest.fn().mockImplementation(() => ({
        width: 600,
        height: 400,
        onload: null,
        onerror: null,
        src: null
      }));

      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const specialCharsImage = new File(['special chars'], 'special.jpg', { type: 'image/jpeg' });
      
      const result = await processor.process(specialCharsImage);

      expect(result.content.raw).toContain('émojis 🚀');
      expect(result.content.raw).toContain('@#$%^&*()');
    });
  });
});