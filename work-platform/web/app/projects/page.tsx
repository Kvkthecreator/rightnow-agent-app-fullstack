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

  // Fetch pending work tickets (work_tickets in pending/running status)
  let pendingWorkSessions: any[] = [];
  try {
    const { data, error } = await supabase
      .from('work_tickets')
      .select('id,basket_id,task_type,status,created_at')
      .in('status', ['pending', 'running']);
    if (error) throw error;
    pendingWorkSessions = data ?? [];
  } catch (err) {
    console.error('[projects/page] Failed to load pending work tickets', err);
  }

  // Group work tickets by basket_id (then map to projects)
  const sessionsByBasket = new Map<string, { count: number; lastCreatedAt: string | null; taskType: string | null }>();
  pendingWorkSessions.forEach((session) => {
    const entry = sessionsByBasket.get(session.basket_id) ?? { count: 0, lastCreatedAt: null, taskType: null };
    entry.count += 1;
    if (!entry.lastCreatedAt || (session.created_at && session.created_at > entry.lastCreatedAt)) {
      entry.lastCreatedAt = session.created_at ?? entry.lastCreatedAt;
      entry.taskType = session.task_type ?? entry.taskType;
    }
    sessionsByBasket.set(session.basket_id, entry);
  });

  const summaries = (projects || []).map((project: any) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    basket_id: project.basket_id,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at,
    pendingWork: sessionsByBasket.get(project.basket_id) ?? { count: 0, lastCreatedAt: null, taskType: null },
  }));

  return <ProjectsIndexClient projects={summaries} />;
}
