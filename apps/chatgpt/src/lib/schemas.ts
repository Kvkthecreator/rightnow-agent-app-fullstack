import { z } from 'zod';

export const CompositionWindow = z.object({
  daysBack: z.number().int().positive().optional(),
  anchors: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
}).optional();

export const ComposeDocumentInput = z.object({
  basketId: z.string().uuid(),
  intent: z.string().min(10),
  documentType: z.enum(['brief', 'report', 'analysis', 'summary', 'memo']).optional(),
  window: CompositionWindow,
  citations: z.boolean().default(true),
});

export const ComposeDocumentResult = z.object({
  success: z.boolean(),
  document_id: z.string().uuid().optional(),
  version_hash: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  message: z.string().optional(),
});

export type ComposeDocumentInputType = z.infer<typeof ComposeDocumentInput>;
export type ComposeDocumentResultType = z.infer<typeof ComposeDocumentResult>;
