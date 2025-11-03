"use client";

import { useState, useEffect } from 'react';
import { FileText, Sparkles, ChevronRight } from 'lucide-react';

interface UploadComparisonProps {
  basketId: string;
  rawDumpId: string;
  fileName: string;
}

type ComparisonData = {
  original: {
    body_md: string;
    filename: string;
  };
  composed: {
    id: string;
    title: string;
    body_md: string;
    created_at: string;
  };
  substrate_count: number;
};

export function UploadComparison({
  basketId,
  rawDumpId,
  fileName,
}: UploadComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(
          `/api/baskets/${basketId}/upload-wizard/compose`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_dump_id: rawDumpId }),
          }
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Composition failed');
        }

        const result = await response.json();
        setData({
          original: result.original,
          composed: result.document,
          substrate_count: result.substrate_count,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [basketId, rawDumpId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              Transformation Complete
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              {data.substrate_count} substrate pieces extracted from {fileName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Original Document */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Original Upload
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {data.original.filename}
            </p>
          </div>
          <div className="p-4 bg-white max-h-[400px] overflow-y-auto">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
              {data.original.body_md}
            </pre>
          </div>
        </div>

        {/* Arrow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white rounded-full p-2 shadow-lg border border-indigo-200">
            <ChevronRight className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        {/* Composed Document */}
        <div className="border border-indigo-200 rounded-lg overflow-hidden">
          <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">
                YARNNN Composed
              </h3>
            </div>
            <p className="text-xs text-indigo-700 mt-1">
              Renewable substrate composition
            </p>
          </div>
          <div className="p-4 bg-white max-h-[400px] overflow-y-auto">
            <div
              className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700"
              dangerouslySetInnerHTML={{
                __html: data.composed.body_md
                  .replace(/\n/g, '<br />')
                  .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
                  .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-3 mb-2">$1</h2>')
                  .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-indigo-200 pl-3 italic text-slate-600">$1</blockquote>'),
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-600">
          <span className="font-medium">What happened?</span> YARNNN extracted{' '}
          {data.substrate_count} reusable substrate pieces from your document. These
          pieces live in your building blocks and can be used across multiple
          documents, keeping everything in sync.
        </p>
      </div>
    </div>
  );
}
