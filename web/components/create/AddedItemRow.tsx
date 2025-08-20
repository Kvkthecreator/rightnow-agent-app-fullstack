'use client';

import type { AddedItem } from './useCreatePageMachine';
import { Badge } from '@/components/ui/Badge';
import { Paperclip, StickyNote, Trash2 } from 'lucide-react';

interface Props {
  item: AddedItem;
  onRemove: (id: string) => void;
}

export function AddedItemRow({ item, onRemove }: Props) {
  const icon = item.kind === 'file' ? (
    <Paperclip className="h-4 w-4" />
  ) : (
    <StickyNote className="h-4 w-4" />
  );
  const size = item.size ? `${(item.size / 1024 / 1024).toFixed(1)}MB` : '';
  const label = item.kind === 'file'
    ? item.name
    : item.text?.slice(0, 30) + (item.text && item.text.length > 30 ? '…' : '');

  const statusClass =
    item.status === 'error'
      ? 'bg-red-100 text-red-700 border-red-200'
      : item.status === 'uploading'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-green-100 text-green-700 border-green-200';

  return (
    <div className="flex items-center justify-between text-sm py-1 border-b last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
        {size && <span className="text-xs text-gray-500">{size}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Badge className={statusClass}>{item.status}</Badge>
        {item.status === 'error' && item.error && (
          <span aria-live="polite" className="text-xs text-red-600">
            {item.error}
          </span>
        )}
        <button
          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  );
}

