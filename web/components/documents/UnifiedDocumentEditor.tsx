"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Code,
  Type,
  Save
} from 'lucide-react';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';

interface UnifiedDocumentEditorProps {
  documentId: string;
  basketId: string;
  initialContent: string;
  title: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'code';
  content: string;
}

export function UnifiedDocumentEditor({
  documentId,
  basketId,
  initialContent,
  title,
  onContentChange,
  onTitleChange
}: UnifiedDocumentEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  const changeManager = useUniversalChanges(basketId);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize blocks from content
  useEffect(() => {
    if (initialContent && blocks.length === 0) {
      const lines = initialContent.split('\n');
      const initialBlocks: Block[] = lines.map((line, index) => ({
        id: `block-${index}`,
        type: getBlockTypeFromLine(line),
        content: line.replace(/^#{1,3}\s*/, '').replace(/^[*-]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^>\s*/, '').replace(/^```/, '').replace(/```$/, '')
      }));
      
      if (initialBlocks.length === 0) {
        initialBlocks.push({ id: 'block-0', type: 'paragraph', content: '' });
      }
      
      setBlocks(initialBlocks);
    }
  }, [initialContent, blocks.length]);

  // Auto-save with debouncing
  const debouncedSave = useCallback(async (content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await changeManager.updateDocument(documentId, { content });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save document:', error);
      }
    }, 1000); // 1 second debounce
  }, [changeManager, documentId]);

  // Convert blocks to markdown and save
  useEffect(() => {
    const content = blocks.map(block => blockToMarkdown(block)).join('\n');
    onContentChange(content);
    if (content !== initialContent) {
      debouncedSave(content);
    }
  }, [blocks, onContentChange, initialContent, debouncedSave]);

  const getBlockTypeFromLine = (line: string): Block['type'] => {
    if (line.startsWith('### ')) return 'heading3';
    if (line.startsWith('## ')) return 'heading2';
    if (line.startsWith('# ')) return 'heading1';
    if (line.startsWith('* ') || line.startsWith('- ')) return 'bullet';
    if (line.match(/^\d+\. /)) return 'numbered';
    if (line.startsWith('> ')) return 'quote';
    if (line.startsWith('```') || line.endsWith('```')) return 'code';
    return 'paragraph';
  };

  const blockToMarkdown = (block: Block): string => {
    switch (block.type) {
      case 'heading1': return `# ${block.content}`;
      case 'heading2': return `## ${block.content}`;
      case 'heading3': return `### ${block.content}`;
      case 'bullet': return `* ${block.content}`;
      case 'numbered': return `1. ${block.content}`;
      case 'quote': return `> ${block.content}`;
      case 'code': return `\`\`\`\n${block.content}\n\`\`\``;
      default: return block.content;
    }
  };

  const updateBlock = (id: string, content: string, newType?: Block['type']) => {
    setBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, content, ...(newType && { type: newType }) }
        : block
    ));
  };

  const addBlock = (afterId: string, type: Block['type'] = 'paragraph') => {
    const newId = `block-${Date.now()}`;
    const afterIndex = blocks.findIndex(b => b.id === afterId);
    
    setBlocks(prev => [
      ...prev.slice(0, afterIndex + 1),
      { id: newId, type, content: '' },
      ...prev.slice(afterIndex + 1)
    ]);
    
    // Focus the new block
    setTimeout(() => setActiveBlockId(newId), 50);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return; // Keep at least one block
    
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Enter: Add line break within block
        updateBlock(blockId, block.content + '\n');
      } else {
        // Enter: Create new block
        addBlock(blockId);
      }
    } else if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
      
      // Focus previous block
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      if (blockIndex > 0) {
        setActiveBlockId(blocks[blockIndex - 1].id);
      }
    }
  };

  const handleSlashCommand = (blockId: string, command: string) => {
    const typeMap: Record<string, Block['type']> = {
      'h1': 'heading1',
      'h2': 'heading2', 
      'h3': 'heading3',
      'bullet': 'bullet',
      'numbered': 'numbered',
      'quote': 'quote',
      'code': 'code'
    };

    const newType = typeMap[command];
    if (newType) {
      updateBlock(blockId, '', newType);
    }
    
    setShowSlashMenu(false);
  };

  const detectSlashCommand = (content: string, blockId: string, cursorPosition: { x: number, y: number }) => {
    if (content === '/') {
      setShowSlashMenu(true);
      setSlashMenuPosition(cursorPosition);
    } else {
      setShowSlashMenu(false);
    }
  };

  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;
    
    const commonProps = {
      key: block.id,
      className: `block-editor min-h-[1.5rem] border-none outline-none resize-none w-full bg-transparent ${
        isActive ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
      }`,
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        updateBlock(block.id, newContent);
        
        // Detect slash commands
        if (newContent.endsWith('/')) {
          const rect = e.target.getBoundingClientRect();
          detectSlashCommand(newContent, block.id, { 
            x: rect.left, 
            y: rect.bottom 
          });
        }
      },
      onFocus: () => setActiveBlockId(block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      placeholder: block.type === 'paragraph' ? "Type '/' for commands or just start writing..." : 'Enter text...'
    };

    switch (block.type) {
      case 'heading1':
        return (
          <input
            {...commonProps}
            className={`${commonProps.className} text-3xl font-bold text-gray-900`}
            placeholder="Heading 1"
          />
        );
      
      case 'heading2':
        return (
          <input
            {...commonProps}
            className={`${commonProps.className} text-2xl font-semibold text-gray-900`}
            placeholder="Heading 2"
          />
        );
        
      case 'heading3':
        return (
          <input
            {...commonProps}
            className={`${commonProps.className} text-xl font-medium text-gray-900`}
            placeholder="Heading 3"
          />
        );
        
      case 'bullet':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <input
              {...commonProps}
              className={`${commonProps.className} flex-1`}
              placeholder="List item"
            />
          </div>
        );
        
      case 'numbered':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">1.</span>
            <input
              {...commonProps}
              className={`${commonProps.className} flex-1`}
              placeholder="Numbered item"
            />
          </div>
        );
        
      case 'quote':
        return (
          <div className="flex items-start gap-2 pl-4 border-l-4 border-gray-300">
            <textarea
              {...commonProps}
              className={`${commonProps.className} text-gray-600 italic`}
              placeholder="Quote text"
              rows={1}
            />
          </div>
        );
        
      case 'code':
        return (
          <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
            <textarea
              {...commonProps}
              className={`${commonProps.className} bg-transparent font-mono`}
              placeholder="Code block"
              rows={3}
            />
          </div>
        );
        
      default:
        return (
          <textarea
            {...commonProps}
            className={`${commonProps.className} text-gray-800 leading-relaxed`}
            rows={1}
            style={{ minHeight: '1.5rem' }}
          />
        );
    }
  };

  const slashCommands = [
    { command: 'h1', label: 'Heading 1', icon: Heading1 },
    { command: 'h2', label: 'Heading 2', icon: Heading2 },
    { command: 'bullet', label: 'Bullet List', icon: List },
    { command: 'numbered', label: 'Numbered List', icon: ListOrdered },
    { command: 'quote', label: 'Quote', icon: Quote },
    { command: 'code', label: 'Code Block', icon: Code }
  ];

  return (
    <div className="unified-document-editor">
      {/* Document Header */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-3xl font-bold text-gray-900 border-none outline-none w-full bg-transparent placeholder-gray-400"
          placeholder="Document title..."
        />
        
        {/* Save Status */}
        <div className="flex items-center justify-end mt-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Saved {lastSaved.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Editor Blocks */}
      <div className="space-y-2 min-h-[400px]">
        {blocks.map(renderBlock)}
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]"
          style={{ 
            left: slashMenuPosition.x, 
            top: slashMenuPosition.y + 20 
          }}
        >
          {slashCommands.map(({ command, label, icon: Icon }) => (
            <button
              key={command}
              onClick={() => activeBlockId && handleSlashCommand(activeBlockId, command)}
              className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .block-editor:focus {
          outline: none !important;
        }
        
        .block-editor::placeholder {
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
}