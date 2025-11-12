"use client";

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { AgentConfig } from '../config';
import { cn } from '@/lib/utils';

export type AgentSession = {
  id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
  task_intent: string | null;
};

interface AgentDashboardClientProps {
  project: {
    id: string;
    name: string;
  };
  agentRow: {
    id: string;
    display_name: string;
    agent_type: string;
    is_active: boolean;
    created_at: string;
  } | null;
  sessions: AgentSession[];
  config: AgentConfig;
}

export default function AgentDashboardClient({ project, agentRow, sessions, config }: AgentDashboardClientProps) {
  const router = useRouter();

  const statusBadge = agentRow?.is_active ? 'Active' : 'Disabled';
  const lastSession = sessions[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{project.name}</p>
            <div className="mt-1 flex items-center gap-3">
              <config.icon className="h-5 w-5 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">{config.label}</h1>
              <Badge variant="outline" className={cn('capitalize', agentRow?.is_active ? 'text-primary border-primary/40' : 'text-muted-foreground')}>
                {statusBadge}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground max-w-2xl">{config.description}</p>
          </div>
          <Button
            variant="secondary"
            disabled={!agentRow?.is_active}
            onClick={() => router.push(`/projects/${project.id}/overview?agent=${agentRow?.id ?? ''}`)}
          >
            Create Work Request
          </Button>
        </div>
      </header>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        {lastSession ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Last run {formatDistanceToNow(new Date(lastSession.created_at), { addSuffix: true })}
            </p>
            <p className="text-foreground font-medium">{lastSession.task_intent ?? 'No description provided'}</p>
            <Badge variant="outline" className="capitalize">{lastSession.status}</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No work sessions yet. Kick off your first task.</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Work History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Work history will appear here once this agent starts running tasks.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(session.created_at).toLocaleString()}</span>
                  <Badge variant="outline" className="capitalize">{session.status}</Badge>
                </div>
                <p className="mt-2 text-foreground text-sm font-medium">
                  {session.task_intent ?? 'Session without description'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
