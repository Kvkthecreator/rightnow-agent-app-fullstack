/**
 * PDF Document Processor
 * 
 * Processes PDF files by extracting text content, maintaining document structure,
 * and leveraging the TextProcessor for semantic analysis. Uses pdfjs-dist
 * for reliable PDF parsing.
 */

// Dynamic import for PDF.js to handle SSR
let getDocument: any;
let GlobalWorkerOptions: any;
import {
  DataTypeProcessor,
  DataTypeIdentifier,
  ProcessingCapability,
  ProcessorMetadata,
  SubstrateOutput,
  StructuredContent,
  StructuralElement,
  PatternData,
  PDFExtractionResult,
  PageContent,
  PDFStructure
} from './types';
import { TextProcessor } from './TextProcessor';

// Initialize PDF.js only on client-side
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    getDocument = pdfjs.getDocument;
    GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }).catch(console.error);
}

export class PDFProcessor implements DataTypeProcessor<File> {
  readonly type = DataTypeIdentifier.PDF_DOCUMENT;
  readonly supportedFormats = ['application/pdf'];
  readonly processingCapabilities: ProcessingCapability[] = [
    { 
      name: 'text_extraction', 
      description: 'Extract text content from PDF pages with structure preservation', 
      quality: 'good' 
    },
    { 
      name: 'structure_detection', 
      description: 'Identify document structure, headings, and page organization', 
      quality: 'basic' 
    },
    { 
      name: 'metadata_extraction', 
      description: 'Extract PDF document metadata, page count, and properties', 
      quality: 'excellent' 
    },
    {
      name: 'semantic_analysis',
      description: 'Leverage text processing for theme and pattern analysis',
      quality: 'good'
    }
  ];

  private textProcessor = new TextProcessor();

  canProcess(input: unknown): input is File {
    return input instanceof File && input.type === 'application/pdf';
  }

  getProcessingInfo(): ProcessorMetadata {
    return {
      version: '1.0.0',
      author: 'Universal Intelligence System',
      description: 'PDF processor with text extraction and structure detection using PDF.js',
      lastUpdated: '2025-01-01'
    };
  }

  async process(file: File): Promise<SubstrateOutput> {
    const startTime = performance.now();
    
    try {
      // Extract content from PDF
      const extractionResult = await this.extractContentFromPDF(file);
      
      // Use text processor for semantic analysis of extracted content
      const textAnalysis = await this.textProcessor.process(extractionResult.fullText);
      
      // Enhance with PDF-specific structure and metadata
      const enhancedStructure = this.enhanceWithPDFStructure(
        textAnalysis.analysis.structure,
        extractionResult.structure
      );

      const enhancedPatterns = this.enhancePatternsWithPDFData(
        textAnalysis.analysis.patterns,
        extractionResult
      );

      return {
        content: {
          raw: extractionResult.fullText,
          structured: {
            ...textAnalysis.content.structured,
            pdfStructure: extractionResult.structure,
            pages: extractionResult.pages
          },
          metadata: {
            ...textAnalysis.content.metadata,
            ...extractionResult.metadata,
            originalFormat: 'pdf',
            fileName: file.name,
            fileSize: file.size
          }
        },
        analysis: {
          ...textAnalysis.analysis,
          structure: enhancedStructure,
          patterns: enhancedPatterns
        },
        processing: {
          processorType: this.type,
          processingTime: performance.now() - startTime,
          extractionQuality: this.assessExtractionQuality(extractionResult)
        }
      };
    } catch (error) {
      console.error('PDF processing failed:', error);
      return this.createFailureOutput(file, performance.now() - startTime);
    }
  }

