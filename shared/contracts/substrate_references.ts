import { z } from "zod";

/**
 * Substrate Canon v1.3.1 - Generic Substrate Reference System
 * 
 * Documents can compose ANY substrate type as peer references:
 * - blocks (context_blocks)
 * - dumps (raw_dumps)  
 * - context_items
 * - reflections
 * - timeline_events
 * 
 * Cache-bust: 2025-08-25
 */

// Substrate types that can be referenced
export const SubstrateTypeSchema = z.enum([
  "block",           // context_blocks
  "dump",            // raw_dumps
  "context_item",    // context_items
  "reflection",      // reflections (from cache)
  "timeline_event"   // timeline_events
]);
export type SubstrateType = z.infer<typeof SubstrateTypeSchema>;

// Generic substrate reference (replaces BlockLinkDTO)
export const SubstrateReferenceSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  substrate_type: SubstrateTypeSchema,
  substrate_id: z.string().uuid(),
  role: z.string().optional(),           // e.g., "primary", "supporting", "citation"
  weight: z.number().min(0).max(1).optional(),
  snippets: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  created_by: z.string().uuid().optional(),
});
export type SubstrateReferenceDTO = z.infer<typeof SubstrateReferenceSchema>;

// Request to attach any substrate to a document
export const AttachSubstrateRequestSchema = z.object({
  substrate_type: SubstrateTypeSchema,
  substrate_id: z.string().uuid(),
  role: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
  snippets: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});
export type AttachSubstrateRequest = z.infer<typeof AttachSubstrateRequestSchema>;

// Response for substrate attachment
export const AttachSubstrateResponseSchema = z.object({
  reference: SubstrateReferenceSchema,
});
export type AttachSubstrateResponse = z.infer<typeof AttachSubstrateResponseSchema>;

// Get document references with filtering
export const GetDocumentReferencesRequestSchema = z.object({
  substrate_types: z.array(SubstrateTypeSchema).optional(), // Filter by types
  role: z.string().optional(),                              // Filter by role
  limit: z.number().int().positive().default(100),
  cursor: z.string().optional(),
});
export type GetDocumentReferencesRequest = z.infer<typeof GetDocumentReferencesRequestSchema>;

// Response with all substrate references for a document
export const GetDocumentReferencesResponseSchema = z.object({
  references: z.array(SubstrateReferenceSchema),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});
export type GetDocumentReferencesResponse = z.infer<typeof GetDocumentReferencesResponseSchema>;

// Substrate summary for UI display
export const SubstrateSummarySchema = z.object({
  substrate_type: SubstrateTypeSchema,
  substrate_id: z.string().uuid(),
  title: z.string().nullable(),
  preview: z.string(),
  created_at: z.string(),
  // Type-specific fields
  // For blocks
  state: z.string().optional(),
  version: z.number().optional(),
  // For dumps
  char_count: z.number().optional(),
  source_type: z.string().optional(),
  // For context_items
  context_type: z.string().optional(),
  is_validated: z.boolean().optional(),
  // For reflections
  reflection_type: z.string().optional(),
  computation_timestamp: z.string().optional(),
  // For timeline_events
  event_kind: z.string().optional(),
  actor_id: z.string().optional(),
});
export type SubstrateSummary = z.infer<typeof SubstrateSummarySchema>;

// Enhanced document composition response
export const DocumentCompositionSchema = z.object({
  document: z.object({
    id: z.string().uuid(),
    basket_id: z.string().uuid(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    metadata: z.record(z.any()),
  }),
  references: z.array(z.object({
    reference: SubstrateReferenceSchema,
    substrate: SubstrateSummarySchema,
  })),
  composition_stats: z.object({
    blocks_count: z.number(),
    dumps_count: z.number(),
    context_items_count: z.number(),
    reflections_count: z.number(),
    timeline_events_count: z.number(),
    total_references: z.number(),
  }),
});
export type DocumentComposition = z.infer<typeof DocumentCompositionSchema>;