/**
 * Text Content Processor
 * 
 * Processes raw text input with enhanced structure detection,
 * semantic analysis, and theme extraction. Serves as the foundation
 * for all text-based content processing.
 */

import { DataTypeIdentifier } from './types';
import type {
  DataTypeProcessor,
  ProcessingCapability,
  ProcessorMetadata,
  SubstrateOutput,
  StructuredContent,
  StructuralElement,
  PatternData,
  StructureExtractionResult
} from './types';

export class TextProcessor implements DataTypeProcessor<string> {
  readonly type = DataTypeIdentifier.TEXT;
  readonly supportedFormats = ['text/plain'];
  readonly processingCapabilities: ProcessingCapability[] = [
    { 
      name: 'semantic_analysis', 
      description: 'Theme and pattern extraction from text content', 
      quality: 'excellent' 
    },
    { 
      name: 'structure_detection', 
      description: 'Automatic identification of headings, sections, and document structure', 
      quality: 'good' 
    },
    {
      name: 'content_analysis',
      description: 'Word count, language detection, and content metrics',
      quality: 'excellent'
    }
  ];

  canProcess(input: unknown): input is string {
    return typeof input === 'string' && input.trim().length > 0;
  }

  getProcessingInfo(): ProcessorMetadata {
    return {
      version: '1.0.0',
      author: 'Universal Intelligence System',
      description: 'Enhanced text processor with structure detection and semantic analysis',
      lastUpdated: '2025-01-01'
    };
  }

