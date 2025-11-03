import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { SubstrateResponse } from '../types/index.js';

/**
 * Tool: get_substrate
 *
 * Query YARNNN substrate memory
 *
 * YARNNN Canon Alignment:
 * - Reads substrate layer (blocks, items, raw_dumps)
 * - No artifact layer access (documents/reflections separate)
 * - Returns peer substrates without hierarchy
 *
 * Use Case:
 * - LLM needs context about user's product/project
 * - User asks "What do we know about X?"
 * - Tool fetches relevant substrate for LLM to synthesize
 */

export const getSubstrateSchema = z.object({
  basket_id: z.string().optional().describe(
    'Basket ID to query. If not provided, uses default basket from context.'
  ),
  keywords: z.array(z.string()).optional().describe(
    'Keywords to filter substrate (e.g., ["authentication", "user flow"])'
  ),
  anchors: z.array(z.string()).optional().describe(
    'Specific anchors to retrieve (e.g., ["core_problem", "product_vision"])'
  ),
  format: z.enum(['structured', 'prose']).default('structured').describe(
    'Output format: "structured" returns JSON substrate items, "prose" returns narrative summary'
  ),
  limit: z.number().optional().default(50).describe(
    'Maximum number of substrate items to return'
  ),
});

export type GetSubstrateInput = z.infer<typeof getSubstrateSchema>;

export async function getSubstrate(
  input: GetSubstrateInput,
  client: YARNNNClient
): Promise<SubstrateResponse> {
  try {
    // Build query params
    const params: Record<string, string> = {
      format: input.format,
      limit: input.limit?.toString() || '50',
    };

    if (input.basket_id) {
      params.basket_id = input.basket_id;
    }

    if (input.keywords && input.keywords.length > 0) {
      params.keywords = input.keywords.join(',');
    }

    if (input.anchors && input.anchors.length > 0) {
      params.anchors = input.anchors.join(',');
    }

    // Call YARNNN backend substrate query endpoint
    const response = await client.get<SubstrateResponse>(
      '/api/mcp/substrate',
      params
    );

    return response;
  } catch (error) {
    return {
      substrate: [],
      total_count: 0,
      substrate_snapshot_id: undefined,
    };
  }
}

/**
 * Tool metadata for MCP registration
 */
export const getSubstrateTool = {
  name: 'get_substrate',
  description: `Query YARNNN substrate memory to retrieve context.

This tool fetches substrate (memory) from YARNNN's knowledge layer:
- Context Blocks: Structured knowledge (goals, constraints, entities)
- Context Items: Semantic connections between concepts
- Raw Dumps: Immutable captured thoughts

Use this when:
- User asks "What do we know about X?"
- You need context to answer user questions
- User wants to review captured substrate

The substrate is returned as peer items (no hierarchy) following YARNNN Canon v3.0.

Output formats:
- "structured": JSON array of substrate items with metadata
- "prose": Narrative summary of substrate for readability

Returns:
- substrate: Array of substrate items
- total_count: Total items available (may be > limit)
- substrate_snapshot_id: Snapshot ID for composition reference`,
  inputSchema: getSubstrateSchema,
};