  private async extractContentFromPDF(file: File): Promise<PDFExtractionResult> {
    // Ensure PDF.js is loaded (client-side only)
    if (!getDocument) {
      throw new Error('PDF.js not available - PDF processing only supported on client-side');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const pages: PageContent[] = [];
    const structure: PDFStructure = { headings: [], sections: [] };
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Combine text items with proper spacing
      const pageText = this.combineTextItems(textContent.items);
      
      if (pageText.trim()) {
        fullText += pageText + '\n\n';
        pages.push({
          number: i,
          text: pageText,
          wordCount: this.countWords(pageText)
        });
        
        // Extract headings from this page
        const pageHeadings = this.extractHeadingsFromPage(pageText, i);
        structure.headings.push(...pageHeadings);
      }
    }

    // Identify sections based on headings
    structure.sections = this.identifySections(structure.headings, pages);

    // Extract PDF metadata
    const metadata = await this.extractPDFMetadata(pdf);

    return {
      fullText: fullText.trim(),
      pages,
      structure,
      metadata: {
        ...metadata,
        pageCount: pdf.numPages,
        wordCount: this.countWords(fullText)
      }
    };
  }

  private combineTextItems(items: any[]): string {
    let text = '';
    let lastY = -1;
    
    for (const item of items) {
      if (!('str' in item)) continue;
      
      const currentY = item.transform[5];
      
      // Add line break for significant Y position changes (new lines)
      if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
        text += '\n';
      }
      
      text += item.str + ' ';
      lastY = currentY;
    }
    
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s+/g, '\n') // Clean up line breaks
      .trim();
  }

  private extractHeadingsFromPage(pageText: string, pageNumber: number): string[] {
    const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const headings = [];
    
    for (const line of lines) {
      if (this.isPDFHeading(line)) {
        headings.push(line);
      }
    }
    
    return headings;
  }

  private isPDFHeading(line: string): boolean {
    // Skip very short or very long lines
    if (line.length < 5 || line.length > 150) return false;
    
    // Skip lines that look like body text
    if (line.endsWith('.') || line.includes(',')) return false;
    
    // Detect numbered headings (1., 1.1, etc.)
    if (/^\d+(\.\d+)*\.\s+[A-Z]/.test(line)) return true;
    
    // Detect all-caps headings
    if (line === line.toUpperCase() && /^[A-Z\s\d\-:]+$/.test(line)) return true;
    
    // Detect title case headings
    if (this.isTitleCase(line) && line.split(' ').length <= 8) return true;
    
    // Detect lines that start with common heading words
    const headingStarters = ['chapter', 'section', 'part', 'appendix', 'introduction', 'conclusion'];
    const firstWord = line.toLowerCase().split(' ')[0];
    if (headingStarters.includes(firstWord)) return true;
    
    return false;
  }

  private isTitleCase(text: string): boolean {
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    
    return words.every(word => {
      if (word.length === 0) return false;
      // Skip common small words
      if (['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())) {
        return true;
      }
      const firstChar = word[0];
      return firstChar === firstChar.toUpperCase() && /[A-Za-z]/.test(firstChar);
    });
  }

  private identifySections(headings: string[], pages: PageContent[]): Array<{ title: string; pageStart: number; pageEnd: number }> {
    const sections = [];
    
    // Simple section identification based on headings
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      
      // Find which page this heading is on
      let pageStart = 1;
      for (const page of pages) {
        if (page.text.includes(heading)) {
          pageStart = page.number;
          break;
        }
      }
      
      // Estimate section end (next heading or last page)
      let pageEnd = pages.length;
      if (i < headings.length - 1) {
        const nextHeading = headings[i + 1];
        for (const page of pages) {
          if (page.text.includes(nextHeading)) {
            pageEnd = page.number - 1;
            break;
          }
        }
      }
      
      sections.push({
        title: heading,
        pageStart,
        pageEnd: Math.max(pageEnd, pageStart)
      });
    }
    
    return sections;
  }

  private async extractPDFMetadata(pdf: any): Promise<Record<string, any>> {
    try {
      const metadata = await pdf.getMetadata();
      return {
        title: metadata.info?.Title || undefined,
        author: metadata.info?.Author || undefined,
        subject: metadata.info?.Subject || undefined,
        creator: metadata.info?.Creator || undefined,
        producer: metadata.info?.Producer || undefined,
        creationDate: metadata.info?.CreationDate || undefined,
        modificationDate: metadata.info?.ModDate || undefined
      };
    } catch (error) {
      console.warn('Failed to extract PDF metadata:', error);
      return {};
    }
  }

  private enhanceWithPDFStructure(
    textStructure: StructuralElement[],
    pdfStructure: PDFStructure
  ): StructuralElement[] {
    const enhanced = [...textStructure];
    
    // Add PDF-specific structural elements
    pdfStructure.headings.forEach((heading, index) => {
      enhanced.push({
        type: 'heading',
        content: heading,
        level: this.inferHeadingLevel(heading),
        position: index,
        metadata: {
          source: 'pdf_extraction',
          confidence: 0.8
        }
      });
    });
    
    pdfStructure.sections.forEach((section, index) => {
      enhanced.push({
        type: 'section',
        content: section.title,
        position: index,
        metadata: {
          pageStart: section.pageStart,
          pageEnd: section.pageEnd,
          source: 'pdf_structure'
        }
      });
    });
    
    return enhanced;
  }

  private enhancePatternsWithPDFData(
    textPatterns: PatternData[],
    extractionResult: PDFExtractionResult
  ): PatternData[] {
    const enhanced = [...textPatterns];
    
    // Add PDF-specific patterns
    if (extractionResult.metadata.pageCount > 10) {
      enhanced.push({
        pattern_type: 'multi_page_document',
        description: `Substantial PDF document with ${extractionResult.metadata.pageCount} pages`,
        confidence: 0.9
      });
    }
    
    if (extractionResult.structure.headings.length > 5) {
      enhanced.push({
        pattern_type: 'well_structured_pdf',
        description: `PDF contains ${extractionResult.structure.headings.length} identifiable headings`,
        confidence: 0.8
      });
    }
    
    if (extractionResult.structure.sections.length > 3) {
      enhanced.push({
        pattern_type: 'sectioned_document',
        description: `Document organized into ${extractionResult.structure.sections.length} distinct sections`,
        confidence: 0.7
      });
    }
    
    // Check for academic/formal document patterns
    const formalIndicators = ['abstract', 'introduction', 'methodology', 'conclusion', 'references'];
    const foundFormalSections = formalIndicators.filter(indicator =>
      extractionResult.fullText.toLowerCase().includes(indicator)
    );
    
    if (foundFormalSections.length >= 3) {
      enhanced.push({
        pattern_type: 'academic_document',
        description: 'Document structure suggests academic or formal research paper',
        confidence: 0.8
      });
    }
    
    return enhanced;
  }

  private inferHeadingLevel(heading: string): number {
    // Infer heading level based on formatting patterns
    if (/^\d+\.\s+/.test(heading)) return 1; // "1. Title"
    if (/^\d+\.\d+\s+/.test(heading)) return 2; // "1.1 Subtitle"
    if (heading === heading.toUpperCase()) return 1; // ALL CAPS
    if (this.isTitleCase(heading)) return 2; // Title Case
    return 3; // Default level
  }

  private assessExtractionQuality(result: PDFExtractionResult): number {
    let quality = 0.5; // Base quality
    
    // Text density factor
    const averageWordsPerPage = result.metadata.wordCount / result.metadata.pageCount;
    const textDensityFactor = Math.min(averageWordsPerPage / 200, 1) * 0.3;
    quality += textDensityFactor;
    
    // Structure quality factor
    const structureFactor = result.structure.headings.length > 0 ? 0.2 : 0;
    quality += structureFactor;
    
    // Page consistency factor (pages with reasonable content)
    const consistentPages = result.pages.filter(page => page.wordCount > 10).length;
    const consistencyFactor = (consistentPages / result.metadata.pageCount) * 0.2;
    quality += consistencyFactor;
    
    // Metadata availability factor
    const metadataFactor = result.metadata.title ? 0.1 : 0;
    quality += metadataFactor;
    
    return Math.min(quality, 0.95);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private createFailureOutput(file: File, processingTime: number): SubstrateOutput {
    return {
      content: {
        raw: '',
        structured: { metadata: {} },
        metadata: {
          originalFormat: 'pdf',
          fileName: file.name,
          fileSize: file.size,
          wordCount: 0,
          characterCount: 0
        }
      },
      analysis: {
        themes: [],
        patterns: [{
          pattern_type: 'pdf_processing_failed',
          description: 'PDF processing encountered an error - file may be corrupted or protected',
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
}