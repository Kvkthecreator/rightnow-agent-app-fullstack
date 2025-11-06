// web/lib/projects/getAllProjects.ts
import { createBrowserClient } from "@/lib/supabase/clients";

export type ProjectOverview = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export async function getAllProjects(): Promise<ProjectOverview[]> {
  const supabase = createBrowserClient();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return [];

    // Resolve user's current workspace (first membership)
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    let query = supabase
      .from('projects')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false });

    if (membership?.workspace_id) {
      query = query.eq('workspace_id', membership.workspace_id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('❌ Supabase error while fetching projects:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error('❌ getAllProjects failed:', e);
    return [];
  }
}
