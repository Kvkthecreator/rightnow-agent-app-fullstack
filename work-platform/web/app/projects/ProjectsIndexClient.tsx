"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import ProjectActions from '@/components/projects/ProjectActions';

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  basket_id: string;
  project_type: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  pendingWork: {
    count: number;
    lastCreatedAt: string | null;
    taskType: string | null;
  };
};

export function ProjectsIndexClient({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUpdate = () => {
    router.refresh(); // Refresh server component data
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bDate - aDate; // Most recently updated first
    });
  }, [projects]);

  const hasProjects = sortedProjects.length > 0;

  // Format task type for display
  const formatTaskType = (taskType: string | null) => {
    if (!taskType) return '';
    return taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your work projects. Each project contains context and work requests for agent collaboration.
          </p>
        </header>
        {hasProjects && (
          <Button onClick={() => setDialogOpen(true)}>New Project</Button>
        )}
      </div>

      {!hasProjects ? (
        <section className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Create a project to organize your work. Each project has its own context and can run work requests with AI agents.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setDialogOpen(true)}>Create Project</Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {sortedProjects.map((project) => {
            const pendingWork = project.pendingWork;
            const workLabel = pendingWork.count > 0
              ? `${pendingWork.count} active work ${pendingWork.count === 1 ? 'request' : 'requests'} ${pendingWork.taskType ? `· ${formatTaskType(pendingWork.taskType)}` : ''}`
              : 'No active work';

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => router.push(`/projects/${project.id}/overview`)}
                className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">{project.name || 'Untitled Project'}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description || 'Work project with AI agents'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {project.status}
                    </span>
                    <ProjectActions
                      projectId={project.id}
                      projectName={project.name || 'Untitled Project'}
                      basketId={project.basket_id}
                      onUpdate={handleUpdate}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span>
                    {project.updated_at
                      ? `Updated ${new Date(project.updated_at).toLocaleString()}`
                      : project.created_at
                        ? `Created ${new Date(project.created_at).toLocaleString()}`
                        : 'No timestamp'}
                  </span>
                  <span className={pendingWork.count > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>
                    {workLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      )}

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
