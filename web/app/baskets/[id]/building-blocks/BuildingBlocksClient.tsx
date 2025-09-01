"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Database, FileText, FolderOpen, Eye, Filter, Search, Plus } from 'lucide-react';
import CreateBlockModal from '@/components/building-blocks/CreateBlockModal';
import CreateContextItemModal from '@/components/building-blocks/CreateContextItemModal';

// Canon v1.4.0: Unified substrate interface - All Substrates are Peers
interface UnifiedSubstrate {
  id: string;
  type: 'raw_dump' | 'context_item' | 'block';
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
}

interface BuildingBlocksResponse {
  substrates: UnifiedSubstrate[];
  counts: {
    raw_dumps: number;
    context_items: number;
    blocks: number;
    total: number;
  };
}

interface BuildingBlocksClientProps {
  basketId: string;
}

interface DetailModalProps {
  substrate: UnifiedSubstrate | null;
  basketId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function DetailModal({ substrate, basketId, onClose, onSuccess }: DetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editContent, setEditContent] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editSemanticType, setEditSemanticType] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize edit fields when substrate changes
  useEffect(() => {
    if (substrate) {
      setEditContent(substrate.content || '');
      setEditLabel(substrate.title || '');
      setEditSemanticType(substrate.semantic_type || '');
    }
  }, [substrate]);

  if (!substrate) return null;

  const canEdit = substrate.type !== 'raw_dump'; // Canon: raw_dumps are immutable
  
  const handleEdit = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_point: 'manual_edit',
          basket_id: basketId,
          ops: [{
            type: substrate.type === 'block' ? 'ReviseBlock' : 'EditContextItem',
            data: substrate.type === 'block' ? {
              block_id: substrate.id,
              content: editContent,
              semantic_type: editSemanticType,
              revision_reason: 'Manual edit from building blocks'
            } : {
              context_item_id: substrate.id,
              label: editLabel,
              content: editContent
            }
          }]
        })
      });

      const result = await response.json();
      
      if (result.route === 'direct') {
        toast.success(`${substrate.type === 'block' ? 'Block' : 'Context item'} updated ✓`);
      } else {
        toast.success(`${substrate.type === 'block' ? 'Block' : 'Context item'} edit proposed for review ⏳`);
      }
      
      setMode('view');
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || !confirm(`Delete this ${substrate.type}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_point: 'manual_edit',
          basket_id: basketId,
          ops: [{
            type: 'Delete',
            data: {
              target_id: substrate.id,
              target_type: substrate.type,
              delete_reason: 'Manual deletion from building blocks'
            }
          }]
        })
      });

      const result = await response.json();
      
      if (result.route === 'direct') {
        toast.success(`${substrate.type === 'block' ? 'Block' : 'Context item'} deleted ✓`);
      } else {
        toast.success(`${substrate.type === 'block' ? 'Block' : 'Context item'} deletion proposed for review ⏳`);
      }
      
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSubstrateIcon(substrate.type)}
            <h3 className="font-semibold text-gray-900">{substrate.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAgentStageColor(substrate.agent_stage)}`}>
              {substrate.agent_stage} Agent
            </span>
            {substrate.type === 'raw_dump' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Immutable
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                  disabled={loading}
                >
                  {mode === 'view' ? 'Edit' : 'Cancel'}
                </Button>
                {mode === 'view' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Agent Attribution */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span className="font-medium">{substrate.processing_agent}</span>
                </div>
                {substrate.agent_confidence && (
                  <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(substrate.agent_confidence)}`}>
                    {Math.round(substrate.agent_confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {mode === 'edit' ? 'Edit Content' : 'Content'}
              </h4>
              {mode === 'edit' && canEdit ? (
                <div className="space-y-3">
                  {substrate.type === 'context_item' && (
                    <div>
                      <Label htmlFor="edit-label">Label</Label>
                      <Input
                        id="edit-label"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  {substrate.type === 'block' && (
                    <div>
                      <Label htmlFor="edit-semantic">Semantic Type</Label>
                      <Input
                        id="edit-semantic"
                        value={editSemanticType}
                        onChange={(e) => setEditSemanticType(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setMode('view')} disabled={loading}>
                      Cancel
                    </Button>
                    <Button onClick={handleEdit} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {substrate.content || 'No content available'}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{substrate.type.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(substrate.created_at)}</div>
                </div>
                {substrate.semantic_type && (
                  <div>
                    <span className="text-gray-500">Semantic Type:</span>
                    <div className="font-medium">{substrate.semantic_type}</div>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">ID:</span>
                  <div className="font-mono text-xs">{substrate.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuildingBlocksClient({ basketId }: BuildingBlocksClientProps) {
  const [data, setData] = useState<BuildingBlocksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSubstrate, setSelectedSubstrate] = useState<UnifiedSubstrate | null>(null);
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
          <span className="text-2xl">🧱</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Building Blocks Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          Your building blocks will appear here as agents process your memory. 
          All substrate types are treated as equals in the Canon architecture.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Substrate Counts - Canon Equality Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Raw Captures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.counts.raw_dumps}</div>
              <div className="text-xs text-gray-500">P0 Agent</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Context Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.counts.context_items}</div>
              <div className="text-xs text-gray-500">Foundation</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Processed Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.counts.blocks}</div>
              <div className="text-xs text-gray-500">P1 Agent</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Building Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data.counts.total}</div>
              <div className="text-xs text-gray-500">All Substrates</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all building blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="raw_dump">Raw Captures</option>
                  <option value="context_item">Context Items</option>
                  <option value="block">Processed Blocks</option>
                </select>
              </div>
              
              {/* CRUD Creation Buttons */}
              <div className="flex items-center gap-2 border-l pl-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCreateContextItem(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Context Item
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCreateBlock(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Block
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unified Substrate List - Canon Equality */}
        <div className="space-y-3">
          {filteredSubstrates.map((substrate) => (
            <Card 
              key={substrate.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSubstrate(substrate)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getSubstrateIcon(substrate.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{substrate.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{substrate.content}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAgentStageColor(substrate.agent_stage)}`}>
                      {substrate.agent_stage}
                    </span>
                    {substrate.agent_confidence && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(substrate.agent_confidence)}`}>
                        {Math.round(substrate.agent_confidence * 100)}%
                      </span>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDate(substrate.created_at)}
                    </div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubstrates.length === 0 && data.counts.total > 0 && (
          <div className="text-center py-8 text-gray-500">
            No building blocks match your current filters.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal 
        substrate={selectedSubstrate}
        basketId={basketId}
        onClose={() => setSelectedSubstrate(null)}
        onSuccess={loadBuildingBlocks}
      />
      
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

// Helper functions for consistent Canon-compliant styling

function getSubstrateIcon(type: string) {
  switch (type) {
    case 'raw_dump': return <FolderOpen className="h-5 w-5 text-green-600" />;
    case 'context_item': return <FileText className="h-5 w-5 text-blue-600" />;
    case 'block': return <Database className="h-5 w-5 text-orange-600" />;
    default: return <Database className="h-5 w-5 text-gray-600" />;
  }
}

function getAgentStageColor(stage: string): string {
  switch (stage) {
    case 'P0': return 'bg-green-100 text-green-800';
    case 'P1': return 'bg-orange-100 text-orange-800';
    case 'P2': return 'bg-cyan-100 text-cyan-800';
    case 'P3': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
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