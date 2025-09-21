"use client";

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications/service';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Database, FileText, FolderOpen, Eye, Filter, Search, Plus } from 'lucide-react';
import CreateBlockModal from '@/components/building-blocks/CreateBlockModal';
import CreateContextItemModal from '@/components/building-blocks/CreateContextItemModal';
import SubstrateDetailModal from '@/components/substrate/SubstrateDetailModal';

interface UnifiedSubstrate {
  id: string;
  type: 'dump' | 'context_item' | 'block' | 'timeline_event';  // v2.0 substrate types
  title: string;
  content: string;
  agent_stage: 'P0' | 'P1' | 'P2' | 'P3';
  agent_type?: string;
  confidence_score?: number;
  semantic_type?: string;
  created_at: string;
  metadata: any;
  processing_agent?: string;
  agent_confidence?: number;
  structured_ingredients?: {
    goals?: any[];
    constraints?: any[];
    metrics?: any[];
    entities?: any[];
    provenance?: any;
  };
}

interface BuildingBlocksResponse {
  substrates: UnifiedSubstrate[];
  counts: {
    dumps: number;       // v2.0 naming
    context_items: number;
    blocks: number;
    total: number;
  };
}

interface BuildingBlocksClientProps {
  basketId: string;
}

export default function BuildingBlocksClient({ basketId }: BuildingBlocksClientProps) {
  const [data, setData] = useState<BuildingBlocksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'source'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSubstrate, setSelectedSubstrate] = useState<{
    type: 'raw_dump' | 'block' | 'context_item' | 'relationship' | 'timeline_event';
    id: string;
  } | null>(null);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [showCreateContextItem, setShowCreateContextItem] = useState(false);

  async function loadBuildingBlocks() {
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/building-blocks`);
      if (!response.ok) {
        throw new Error("Failed to load building blocks");
      }

      const result: BuildingBlocksResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load building blocks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBuildingBlocks();
  }, [basketId]);

  const filteredSubstrates = data?.substrates.filter(substrate => {
    const matchesSearch = !searchQuery || 
      substrate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      substrate.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || substrate.type === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  // Restrict to meanings and knowledge blocks for the All Types view
  const filteredKnowledgeSubstrates = (data?.substrates || []).filter(substrate => {
    if (substrate.type === 'dump') return false; // exclude Source Notes from All Types
    const matchesSearch = !searchQuery ||
      substrate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      substrate.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || substrate.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
          <span>⚠️</span>
          <span>Failed to load building blocks</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={loadBuildingBlocks} className="mt-2">
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.counts.total === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏷️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Add Meaning to Your Knowledge</h3>
        <p className="text-gray-600 text-sm mb-4">
          Create meaning layers and organize your knowledge blocks.
          Connect related concepts and make your insights discoverable.
        </p>
        <Button onClick={() => setShowCreateContextItem(true)} className="mt-4">
          Add Your First Meaning
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'all' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setViewMode('all')}
            >
              All Types
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'source' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setViewMode('source')}
            >
              Source Notes
            </button>
          </div>
        </div>

        {viewMode === 'source' ? (
          /* Source Notes: list raw source notes only */
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Source Notes</h3>
                <div className="text-xs text-gray-500">{data.counts.dumps} notes</div>
              </div>
              <div className="relative max-w-md">
                <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search source notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredSubstrates
                .filter(s => s.type === 'dump')
                .map((substrate) => (
                  <div
                    key={substrate.id}
                    className="bg-white border border-gray-100 rounded p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSubstrate({ 
                      type: 'raw_dump', 
                      id: substrate.id 
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {getSubstrateIcon(substrate.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{substrate.title}</h4>
                          <p className="text-xs text-gray-600 truncate">{substrate.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="text-xs text-gray-500">{formatDate(substrate.created_at)}</div>
                        <Eye className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {filteredSubstrates.filter(s => s.type === 'dump').length === 0 && data.counts.dumps > 0 && (
              <div className="text-center py-8 text-gray-500">
                No source notes match your search.
              </div>
            )}
          </div>
        ) : (
          /* All Types: grouped list of knowledge items (meanings + knowledge blocks) */
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Your Knowledge</h3>
                
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 pl-7 pr-3 py-2 border border-gray-200 rounded text-xs"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded text-xs"
                  >
                    <option value="all">All Types</option>
                    <option value="context_item">Meanings Only</option>
                    <option value="block">Knowledge Blocks Only</option>
                  </select>
                </div>
                
                {/* Create Buttons */}
                <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowCreateContextItem(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Meaning
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowCreateBlock(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Knowledge Block
                  </Button>
                </div>
              </div>
            </div>

            {/* Knowledge Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-100 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Source Notes</span>
                </div>
                <div className="text-lg font-bold text-green-600">{data.counts.dumps}</div>
                <div className="text-xs text-gray-500">Your original input</div>
              </div>

              <div className="bg-white border border-gray-100 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Meanings</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{data.counts.context_items}</div>
                <div className="text-xs text-gray-500">Semantic connections</div>
              </div>

              <div className="bg-white border border-gray-100 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-600">Knowledge Blocks</span>
                </div>
                <div className="text-lg font-bold text-orange-600">{data.counts.blocks}</div>
                <div className="text-xs text-gray-500">Structured insights</div>
              </div>

              <div className="bg-white border border-gray-100 rounded p-3">
                <div className="text-xs font-medium text-gray-600 mb-2">Total Items</div>
                <div className="text-lg font-bold text-purple-600">{data.counts.total}</div>
                <div className="text-xs text-gray-500">Your knowledge</div>
              </div>
            </div>

            {/* Your Knowledge Items (Meanings + Knowledge Blocks only) */}
            <div className="space-y-2">
              {filteredKnowledgeSubstrates.map((substrate) => (
                <div
                  key={substrate.id} 
                  className="bg-white border border-gray-100 rounded p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSubstrate({ 
                    type: substrate.type === 'dump' ? 'raw_dump' : substrate.type as any, 
                    id: substrate.id 
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {getSubstrateIcon(substrate.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{substrate.title}</h4>
                        <p className="text-xs text-gray-600 truncate">{substrate.content}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(substrate.type)}`}>
                        {getTypeLabel(substrate.type)}
                      </span>
                      {substrate.agent_confidence && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(substrate.agent_confidence)}`}>
                          {Math.round(substrate.agent_confidence * 100)}%
                        </span>
                      )}
                      <div className="text-xs text-gray-500">
                        {formatDate(substrate.created_at)}
                      </div>
                      <Eye className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredKnowledgeSubstrates.length === 0 && (data.counts.context_items + data.counts.blocks) > 0 && (
              <div className="text-center py-8 text-gray-500">
                No items match your search or filter.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Substrate Detail Modal */}
      {selectedSubstrate && (
        <SubstrateDetailModal
          substrateType={selectedSubstrate.type}
          substrateId={selectedSubstrate.id}
          basketId={basketId}
          open={!!selectedSubstrate}
          onClose={() => setSelectedSubstrate(null)}
        />
      )}
      
      {/* Create Modals */}
      <CreateBlockModal
        basketId={basketId}
        open={showCreateBlock}
        onClose={() => setShowCreateBlock(false)}
        onSuccess={loadBuildingBlocks}
      />
      
      <CreateContextItemModal
        basketId={basketId}
        open={showCreateContextItem}
        onClose={() => setShowCreateContextItem(false)}
        onSuccess={loadBuildingBlocks}
      />
    </>
  );
}

// Helper functions for user-friendly display

function getSubstrateIcon(type: string) {
  switch (type) {
    case 'dump': return <FolderOpen className="h-4 w-4 text-green-600" />;
    case 'context_item': return <FileText className="h-4 w-4 text-blue-600" />;
    case 'block': return <Database className="h-4 w-4 text-orange-600" />;
    case 'timeline_event': return <Database className="h-4 w-4 text-purple-600" />;
    default: return <Database className="h-4 w-4 text-gray-600" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'dump': return 'bg-green-100 text-green-800';
    case 'context_item': return 'bg-blue-100 text-blue-800';
    case 'block': return 'bg-orange-100 text-orange-800';
    case 'timeline_event': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'dump': return 'Source Note';
    case 'context_item': return 'Meaning';
    case 'block': return 'Knowledge Block';
    case 'timeline_event': return 'Event';
    default: return 'Item';
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800';
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
  return 'bg-orange-100 text-orange-800';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffHours * 60);
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${Math.round(diffHours)}h ago`;
  } else {
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  }
}