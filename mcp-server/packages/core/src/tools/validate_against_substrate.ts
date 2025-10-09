import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { ValidationResponse } from '../types/index.js';

/**
 * Tool: validate_against_substrate
 *
 * Validate new ideas against existing substrate
 *
 * YARNNN Canon Alignment:
 * - Queries substrate for conflict detection
 * - Identifies contradictions, overlaps, refinements
 * - Helps maintain substrate coherence
 *
 * Use Case:
 * - User proposes new feature/idea
 * - LLM checks if it conflicts with existing substrate
 * - Tool provides alignment analysis and recommendations
 */

export const validateAgainstSubstrateSchema = z.object({
  basket_id: z.string().optional().describe(
    'Basket ID to validate against. If not provided, uses default basket from context.'
  ),
  new_idea: z.string().describe(
    'The new idea, feature, or concept to validate against existing substrate.'
  ),
  focus_areas: z.array(z.string()).optional().describe(
    'Specific substrate areas to focus validation on (e.g., ["core_problem", "technical_constraints"])'
  ),
  return_evidence: z.boolean().optional().default(true).describe(
    'Include substrate evidence in conflict items'
  ),
});

export type ValidateAgainstSubstrateInput = z.infer<typeof validateAgainstSubstrateSchema>;

export async function validateAgainstSubstrate(
  input: ValidateAgainstSubstrateInput,
  client: YARNNNClient
): Promise<ValidationResponse> {
  try {
    // Call YARNNN backend validation endpoint
    // This endpoint will:
    // 1. Query relevant substrate
    // 2. Analyze new idea against substrate
    // 3. Detect conflicts/contradictions
    // 4. Compute alignment score
    // 5. Provide recommendation
    const response = await client.post<ValidationResponse>(
      '/api/mcp/validate',
      {
        basket_id: input.basket_id,
        new_idea: input.new_idea,
        focus_areas: input.focus_areas,
        return_evidence: input.return_evidence,
      }
    );

    return response;
  } catch (error) {
    return {
      alignment_score: 0,
      conflicts: [],
      recommendation: 'Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      analysis: 'Could not complete validation due to error',
    };
  }
}

/**
 * Tool metadata for MCP registration
 */
export const validateAgainstSubstrateTool = {
  name: 'validate_against_substrate',
  description: `Validate new ideas against existing YARNNN substrate.

This tool checks if a new idea/feature/concept aligns with or conflicts with existing substrate memory:

Analysis includes:
- Contradiction detection: New idea contradicts existing substrate
- Overlap detection: New idea duplicates existing concepts
- Refinement detection: New idea enhances existing substrate

Use this when:
- User proposes new feature/direction
- LLM wants to check consistency
- User asks "Does this align with our product?"

Conflict types:
- contradiction: Direct conflict requiring resolution
- overlap: Duplicate concept (merge candidate)
- refinement: Enhancement to existing substrate

Severity levels:
- high: Critical conflict requiring immediate attention
- medium: Notable overlap or contradiction
- low: Minor refinement opportunity

Returns:
- alignment_score: 0-1 score (0=conflict, 1=perfect alignment)
- conflicts: Array of detected conflicts with evidence
- recommendation: Action recommendation (proceed/revise/merge)
- analysis: Detailed alignment analysis`,
  inputSchema: validateAgainstSubstrateSchema,
};
