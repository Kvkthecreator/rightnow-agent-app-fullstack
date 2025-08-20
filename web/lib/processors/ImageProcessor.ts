/**
 * Image Processor
 * 
 * Processes image files by extracting text through OCR (Optical Character Recognition)
 * using Tesseract.js. Supports various image formats and provides quality assessment
 * based on OCR confidence and text extraction success.
 */

import { createWorker, PSM, OEM } from 'tesseract.js';
import { DataTypeIdentifier } from './types';
import type {
  DataTypeProcessor,
  ProcessingCapability,
  ProcessorMetadata,
  SubstrateOutput,
  StructuredContent,
  StructuralElement,
  PatternData
} from './types';
import { TextProcessor } from './TextProcessor';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  words: Array<{
    text: string;
    confidence: number;
    baseline?: any;
  }>;
}

interface ImageExtractionResult {
  extractedText: string;
  ocrConfidence: number;
  visualAnalysis: {
    hasText: boolean;
    textDensity: number;
    imageType: 'document' | 'screenshot' | 'photo' | 'diagram' | 'mixed';
    estimatedLanguage: string;
  };
  processingMetadata: {
    imageWidth: number;
    imageHeight: number;
    fileSize: number;
    processingTime: number;
  };
}

export class ImageProcessor implements DataTypeProcessor<File> {
  readonly type = DataTypeIdentifier.IMAGE;
  readonly supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
  readonly processingCapabilities: ProcessingCapability[] = [
    { 
      name: 'ocr_text_extraction', 
      description: 'Extract text from images using OCR with high accuracy', 
      quality: 'good' 
    },
    { 
      name: 'visual_analysis', 
      description: 'Analyze image content type and text density', 
      quality: 'basic' 
    },
    {
      name: 'structure_detection',
      description: 'Identify document structure within images',
      quality: 'basic'
    },
    {
      name: 'multi_language_support',
      description: 'OCR support for multiple languages',
      quality: 'good'
    }
  ];

  private textProcessor = new TextProcessor();
  private static ocrWorker: any = null;

  canProcess(input: unknown): input is File {
    if (!(input instanceof File)) return false;
    return this.supportedFormats.includes(input.type);
  }

  getProcessingInfo(): ProcessorMetadata {
    return {
      version: '1.0.0',
      author: 'Universal Intelligence System',
      description: 'Image processor with OCR text extraction using Tesseract.js',
      lastUpdated: '2025-01-01'
    };
  }

