"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  const [hoveredReference, setHoveredReference] = useState<string | null>(null);
  const [showSubstrateMode, setShowSubstrateMode] = useState(false);

  const getSubstrateIcon = (type: string) => {
    switch (type) {
      case 'block': return <Database className="h-3 w-3 text-blue-500" />;
      case 'dump': return <FileText className="h-3 w-3 text-green-500" />;
      case 'context_item': return <MessageSquare className="h-3 w-3 text-purple-500" />;
      case 'timeline_event': return <Clock className="h-3 w-3 text-red-500" />;
      default: return <Database className="h-3 w-3 text-gray-400" />;
    }
  };

  const getSubstrateColor = (type: string) => {
    switch (type) {
      case 'block': return 'border-l-blue-200 bg-blue-50/30';
      case 'dump': return 'border-l-green-200 bg-green-50/30';
      case 'context_item': return 'border-l-purple-200 bg-purple-50/30';
      case 'timeline_event': return 'border-l-red-200 bg-red-50/30';
      default: return 'border-l-gray-200 bg-gray-50/30';
    }
  };

  // Simulate substrate source detection (in real implementation, this would be more sophisticated)
  const detectSubstrateSources = (text: string): Array<{start: number, end: number, reference: SubstrateReference}> => {
    const sources: Array<{start: number, end: number, reference: SubstrateReference}> = [];
    
    // Simple heuristic: every paragraph could potentially come from different substrate sources
    const paragraphs = text.split('\n\n');
    let currentIndex = 0;
    
    paragraphs.forEach((paragraph, idx) => {
      if (paragraph.trim() && references[idx % references.length]) {
        sources.push({
          start: currentIndex,
          end: currentIndex + paragraph.length,
          reference: references[idx % references.length]
        });
      }
      currentIndex += paragraph.length + 2; // +2 for \n\n
    });
    
    return sources;
  };

  const substrateSources = detectSubstrateSources(content);

  const enhanceContent = (text: string) => {
    if (!showSubstrateMode || substrateSources.length === 0) {
      return text;
    }

    let enhancedText = text;
    let offset = 0;

    substrateSources.forEach((source, idx) => {
      const beforeText = enhancedText.substring(0, source.start + offset);
      const sourceText = enhancedText.substring(source.start + offset, source.end + offset);
      const afterText = enhancedText.substring(source.end + offset);

      const wrappedText = `<div class="substrate-section" data-substrate-id="${source.reference.id}" data-substrate-type="${source.reference.substrate_type}">${sourceText}</div>`;
      
      enhancedText = beforeText + wrappedText + afterText;
      offset += wrappedText.length - sourceText.length;
    });

    return enhancedText;
  };

  const customRenderers = {
    div: ({ node, className, children, ...props }: any) => {
      const substrateId = props['data-substrate-id'];
      const substrateType = props['data-substrate-type'];
      
      if (className === 'substrate-section' && substrateId) {
        const reference = references.find(r => r.id === substrateId);
        const isHovered = hoveredReference === substrateId;

        if (!showSubstrateMode) {
          return (
            <div {...props}>
              {children}
            </div>
          );
        }

        return (
          <div
            className={`
              relative group transition-all duration-200 rounded-lg px-3 py-2 my-2
              border-l-2 ${getSubstrateColor(substrateType)}
              ${isHovered ? 'shadow-sm scale-[1.01]' : ''}
            `}
            onMouseEnter={() => setHoveredReference(substrateId)}
            onMouseLeave={() => setHoveredReference(null)}
            {...props}
          >
            {/* Subtle substrate indicator */}
            <div className="absolute -left-1 top-2 opacity-60 group-hover:opacity-100 transition-opacity">
              {getSubstrateIcon(substrateType)}
            </div>

            {/* Content */}
            <div className="ml-3">{children}</div>

            {/* Hover tooltip */}
            {isHovered && reference && (
              <div className="absolute left-full ml-2 top-0 z-10 p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-xs max-w-xs">
                <div className="flex items-center gap-1 mb-1">
                  {getSubstrateIcon(substrateType)}
                  <span className="font-medium capitalize">{substrateType.replace('_', ' ')}</span>
                </div>
                <div className="text-gray-600">{reference.preview || reference.title || 'Substrate source'}</div>
                {reference.role && (
                  <div className="mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs inline-block">
                    {reference.role}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      return <div className={className} {...props}>{children}</div>;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Substrate Mode Toggle */}
      {references.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowSubstrateMode(!showSubstrateMode)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${showSubstrateMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'
              }
            `}
          >
            <Layers className="h-3 w-3" />
            {showSubstrateMode ? 'Hide' : 'Show'} Sources
          </button>
        </div>
      )}

      {/* Enhanced Document Content */}
      <div className="prose prose-gray prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw as any]}
          skipHtml={false}
          components={customRenderers}
          className="text-gray-800 leading-relaxed"
        >
          {showSubstrateMode ? enhanceContent(content) : content}
        </ReactMarkdown>
      </div>

      {/* Substrate Legend */}
      {showSubstrateMode && references.length > 0 && (
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
