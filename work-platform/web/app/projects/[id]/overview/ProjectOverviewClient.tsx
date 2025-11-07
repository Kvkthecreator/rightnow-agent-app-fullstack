"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, FileText, Layers, Zap, CheckCircle, Clock, PlayCircle, PauseCircle, XCircle } from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  basket_id: string;
  project_type: string;
  status: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  };
}

interface ProjectOverviewClientProps {
  project: ProjectData;
}

export function ProjectOverviewClient({ project }: ProjectOverviewClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const activeWork = project.stats.workSessions.pending + project.stats.workSessions.running;
  const totalWork = project.stats.workSessions.total;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-lg text-slate-600">{project.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {project.basket_status || 'Active'}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push(`/projects/${project.id}/work-review`)}
            disabled
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Work Request
          </Button>
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
            <div className="rounded-lg bg-blue-50 p-3">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{project.stats.contextItems}</div>
              <div className="text-sm text-slate-600">Context Items</div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-blue-600 hover:text-blue-700"
              onClick={() => router.push(`/projects/${project.id}/context`)}
            >
              Manage Context →
            </Button>
          </div>
        </Card>

        {/* Active Work */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-50 p-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{activeWork}</div>
              <div className="text-sm text-slate-600">Active Work</div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            {project.stats.workSessions.pending > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{project.stats.workSessions.pending} pending</span>
              </div>
            )}
            {project.stats.workSessions.running > 0 && (
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600">{project.stats.workSessions.running} running</span>
              </div>
            )}
            {project.stats.workSessions.paused > 0 && (
              <div className="flex items-center gap-2">
                <PauseCircle className="h-3 w-3 text-yellow-600" />
                <span>{project.stats.workSessions.paused} paused</span>
              </div>
            )}
          </div>
        </Card>

        {/* Completed Work */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-50 p-3">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{project.stats.workSessions.completed}</div>
              <div className="text-sm text-slate-600">Completed Work</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-slate-500">
              {project.stats.documents} report{project.stats.documents !== 1 ? 's' : ''} generated
            </div>
          </div>
        </Card>
      </div>

      {/* Work Sessions Status */}
      {totalWork > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Work Status</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{project.stats.workSessions.pending}</div>
              <div className="text-xs text-slate-600 mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{project.stats.workSessions.running}</div>
              <div className="text-xs text-slate-600 mt-1">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{project.stats.workSessions.paused}</div>
              <div className="text-xs text-slate-600 mt-1">Paused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{project.stats.workSessions.completed}</div>
              <div className="text-xs text-slate-600 mt-1">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{project.stats.workSessions.failed}</div>
              <div className="text-xs text-slate-600 mt-1">Failed</div>
            </div>
          </div>
        </Card>
      )}

      {/* Context Basket Info */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Linked Context</h3>
            <p className="text-lg font-medium text-slate-900">{project.basket_name || 'Untitled Context'}</p>
            <p className="text-sm text-slate-600 mt-1">
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
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Start Working</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Add context to your project and create your first work request to begin collaborating with AI agents.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push(`/projects/${project.id}/context`)}>
              Add Context
            </Button>
            <Button variant="secondary" disabled>
              Create Work Request
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