  async process(file: File): Promise<SubstrateOutput> {
    const startTime = performance.now();
    
    try {
      // Extract text and analyze image
      const extractionResult = await this.extractContentFromImage(file);
      
      // If we extracted meaningful text, process it through TextProcessor
      let textAnalysis = null;
      if (extractionResult.extractedText.trim().length > 5) {
        textAnalysis = await this.textProcessor.process(extractionResult.extractedText);
      }

      // Enhance with image-specific analysis
      const enhancedStructure = this.enhanceWithImageStructure(
        textAnalysis?.analysis.structure || [],
        extractionResult
      );

      const enhancedPatterns = this.enhancePatternsWithImageData(
        textAnalysis?.analysis.patterns || [],
        extractionResult
      );

      return {
        content: {
          raw: extractionResult.extractedText,
          structured: {
            ...(textAnalysis?.content.structured || { metadata: {} }),
            imageAnalysis: {
              visualType: extractionResult.visualAnalysis.imageType,
              hasText: extractionResult.visualAnalysis.hasText,
              textDensity: extractionResult.visualAnalysis.textDensity,
              ocrConfidence: extractionResult.ocrConfidence
            }
          },
          metadata: {
            ...(textAnalysis?.content.metadata || {}),
            originalFormat: 'image',
            fileName: file.name,
            fileSize: file.size,
            imageWidth: extractionResult.processingMetadata.imageWidth,
            imageHeight: extractionResult.processingMetadata.imageHeight,
            ocrConfidence: extractionResult.ocrConfidence,
            estimatedLanguage: extractionResult.visualAnalysis.estimatedLanguage,
            imageType: extractionResult.visualAnalysis.imageType
          }
        },
        analysis: {
          themes: textAnalysis?.analysis.themes || [],
          patterns: enhancedPatterns,
          structure: enhancedStructure,
          confidence: this.calculateImageProcessingConfidence(extractionResult, textAnalysis)
        },
        processing: {
          processorType: this.type,
          processingTime: performance.now() - startTime,
          extractionQuality: this.assessImageExtractionQuality(extractionResult)
        }
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      return this.createFailureOutput(file, performance.now() - startTime);
    }
  }

  private async extractContentFromImage(file: File): Promise<ImageExtractionResult> {
    const startTime = performance.now();

    // Initialize OCR worker if not already done
    if (!ImageProcessor.ocrWorker) {
      ImageProcessor.ocrWorker = await createWorker('eng', OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        }
      });
      
      // Configure for better text extraction
      await ImageProcessor.ocrWorker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_char_whitelist: '', // Allow all characters
        preserve_interword_spaces: '1'
      });
    }

    // Create image element to analyze dimensions
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Perform OCR
    const ocrResult = await ImageProcessor.ocrWorker.recognize(file);
    
    // Clean up object URL
    URL.revokeObjectURL(imageUrl);

    // Process OCR results
    const extractedText = this.cleanExtractedText(ocrResult.data.text);
    const ocrConfidence = ocrResult.data.confidence / 100; // Convert to 0-1 scale

    // Analyze image content type
    const visualAnalysis = this.analyzeImageContent(extractedText, ocrResult.data, img);

    return {
      extractedText,
      ocrConfidence,
      visualAnalysis,
      processingMetadata: {
        imageWidth: img.width,
        imageHeight: img.height,
        fileSize: file.size,
        processingTime: performance.now() - startTime
      }
    };
  }

  private cleanExtractedText(rawText: string): string {
    return rawText
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .replace(/[ \t]{2,}/g, ' ') // Collapse excessive spaces
      .replace(/[^\S\n\t]+/g, ' ') // Normalize whitespace
      .trim();
  }

  private analyzeImageContent(text: string, ocrData: any, image: HTMLImageElement) {
    const textLength = text.trim().length;
    const imageArea = image.width * image.height;
    const textDensity = textLength / (imageArea / 10000); // Normalize by image size

    // Determine image type based on content and OCR data
    let imageType: 'document' | 'screenshot' | 'photo' | 'diagram' | 'mixed' = 'mixed';
    
    if (textDensity > 5 && ocrData.confidence > 80) {
      imageType = 'document';
    } else if (textLength > 50 && this.hasUIElements(text)) {
      imageType = 'screenshot';
    } else if (textLength < 20 && ocrData.confidence < 50) {
      imageType = 'photo';
    } else if (textLength > 10 && this.hasTechnicalContent(text)) {
      imageType = 'diagram';
    }

    // Simple language detection
    const estimatedLanguage = this.detectLanguageFromText(text);

    return {
      hasText: textLength > 5,
      textDensity,
      imageType,
      estimatedLanguage
    };
  }

  private hasUIElements(text: string): boolean {
    const uiKeywords = ['button', 'click', 'menu', 'tab', 'window', 'dialog', 'form', 'login', 'password', 'submit'];
    const lowerText = text.toLowerCase();
    return uiKeywords.some(keyword => lowerText.includes(keyword));
  }

  private hasTechnicalContent(text: string): boolean {
    const technicalKeywords = ['system', 'process', 'function', 'data', 'analysis', 'component', 'structure'];
    const lowerText = text.toLowerCase();
    return technicalKeywords.some(keyword => lowerText.includes(keyword));
  }

  private detectLanguageFromText(text: string): string {
    // Very basic language detection - could be enhanced with a proper library
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => commonEnglishWords.includes(word)).length;
    
    return englishWordCount > words.length * 0.1 ? 'en' : 'unknown';
  }

  private enhanceWithImageStructure(
    textStructure: StructuralElement[],
    extractionResult: ImageExtractionResult
  ): StructuralElement[] {
    const enhanced = [...textStructure];
    
    // Add image-specific structural elements
    enhanced.push({
      type: 'section',
      content: `Image content (${extractionResult.visualAnalysis.imageType})`,
      position: 0,
      metadata: {
        source: 'image_analysis',
        imageType: extractionResult.visualAnalysis.imageType,
        ocrConfidence: extractionResult.ocrConfidence,
        textDensity: extractionResult.visualAnalysis.textDensity
      }
    });

    return enhanced;
  }

  private enhancePatternsWithImageData(
    textPatterns: PatternData[],
    extractionResult: ImageExtractionResult
  ): PatternData[] {
    const enhanced = [...textPatterns];
    
    // Add OCR quality pattern
    if (extractionResult.ocrConfidence > 0.8) {
      enhanced.push({
        pattern_type: 'high_quality_ocr',
        description: `High-quality OCR extraction with ${(extractionResult.ocrConfidence * 100).toFixed(1)}% confidence`,
        confidence: extractionResult.ocrConfidence
      });
    } else if (extractionResult.ocrConfidence < 0.5) {
      enhanced.push({
        pattern_type: 'low_quality_ocr',
        description: 'OCR extraction had low confidence - image may be blurry or have complex layout',
        confidence: 0.8
      });
    }

    // Add image type pattern
    enhanced.push({
      pattern_type: 'image_content_type',
      description: `Image appears to be a ${extractionResult.visualAnalysis.imageType} with ${extractionResult.visualAnalysis.hasText ? 'text content' : 'minimal text'}`,
      confidence: 0.7
    });

    // Add text density pattern
    if (extractionResult.visualAnalysis.textDensity > 3) {
      enhanced.push({
        pattern_type: 'text_rich_image',
        description: 'Image contains dense text content, likely a document or screenshot',
        confidence: 0.8
      });
    }

    return enhanced;
  }

  private calculateImageProcessingConfidence(
    extractionResult: ImageExtractionResult,
    textAnalysis: any
  ): number {
    let confidence = 0.3; // Base confidence for image processing

    // OCR confidence factor
    confidence += extractionResult.ocrConfidence * 0.4;

    // Text analysis confidence (if available)
    if (textAnalysis) {
      confidence += textAnalysis.analysis.confidence * 0.2;
    }

    // Text presence bonus
    if (extractionResult.visualAnalysis.hasText) {
      confidence += 0.1;
    }

    // Image type confidence bonus
    if (extractionResult.visualAnalysis.imageType === 'document') {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private assessImageExtractionQuality(result: ImageExtractionResult): number {
    let quality = 0.3; // Base quality

    // OCR confidence is the primary quality indicator
    quality += result.ocrConfidence * 0.5;

    // Text extraction success
    const textLength = result.extractedText.trim().length;
    if (textLength > 100) quality += 0.2;
    else if (textLength > 20) quality += 0.1;

    // Visual analysis quality
    if (result.visualAnalysis.hasText) quality += 0.1;
    if (result.visualAnalysis.imageType !== 'mixed') quality += 0.1;

    return Math.min(quality, 0.95);
  }

  private createFailureOutput(file: File, processingTime: number): SubstrateOutput {
    return {
      content: {
        raw: '',
        structured: { 
          metadata: {},
          imageAnalysis: {
            visualType: 'unknown',
            hasText: false,
            textDensity: 0,
            ocrConfidence: 0
          }
        },
        metadata: {
          originalFormat: 'image',
          fileName: file.name,
          fileSize: file.size,
          wordCount: 0,
          characterCount: 0,
          ocrConfidence: 0,
          imageType: 'unknown'
        }
      },
      analysis: {
        themes: [],
        patterns: [{
          pattern_type: 'image_processing_failed',
          description: 'Image processing encountered an error - file may be corrupted or format unsupported',
          confidence: 0.9
        }],
        structure: [],
        confidence: 0.1
      },
      processing: {
        processorType: this.type,
        processingTime,
        extractionQuality: 0.1
      }
    };
  }

  /**
   * Cleanup method to dispose of OCR worker when no longer needed
   */
  static async cleanup(): Promise<void> {
    if (ImageProcessor.ocrWorker) {
      await ImageProcessor.ocrWorker.terminate();
      ImageProcessor.ocrWorker = null;
      console.log('OCR worker terminated');
    }
  }
}