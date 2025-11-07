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
      project_type,
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

  // TODO: Fetch blocks and documents from substrate-api via HTTP
  // These tables are in substrate DB, not work-platform DB
  // For now, set to 0 until we implement substrate client calls
  const blocksCount = 0;
  const documentsCount = 0;

  // Future implementation:
  // const substrateClient = getSubstrateClient();
  // const basket = await substrateClient.getBasket(project.basket_id);
  // const blocksCount = basket.blocks_count;
  // const documentsCount = basket.documents_count;

  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    basket_id: project.basket_id,
    project_type: project.project_type,
    status: project.status,
    workspace_id: project.workspace_id,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
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
