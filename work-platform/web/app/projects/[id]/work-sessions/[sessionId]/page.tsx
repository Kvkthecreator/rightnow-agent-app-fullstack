/**
 * Page: /projects/[id]/work-sessions/[sessionId] - Work Session Detail
 *
 * Shows detailed information about a specific work session including:
 * - Status and metadata
 * - Task description
 * - Results/artifacts (when completed)
 * - Error messages (if failed)
 */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function WorkSessionDetailPage({ params }: PageProps) {
  const { id: projectId, sessionId } = await params;

  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Fetch session details via BFF
  let session: any = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/projects/${projectId}/work-sessions/${sessionId}`,
      {
        headers: {
          Cookie: (await cookies()).toString(),
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      session = await response.json();
    } else if (response.status === 404) {
      error = 'Work session not found';
    } else {
      error = 'Failed to load work session';
    }
  } catch (err) {
    console.error(`[Work Session Detail] Error:`, err);
    error = 'Failed to load work session';
  }

  if (error || !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{error || 'Not Found'}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The work session you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href={`/projects/${projectId}/work-sessions`} className="mt-4 inline-block">
            <Button variant="outline">Back to Work Sessions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${projectId}/work-sessions`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Work Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Work Session</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{session.project_name}</p>
          </div>
          <Badge variant={getStatusVariant(session.status)} className="text-base px-4 py-2">
            {getStatusIcon(session.status)}
            <span className="ml-2">{session.status}</span>
          </Badge>
        </div>
      </div>

      {/* Session Metadata */}
      <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Session Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Agent" value={session.agent_display_name} icon={<Zap className="h-4 w-4" />} />
          <InfoItem label="Agent Type" value={session.agent_type} />
          <InfoItem label="Created" value={new Date(session.created_at).toLocaleString()} icon={<Clock className="h-4 w-4" />} />
          {session.completed_at && (
            <InfoItem label="Completed" value={new Date(session.completed_at).toLocaleString()} icon={<CheckCircle className="h-4 w-4" />} />
          )}
          <InfoItem label="Priority" value={session.priority} />
          <InfoItem label="Task Type" value={session.task_type} />
        </div>
      </Card>

      {/* Task Description */}
      <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Description</h2>
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{session.task_description}</p>
      </Card>

      {/* Context (if any) */}
      {session.context && Object.keys(session.context).length > 0 && (
        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Additional Context</h2>
          <pre className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(session.context, null, 2)}
          </pre>
        </Card>
      )}

      {/* Running State */}
      {session.status === 'running' && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Agent is processing your request</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                The agent is actively working on your task. Results will appear here when completed.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pending State */}
      {session.status === 'pending' && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Waiting for agent</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your work request is queued and will be processed shortly.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {session.status === 'failed' && session.error_message && (
        <Card className="p-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Task Failed</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{session.error_message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {session.status === 'completed' && (
        <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Task Completed</h3>
              {session.result_summary ? (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">{session.result_summary}</p>
              ) : (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  The agent has successfully completed your task.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Placeholder for Artifacts (future) */}
      {session.status === 'completed' && (
        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Artifacts & Results
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Artifacts and detailed results will be displayed here when agent execution is implemented.
          </p>
        </Card>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-slate-900 dark:text-slate-100 font-medium">{value}</div>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
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
