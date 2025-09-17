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
  const [preview, setPreview] = useState<{refs_detached_count:number;relationships_pruned_count:number;affected_documents_count:number} | null>(null);
  const [confirming, setConfirming] = useState<null | 'archive' | 'redact'>(null);

  // Initialize edit fields when substrate changes
  useEffect(() => {
    if (substrate) {
      setEditContent(substrate.content || '');
      setEditLabel(substrate.title || '');
      setEditSemanticType(substrate.semantic_type || '');
    }
  }, [substrate]);

  if (!substrate) return null;

  const canEdit = substrate.type !== 'dump'; // Original notes are read-only
  const canArchive = substrate.type === 'block';
  const canRedact = substrate.type === 'dump';

  const doPreview = async (action: 'archive'|'redact') => {
    try {
      setPreview(null);
      setConfirming(action);
      const res = await fetch('/api/cascade/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          substrate_type: action === 'archive' ? 'block' : 'dump',
          substrate_id: substrate.id,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
      } else {
        notificationService.substrateRejected('Preview failed', data.error || 'Unable to preview cascade', [substrate.id], basketId);
      }
    } catch (e) {
      notificationService.substrateRejected('Preview failed', 'Unable to preview cascade', [substrate.id], basketId);
    }
  };

  const confirmArchive = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [{ type: 'ArchiveBlock', data: { block_id: substrate.id } }]
          },
          priority: 'normal'
        })
      });
      const result = await response.json();
      if (result.execution_mode === 'auto_execute') {
        notificationService.substrateApproved('Knowledge Block Archived', 'Knowledge block has been archived', [substrate.id], basketId);
      } else {
        notificationService.approvalRequired('Archive Pending', 'Awaiting approval', basketId);
      }
      onClose();
      onSuccess?.();
    } catch (e) {
      notificationService.substrateRejected('Archive failed', 'Unable to archive block', [substrate.id], basketId);
    } finally {
      setLoading(false);
    }
  };

  const confirmRedact = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [{ type: 'RedactDump', data: { dump_id: substrate.id, scope: 'full', reason: 'user_requested' } }]
          },
          priority: 'normal'
        })
      });
      const result = await response.json();
      if (result.execution_mode === 'auto_execute') {
        notificationService.substrateApproved('Source Note Redacted', 'Original content redacted', [substrate.id], basketId);
      } else {
        notificationService.approvalRequired('Redaction Pending', 'Awaiting approval', basketId);
      }
      onClose();
      onSuccess?.();
    } catch (e) {
      notificationService.substrateRejected('Redaction failed', 'Unable to redact dump', [substrate.id], basketId);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [{
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
          },
          priority: 'normal'
        })
      });

      const result = await response.json();
      
      if (result.execution_mode === 'auto_execute') {
        notificationService.substrateApproved(
          `${substrate.type === 'block' ? 'Knowledge Block' : 'Meaning'} Updated`,
          'Your changes have been saved',
          [substrate.id],
          basketId
        );
      } else {
        notificationService.approvalRequired(
          `${substrate.type === 'block' ? 'Knowledge Block' : 'Meaning'} Edit Pending`,
          'Your changes are awaiting approval',
          basketId
        );
      }
      
      setMode('view');
      onClose();
      onSuccess?.();
    } catch (error) {
      notificationService.substrateRejected(
        'Failed to Save Changes',
        'Unable to update substrate item',
        [substrate.id],
        basketId
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || !confirm(`Delete this ${substrate.type}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [{
              type: 'Delete',
              data: {
                target_id: substrate.id,
                target_type: substrate.type,
                delete_reason: 'Manual deletion from building blocks'
              }
            }]
          },
          priority: 'normal'
        })
      });

      const result = await response.json();
      
      if (result.execution_mode === 'auto_execute') {
        notificationService.substrateApproved(
          `${substrate.type === 'block' ? 'Knowledge Block' : 'Meaning'} Deleted`,
          'Item has been removed from your basket',
          [substrate.id],
          basketId
        );
      } else {
        notificationService.approvalRequired(
          `${substrate.type === 'block' ? 'Knowledge Block' : 'Meaning'} Deletion Pending`,
          'Deletion request is awaiting approval',
          basketId
        );
      }
      
      onClose();
      onSuccess?.();
    } catch (error) {
      notificationService.substrateRejected(
        'Failed to Delete',
        'Unable to delete substrate item',
        [substrate.id],
        basketId
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSubstrateIcon(substrate.type)}
            <h3 className="text-sm font-medium text-gray-900">{substrate.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(substrate.type)}`}>
              {getTypeLabel(substrate.type)}
            </span>
            {substrate.type === 'dump' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Source Material
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
            {canArchive && mode === 'view' && (
              <Button variant="outline" size="sm" onClick={() => doPreview('archive')} disabled={loading}>
                Archive
              </Button>
            )}
            {canRedact && mode === 'view' && (
              <Button variant="outline" size="sm" onClick={() => doPreview('redact')} disabled={loading}>
                Redact
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto">
          <div className="space-y-4">
            {/* Processing Info */}
            {substrate.processing_agent && (
              <div className="bg-gray-50 rounded p-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>🔧</span>
                    <span className="font-medium">Processed automatically</span>
                  </div>
                  {substrate.agent_confidence && (
                    <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(substrate.agent_confidence)}`}>
                      {Math.round(substrate.agent_confidence * 100)}% quality
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
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
                <div className="bg-gray-50 rounded p-2 text-xs text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {substrate.content || 'No content available'}
                </div>
              )}
            </div>

            {/* Structured Ingredients */}
            {substrate.type === 'block' && substrate.structured_ingredients && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Knowledge Components</h4>
                <div className="bg-gray-50 rounded p-3 space-y-3">
                  {substrate.structured_ingredients.goals && substrate.structured_ingredients.goals.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-blue-700">🎯 Goals ({substrate.structured_ingredients.goals.length})</span>
                      <div className="mt-1 space-y-1">
                        {substrate.structured_ingredients.goals.slice(0, 3).map((goal: any, i: number) => (
                          <div key={i} className="text-xs text-gray-700 bg-blue-50 rounded px-2 py-1">
                            {goal.title || goal.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {substrate.structured_ingredients.constraints && substrate.structured_ingredients.constraints.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-red-700">⚠️ Constraints ({substrate.structured_ingredients.constraints.length})</span>
                      <div className="mt-1 space-y-1">
                        {substrate.structured_ingredients.constraints.slice(0, 3).map((constraint: any, i: number) => (
                          <div key={i} className="text-xs text-gray-700 bg-red-50 rounded px-2 py-1">
                            {constraint.title || constraint.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {substrate.structured_ingredients.metrics && substrate.structured_ingredients.metrics.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-green-700">📊 Metrics ({substrate.structured_ingredients.metrics.length})</span>
                      <div className="mt-1 space-y-1">
                        {substrate.structured_ingredients.metrics.slice(0, 3).map((metric: any, i: number) => (
                          <div key={i} className="text-xs text-gray-700 bg-green-50 rounded px-2 py-1">
                            {metric.name}: {metric.target}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {substrate.structured_ingredients.entities && substrate.structured_ingredients.entities.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-purple-700">👥 Entities ({substrate.structured_ingredients.entities.length})</span>
                      <div className="mt-1 space-y-1">
                        {substrate.structured_ingredients.entities.slice(0, 3).map((entity: any, i: number) => (
                          <div key={i} className="text-xs text-gray-700 bg-purple-50 rounded px-2 py-1">
                            {entity.name} ({entity.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{getTypeLabel(substrate.type)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(substrate.created_at)}</div>
                </div>
                {substrate.semantic_type && (
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <div className="font-medium">{substrate.semantic_type}</div>
                  </div>
                )}
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
  const [viewMode, setViewMode] = useState<'all' | 'source'>('all');
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
                    onClick={() => setSelectedSubstrate(substrate)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <FolderOpen className="h-4 w-4 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">{substrate.title}</h4>
                          <p className="text-xs text-gray-600 truncate">{substrate.content}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(substrate.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {filteredSubstrates.filter(s => s.type === 'dump').length === 0 && (
              <div className="text-center py-6 text-gray-500 text-xs">
                {searchQuery ? 'No source notes match your search.' : 'No source notes captured yet.'}
              </div>
            )}
          </div>
        ) : (
          /* Secondary View: All Types */
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="bg-white border border-gray-100 rounded p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48 relative">
                  <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your knowledge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded text-xs"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs"
                  >
                    <option value="all">All Types</option>
                    <option value="context_item">Meanings</option>
                    <option value="block">Knowledge Blocks</option>
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
                  onClick={() => setSelectedSubstrate(substrate)}
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

      {/* Confirm Dialog handled inside DetailModal for Archive/Redact */}

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
