"use client";

import { useState } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';

/**
 * ProjectActions - Project management actions
 *
 * Available actions:
 * - Rename project
 * - Edit description
 * - Delete project (CASCADE deletes all work sessions, artifacts, checkpoints)
 */

interface ProjectActionsProps {
  projectId: string;
  projectName: string;
  basketId: string;
  onUpdate: () => void;
}

export default function ProjectActions({
  projectId,
  projectName,
  basketId,
  onUpdate,
}: ProjectActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedName, setEditedName] = useState(projectName);
  const [editedDescription, setEditedDescription] = useState('');

  // Edit project metadata
  const handleEdit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/work/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName.trim(),
          description: editedDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to update project');
      }

      setEditOpen(false);
      onUpdate();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Delete project (CASCADE deletes work sessions, artifacts, checkpoints)
  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/work/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to delete project');
      }

      setDeleteOpen(false);
      onUpdate();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setEditedName(projectName);
              setEditedDescription('');
              setEditOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project name and description. The linked context is not affected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Project Name</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Describe this project..."
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-surface-danger-border bg-surface-danger/80 p-3 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !editedName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This will permanently delete the project and all associated work requests, artifacts, and checkpoints.
              The linked context basket will NOT be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <h4 className="text-sm font-semibold text-rose-900 mb-1">{projectName}</h4>
            <p className="text-sm text-rose-700">
              ⚠️ This action cannot be undone. All work history will be permanently lost.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
