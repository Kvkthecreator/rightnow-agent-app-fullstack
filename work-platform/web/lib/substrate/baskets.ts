/**
 * Substrate-API basket client
 *
 * These functions call substrate-api HTTP endpoints to fetch basket data.
 * work-platform should NEVER have its own basket management - baskets are
 * owned by substrate-api.
 */

import { createBrowserClient } from "@/lib/supabase/clients";

export type BasketOverview = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string | null;
};

/**
 * List all baskets for a workspace
 * Calls substrate-api via direct database query for now
 * TODO: Replace with HTTP call to substrate-api once BFF endpoints are set up
 */
export async function listBasketsByWorkspace(
  workspaceId: string
): Promise<{ data: BasketOverview[] | null; error: any }> {
  const supabase = createBrowserClient();

  try {
    const { data, error } = await supabase
      .from('baskets')
      .select('id, name, description, status, workspace_id, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (e) {
    console.error('❌ Failed to list baskets:', e);
    return { data: null, error: e };
  }
}

/**
 * Pick the most relevant basket for a user
 * Simple heuristic: most recently created basket in workspace
 * TODO: Replace with substrate-api intelligence endpoint
 */
export async function pickMostRelevantBasket(
  workspaceId: string
): Promise<BasketOverview | null> {
  const { data } = await listBasketsByWorkspace(workspaceId);

  if (!data || data.length === 0) {
    return null;
  }

  // Return most recently created
  return data[0];
}

/**
 * Accepted file types for basket uploads
 * Kept minimal - full validation happens in substrate-api
 */
export const ACCEPTED_FILE_TYPES = [
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.pdf',
  '.doc',
  '.docx',
] as const;

/**
 * Create a basket with seed content
 * TODO: This should be a POST to substrate-api HTTP endpoint
 * For now, keeping minimal stub
 */
export async function createBasketWithSeed(params: {
  workspaceId: string;
  name: string;
  description?: string;
  seedContent?: string;
}): Promise<{ basket: BasketOverview | null; error: any }> {
  const supabase = createBrowserClient();

  try {
    // Call substrate-api to create basket
    // For now, direct DB insert (TEMPORARY - should be HTTP call)
    const { data, error } = await supabase
      .from('baskets')
      .insert({
        workspace_id: params.workspaceId,
        name: params.name,
        description: params.description || null,
        status: 'active',
      })
      .select('id, name, description, status, workspace_id, created_at, updated_at')
      .single();

    if (error) {
      return { basket: null, error };
    }

    // TODO: Send seedContent to substrate-api for processing

    return { basket: data, error: null };
  } catch (e) {
    console.error('❌ Failed to create basket:', e);
    return { basket: null, error: e };
  }
}
