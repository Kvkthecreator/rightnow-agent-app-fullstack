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
import WorkSessionExecutor from './WorkSessionExecutor';
import ArtifactList from './ArtifactList';

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
  let artifacts: any[] = [];

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

      // Fetch artifacts if session is completed
      if (session.status === 'completed') {
        try {
          const artifactsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/projects/${projectId}/work-sessions/${sessionId}/artifacts`,
            {
              headers: {
                Cookie: (await cookies()).toString(),
              },
              cache: 'no-store',
            }
          );

          if (artifactsResponse.ok) {
            artifacts = await artifactsResponse.json();
          }
        } catch (artifactErr) {
          console.error(`[Work Session Artifacts] Error:`, artifactErr);
          // Don't fail the whole page if artifacts fail
        }
      }
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
          <h2 className="text-xl font-semibold text-slate-900">{error || 'Not Found'}</h2>
          <p className="mt-2 text-sm text-slate-600">
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
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Work Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Work Session</h1>
            <p className="text-slate-600 mt-1">{session.project_name}</p>
          </div>
          <Badge variant={getStatusVariant(session.status)} className="text-base px-4 py-2">
            {getStatusIcon(session.status)}
            <span className="ml-2">{session.status}</span>
          </Badge>
        </div>
      </div>

      {/* Session Metadata */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Session Information</h2>
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
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Task Description</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{session.task_description}</p>
      </Card>

      {/* Context (if any) */}
      {session.context && Object.keys(session.context).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Context</h2>
          <pre className="text-sm text-slate-700 bg-slate-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(session.context, null, 2)}
          </pre>
        </Card>
      )}

      {/* Work Session Executor - Shows execute button and status cards */}
      <WorkSessionExecutor
        projectId={projectId}
        sessionId={sessionId}
        initialStatus={session.status}
        initialArtifactsCount={session.artifacts_count || 0}
      />

      {/* Artifacts Viewer */}
      {session.status === 'completed' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Artifacts & Results
          </h2>
          <ArtifactList artifacts={artifacts} />
        </div>
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
      <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-slate-900 font-medium">{value}</div>
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
