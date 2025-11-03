export type AnchorScope = 'core' | 'brain' | 'custom';
export type AnchorExpectedType = 'block' | 'context_item';
export type AnchorLifecycleStatus = 'missing' | 'draft' | 'approved' | 'stale' | 'archived';

export interface BasketAnchorRecord {
  id: string; // registry id (uuid)
  basket_id: string;
  anchor_key: string;
  label: string;
  scope: AnchorScope;
  expected_type: AnchorExpectedType;
  required: boolean;
  description?: string | null;
  ordering?: number | null;
  status: 'active' | 'archived';
  linked_substrate_id?: string | null;
  metadata: Record<string, any>;
  last_refreshed_at?: string | null;
  last_relationship_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AnchorSubstrateSummary {
  id: string;
  type: AnchorExpectedType;
  title: string;
  content_snippet: string | null;
  semantic_type: string | null;
  state: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata?: Record<string, any> | null;
}

export interface AnchorStatusSummary {
  anchor_key: string;
  scope: AnchorScope;
  expected_type: AnchorExpectedType;
  label: string;
  required: boolean;
  description?: string | null;
  ordering?: number | null;
  lifecycle: AnchorLifecycleStatus;
  is_stale: boolean;
  linked_substrate?: AnchorSubstrateSummary | null;
  relationships: number;
  last_refreshed_at?: string | null;
  last_updated_at?: string | null;
  last_relationship_count?: number;
  registry_id: string;
  metadata: Record<string, any>;
}
