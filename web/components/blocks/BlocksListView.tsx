"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  FileText, 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Hash,
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreVertical
} from 'lucide-react';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import type { BlockDTO } from '@/shared/contracts/documents';

interface BlocksListViewProps {
  basketId: string;
  basketTitle: string;
  initialBlocks: BlockDTO[];
  canEdit: boolean;
}

interface BlockWithStats extends BlockDTO {
  references_count?: number;
  last_referenced?: string;
}

export function BlocksListView({ 
  basketId, 
  basketTitle, 
  initialBlocks, 
  canEdit 
}: BlocksListViewProps) {
  const [blocks, setBlocks] = useState<BlockWithStats[]>(initialBlocks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title' | 'references'>('created_at');
  const router = useRouter();

  useEffect(() => {
    // Enhance blocks with reference statistics
    const fetchBlockStats = async () => {
      try {
        const enhancedBlocks = await Promise.all(
          initialBlocks.map(async (block) => {
            try {
              const response = await fetch(`/api/blocks/${block.id}/stats`);
              if (response.ok) {
                const stats = await response.json();
                return { ...block, ...stats };
              }
              return block;
            } catch (err) {
              console.warn(`Failed to fetch stats for block ${block.id}:`, err);
              return block;
            }
          })
        );
        setBlocks(enhancedBlocks);
      } catch (err) {
        console.error('Error enhancing blocks:', err);
      }
    };

    fetchBlockStats();
  }, [initialBlocks]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'superseded': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredAndSortedBlocks = () => {
    let filtered = blocks.filter(block => {
      const matchesSearch = !searchQuery || 
        block.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.body_md?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesState = stateFilter === 'all' || block.state === stateFilter;
      
      return matchesSearch && matchesState;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'references':
          return (b.references_count || 0) - (a.references_count || 0);
        case 'updated_at':
          return new Date(b.updated_at || b.created_at).getTime() - 
                 new Date(a.updated_at || a.created_at).getTime();
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const handleBlockClick = (blockId: string) => {
    router.push(`/baskets/${basketId}/blocks/${blockId}`);
  };

  const handleCreateBlock = () => {
    router.push(`/baskets/${basketId}/blocks/new`);
  };

  const uniqueStates = Array.from(new Set(blocks.map(block => block.state)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6 max-w-6xl px-4">
        
        {/* Header */}
        <SubpageHeader title="Blocks" basketId={basketId} />
        
        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search blocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="all">All States</option>
                    {uniqueStates.map(state => (
                      <option key={state} value={state}>
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="created_at">Created Date</option>
                    <option value="updated_at">Updated Date</option>
                    <option value="title">Title</option>
                    <option value="references">References</option>
                  </select>
                </div>
              </div>
              
              {canEdit && (
                <Button onClick={handleCreateBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Block
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {blocks.length}
                </div>
                <div className="text-sm text-gray-500">Total Blocks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {blocks.filter(b => b.state === 'active').length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {blocks.reduce((sum, b) => sum + (b.references_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">References</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {blocks.filter(b => b.updated_at !== b.created_at).length}
                </div>
                <div className="text-sm text-gray-500">Modified</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Context Blocks ({filteredAndSortedBlocks().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : filteredAndSortedBlocks().length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8 text-gray-400" />}
                title={blocks.length === 0 ? "No blocks yet" : "No blocks match your filters"}
                action={
                  blocks.length === 0 ? (
                    canEdit ? (
                      <Button onClick={handleCreateBlock} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Block
                      </Button>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        Blocks will appear here once content is added to the basket
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting your search or filter criteria
                    </p>
                  )
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredAndSortedBlocks().map((block) => (
                  <div
                    key={block.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleBlockClick(block.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {block.title || 'Untitled Block'}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStateColor(block.state)}`}>
                            {block.state}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            v{block.version}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {block.body_md ? (
                            block.body_md.length > 150 ? 
                            `${block.body_md.substring(0, 150)}...` : 
                            block.body_md
                          ) : (
                            'No content available'
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(block.created_at)}</span>
                          </div>
                          {block.updated_at !== block.created_at && (
                            <div className="flex items-center gap-1">
                              <Edit className="h-3 w-3" />
                              <span>Updated {formatDate(block.updated_at || block.created_at)}</span>
                            </div>
                          )}
                          {block.references_count !== undefined && block.references_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              <span>{block.references_count} reference{block.references_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {block.last_referenced && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>Last referenced {formatDate(block.last_referenced)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {canEdit && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/baskets/${basketId}/blocks/${block.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}