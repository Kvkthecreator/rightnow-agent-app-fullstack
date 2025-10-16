"use client";

import { useState } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
import { Edit2, Archive, Tag, MoreVertical, Loader2 } from 'lucide-react';

/**
 * BuildingBlocksActions - CRUD Operations for Substrate Blocks
 *
 * Phase 1 implementation with optimistic updates:
 * - Edit (ReviseBlock) - Creates versioned update via parent_block_id
 * - Archive (ArchiveBlock) - Soft delete with tombstone
 * - Retag (UpdateBlock) - Metadata-only update (no versioning)
 *
 * All operations go through /api/work with user_override: 'allow_auto'
 * for instant approval while preserving governance framework.
 */

interface BlockWithMetrics {
  id: string;
  title: string | null;
  content: string | null;
  semantic_type: string | null;
  anchor_role?: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at?: string | null;
  status: string | null;
  metadata?: Record<string, any> | null;
}

interface BuildingBlocksActionsProps {
  block: BlockWithMetrics;
  basketId: string;
  onUpdate: () => void;
}

const SEMANTIC_TYPES = [
  { value: 'fact', label: 'Fact', category: 'knowledge' },
  { value: 'metric', label: 'Metric', category: 'knowledge' },
  { value: 'intent', label: 'Intent', category: 'meaning' },
  { value: 'objective', label: 'Objective', category: 'meaning' },
  { value: 'rationale', label: 'Rationale', category: 'meaning' },
  { value: 'principle', label: 'Principle', category: 'meaning' },
  { value: 'assumption', label: 'Assumption', category: 'meaning' },
  { value: 'context', label: 'Context', category: 'meaning' },
  { value: 'constraint', label: 'Constraint', category: 'meaning' },
  { value: 'entity', label: 'Entity', category: 'structural' },
];

export default function BuildingBlocksActions({
  block,
  basketId,
  onUpdate,
}: BuildingBlocksActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [retagOpen, setRetagOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState(block.title || '');
  const [editContent, setEditContent] = useState(block.content || '');

  // Retag form state
  const [newSemanticType, setNewSemanticType] = useState(block.semantic_type || '');
  const [newAnchorRole, setNewAnchorRole] = useState(block.anchor_role || '');

  // Submit edit (ReviseBlock operation)
  const handleEdit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [
              {
                type: 'ReviseBlock',
                block_id: block.id,
                title: editTitle.trim(),
                content: editContent.trim(),
                semantic_type: block.semantic_type,
                anchor_role: block.anchor_role,
                confidence: 1.0,
              },
            ],
            user_override: 'allow_auto', // Instant approval
          },
          priority: 'normal',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to edit block');
      }

      const result = await response.json();

      if (result.executed_immediately) {
        // Success - optimistic update
        setEditOpen(false);
        onUpdate(); // Refresh list
      } else {
        throw new Error('Block edit was not executed immediately');
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Submit archive (ArchiveBlock operation)
  const handleArchive = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [
              {
                type: 'ArchiveBlock',
                block_id: block.id,
              },
            ],
            user_override: 'allow_auto',
          },
          priority: 'normal',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to archive block');
      }

      const result = await response.json();

      if (result.executed_immediately) {
        setArchiveOpen(false);
        onUpdate();
      } else {
        throw new Error('Block archive was not executed immediately');
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Submit retag (UpdateBlock operation - metadata only)
  const handleRetag = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [
              {
                type: 'UpdateBlock',
                block_id: block.id,
                semantic_type: newSemanticType,
                anchor_role: newAnchorRole.trim() || null,
                confidence: 1.0,
              },
            ],
            user_override: 'allow_auto',
          },
          priority: 'normal',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to retag block');
      }

      const result = await response.json();

      if (result.executed_immediately) {
        setRetagOpen(false);
        onUpdate();
      } else {
        throw new Error('Block retag was not executed immediately');
      }
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
          <Button size="sm" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditTitle(block.title || '');
              setEditContent(block.content || '');
              setEditOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setNewSemanticType(block.semantic_type || '');
              setNewAnchorRole(block.anchor_role || '');
              setRetagOpen(true);
            }}
          >
            <Tag className="h-4 w-4 mr-2" />
            Retag
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setArchiveOpen(true)}
            className="text-rose-600"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>
              Creates a new version of this block via ReviseBlock operation. Original version
              preserved in version history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Block title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Block content..."
                className="w-full min-h-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !editTitle.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save New Version'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Block</DialogTitle>
            <DialogDescription>
              This will soft-delete the block with a tombstone. You can restore it later if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              {block.title || 'Untitled block'}
            </h4>
            <p className="text-sm text-slate-600 line-clamp-2">{block.content}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                'Archive Block'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retag Dialog */}
      <Dialog open={retagOpen} onOpenChange={setRetagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retag Block</DialogTitle>
            <DialogDescription>
              Update semantic type and anchor role. This is a metadata-only update (no versioning).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Semantic Type
              </label>
              <select
                value={newSemanticType}
                onChange={(e) => setNewSemanticType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {SEMANTIC_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Anchor Role (optional)
              </label>
              <Input
                value={newAnchorRole}
                onChange={(e) => setNewAnchorRole(e.target.value)}
                placeholder="e.g., project_constraint, stakeholder_need"
              />
              <p className="text-xs text-slate-500 mt-1">
                Free-text emergent role for V3.0 substrate
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRetagOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRetag} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Tags'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
