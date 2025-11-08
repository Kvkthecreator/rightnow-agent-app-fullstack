/**
 * Page: /projects/[id]/work-sessions - Work Sessions List
 *
 * Shows all work sessions for a project with filtering and status indicators.
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function WorkSessionsPage({ params, searchParams }: PageProps) {
  const { id: projectId } = await params;
  const { status: statusFilter } = await searchParams;

  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Project not found</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch work sessions via BFF
  let sessions: any[] = [];
  let statusCounts: Record<string, number> = {};
  let totalCount = 0;

  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/projects/${projectId}/work-sessions/list`);
    if (statusFilter) {
      url.searchParams.set('status', statusFilter);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Cookie: (await cookies()).toString(),
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      sessions = data.sessions || [];
      statusCounts = data.status_counts || {};
      totalCount = data.total_count || 0;
    } else {
      console.warn(`[Work Sessions] Failed to fetch sessions: ${response.status}`);
    }
  } catch (error) {
    console.error(`[Work Sessions] Error fetching sessions:`, error);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${projectId}/overview`} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Work Sessions</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{project.name}</p>
        </div>
        <Link href={`/projects/${projectId}/overview`}>
          <Button>New Work Request</Button>
        </Link>
      </div>

      {/* Status Filter Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatusFilterCard
          label="All"
          count={totalCount}
          projectId={projectId}
          active={!statusFilter}
        />
        <StatusFilterCard
          label="Pending"
          count={statusCounts.pending || 0}
          projectId={projectId}
          statusFilter="pending"
          active={statusFilter === 'pending'}
          icon={<Clock className="h-4 w-4" />}
          color="text-slate-600"
        />
        <StatusFilterCard
          label="Running"
          count={statusCounts.running || 0}
          projectId={projectId}
          statusFilter="running"
          active={statusFilter === 'running'}
          icon={<Loader2 className="h-4 w-4 animate-spin" />}
          color="text-blue-600"
        />
        <StatusFilterCard
          label="Completed"
          count={statusCounts.completed || 0}
          projectId={projectId}
          statusFilter="completed"
          active={statusFilter === 'completed'}
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-green-600"
        />
        <StatusFilterCard
          label="Failed"
          count={statusCounts.failed || 0}
          projectId={projectId}
          statusFilter="failed"
          active={statusFilter === 'failed'}
          icon={<XCircle className="h-4 w-4" />}
          color="text-red-600"
        />
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="p-12 text-center border-dashed dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {statusFilter ? 'No sessions found' : 'No work sessions yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {statusFilter
              ? `No ${statusFilter} work sessions for this project.`
              : 'Create your first work request to get started.'}
          </p>
          {!statusFilter && (
            <Link href={`/projects/${projectId}/overview`}>
              <Button>Create Work Request</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.session_id} href={`/projects/${projectId}/work-sessions/${session.session_id}`}>
              <Card className="p-4 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getStatusVariant(session.status)}>
                        {session.status}
                      </Badge>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{session.agent_display_name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(session.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">{session.task_description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusFilterCard({
  label,
  count,
  projectId,
  statusFilter,
  active,
  icon,
  color = "text-slate-600",
}: {
  label: string;
  count: number;
  projectId: string;
  statusFilter?: string;
  active?: boolean;
  icon?: React.ReactNode;
  color?: string;
}) {
  const href = statusFilter
    ? `/projects/${projectId}/work-sessions?status=${statusFilter}`
    : `/projects/${projectId}/work-sessions`;

  return (
    <Link href={href}>
      <Card className={`p-4 cursor-pointer transition ${
        active
          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 dark:border-blue-500'
          : 'hover:border-slate-300 dark:hover:border-slate-600 dark:bg-slate-800 dark:border-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          {icon && <span className={`${color} dark:brightness-125`}>{icon}</span>}
          <div>
            <div className={`text-2xl font-bold ${
              active
                ? 'text-blue-600 dark:text-blue-400'
                : `${color} dark:brightness-125`
            }`}>{count}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'running':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}
