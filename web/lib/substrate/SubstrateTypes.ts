// TRUE CONTEXT OS - Unified Substrate Type Definitions
// All substrate types as peers, not hierarchical

export interface SubstrateElement {
  id: string;
  type: SubstrateType;
  basketId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubstrateType = 'raw_dump' | 'block' | 'context_item' | 'narrative' | 'document';

export interface RawDump extends SubstrateElement {
  type: 'raw_dump';
  content: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface Block extends SubstrateElement {
  type: 'block';
  title: string;
  content: string;
  status: 'proposed' | 'accepted' | 'rejected';
  rawDumpId?: string;
  metadata?: Record<string, any>;
}

import type { ContextItem as ContractContextItem } from '@shared/contracts/context';

export interface ContextElement extends SubstrateElement, ContractContextItem {
  type: 'context_item';
  semanticType: 'theme' | 'question' | 'insight' | 'connection' | 'tag';
  references: SubstrateRef[];
}

export interface Narrative extends SubstrateElement {
  type: 'narrative';
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'plain';
  references: SubstrateRef[];
  metadata?: Record<string, any>;
}

export interface Document extends SubstrateElement {
  type: 'document';
  title: string;
  composition: CompositionElement[];
  metadata?: Record<string, any>;
}

export interface CompositionElement {
  id: string;
  type: SubstrateType;
  substrateId: string;
  order: number;
  excerpt?: string;
  displayMode?: 'full' | 'excerpt' | 'reference';
}

export interface SubstrateRef {
  id: string;
  type: SubstrateType;
  basketId: string;
}

export interface Relationship {
  id: string;
  from: SubstrateRef;
  to: SubstrateRef;
  type: RelationshipType;
  strength?: number;
  metadata?: Record<string, any>;
}

export type RelationshipType = 
  | 'derives_from'    // block derives from raw_dump
  | 'references'      // document references block
  | 'contextualizes'  // context_item contextualizes anything
  | 'contradicts'     // semantic opposition
  | 'supports'        // semantic agreement
  | 'extends'         // builds upon
  | 'synthesizes';    // combines multiple sources

export interface SubstrateOperation {
  type: 'add' | 'update' | 'delete' | 'compose' | 'link' | 'process';
  substrate: Partial<SubstrateElement>;
  agentType?: string;
  relationships?: Relationship[];
}

export interface SubstrateResponse {
  success: boolean;
  data?: SubstrateElement | SubstrateElement[];
  relationships?: Relationship[];
  error?: string;
}

export interface AgentRequest {
  agentType: string;
  operation: string;
  data: any;
  basketId: string;
  workspaceId: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}