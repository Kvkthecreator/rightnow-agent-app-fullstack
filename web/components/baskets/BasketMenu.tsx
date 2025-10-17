"use client";

import { useState } from 'react';
import { MoreVertical, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';

interface BasketMenuProps {
  basketId: string;
  basketName: string;
  onArchive: () => Promise<void>;
}

export default function BasketMenu({ basketId, basketName, onArchive }: BasketMenuProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await onArchive();
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Failed to archive basket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Basket actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowArchiveDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive basket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive basket?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{basketName}</strong>? You can restore it later from the archived baskets view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
