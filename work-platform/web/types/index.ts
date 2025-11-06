/**
 * Component: TypeDefinitions
 * Type definitions re-exported from shared contracts
 * @contract renders: Document, Block, Basket, ContextItem, Dump
 */
// Re-export from shared contracts for backward compatibility
export * from "@/shared/contracts";

// Legacy exports for compatibility
export type { Document } from "@/shared/contracts/documents";
export type { Block, BlockWithHistory } from "@/shared/contracts/blocks";
export type { Dump, RawDump } from "@/shared/contracts/dumps";

// Basket type (deprecated - baskets now handled by substrate-api)
export interface Basket {
  id: string;
  name: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}
