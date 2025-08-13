'use client';

import { CreateState } from './useCreatePageMachine';

interface Props {
  progress: number;
  state: CreateState;
  fileCount: number;
}

export function ProgressRibbon({ progress, state, fileCount }: Props) {
  const steps = ['Uploading', 'Parsing', 'Dumps', 'Scaffolding'];
  const activeIndex = Math.min(Math.floor(progress / 25), steps.length - 1);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`px-2 py-1 rounded-full border ${
              i <= activeIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 h-1 rounded">
        <div className="bg-blue-600 h-1 rounded" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-xs text-gray-500">
        {state === 'EMPTY' || state === 'COLLECTING'
          ? 'Waiting to start…'
          : `Parsing ${fileCount} file${fileCount === 1 ? '' : 's'} • Creating raw dumps…`}
      </div>
    </div>
  );
}

