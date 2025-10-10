import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { CreateMemoryResponse } from '../types/index.js';
import { sessionFingerprintSchema } from '../utils/sessionFingerprint.js';

/**
 * Tool: create_memory_from_chat
 *
 * Create a new YARNNN basket from conversation history
 *
 * YARNNN Canon Alignment:
 * - Creates basket with initial raw_dumps (P0 Capture)
 * - Triggers P1 governed substrate evolution
 * - Returns governance actions for user approval
 *
 * Use Case:
 * - LLM had conversation with user about a product/project
 * - User wants to capture insights into YARNNN substrate
 * - Tool creates basket, captures raw thoughts, initiates substrate proposals
 */

export const createMemoryFromChatSchema = z.object({
  conversation_history: z.string().describe(
    'The conversation history to capture. Should be formatted as alternating user/assistant messages.'
  ),
  basket_name_suggestion: z.string().optional().describe(
    'Suggested name for the basket (e.g., "Product Vision Q4 2024")'
  ),
  anchor_suggestions: z.record(z.string()).optional().describe(
    'Key concepts to seed as anchors (e.g., {"core_problem": "Users struggle with context management", "product_vision": "Build context OS"})'
  ),
  session_fingerprint: sessionFingerprintSchema.describe(
    'Session fingerprint used for basket inference (embedding + summary/intent metadata). Required for canon compliance.'
  ),
});

export type CreateMemoryFromChatInput = z.infer<typeof createMemoryFromChatSchema>;

export async function createMemoryFromChat(
  input: CreateMemoryFromChatInput,
  client: YARNNNClient
): Promise<CreateMemoryResponse> {
  try {
    // Call YARNNN backend MCP onboarding endpoint
    // This endpoint will:
    // 1. Create new basket
    // 2. Create raw_dumps from conversation (P0)
    // 3. Trigger P1 substrate proposals
    // 4. Return governance actions
    const response = await client.post<CreateMemoryResponse>(
      '/api/mcp/onboarding/create-from-chat',
      {
        conversation_history: input.conversation_history,
        basket_name: input.basket_name_suggestion,
        anchor_seeds: input.anchor_suggestions,
        session_fingerprint: input.session_fingerprint,
      }
    );

    return response;
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to create memory from chat',
    };
  }
}

/**
 * Tool metadata for MCP registration
 */
export const createMemoryFromChatTool = {
  name: 'create_memory_from_chat',
  description: `Create a new YARNNN basket from conversation history.

This tool captures a conversation between you (the LLM) and a user into YARNNN's substrate memory system. The conversation will be:
1. Captured as immutable raw dumps (P0)
2. Analyzed to extract structured substrate (P1 - governed proposals)
3. Organized into a new basket with suggested anchors

Use this when:
- User had a productive conversation about a product/project
- User wants to preserve insights as renewable substrate
- User wants to start building a product brain from chat

Returns:
- basket_id: The new basket identifier
- basket_name: The basket name
- blocks_created: Number of substrate blocks proposed
- visualization: Text visualization of captured substrate
- actions: Required governance actions (approve/reject proposals)`,
  inputSchema: createMemoryFromChatSchema,
};
