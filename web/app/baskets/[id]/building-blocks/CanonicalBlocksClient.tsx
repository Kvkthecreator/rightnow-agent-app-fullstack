"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface CanonicalBlock {
  id: string;
  basket_id: string;
  title: string | null;
  body_md: string | null;
  state: string;
  version: number;
  created_at: string;
  updated_at: string;
  metadata: any;
  // P1 Agent specific fields
  semantic_type?: string;
  confidence_score?: number;
  processing_agent?: string;
  keywords?: string[];
  dump_id?: string;
}

interface CanonicalBlocksClientProps {
  basketId: string;
}

export default function CanonicalBlocksClient({ basketId }: CanonicalBlocksClientProps) {
  const [blocks, setBlocks] = useState<CanonicalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticFilter, setSemanticFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'confidence' | 'semantic_type'>('created_at');

  // Load blocks from canonical API
  async function loadBlocks() {
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/blocks`);
      if (!response.ok) {
        throw new Error("Failed to load blocks");
      }

      const data: CanonicalBlock[] = await response.json();
      setBlocks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blocks");
    } finally {
      setLoading(false);
    }
  }

  // Format confidence score for display
  function formatConfidence(confidence?: number): string {
    if (!confidence) return 'Unknown';
    return `${Math.round(confidence * 100)}%`;
  }

  // Get confidence color based on score
  function getConfidenceColor(confidence?: number): string {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  }

  // Canon v1.4.0: Substrate Equality - all semantic types treated as peers
  function getSemanticTypeColor(type?: string): string {
    // Use consistent, peer-level styling for all substrate types
    // All types get same visual treatment to avoid hierarchy implications
    return 'bg-blue-100 text-blue-800';
  }

  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffHours * 60);
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)} hours ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} days ago`;
    }
  }

  // Filter and sort blocks
  function filteredAndSortedBlocks(): CanonicalBlock[] {
    let filtered = blocks.filter(block => {
      const matchesSearch = !searchQuery || 
        block.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.body_md?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.keywords?.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSemantic = semanticFilter === 'all' || block.semantic_type === semanticFilter;
      
      return matchesSearch && matchesSemantic;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (b.confidence_score || 0) - (a.confidence_score || 0);
        case 'semantic_type':
          return (a.semantic_type || '').localeCompare(b.semantic_type || '');
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  // Get unique semantic types for filter
  const uniqueSemanticTypes = Array.from(new Set(blocks.map(block => block.semantic_type).filter((type): type is string => Boolean(type))));

  // Load initial data
  useEffect(() => {
    loadBlocks();
  }, [basketId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-28 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load substrate blocks</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={loadBlocks}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🧱</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Substrate Blocks Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          The P1 Substrate Agent will create structured blocks once you add memory to your basket.
          Blocks represent your thoughts organized into semantic building blocks.
        </p>
        <div className="text-xs text-gray-500">
          💡 Add some memory content to see the P1 Agent transform it into structured substrate
        </div>
      </div>
    );
  }

  const filteredBlocks = filteredAndSortedBlocks();
  const avgConfidence = blocks.reduce((sum, b) => sum + (b.confidence_score || 0), 0) / blocks.length;

  return (
    <div className="space-y-6">
      {/* Agent Processing Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {blocks.length}
          </div>
          <div className="text-sm text-gray-500">Substrate Blocks</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {uniqueSemanticTypes.length}
          </div>
          <div className="text-sm text-gray-500">Semantic Types</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(avgConfidence * 100)}%
          </div>
          <div className="text-sm text-gray-500">Avg Confidence</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {blocks.filter(b => b.processing_agent).length}
          </div>
          <div className="text-sm text-gray-500">Agent Created</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search blocks, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Semantic Type:</label>
            <select
              value={semanticFilter}
              onChange={(e) => setSemanticFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              {uniqueSemanticTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="created_at">Created Date</option>
              <option value="confidence">Confidence</option>
              <option value="semantic_type">Semantic Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blocks List */}
      <div className="space-y-4">
        {filteredBlocks.map((block, index) => (
          <div key={block.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Block Header */}
            <div className="border-b border-gray-100 px-6 py-3 bg-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <h3 className="font-medium text-gray-900">
                    {block.title || `Block #${index + 1}`}
                  </h3>
                  
                  {/* Semantic Type Badge */}
                  {block.semantic_type && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSemanticTypeColor(block.semantic_type)}`}>
                      {block.semantic_type}
                    </span>
                  )}
                  
                  {/* Confidence Score */}
                  {block.confidence_score && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(block.confidence_score)}`}>
                      {formatConfidence(block.confidence_score)} confidence
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-orange-600">
                  {formatDate(block.created_at)}
                </div>
              </div>
            </div>

            {/* Block Content */}
            <div className="px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-800 whitespace-pre-wrap">
                  {block.body_md || 'No content available'}
                </div>
              </div>
            </div>

            {/* Agent Metadata */}
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  {block.processing_agent && (
                    <div className="flex items-center gap-1">
                      <span>🤖</span>
                      <span>{block.processing_agent}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>v{block.version}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>{block.state}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {block.keywords && block.keywords.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🏷️</span>
                      <span>{block.keywords.slice(0, 3).join(', ')}</span>
                      {block.keywords.length > 3 && <span>+{block.keywords.length - 3} more</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>🆔</span>
                    <span>{block.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBlocks.length === 0 && blocks.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No blocks match your current filters. Try adjusting your search or filter criteria.
        </div>
      )}
    </div>
  );
}