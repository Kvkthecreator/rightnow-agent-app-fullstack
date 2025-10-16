"use client";

import { useState } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { MoreVertical, Edit2, Archive, ArchiveRestore, Loader2 } from 'lucide-react';

/**
 * BasketActions - Minimal CRUD for basket cards
 *
 * Secondary-order actions (shown on hover/click):
 * - Rename basket (inline dialog)
 * - Archive basket (soft delete)
 * - Restore basket (if archived)
 *
 * All operations direct REST (not governed substrate)
 */

interface BasketActionsProps {
  basketId: string;
  basketName: string;
  basketStatus: string | null;
  onUpdate: () => void;
}

export default function BasketActions({
  basketId,
  basketName,
  basketStatus,
  onUpdate,
}: BasketActionsProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState(basketName);

  const isArchived = basketStatus === 'ARCHIVED';

  // Rename basket
  const handleRename = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to rename basket');
      }

      setRenameOpen(false);
      onUpdate();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Archive basket
  const handleArchive = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_archived' }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to archive basket');
      }

      setArchiveOpen(false);
      onUpdate();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Restore basket
  const handleRestore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to restore basket');
      }

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
              setNewName(basketName);
              setRenameOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRestore(); }}>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setArchiveOpen(true);
              }}
              className="text-rose-600"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename Basket</DialogTitle>
            <DialogDescription>
              Update the name of this context basket. This does not affect any substrate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Basket Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter basket name..."
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={loading || !newName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Rename'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Archive Basket</DialogTitle>
            <DialogDescription>
              This will soft-delete the basket. All substrate will remain but won't be accessible
              unless you restore the basket.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">{basketName}</h4>
            <p className="text-sm text-slate-600">
              This basket will be archived and hidden from the main list.
            </p>
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
                'Archive Basket'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
