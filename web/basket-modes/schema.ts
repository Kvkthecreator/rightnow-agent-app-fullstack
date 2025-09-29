import { z } from 'zod';

export const anchorScopeSchema = z.enum(['core', 'brain']);

export const anchorSpecSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  scope: anchorScopeSchema,
  substrateType: z.enum(['block', 'context_item', 'relationship']),
  description: z.string().min(1),
  acceptanceCriteria: z.string().min(1),
  required: z.boolean(),
  dependsOn: z.array(z.string().min(1)).optional(),
});

export const captureRecipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  captureType: z.enum(['raw_dump', 'file_upload', 'inline_block', 'inline_context']),
  prompt: z.string().optional(),
  intentMetadata: z.record(z.string(), z.string()).optional(),
  anchorRefs: z.array(z.string().min(1)).optional(),
});

export const deliverableSpecSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  composeIntent: z.string().min(1),
  requiredAnchors: z.array(z.string().min(1)).nonempty(),
  optionalAnchors: z.array(z.string().min(1)).optional(),
});

export const progressRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  requiredAnchors: z.array(z.string().min(1)).optional(),
  minCounts: z.record(z.string(), z.number().int().positive()).optional(),
});

export const modeStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cta: z
    .object({
      label: z.string().min(1),
      href: z.string().min(1),
    })
    .optional(),
});

export const basketModeConfigSchema = z.object({
  id: z.enum(['default', 'product_brain', 'campaign_brain']),
  label: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  onboarding: z.object({
    headline: z.string().min(1),
    steps: z.array(modeStepSchema).nonempty(),
    completion: z.string().min(1),
  }),
  anchors: z.object({
    core: z.array(anchorSpecSchema),
    brain: z.array(anchorSpecSchema),
  }),
  captureRecipes: z.array(captureRecipeSchema),
  deliverables: z.array(deliverableSpecSchema),
  progress: z.object({
    checklist: z.array(progressRuleSchema),
  }),
});

export type BasketModeConfigInput = z.infer<typeof basketModeConfigSchema>;
