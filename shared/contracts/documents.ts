import { z } from "zod";

// Re-export substrate reference types for documents
export { 
  SubstrateTypeSchema,
  SubstrateReferenceSchema,
  AttachSubstrateRequestSchema,
  AttachSubstrateResponseSchema,
  GetDocumentReferencesRequestSchema,
  GetDocumentReferencesResponseSchema,
  DocumentCompositionSchema,
  type SubstrateType,
  type SubstrateReferenceDTO,
  type AttachSubstrateRequest,
  type AttachSubstrateResponse,
  type GetDocumentReferencesRequest,
  type GetDocumentReferencesResponse,
  type DocumentComposition,
  type SubstrateSummary,
} from './substrate_references';

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).default({}),
});
export type DocumentDTO = z.infer<typeof DocumentSchema>;

export const BlockSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  title: z.string().nullable(),
  body_md: z.string().nullable(),
  state: z.string(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).default({}),
});
export type BlockDTO = z.infer<typeof BlockSchema>;

// DEPRECATED: Use SubstrateReferenceDTO instead for substrate canon compliance
export const BlockLinkSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  block_id: z.string().uuid(),
  occurrences: z.number().int().default(0),
  snippets: z.any().default([]),
});
export type BlockLinkDTO = z.infer<typeof BlockLinkSchema>;

// API Request Schemas
export const CreateDocumentRequestSchema = z.object({
  basket_id: z.string().uuid(),
  title: z.string(),
  metadata: z.record(z.any()).optional(),
});
export type CreateDocumentRequest = z.infer<typeof CreateDocumentRequestSchema>;

export const CreateDocumentResponseSchema = z.object({
  document_id: z.string().uuid(),
});
export type CreateDocumentResponse = z.infer<typeof CreateDocumentResponseSchema>;

export const UpdateDocumentRequestSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>;

export const AttachBlockRequestSchema = z.object({
  block_id: z.string().uuid(),
  occurrences: z.number().int().optional(),
  snippets: z.any().default([]),
});
export type AttachBlockRequest = z.infer<typeof AttachBlockRequestSchema>;

// API Response Schemas
export const GetDocumentsResponseSchema = z.object({
  documents: z.array(DocumentSchema),
  last_cursor: z.string().optional(),
});
export type GetDocumentsResponse = z.infer<typeof GetDocumentsResponseSchema>;

export const GetBlocksResponseSchema = z.object({
  blocks: z.array(BlockSchema),
  last_cursor: z.string().optional(),
});
export type GetBlocksResponse = z.infer<typeof GetBlocksResponseSchema>;

// Graph/Relationship Schemas for Task E.7
export const RelationshipSchema = z.object({
  from_type: z.string(),
  from_id: z.string().uuid(),
  to_type: z.string(),
  to_id: z.string().uuid(),
  relationship_type: z.string(),
  strength: z.number().min(0).max(1),
});
export type RelationshipDTO = z.infer<typeof RelationshipSchema>;

export const GetGraphResponseSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().uuid(),
    type: z.string(),
    title: z.string(),
    metadata: z.record(z.any()).default({}),
  })),
  edges: z.array(RelationshipSchema),
});
export type GetGraphResponse = z.infer<typeof GetGraphResponseSchema>;

// Legacy types (keep for backward compatibility during transition)
export type Document = {
  id: string;
  title: string;
  basket_id: string;
  content_raw?: string;
  document_type?: string;
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
};
