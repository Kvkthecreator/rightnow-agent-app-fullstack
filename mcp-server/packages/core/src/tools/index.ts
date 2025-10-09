/**
 * YARNNN MCP Tools Index
 *
 * Exports all MCP tools with their schemas and handlers
 *
 * Basket inference and confidence handling follow
 * docs/BASKET_INFERENCE_SPEC.md. Adapters SHOULD call the basket-selection
 * helper before invoking these handlers and surface the appropriate UX state
 * (auto, confirm, pick-list) based on the returned score.
 */

import {
  createMemoryFromChat,
  createMemoryFromChatTool,
  type CreateMemoryFromChatInput,
} from './create_memory_from_chat.js';

import {
  getSubstrate,
  getSubstrateTool,
  type GetSubstrateInput,
} from './get_substrate.js';

import {
  addToSubstrate,
  addToSubstrateTool,
  type AddToSubstrateInput,
} from './add_to_substrate.js';

import {
  validateAgainstSubstrate,
  validateAgainstSubstrateTool,
  type ValidateAgainstSubstrateInput,
} from './validate_against_substrate.js';

import type { YARNNNClient } from '../client.js';

/**
 * Tool registry for MCP server
 */
export const tools = {
  create_memory_from_chat: createMemoryFromChatTool,
  get_substrate: getSubstrateTool,
  add_to_substrate: addToSubstrateTool,
  validate_against_substrate: validateAgainstSubstrateTool,
} as const;

/**
 * Tool handler type
 */
export type ToolHandler = (input: any, client: YARNNNClient) => Promise<any>;

/**
 * Tool handlers map
 */
export const toolHandlers: Record<string, ToolHandler> = {
  create_memory_from_chat: createMemoryFromChat,
  get_substrate: getSubstrate,
  add_to_substrate: addToSubstrate,
  validate_against_substrate: validateAgainstSubstrate,
};

/**
 * Get tool list for MCP server registration
 */
export function getToolsList() {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Execute tool by name
 */
export async function executeTool(
  toolName: string,
  input: any,
  client: YARNNNClient
): Promise<any> {
  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Validate input against schema
  const tool = tools[toolName as keyof typeof tools];
  const validatedInput = tool.inputSchema.parse(input);

  // Execute handler
  return await handler(validatedInput, client);
}
