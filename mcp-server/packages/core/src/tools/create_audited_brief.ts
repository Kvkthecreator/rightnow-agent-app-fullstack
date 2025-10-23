import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { AuditedBriefResponse } from '../types/index.js';

export const createAuditedBriefSchema = z.object({
  basketId: z.string().uuid().describe('Target basket to ground the GTM brief.'),
  topic: z.string().min(3).describe('Focus topic for the brief.'),
  audience: z.string().min(3).describe('Intended audience (e.g., "Revenue Leadership").'),
  goals: z.array(z.string().min(3)).min(1).describe('Primary goals or questions to answer.'),
  citations: z.boolean().default(true).describe('Include provenance metadata in the response.'),
});

export type CreateAuditedBriefInput = z.infer<typeof createAuditedBriefSchema>;

interface BriefComposePayload {
  basketId: string;
  topic: string;
  audience: string;
  goals: string[];
  citations: boolean;
}

export async function createAuditedBrief(
  input: CreateAuditedBriefInput,
  client: YARNNNClient
): Promise<AuditedBriefResponse> {
  try {
    return await client.post<AuditedBriefResponse>('/api/briefs/compose', {
      basketId: input.basketId,
      topic: input.topic,
      audience: input.audience,
      goals: input.goals,
      citations: input.citations,
    } satisfies BriefComposePayload);
  } catch (error) {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      title: 'Brief composition failed',
      sections: [
        {
          heading: 'Error',
          content: [
            {
              text: error instanceof Error ? error.message : 'Failed to compose audited GTM brief.',
              provenance: [],
            },
          ],
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const createAuditedBriefTool = {
  name: 'create_audited_gtm_brief',
  description: `Compose a GTM brief grounded in Yarnnn substrate with paragraph-level provenance.`,
  inputSchema: createAuditedBriefSchema,
};
