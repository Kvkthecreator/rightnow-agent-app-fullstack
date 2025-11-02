import { z } from 'zod';
import type { YARNNNClient } from '../client.js';

/**
 * Tool: compose_document
 *
 * Generic P4 composition aligned with YARNNN Canon v3.0
 *
 * YARNNN Canon Alignment:
 * - Artifact layer (P4) composition from substrate memory
 * - Intent-driven, not template-specific
 * - Provenance tracking via substrate references
 * - Works for ANY document type (brief, report, analysis, etc.)
 *
 * Use Cases:
 * - "Compose a product brief from our substrate"
 * - "Create an executive summary of recent decisions"
 * - "Generate a technical analysis based on our memory"
 */

export const composeDocumentSchema = z.object({
  basket_id: z.string().uuid().describe(
    'Basket ID to compose from. Required - specifies which memory to use.'
  ),
  intent: z.string().min(10).describe(
    'What you want the document to communicate. Be specific about purpose, audience, and goals. Examples: "Create an executive brief on product strategy for leadership", "Technical analysis of authentication approach for engineering team"'
  ),
  document_type: z.enum(['brief', 'report', 'analysis', 'summary', 'memo']).optional().describe(
    'Type of document to create. If omitted, inferred from intent.'
  ),
  window: z.object({
    days_back: z.number().min(1).optional().describe('Include substrate from last N days'),
    anchors: z.array(z.string()).optional().describe('Specific anchors to focus on'),
    keywords: z.array(z.string()).optional().describe('Keywords to filter substrate'),
  }).optional().describe(
    'Optional filters to focus composition on specific substrate'
  ),
  citations: z.boolean().default(true).describe(
    'Include provenance metadata showing which substrate each section draws from'
  ),
});

export type ComposeDocumentInput = z.infer<typeof composeDocumentSchema>;

interface P4CompositionResponse {
  success: boolean;
  document_id?: string;
  version_hash?: string;
  content?: string;
  metadata?: {
    composition_metrics?: {
      candidates_found: number;
      candidates_selected: number;
      coverage_percentage: number;
      freshness_score: number;
      provenance_percentage: number;
    };
    substrate_references?: Array<{
      substrate_id: string;
      substrate_type: string;
      reference_count: number;
    }>;
  };
  message?: string;
}

export async function composeDocument(
  input: ComposeDocumentInput,
  client: YARNNNClient
): Promise<P4CompositionResponse> {
  try {
    // Call P4 composition endpoint
    const response = await client.post<P4CompositionResponse>('/api/agents/p4-composition', {
      basket_id: input.basket_id,
      intent: input.intent,
      operation: 'compose',
      window: input.window || {},
      // Generate a new document ID for this composition
      // The backend will create the document record
    });

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Composition failed: ${error.message}`
        : 'Failed to compose document from substrate',
    };
  }
}

export const composeDocumentTool = {
  name: 'compose_document',
  description: `Compose a document from YARNNN substrate memory using P4 composition.

This tool creates artifact layer documents grounded in your substrate memory:
- Intent-driven: Describe what you want, not a template
- Provenance-tracked: See which substrate each section draws from
- Canon-compliant: Generic P4 composition, not template-specific

Document types supported:
- Brief: Concise overview for decision-makers
- Report: Detailed analysis with evidence
- Analysis: Deep-dive on specific topic
- Summary: High-level synthesis
- Memo: Informal knowledge capture

The composition agent will:
1. Query substrate based on intent and filters
2. Generate narrative structure from substrate
3. Compose sections with provenance tracking
4. Return document with metadata

Output includes:
- document_id: Reference for retrieving the composed document
- content: Markdown-formatted document
- metadata: Composition metrics and substrate references
- provenance: Which substrate items informed each section`,
  inputSchema: composeDocumentSchema,
};
