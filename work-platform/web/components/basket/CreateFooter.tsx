import React from 'react';

interface Props {
  filesCount: number;
  notesCount: number;
  onCreate: () => void;
  onClear: () => void;
}

export function CreateFooter({ filesCount, notesCount, onCreate, onClear }: Props) {
  return (
    <footer className="sticky bottom-0 w-full border-t bg-white py-4">
      <div className="container max-w-3xl mx-auto flex items-center justify-between px-4">
        <span className="text-sm text-gray-600">
          {filesCount} files · {notesCount} notes
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 border rounded bg-white text-sm"
            onClick={onClear}
          >
            Clear
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
            onClick={onCreate}
          >
            Create &amp; Open Basket
          </button>
        </div>
      </div>
    </footer>
  );
}

