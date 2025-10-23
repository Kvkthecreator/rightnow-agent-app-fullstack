import { z } from 'zod';

export const CreateAuditedGtmBriefInput = z.object({
  basketId: z.string().uuid(),
  topic: z.string().min(3),
  audience: z.string().min(3),
  goals: z.array(z.string().min(3)).min(1),
  citations: z.boolean().default(true)
});

export const ProvenanceRef = z.object({
  block_id: z.string().uuid(),
  source_url: z.string().url().optional(),
  excerpt: z.string().optional(),
  offsets: z.tuple([z.number(), z.number()]).optional()
});

export const AuditedParagraph = z.object({
  text: z.string(),
  provenance: z.array(ProvenanceRef)
});

export const AuditedGtmBrief = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.array(AuditedParagraph)
    })
  ),
  generatedAt: z.string().optional()
});

export type CreateAuditedGtmBriefInputType = z.infer<typeof CreateAuditedGtmBriefInput>;
export type AuditedGtmBriefType = z.infer<typeof AuditedGtmBrief>;
