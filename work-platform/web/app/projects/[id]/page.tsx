/**
 * Project root page - Main Thinking Partner chat interface
 *
 * This is the NEW primary interface for project interaction.
 * Implements spatial co-presence model:
 * - Left (40%): Chat interface with TP
 * - Right (60%): Live context pane (morphs based on TP state)
 */

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { TPChatPage } from './TPChatPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id: projectId } = await params;
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Fetch project (need basket_id and workspace_id for TP)
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, basket_id, workspace_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Project not found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TPChatPage
      projectId={project.id}
      projectName={project.name}
      basketId={project.basket_id}
      workspaceId={project.workspace_id}
    />
  );
}
