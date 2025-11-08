/**
 * Page: /projects/[id]/overview - Project Overview
 *
 * Primary project dashboard showing:
 * - Project metadata (name, description)
 * - Key metrics (context items, active work, completed work)
 * - Quick actions (create work request, add context, view reports)
 * - Context basket summary
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { ProjectOverviewClient } from "./ProjectOverviewClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectOverviewPage({ params }: PageProps) {
  const { id: projectId } = await params;
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Fetch project (baskets are in separate DB, fetch separately via API)
  const { data: project } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      basket_id,
      workspace_id,
      user_id,
      status,
      created_at,
      updated_at
    `)
    .eq('id', projectId)
    .maybeSingle() as { data: any };

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Project not found</h2>
          <p className="mt-2 text-sm text-slate-600">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch project agents (auto-scaffolded on project creation)
  const { data: projectAgents } = await supabase
    .from('project_agents')
    .select('id, agent_type, display_name, is_active, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  // Fetch work sessions stats
  const { data: workSessions } = await supabase
    .from('work_sessions')
    .select('id, status, task_type, created_at')
    .eq('project_id', projectId);

  const sessionStats = {
    total: workSessions?.length || 0,
    pending: workSessions?.filter(s => s.status === 'pending').length || 0,
    running: workSessions?.filter(s => s.status === 'running').length || 0,
    paused: workSessions?.filter(s => s.status === 'paused').length || 0,
    completed: workSessions?.filter(s => s.status === 'completed').length || 0,
    failed: workSessions?.filter(s => s.status === 'failed').length || 0,
  };

  // Fetch basket data from substrate-api via BFF pattern
  // Call our Next.js API route which proxies to substrate-api
  let blocksCount = 0;
  let documentsCount = 0;
  let basketName = project.name;

  try {
    const basketResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/baskets/${project.basket_id}`,
      {
        headers: {
          // Forward cookies for authentication
          Cookie: (await cookies()).toString(),
        },
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (basketResponse.ok) {
      const basketData = await basketResponse.json();
      blocksCount = basketData.stats?.blocks_count || 0;
      documentsCount = basketData.stats?.documents_count || 0;
      basketName = basketData.name || project.name;
    } else {
      console.warn(`[Project Overview] Failed to fetch basket ${project.basket_id}: ${basketResponse.status}`);
    }
  } catch (error) {
    console.error(`[Project Overview] Error fetching basket ${project.basket_id}:`, error);
    // Continue with 0 counts if fetch fails
  }

  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    basket_id: project.basket_id,
    basket_name: basketName,
    status: project.status,
    workspace_id: project.workspace_id,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    agents: projectAgents || [],
    stats: {
      contextItems: blocksCount || 0,
      documents: documentsCount || 0,
      workSessions: sessionStats,
    },
  };

  return (
    <div className="space-y-6 pb-8">
      <ProjectOverviewClient project={projectData} />
    </div>
  );
}
