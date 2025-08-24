"use client";

import { useRef, useState, useMemo } from "react";
import { useCursorContext } from "@/lib/intelligence/useCursorContext";
import { useDocumentIntelligence, useSelectionAnalysis } from "@/lib/intelligence/useDocumentIntelligence";
import ContextItemOverlay from "./ContextItemOverlay";
import BlockSuggestionPopover from "./BlockSuggestionPopover";
import MemoryConnectionHighlight from "./MemoryConnectionHighlight";
import CursorContextTooltip from "./CursorContextTooltip";
import FloatingIntelligenceActions from "./FloatingIntelligenceActions";
import type { ContextItem } from "@shared/contracts/context";

interface Props {
  documentId: string;
  basketId: string;
  children: React.ReactNode;
  onBlockCreate?: (suggestion: any) => void;
  onDocumentNavigate?: (documentId: string) => void;
  className?: string;
}

export default function DocumentIntelligenceLayer({
  documentId,
  basketId,
  children,
  onBlockCreate,
  onDocumentNavigate,
  className
}: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [dismissedOverlays, setDismissedOverlays] = useState<Set<string>>(new Set());
  const [showCursorTooltip, setShowCursorTooltip] = useState(false);
  const [cursorTooltipPosition, setCursorTooltipPosition] = useState({ x: 0, y: 0 });

  const { cursorPosition, textSelection, hasCursor, hasSelection } = useCursorContext(documentRef);
  
  const {
    contextItems,
    blockSuggestions,
    memoryConnections,
    isLoading: intelligenceLoading
  } = useDocumentIntelligence(
    documentId,
    cursorPosition?.position
  );

  type RichContextItem = ContextItem & {
    relevance_score?: number;
    content?: string;
    position?: { start: number; x?: number; y?: number };
  };
  const typedContextItems = contextItems as RichContextItem[];

  const {
    contextSuggestions,
    relatedContent,
    enhancementOptions,
    isLoading: selectionLoading
  } = useSelectionAnalysis(
    documentId,
    textSelection?.text,
    documentRef.current?.textContent || ""
  );

  const visibleContextItems = useMemo(() => {
    return typedContextItems.filter(item =>
      !dismissedOverlays.has(`context-${item.type}-${item.relevance_score ?? 0}`)
    );
  }, [typedContextItems, dismissedOverlays]);

  const visibleBlockSuggestions = useMemo(() => {
    return blockSuggestions.filter(suggestion => 
      !dismissedOverlays.has(`block-${suggestion.suggestion_id}`)
    );
  }, [blockSuggestions, dismissedOverlays]);

  const visibleMemoryConnections = useMemo(() => {
    return memoryConnections.filter(connection => 
      !dismissedOverlays.has(`memory-${connection.connection_id}`)
    );
  }, [memoryConnections, dismissedOverlays]);

  const handleDismissOverlay = (overlayId: string) => {
    setDismissedOverlays(prev => new Set([...prev, overlayId]));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hasCursor && !hasSelection) {
      const rect = documentRef.current?.getBoundingClientRect();
      if (rect) {
        setCursorTooltipPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setShowCursorTooltip(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setShowCursorTooltip(false);
  };

  const getTextPosition = (element: HTMLElement, targetPosition: number) => {
    const range = document.createRange();
    const textNode = element.childNodes[0];
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, Math.min(targetPosition, textNode.textContent?.length || 0));
      range.setEnd(textNode, Math.min(targetPosition + 1, textNode.textContent?.length || 0));
      const rect = range.getBoundingClientRect();
      const containerRect = element.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const enhanceChildrenWithConnections = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      let enhancedText = children;
      const segments: Array<{ start: number; end: number; connection: any }> = [];
      
      visibleMemoryConnections.forEach(connection => {
        if (connection.position) {
          segments.push({
            start: connection.position.start,
            end: connection.position.end,
            connection
          });
        }
      });

      segments.sort((a, b) => a.start - b.start);

      const result: React.ReactNode[] = [];
      let lastIndex = 0;

      segments.forEach((segment, index) => {
        if (lastIndex < segment.start) {
          result.push(enhancedText.slice(lastIndex, segment.start));
        }
        
        result.push(
          <MemoryConnectionHighlight
            key={`memory-${segment.connection.connection_id}`}
            connection={segment.connection}
            onNavigate={onDocumentNavigate}
            onDismiss={() => handleDismissOverlay(`memory-${segment.connection.connection_id}`)}
          >
            {enhancedText.slice(segment.start, segment.end)}
          </MemoryConnectionHighlight>
        );
        
        lastIndex = segment.end;
      });

      if (lastIndex < enhancedText.length) {
        result.push(enhancedText.slice(lastIndex));
      }

      return result.length > 0 ? result : children;
    }

    return children;
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={documentRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {enhanceChildrenWithConnections(children)}
        
        {visibleContextItems.map((item, index) => {
          const position = item.position
            ? getTextPosition(documentRef.current!, item.position.start)
            : { x: 20 + index * 100, y: 20 };

          return (
            <ContextItemOverlay
              key={`context-${item.type}-${item.relevance_score ?? 0}-${index}`}
              contextItem={item}
              position={position}
              onDismiss={() =>
                handleDismissOverlay(`context-${item.type}-${item.relevance_score ?? 0}`)
              }
            />
          );
        })}
        
        {visibleBlockSuggestions.map((suggestion) => {
          const position = getTextPosition(documentRef.current!, suggestion.position);
          
          return (
            <BlockSuggestionPopover
              key={suggestion.suggestion_id}
              suggestion={suggestion}
              position={position}
              onAccept={onBlockCreate}
              onDismiss={() => handleDismissOverlay(`block-${suggestion.suggestion_id}`)}
              isVisible={!dismissedOverlays.has(`block-${suggestion.suggestion_id}`)}
            />
          );
        })}
        
        {showCursorTooltip && hasCursor && !hasSelection && (
          <CursorContextTooltip
            position={cursorTooltipPosition}
            themes={[]}
            contextItems={visibleContextItems}
            suggestedConnections={visibleMemoryConnections.map(c => c.related_content.substring(0, 50))}
            onAction={(action) => {
              console.log(`Intelligence action: ${action}`);
            }}
            isVisible={!intelligenceLoading}
          />
        )}
      </div>
      
      <FloatingIntelligenceActions
        documentId={documentId}
        basketId={basketId}
        onAnalyze={() => console.log('Analyze document')}
        onConnect={() => console.log('Find connections')}
        onEnhance={() => console.log('Enhance document')}
        onSummarize={() => console.log('Summarize document')}
      />
    </div>
  );
}