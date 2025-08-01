/**
 * Core Data Type Processing System
 * 
 * This module defines the foundational interfaces for a modular, extensible
 * data type processing architecture. Each data type (text, PDF, image, etc.)
 * implements the DataTypeProcessor interface and outputs to a consistent
 * SubstrateOutput format.
 */

// Data type identifiers for all supported and future modalities
export enum DataTypeIdentifier {
  TEXT = 'text',
  TEXT_FILE = 'text_file',
  PDF_DOCUMENT = 'pdf_document',
  // Future modalities (prepared but not implemented)
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation'
}

// Processing capability descriptor
export interface ProcessingCapability {
  name: string;
  description: string;
  quality: 'basic' | 'good' | 'excellent';
}

// Metadata for extracted content
export interface ContentMetadata {
  wordCount?: number;
  characterCount?: number;
  language?: string;
  originalFormat?: string;
  fileName?: string;
  fileSize?: number;
  title?: string;
  pageCount?: number;
  [key: string]: any;
}

// Structured content representation
export interface StructuredContent {
  sections?: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  headings?: string[];
  metadata?: Record<string, any>;
  pdfStructure?: PDFStructure;
  pages?: PageContent[];
  imageAnalysis?: {
    visualType: string;
    hasText: boolean;
    textDensity: number;
    ocrConfidence: number;
  };
}

// PDF-specific structure
export interface PDFStructure {
  headings: string[];
  sections: Array<{
    title: string;
    pageStart: number;
    pageEnd: number;
  }>;
}

// Page content for multi-page documents
export interface PageContent {
  number: number;
  text: string;
  wordCount: number;
}

// Structural element in document
export interface StructuralElement {
  type: 'heading' | 'section' | 'paragraph' | 'list' | 'table';
  content: string;
  level?: number;
  position?: number;
  metadata?: Record<string, any>;
}

// Pattern data from analysis
export interface PatternData {
  pattern_type: string;
  description: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// Consistent output format that all processors must produce
export interface SubstrateOutput {
  content: {
    raw: string;
    structured: StructuredContent;
    metadata: ContentMetadata;
  };
  analysis: {
    themes: string[];
    patterns: PatternData[];
    structure: StructuralElement[];
    confidence: number;
  };
  processing: {
    processorType: DataTypeIdentifier;
    processingTime: number;
    extractionQuality: number;
  };
}

// Metadata about the processor itself
export interface ProcessorMetadata {
  version: string;
  author: string;
  description: string;
  lastUpdated: string;
}

// Base interface that ALL data type processors must implement
export interface DataTypeProcessor<T = any> {
  readonly type: DataTypeIdentifier;
  readonly supportedFormats: string[];
  readonly processingCapabilities: ProcessingCapability[];
  
  // Core processing method - converts input to substrate format
  process(input: T): Promise<SubstrateOutput>;
  
  // Type guard for input validation
  canProcess(input: unknown): input is T;
  
  // Processor metadata
  getProcessingInfo(): ProcessorMetadata;
}

// Combined output from multiple processors
export interface CohesiveSubstrateOutput {
  components: SubstrateOutput[]; // Individual processing results
  cohesive: {
    themes: string[];
    patterns: PatternData[];
    structure: StructuralElement[];
    confidence: number;
    interpretation: string;
  };
  metadata: {
    inputTypes: DataTypeIdentifier[];
    totalProcessingTime: number;
    averageQuality: number;
  };
}

// Internal types for specific processors
export interface PDFExtractionResult {
  fullText: string;
  pages: PageContent[];
  structure: PDFStructure;
  metadata: {
    title?: string;
    pageCount: number;
    wordCount: number;
  };
}

export interface StructureExtractionResult {
  sections: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  headings: string[];
  elements: StructuralElement[];
}