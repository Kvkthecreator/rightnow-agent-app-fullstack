'use client';
import { useState } from 'react';
import { useFocus } from '../FocusContext';
import { useBasketEvents } from '@/lib/hooks/useBasketEvents';
import { LoadingSkeleton, EmptyState } from '@/components/ui/states';

interface Block {
  id: string;
  title?: string;
  content: string;
  context_items?: string[];
  created_at: string;
  updated_at: string;
}

// Mock hook - replace with actual implementation
function useBasketBlocks(basketId: string) {
  // This would be replaced with the actual API call
  return {
    data: [] as Block[],
    isLoading: false,
    error: null
  };
}


export default function BlocksCenter({ basketId }: { basketId: string }) {
  const { data: blocks, isLoading } = useBasketBlocks(basketId);
  const [search, setSearch] = useState('');
  const { setFocus } = useFocus();
  
  // Subscribe to real-time events
  useBasketEvents(basketId);
  
  if (isLoading) return <LoadingSkeleton type="grid" />;
  if (!blocks?.length) return <EmptyState type="blocks" />;
  
  // Progressive disclosure: only show search with 5+ items
  const showSearch = blocks.length > 5;
  
  const filteredBlocks = blocks.filter(block => 
    block.content.toLowerCase().includes(search.toLowerCase()) ||
    block.title?.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with optional search */}
      <div className="border-b border-gray-100 bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Memory Blocks</h1>
              <p className="text-sm text-gray-500">{blocks.length} structured thoughts</p>
            </div>
          </div>
          
          {showSearch && (
            <div className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter memories..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                />
                <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Grid content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No blocks match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredBlocks.map(block => (
              <button
                key={block.id}
                onClick={() => setFocus({ kind: 'block', id: block.id })}
                className="group p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all text-left focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700">
                  {block.title || 'Untitled Block'}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-4 mb-4">
                  {block.content}
                </p>
                
                {/* Context tags */}
                {block.context_items && block.context_items.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {block.context_items.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                        {tag}
                      </span>
                    ))}
                    {block.context_items.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                        +{block.context_items.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="text-xs text-gray-400">
                  {new Date(block.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
