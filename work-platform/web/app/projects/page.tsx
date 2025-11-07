import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { ProjectsIndexClient } from './ProjectsIndexClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  // Fetch projects (baskets are in substrate-api DB, can't join)
  const { data: projects = [], error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      basket_id,
      status,
      created_at,
      updated_at
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('[projects/page] Failed to load projects', projectsError);
  }

  // Fetch pending work requests (work_sessions in pending/running status)
  let pendingWorkSessions: any[] = [];
  try {
    const { data, error } = await supabase
      .from('work_sessions')
      .select('id,project_id,task_type,status,created_at')
      .eq('workspace_id', workspace.id)
      .in('status', ['pending', 'running']);
    if (error) throw error;
    pendingWorkSessions = data ?? [];
  } catch (err) {
    console.error('[projects/page] Failed to load pending work sessions', err);
  }

  // Group work sessions by project
  const sessionsByProject = new Map<string, { count: number; lastCreatedAt: string | null; taskType: string | null }>();
  pendingWorkSessions.forEach((session) => {
    const entry = sessionsByProject.get(session.project_id) ?? { count: 0, lastCreatedAt: null, taskType: null };
    entry.count += 1;
    if (!entry.lastCreatedAt || (session.created_at && session.created_at > entry.lastCreatedAt)) {
      entry.lastCreatedAt = session.created_at ?? entry.lastCreatedAt;
      entry.taskType = session.task_type ?? entry.taskType;
    }
    sessionsByProject.set(session.project_id, entry);
  });

  const summaries = (projects || []).map((project: any) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    basket_id: project.basket_id,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at,
    pendingWork: sessionsByProject.get(project.id) ?? { count: 0, lastCreatedAt: null, taskType: null },
  }));

  return <ProjectsIndexClient projects={summaries} />;
}
