import { z } from "zod";

/**
 * Reflection Artifact v2.0 - Computed insights targeting substrate or documents
 * 
 * Reflections are artifacts that can target:
 * - Substrate state (current basket substrate)
 * - Document versions (specific document snapshots)
 * - Legacy baskets (backward compatibility)
 */

// Reflection target types
export const ReflectionTargetTypeSchema = z.enum([
  "substrate",   // Targets current substrate state
  "document",    // Targets specific document version
  "legacy"       // Backward compatibility
]);
export type ReflectionTargetType = z.infer<typeof ReflectionTargetTypeSchema>;

// Updated reflection DTO for artifact model
export const ReflectionDTOSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  reflection_text: z.string().min(1),
  substrate_hash: z.string().optional(),          // Legacy field
  computation_timestamp: z.string(),
  
  // New flexible targeting
  reflection_target_type: ReflectionTargetTypeSchema.default("legacy"),
  reflection_target_id: z.string().uuid().optional(),
  reflection_target_version: z.string().optional(),
  
  // Legacy fields (for backward compatibility)
  substrate_window_start: z.string().optional(),
  substrate_window_end: z.string().optional(),
  
  meta: z
    .object({
      computation_trace_id: z.string().uuid().optional(),
      substrate_dump_count: z.number().int().min(0).optional(),
      substrate_tokens: z.number().int().min(0).optional(),
    })
    .catchall(z.unknown())
    .optional(),
}).strict();

export type ReflectionDTO = z.infer<typeof ReflectionDTOSchema>;

// Request to create reflection from substrate
export const CreateSubstrateReflectionRequestSchema = z.object({
  basket_id: z.string().uuid(),
  reflection_text: z.string().min(1),
});
export type CreateSubstrateReflectionRequest = z.infer<typeof CreateSubstrateReflectionRequestSchema>;

// Request to create reflection from document
export const CreateDocumentReflectionRequestSchema = z.object({
  basket_id: z.string().uuid(),
  document_id: z.string().uuid(),
  reflection_text: z.string().min(1),
});
export type CreateDocumentReflectionRequest = z.infer<typeof CreateDocumentReflectionRequestSchema>;

export const GetReflectionsResponseSchema = z.object({
  reflections: z.array(ReflectionDTOSchema),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
}).strict();

export type GetReflectionsResponse = z.infer<typeof GetReflectionsResponseSchema>;