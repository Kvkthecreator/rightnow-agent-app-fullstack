'use client';

import { AddedItem } from './useCreatePageMachine';

interface Props {
  item: AddedItem;
  onRemove: (id: string) => void;
}

export function AddedItemRow({ item, onRemove }: Props) {
  const icon = item.kind === 'file' ? '🗎' : item.kind === 'url' ? '🔗' : '📝';
  const size = item.size ? `${(item.size / 1024 / 1024).toFixed(1)}MB` : '';
  const label =
    item.kind === 'file'
      ? item.name
      : item.kind === 'url'
      ? item.url
      : item.text?.slice(0, 30) + (item.text && item.text.length > 30 ? '…' : '');

  return (
    <div className="flex items-center justify-between text-sm py-1 border-b last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span>{icon}</span>
        <span className="truncate">{label}</span>
        {size && <span className="text-xs text-gray-500">{size}</span>}
        <button
          className="text-xs text-blue-500 hover:underline ml-2"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
      </div>
      <div className="text-xs text-gray-500">
        {item.status}
        {item.status === 'error' && item.error && (
          <span className="text-red-600 ml-1">{item.error}</span>
        )}
      </div>
    </div>
  );
}

