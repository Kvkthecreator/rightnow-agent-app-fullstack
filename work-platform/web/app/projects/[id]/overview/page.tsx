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

  // Fetch project with basket info
  const { data: project } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      basket_id,
      workspace_id,
      created_by_user_id,
      created_at,
      updated_at,
      baskets!inner(
        id,
        name,
        description,
        status
      )
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

  // Fetch context blocks count (from basket)
  const { count: blocksCount } = await supabase
    .from('blocks')
    .select('id', { count: 'exact', head: true })
    .eq('basket_id', project.basket_id);

  // Fetch documents count (reports)
  const { count: documentsCount } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('basket_id', project.basket_id);

  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    basket_id: project.basket_id,
    basket_name: project.baskets?.name,
    basket_status: project.baskets?.status,
    workspace_id: project.workspace_id,
    created_by_user_id: project.created_by_user_id,
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
