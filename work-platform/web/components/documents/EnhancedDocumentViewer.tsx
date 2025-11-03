"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Database, FileText, MessageSquare, Clock, Layers, Info } from 'lucide-react';

interface SubstrateReference {
  id: string;
  substrate_type: 'block' | 'dump' | 'context_item' | 'timeline_event';
  preview?: string;
  title?: string;
  role?: string;
  weight?: number;
}

interface EnhancedDocumentViewerProps {
  content: string;
  references?: SubstrateReference[];
  className?: string;
}

export function EnhancedDocumentViewer({ content, references = [], className = "" }: EnhancedDocumentViewerProps) {
  const [showSources, setShowSources] = useState(false);
  const [expandedReferenceId, setExpandedReferenceId] = useState<string | null>(null);
  const paragraphIndexRef = useRef(0);

  const paragraphAssignments = useMemo(() => {
    if (!references.length) return [] as Array<SubstrateReference | null>;

    const paragraphs = content
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    if (!paragraphs.length) return [] as Array<SubstrateReference | null>;

    return paragraphs.map((_, idx) => references[idx % references.length]);
  }, [content, references]);

  const getSubstrateIcon = (type: string) => {
    switch (type) {
      case 'block': return <Database className="h-3 w-3 text-blue-500" />;
      case 'dump': return <FileText className="h-3 w-3 text-green-500" />;
      case 'context_item': return <MessageSquare className="h-3 w-3 text-purple-500" />;
      case 'timeline_event': return <Clock className="h-3 w-3 text-red-500" />;
      default: return <Database className="h-3 w-3 text-gray-400" />;
    }
  };

  const getHighlightClasses = (type: string) => {
    switch (type) {
      case 'block': return 'border-l-blue-200 bg-blue-50/30';
      case 'dump': return 'border-l-green-200 bg-green-50/30';
      case 'context_item': return 'border-l-purple-200 bg-purple-50/30';
      case 'timeline_event': return 'border-l-red-200 bg-red-50/30';
      default: return 'border-l-gray-200 bg-gray-50/30';
    }
  };

  const getDetailClasses = (type: string) => {
    switch (type) {
      case 'block': return 'border-blue-200 bg-blue-50/70';
      case 'dump': return 'border-green-200 bg-green-50/70';
      case 'context_item': return 'border-purple-200 bg-purple-50/70';
      case 'timeline_event': return 'border-red-200 bg-red-50/70';
      default: return 'border-slate-200 bg-slate-50/80';
    }
  };

  useEffect(() => {
    setExpandedReferenceId(null);
  }, [content, references, showSources]);

  const formatWeight = (weight?: number) => {
    if (typeof weight !== 'number') return null;
    return `${Math.round(weight * 100)}% weight`;
  };

  paragraphIndexRef.current = 0;

  const markdownComponents = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-6 border-b border-slate-200 pb-3">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-2xl font-semibold text-slate-800 mt-7 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">{children}</h3>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-outside ml-6 space-y-2 text-slate-700 mb-6">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-outside ml-6 space-y-2 text-slate-700 mb-6">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-3 italic text-slate-700 my-6 rounded-r">
        {children}
      </blockquote>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-slate-900">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic text-slate-700">{children}</em>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    p: ({ children }: { children: React.ReactNode }) => {
      const currentIndex = paragraphIndexRef.current++;
      const reference = showSources ? paragraphAssignments[currentIndex] : null;

      if (!reference) {
        return <p className="text-slate-800 leading-relaxed mb-5">{children}</p>;
      }

      const isExpanded = expandedReferenceId === reference.id;
      const highlightClass = showSources ? getHighlightClasses(reference.substrate_type) : '';
      const detailClass = getDetailClasses(reference.substrate_type);

      return (
        <div
          className={`rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-colors ${highlightClass} ${
            isExpanded ? 'border-blue-200 bg-blue-50/50' : 'hover:border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0 opacity-70">{getSubstrateIcon(reference.substrate_type)}</div>
            <div className="flex-1 space-y-3">
              <p className="m-0 text-slate-800 leading-relaxed">{children}</p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">{reference.title || 'Substrate source'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">{reference.substrate_type.replace('_', ' ')}</span>
                  {reference.role && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">{reference.role}</span>}
                  {formatWeight(reference.weight) && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{formatWeight(reference.weight)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => setExpandedReferenceId(isExpanded ? null : reference.id)}
                >
                  {isExpanded ? 'Hide source detail' : 'View source detail'}
                </button>
              </div>
              {isExpanded && (
                <div className={`rounded-lg border ${detailClass} p-3 text-xs text-slate-600`}
                >
                  <div className="font-medium text-slate-700">Why this source</div>
                  <p className="mt-1 leading-relaxed">
                    {reference.preview || 'Linked substrate did not include a preview. Open the source to review the full context.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
  } as const;

  return (
    <div className={`relative ${className}`}>
      {/* Substrate Mode Toggle */}
      {references.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setShowSources(prev => {
                const next = !prev;
                if (!next) {
                  setExpandedReferenceId(null);
                }
                return next;
              });
            }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${showSources 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'
              }
            `}
          >
            <Layers className="h-3 w-3" />
            {showSources ? 'Hide Sources' : 'Show Sources'}
          </button>
        </div>
      )}

      {showSources && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <Info className="mt-0.5 h-4 w-4 text-blue-500" />
          <span>
            Source tracing highlights each paragraph with its strongest substrate input. Select a paragraph to review the originating block, context item, or memory before you share or edit the narrative.
          </span>
        </div>
      )}

      {/* Enhanced Document Content */}
      <div className="prose prose-slate prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
          skipHtml
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Substrate Legend */}
      {showSources && references.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Substrate Sources</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Structured knowledge blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-green-500" />
              <span className="text-gray-600">Raw memory dumps</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3 text-purple-500" />
              <span className="text-gray-600">Context items</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-red-500" />
              <span className="text-gray-600">Timeline events</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
