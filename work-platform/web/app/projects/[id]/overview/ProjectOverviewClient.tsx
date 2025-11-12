"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, FileText, Layers, Zap, CheckCircle, Clock, PlayCircle, PauseCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateWorkRequestModal from '@/components/CreateWorkRequestModal';
import { formatDistanceToNow } from 'date-fns';

interface ProjectAgent {
  id: string;
  agent_type: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  basket_id: string;
  basket_name: string;
  status: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  agents: ProjectAgent[];
  stats: {
    contextItems: number;
    documents: number;
    workSessions: {
      total: number;
      pending: number;
      running: number;
      paused: number;
      completed: number;
      failed: number;
    };
    agents: Record<string, {
      pending: number;
      running: number;
      lastRun: string | null;
      lastStatus: string | null;
    }>;
  };
}

interface ProjectOverviewClientProps {
  project: ProjectData;
}

export function ProjectOverviewClient({ project }: ProjectOverviewClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [workRequestModalOpen, setWorkRequestModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const activeWork = project.stats.workSessions.pending + project.stats.workSessions.running;
  const totalWork = project.stats.workSessions.total;
  const agentSummaries = useMemo(() => project.stats.agents || {}, [project.stats.agents]);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    setWorkRequestModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setWorkRequestModalOpen(open);
    if (!open) {
      setSelectedAgentId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-lg text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs capitalize">
            {project.status}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${project.id}/context`)}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Add Context
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${project.id}/reports`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Context Items */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-surface-primary/70 p-3 text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{project.stats.contextItems}</div>
              <div className="text-sm text-muted-foreground">Context Items</div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-primary"
              onClick={() => router.push(`/projects/${project.id}/context`)}
            >
              Manage Context →
            </Button>
          </div>
        </Card>

        {/* Active Work */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-surface-success/80 p-3 text-success-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{activeWork}</div>
              <div className="text-sm text-muted-foreground">Active Work</div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            {project.stats.workSessions.pending > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{project.stats.workSessions.pending} pending</span>
              </div>
            )}
            {project.stats.workSessions.running > 0 && (
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3 text-primary" />
                <span className="text-primary">{project.stats.workSessions.running} running</span>
              </div>
            )}
            {project.stats.workSessions.paused > 0 && (
              <div className="flex items-center gap-2">
                <PauseCircle className="h-3 w-3 text-warning-foreground" />
                <span>{project.stats.workSessions.paused} paused</span>
              </div>
            )}
          </div>
        </Card>

        {/* Completed Work */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-surface-primary/70 p-3 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{project.stats.workSessions.completed}</div>
              <div className="text-sm text-muted-foreground">Completed Work</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {project.stats.documents} report{project.stats.documents !== 1 ? 's' : ''} generated
          </div>
        </Card>
      </div>

      {/* Project Agents */}
      {project.agents && project.agents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Agents</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {project.agents.map((agent) => {
              const stats = agentSummaries[agent.id];
              return (
                <div
                  key={agent.id}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-all flex flex-col gap-3',
                    agent.is_active ? 'hover:border-ring hover:shadow-md' : 'opacity-70'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-surface-primary/70 p-2 text-primary">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{agent.display_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{agent.agent_type}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs capitalize', getAgentStatusBadgeClass(stats, agent.is_active))}>
                      {getAgentStatusLabel(stats, agent.is_active)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.lastRun
                      ? `Last run ${formatDistanceToNow(new Date(stats.lastRun))} ago`
                      : 'No work sessions yet'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{getAgentQuickActionHint(agent.agent_type)}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                      disabled={!agent.is_active}
                      onClick={() => handleAgentClick(agent.id)}
                    >
                      <Plus className="h-4 w-4" />
                      {getAgentQuickActionLabel(agent.agent_type)}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Work Sessions Status */}
      {totalWork > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Work Status</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{project.stats.workSessions.pending}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{project.stats.workSessions.running}</div>
              <div className="text-xs text-muted-foreground mt-1">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-foreground">{project.stats.workSessions.paused}</div>
              <div className="text-xs text-muted-foreground mt-1">Paused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-foreground">{project.stats.workSessions.completed}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{project.stats.workSessions.failed}</div>
              <div className="text-xs text-muted-foreground mt-1">Failed</div>
            </div>
          </div>
        </Card>
      )}

      {/* Context Basket Info */}
      <Card className="p-6 border border-border bg-muted/60">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Linked Context</h3>
            <p className="text-lg font-medium text-foreground">{project.basket_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              This project uses context from the linked basket. All work requests have access to this knowledge base.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/context`)}
          >
            View Context
          </Button>
        </div>
      </Card>

      {/* Empty State for New Projects */}
      {totalWork === 0 && project.stats.contextItems === 0 && (
        <Card className="p-12 text-center border-dashed">
          <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Start Working</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add context to your project and create your first work request to begin collaborating with AI agents.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push(`/projects/${project.id}/context`)}>
              Add Context
            </Button>
            <Button variant="secondary" onClick={() => setWorkRequestModalOpen(true)}>
              Create Work Request
            </Button>
          </div>
        </Card>
      )}

      {/* Work Request Modal */}
      <CreateWorkRequestModal
        open={workRequestModalOpen}
        onOpenChange={handleModalClose}
        projectId={project.id}
        agents={project.agents}
        preSelectedAgentId={selectedAgentId}
      />
    </div>
  );
}

function getAgentQuickActionLabel(agentType: string) {
  switch (agentType) {
    case 'research':
      return 'Run Monitor';
    case 'content':
      return 'Create Content';
    case 'reporting':
      return 'Generate Report';
    default:
      return 'Start Work';
  }
}

function getAgentQuickActionHint(agentType: string) {
  switch (agentType) {
    case 'research':
      return 'Monitor markets or run a deep dive.';
    case 'content':
      return 'Draft posts, briefs, or copy.';
    case 'reporting':
      return 'Assemble summaries or decks.';
    default:
      return 'Kick off a new work session.';
  }
}

function getAgentStatusLabel(
  stats: { pending: number; running: number; lastStatus: string | null } | undefined,
  isActive: boolean
) {
  if (!isActive) return 'Inactive';
  if (!stats) return 'Idle';
  if (stats.running > 0) return 'Running';
  if (stats.pending > 0) return 'Queued';
  if (stats.lastStatus) return stats.lastStatus.charAt(0).toUpperCase() + stats.lastStatus.slice(1);
  return 'Idle';
}

function getAgentStatusBadgeClass(
  stats: { pending: number; running: number; lastStatus: string | null } | undefined,
  isActive: boolean
) {
  const label = getAgentStatusLabel(stats, isActive).toLowerCase();
  if (label === 'running') {
    return 'bg-surface-primary/60 text-primary';
  }
  if (label === 'queued' || label === 'pending') {
    return 'bg-surface-warning/60 text-warning-foreground';
  }
  if (label === 'inactive') {
    return 'bg-muted text-muted-foreground';
  }
  return 'bg-surface-primary/20 text-primary';
}
