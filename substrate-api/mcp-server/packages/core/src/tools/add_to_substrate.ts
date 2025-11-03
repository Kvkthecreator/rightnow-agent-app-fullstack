import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { AddSubstrateResponse } from '../types/index.js';
import { sessionFingerprintSchema } from '../utils/sessionFingerprint.js';

/**
 * Tool: add_to_substrate
 *
 * Add new content to YARNNN substrate with governance
 *
 * YARNNN Canon Alignment:
 * - Creates raw_dump (P0 Capture - sacred)
 * - Triggers P1 governed substrate evolution
 * - Respects workspace governance settings (auto/manual)
 *
 * Use Case:
 * - User shares new insight during LLM conversation
 * - LLM extracts key concept to add to substrate
 * - Tool captures and proposes substrate evolution
 */

export const addToSubstrateSchema = z.object({
  basket_id: z.string().optional().describe(
    'Basket ID to add substrate to. If not provided, uses default basket from context.'
  ),
  content: z.string().describe(
    'The content to add to substrate. Can be raw thoughts, structured data, or extracted insights.'
  ),
  metadata: z.record(z.any()).optional().describe(
    'Optional metadata to attach to the raw dump (e.g., {"source": "chat", "topic": "authentication"})'
  ),
  governance: z.object({
    confidence: z.number().min(0).max(1).optional().describe(
      'Confidence score for substrate proposals (0-1). High confidence may auto-approve based on workspace settings.'
    ),
    require_approval: z.boolean().optional().describe(
      'Force manual approval regardless of confidence score'
    ),
  }).optional().describe(
    'Governance options for substrate evolution'
  ),
  session_fingerprint: sessionFingerprintSchema.describe(
    'Session fingerprint used for basket inference (embedding + summary/intent metadata). Required for canon compliance.'
  ),
});

export type AddToSubstrateInput = z.infer<typeof addToSubstrateSchema>;

export async function addToSubstrate(
  input: AddToSubstrateInput,
  client: YARNNNClient
): Promise<AddSubstrateResponse> {
  try {
    // Call YARNNN backend substrate addition endpoint
    // This endpoint will:
    // 1. Create raw_dump (P0 - immutable capture)
    // 2. Trigger P1 substrate proposals
    // 3. Route based on governance settings (auto/manual/confidence)
    const response = await client.post<AddSubstrateResponse>(
      '/api/mcp/substrate',
      {
        basket_id: input.basket_id,
        content: input.content,
        metadata: input.metadata,
        governance: input.governance,
        session_fingerprint: input.session_fingerprint,
      }
    );

    return response;
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to add to substrate',
    };
  }
}

/**
 * Tool metadata for MCP registration
 */
export const addToSubstrateTool = {
  name: 'add_to_substrate',
  description: `Add new content to YARNNN substrate memory with governance.

This tool captures new content into YARNNN's substrate layer following Canon v3.0:

Flow:
1. Content captured as immutable raw_dump (P0 - Sacred Capture)
2. Agent analyzes for substrate evolution (P1)
3. Proposes substrate operations (CREATE/UPDATE/MERGE/REVISE)
4. Governance routing based on workspace settings:
   - AUTO: High-confidence proposals execute immediately
   - MANUAL: All proposals require user approval
   - CONFIDENCE: Confidence score determines routing

Use this when:
- User shares new insight during conversation
- LLM extracts key concept to preserve
- User wants to update substrate with new information

Governance:
- confidence: 0-1 score affects auto-approval (higher = more likely)
- require_approval: Force manual approval even if auto mode

Returns:
- status: success/error
- raw_dump_id: The captured raw dump ID
- proposed_blocks: Number of substrate proposals created
- governance_mode: How proposals were routed (auto/manual)`,
  inputSchema: addToSubstrateSchema,
};