  async process(text: string): Promise<SubstrateOutput> {
    const startTime = performance.now();
    
    try {
      // Clean and prepare text
      const cleanedText = this.cleanText(text);
      
      // Extract structural information
      const structure = this.extractStructure(cleanedText);
      
      // Perform semantic analysis
      const themes = await this.extractThemes(cleanedText);
      const patterns = await this.detectPatterns(cleanedText, structure);
      
      // Build structured content
      const structuredContent = this.buildStructuredContent(cleanedText, structure);
      
      // Calculate processing metrics
      const confidence = this.calculateConfidence(cleanedText, themes, patterns);
      const processingTime = performance.now() - startTime;

      return {
        content: {
          raw: cleanedText,
          structured: structuredContent,
          metadata: {
            wordCount: this.countWords(cleanedText),
            characterCount: cleanedText.length,
            language: this.detectLanguage(cleanedText),
            originalFormat: 'text'
          }
        },
        analysis: {
          themes,
          patterns,
          structure: structure.elements,
          confidence
        },
        processing: {
          processorType: this.type,
          processingTime,
          extractionQuality: 0.95 // High quality for direct text
        }
      };
    } catch (error) {
      console.error('Text processing failed:', error);
      return this.createFailureOutput(text, performance.now() - startTime);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .trim();
  }

  private extractStructure(text: string): StructureExtractionResult {
    const lines = text.split('\n').map(line => line.trim());
    const sections = [];
    const headings = [];
    const elements: StructuralElement[] = [];

    let currentSection = null;
    let sectionContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line) continue;

      // Detect headings using multiple patterns
      const headingInfo = this.analyzeHeading(line);
      
      if (headingInfo.isHeading) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: sectionContent.trim(),
            level: headingInfo.level
          });
          sectionContent = '';
        }

        // Start new section
        currentSection = line;
        headings.push(line);
        elements.push({
          type: 'heading',
          content: line,
          level: headingInfo.level,
          position: i
        });
      } else {
        // Add to current section content
        sectionContent += line + '\n';
        
        // Detect other structural elements
        if (this.isList(line)) {
          elements.push({
            type: 'list',
            content: line,
            position: i
          });
        } else if (line.length > 50) {
          elements.push({
            type: 'paragraph',
            content: line,
            position: i
          });
        }
      }
    }

    // Add final section
    if (currentSection && sectionContent.trim()) {
      sections.push({
        title: currentSection,
        content: sectionContent.trim(),
        level: 1
      });
    }

    return { sections, headings, elements };
  }

  private analyzeHeading(line: string): { isHeading: boolean; level: number } {
    // Markdown-style headings
    const markdownMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (markdownMatch) {
      return { isHeading: true, level: markdownMatch[1].length };
    }

    // All caps headings (common pattern)
    if (line.length > 3 && line.length < 100 && line === line.toUpperCase() && 
        /^[A-Z\s\d\-:]+$/.test(line)) {
      return { isHeading: true, level: 2 };
    }

    // Numbered headings (1., 2., etc.)
    if (/^\d+\.\s+[A-Z]/.test(line) && line.length < 100) {
      return { isHeading: true, level: 3 };
    }

    // Title case lines (common in documents)
    if (this.isTitleCase(line) && line.length > 5 && line.length < 80 && 
        !line.endsWith('.') && !line.includes(',')) {
      return { isHeading: true, level: 3 };
    }

    return { isHeading: false, level: 0 };
  }

  private isTitleCase(text: string): boolean {
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    
    return words.every(word => {
      if (word.length === 0) return false;
      const firstChar = word[0];
      return firstChar === firstChar.toUpperCase() && /[A-Za-z]/.test(firstChar);
    });
  }

  private isList(line: string): boolean {
    return /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line) || /^[a-zA-Z]\.\s+/.test(line);
  }

  private buildStructuredContent(text: string, structure: StructureExtractionResult): StructuredContent {
    return {
      sections: structure.sections,
      headings: structure.headings,
      metadata: {
        sectionCount: structure.sections.length,
        headingCount: structure.headings.length,
        hasStructure: structure.headings.length > 0
      }
    };
  }

  private async extractThemes(text: string): Promise<string[]> {
    const keywords = this.extractKeywords(text);
    const concepts = this.identifyConcepts(keywords);
    return this.clusterThemes(concepts);
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return most frequent keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private identifyConcepts(keywords: string[]): string[] {
    // Enhanced concept identification
    const conceptMap: Record<string, string[]> = {
      'business': ['business', 'company', 'enterprise', 'organization', 'corporate'],
      'strategy': ['strategy', 'plan', 'approach', 'method', 'framework'],
      'technology': ['technology', 'software', 'system', 'platform', 'digital'],
      'product': ['product', 'service', 'solution', 'offering', 'feature'],
      'customer': ['customer', 'client', 'user', 'consumer', 'audience'],
      'market': ['market', 'industry', 'sector', 'segment', 'competitive'],
      'project': ['project', 'initiative', 'program', 'effort', 'campaign'],
      'data': ['data', 'information', 'analytics', 'metrics', 'insights']
    };

    const identifiedConcepts = [];
    for (const [concept, relatedWords] of Object.entries(conceptMap)) {
      const matches = keywords.filter(keyword => 
        relatedWords.some(word => keyword.includes(word) || word.includes(keyword))
      );
      if (matches.length > 0) {
        identifiedConcepts.push(concept);
      }
    }

    return identifiedConcepts;
  }

  private clusterThemes(concepts: string[]): string[] {
    // Simple theme clustering based on concept co-occurrence
    const themes = [];
    
    if (concepts.includes('business') && concepts.includes('strategy')) {
      themes.push('business-strategy');
    }
    if (concepts.includes('product') && concepts.includes('customer')) {
      themes.push('product-development');
    }
    if (concepts.includes('technology') && concepts.includes('system')) {
      themes.push('technology-implementation');
    }
    if (concepts.includes('project') && concepts.includes('plan')) {
      themes.push('project-management');
    }
    if (concepts.includes('data') && concepts.includes('analytics')) {
      themes.push('data-analysis');
    }
    if (concepts.includes('market') && concepts.includes('customer')) {
      themes.push('market-analysis');
    }

    // Include individual concepts as themes if no clusters formed
    if (themes.length === 0) {
      themes.push(...concepts.slice(0, 5));
    }

    return themes;
  }

  private async detectPatterns(text: string, structure: StructureExtractionResult): Promise<PatternData[]> {
    const patterns: PatternData[] = [];

    // Content structure patterns
    if (structure.headings.length > 3) {
      patterns.push({
        pattern_type: 'well_structured',
        description: `Document contains ${structure.headings.length} headings indicating good organization`,
        confidence: 0.8
      });
    }

    // Content length patterns
    const words = this.countWords(text);
    if (words > 1000) {
      patterns.push({
        pattern_type: 'comprehensive_content',
        description: 'Substantial content volume suggests detailed analysis or documentation',
        confidence: 0.7
      });
    }

    // List pattern detection
    const listItems = text.split('\n').filter(line => this.isList(line.trim()));
    if (listItems.length > 5) {
      patterns.push({
        pattern_type: 'list_heavy',
        description: 'Multiple lists suggest action items or structured information',
        confidence: 0.6
      });
    }

    // Question pattern detection
    const questions = text.split(/[.!?]/).filter(sentence => 
      sentence.trim().endsWith('?') || sentence.includes('how') || sentence.includes('what')
    );
    if (questions.length > 3) {
      patterns.push({
        pattern_type: 'inquiry_focused',
        description: 'Multiple questions suggest exploratory or requirements-gathering content',
        confidence: 0.6
      });
    }

    return patterns;
  }

  private calculateConfidence(text: string, themes: string[], patterns: PatternData[]): number {
    let score = 0.5; // Base confidence

    // Length factor
    const words = this.countWords(text);
    const lengthFactor = Math.min(words / 1000, 1) * 0.3;
    score += lengthFactor;

    // Theme factor
    const themeFactor = Math.min(themes.length / 5, 1) * 0.4;
    score += themeFactor;

    // Pattern factor
    const patternFactor = patterns.length > 0 ? 0.2 : 0;
    score += patternFactor;

    // Structure factor
    const structureFactor = text.includes('\n') ? 0.1 : 0;
    score += structureFactor;

    return Math.min(score, 0.95);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private detectLanguage(text: string): string {
    // Simple language detection (can be enhanced with proper library)
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => commonEnglishWords.includes(word)).length;
    
    return englishWordCount > words.length * 0.1 ? 'en' : 'unknown';
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those',
      'a', 'an', 'as', 'if', 'it', 'he', 'she', 'we', 'they', 'you', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'our', 'their'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  private createFailureOutput(text: string, processingTime: number): SubstrateOutput {
    return {
      content: {
        raw: text,
        structured: { metadata: {} },
        metadata: {
          wordCount: this.countWords(text),
          characterCount: text.length,
          originalFormat: 'text'
        }
      },
      analysis: {
        themes: [],
        patterns: [{
          pattern_type: 'processing_failed',
          description: 'Text processing encountered an error',
          confidence: 0.1
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