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
const ACCEPTED_FILE_TYPES_ARRAY = [
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.pdf',
  '.doc',
  '.docx',
] as const;

export const ACCEPTED_FILE_TYPES = ACCEPTED_FILE_TYPES_ARRAY.join(',');

/**
 * Create a basket with seed content
 * TODO: This should be a POST to substrate-api HTTP endpoint
 * For now, keeping minimal stub with expected parameters
 */
export async function createBasketWithSeed(params: {
  name: string;
  mode?: string;
  rawDump?: string;
  files?: File[];
  description?: string;
}): Promise<{ nextUrl: string }> {
  const supabase = createBrowserClient();

  try {
    // Get current user's workspace
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!membership?.workspace_id) {
      throw new Error('No workspace found');
    }

    // Call substrate-api to create basket
    // For now, direct DB insert (TEMPORARY - should be HTTP call)
    const { data, error } = await supabase
      .from('baskets')
      .insert({
        workspace_id: membership.workspace_id,
        name: params.name,
        description: params.description || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    // TODO: Send rawDump and files to substrate-api for processing
    // For now, just return the basket URL

    return { nextUrl: `/baskets/${data.id}/overview` };
  } catch (e) {
    console.error('❌ Failed to create basket:', e);
    throw e;
  }
}
