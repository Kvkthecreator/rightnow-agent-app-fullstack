"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Network,
  ArrowLeft,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Info,
  FileText,
  Database,
  FolderOpen,
  Lightbulb,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
// Page-level header supplied by parent layout

interface GraphNode {
  id: string;
  type: 'block' | 'dump' | 'context_item';
  title: string;
  label: string;
  color: string;
  size: number;
  metadata: Record<string, any>;
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  relationship_type?: string;
  type: 'semantic' | 'derivation';
  color: string;
  width: number;
}

interface GraphData {
  blocks: any[];
  dumps: any[];
  context_items: any[];
  relationships: any[];
}

interface GraphViewProps {
  basketId: string;
  basketTitle: string;
  graphData: GraphData;
  canEdit: boolean;
}

export function GraphView({ basketId, basketTitle, graphData, canEdit }: GraphViewProps) {
  // Helpers: ensure safe strings and truncation (avoid null.length crashes)
  const toStringSafe = (val: unknown, fallback = ''): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return fallback;
    try {
      return String(val);
    } catch {
      return fallback;
    }
  };

  const truncate = (text: string, max = 15): string => {
    const s = toStringSafe(text, '');
    return s.length > max ? s.substring(0, max) + '...' : s;
  };

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, GraphNode>>({});
  const [bulkPreview, setBulkPreview] = useState<{ refs: number; rels: number; docs: number } | null>(null);
  const [visibleTypes, setVisibleTypes] = useState({
    block: true,
    dump: true,
    context_item: true
  });
  const [graphLayout, setGraphLayout] = useState<'force' | 'hierarchy' | 'circular'>('force');
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeWeights, setShowEdgeWeights] = useState(false);
  const [confirming, setConfirming] = useState<null | 'archive' | 'redact'>(null);
  const [preview, setPreview] = useState<{refs_detached_count:number;relationships_pruned_count:number;affected_documents_count:number} | null>(null);
  const [busy, setBusy] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    buildGraph();
  }, [graphData, visibleTypes]);

  useEffect(() => {
    renderGraph();
  }, [nodes, edges, zoom, showLabels, showEdgeWeights, selectedNode]);

  const buildGraph = () => {
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];

    // Create context-item nodes (semantic bridges)
    if (visibleTypes.context_item) {
      (graphData.context_items || []).forEach(item => {
        const title = toStringSafe(item?.title, toStringSafe(item?.normalized_label, toStringSafe(item?.type, 'context item')));
        nodeMap.set(item.id, {
          id: item.id,
          type: 'context_item',
          title,
          label: truncate(title, 15),
          color: '#3b82f6', // blue
          size: 12,
          metadata: item
        });
      });
    }

    // Create block nodes (Canon compliant - using semantic_type)
    if (visibleTypes.block) {
      (graphData.blocks || []).forEach(block => {
        const semantic = toStringSafe(block?.semantic_type, toStringSafe(block?.title, 'block'));
        nodeMap.set(block.id, {
          id: block.id,
          type: 'block',
          title: semantic,
          label: truncate(semantic, 15),
          color: getBlockColor(typeof block?.confidence_score === 'number' ? block.confidence_score : 0.5),
          size: 18,
          metadata: block
        });
      });
    }

    // Create dump nodes
    if (visibleTypes.dump) {
      (graphData.dumps || []).forEach(dump => {
        const sourceType = toStringSafe(dump?.source_meta?.source_type, 'capture');
        nodeMap.set(dump.id, {
          id: dump.id,
          type: 'dump',
          title: `${sourceType} capture`,
          label: sourceType,
          color: '#10b981', // green
          size: 14,
          metadata: dump
        });
      });
    }

    // Create edges from context relationships (Canon-compliant semantic bridges)
    (graphData.relationships || []).forEach(rel => {
      const sourceNode = nodeMap.get(rel.from_id);
      const targetNode = nodeMap.get(rel.to_id);
      
      if (sourceNode && targetNode) {
        edgeList.push({
          id: rel.id,
          source: rel.from_id,
          target: rel.to_id,
          weight: typeof rel?.weight === 'number' ? rel.weight : 0.7,
          relationship_type: rel.relationship_type,
          type: 'semantic',
          color: getRelationshipColor(rel.relationship_type),
          width: Math.max(1, ((typeof rel?.weight === 'number' ? rel.weight : 0.7) as number) * 3)
        });
      }
    });

    // Apply layout algorithm
    const layoutNodes = applyLayout(Array.from(nodeMap.values()), edgeList, graphLayout);
    
    setNodes(layoutNodes);
    setEdges(edgeList);
  };

  const getBlockColor = (confidence_score: number) => {
    if (confidence_score >= 0.8) return '#10b981'; // high confidence - green
    if (confidence_score >= 0.6) return '#3b82f6'; // medium confidence - blue
    if (confidence_score >= 0.4) return '#f59e0b'; // low confidence - yellow
    return '#ef4444'; // very low confidence - red
  };

  const getRelationshipColor = (relationshipType?: string) => {
    switch (relationshipType) {
      case 'relates_to': return '#3b82f6'; // blue
      case 'contains': return '#10b981'; // green
      case 'derived_from': return '#f59e0b'; // orange
      case 'similar_to': return '#8b5cf6'; // purple
      default: return '#64748b'; // gray
    }
  };

  const applyLayout = (nodes: GraphNode[], edges: GraphEdge[], layout: string): GraphNode[] => {
    const width = 800;
    const height = 600;
    
    switch (layout) {
      case 'circular':
        return nodes.map((node, i) => ({
          ...node,
          x: width/2 + 200 * Math.cos(2 * Math.PI * i / nodes.length),
          y: height/2 + 200 * Math.sin(2 * Math.PI * i / nodes.length)
        }));
      
      case 'hierarchy':
        // Simple hierarchy based on substrate types (Canon compliant)
        const typeOrder = ['dump', 'block', 'context_item']; // Capture → Structure → Semantic
        return nodes.map(node => {
          const typeIndex = typeOrder.indexOf(node.type);
          const typeNodes = nodes.filter(n => n.type === node.type);
          const nodeIndex = typeNodes.indexOf(node);
          
          return {
            ...node,
            x: 100 + nodeIndex * (width - 200) / Math.max(1, typeNodes.length - 1),
            y: 100 + typeIndex * (height - 200) / Math.max(1, typeOrder.length - 1)
          };
        });
      
      case 'force':
      default:
        // Simple force-directed layout simulation
        return nodes.map((node, i) => ({
          ...node,
          x: Math.random() * width,
          y: Math.random() * height
        }));
    }
  };

  const renderGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply zoom transform
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-rect.width * (zoom - 1) / (2 * zoom), -rect.height * (zoom - 1) / (2 * zoom));

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edge.color + '80'; // Add transparency
        ctx.lineWidth = edge.width;
        ctx.stroke();

        // Draw edge weight if enabled
        if (showEdgeWeights && edge.weight) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.fillStyle = '#374151';
          ctx.font = '10px system-ui';
          ctx.fillText(edge.weight.toFixed(1), midX, midY);
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (node.x && node.y) {
        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.id === selectedNode?.id ? '#fbbf24' : node.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw node label
        if (showLabels) {
          ctx.fillStyle = '#374151';
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + node.size + 15);
        }
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (!clickedNode) {
      if (!selectionMode) setSelectedNode(null);
      return;
    }

    if (selectionMode) {
      setSelected(prev => {
        const next = { ...prev };
        if (next[clickedNode.id]) {
          delete next[clickedNode.id];
        } else {
          next[clickedNode.id] = clickedNode;
        }
        return next;
      });
    } else {
      setSelectedNode(clickedNode);
    }
  };

  const handleNodeNavigation = (node: GraphNode) => {
    switch (node.type) {
      case 'block':
        router.push(`/baskets/${basketId}/building-blocks`);
        break;
      case 'dump':
        router.push(`/baskets/${basketId}/timeline`);
        break;
      case 'context_item':
        router.push(`/baskets/${basketId}/building-blocks`);
        break;
    }
  };

  const resetGraph = () => {
    setZoom(1);
    setSelectedNode(null);
    setSelected({});
    setBulkPreview(null);
    buildGraph();
  };

  const toggleNodeType = (type: keyof typeof visibleTypes) => {
    setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const selectedBlocks = Object.values(selected).filter(n => n.type === 'block');
  const selectedDumps = Object.values(selected).filter(n => n.type === 'dump');

  const computeBulkPreview = async () => {
    setBulkPreview(null);
    let refs = 0, rels = 0, docs = 0;
    const toPreview = [...selectedBlocks, ...selectedDumps];
    for (const node of toPreview) {
      try {
        const res = await fetch('/api/cascade/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            basket_id: basketId,
            substrate_type: node.type,
            substrate_id: node.id
          })
        });
        if (res.ok) {
          const json = await res.json();
          const p = json?.preview || { refs_detached_count: 0, relationships_pruned_count: 0, affected_documents_count: 0 };
          refs += p.refs_detached_count || 0;
          rels += p.relationships_pruned_count || 0;
          docs += p.affected_documents_count || 0;
        }
      } catch {}
    }
    setBulkPreview({ refs, rels, docs });
  };

  const proposeBulk = async () => {
    const ops: any[] = [];
    selectedBlocks.forEach(n => ops.push({ type: 'ArchiveBlock', data: { block_id: n.id } }));
    selectedDumps.forEach(n => ops.push({ type: 'RedactDump', data: { dump_id: n.id, scope: 'full', reason: 'graph_bulk' } }));
    if (ops.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            operations: ops,
            basket_id: basketId
          },
          priority: 'normal'
        })
      });
      const json = await res.json();
      // No notifications here to keep component decoupled; page can listen to events
      if (!res.ok) throw new Error(json.error || 'Failed to propose bulk changes');
      setSelected({});
      setBulkPreview(null);
    } catch (e) {
      // noop: integrations can handle via notifications
    } finally {
      setBusy(false);
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'block': return <Database className="h-4 w-4" />;
      case 'dump': return <FolderOpen className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const totalNodes = Object.values(visibleTypes).filter(Boolean).length;
  const hasData = nodes.length > 0;

  return (
    <>
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Graph Visualization */}
            <div className="lg:col-span-3">
              <Card className="h-[600px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Substrate Graph ({nodes.length} nodes, {edges.length} connections)
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetGraph}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <label className="ml-2 text-xs flex items-center gap-2">
                        <input type="checkbox" checked={selectionMode} onChange={(e) => { setSelectionMode(e.target.checked); setSelected({}); setBulkPreview(null); }} />
                        Multi‑select
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 relative">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full h-full cursor-pointer"
                    style={{ height: '500px' }}
                  />
                  
                  {selectedNode && (
                    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                      <div className="flex items-center gap-2 mb-2">
                        {getNodeTypeIcon(selectedNode.type)}
                        <span className="font-medium capitalize">{selectedNode.type}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{selectedNode.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {selectedNode.metadata.created_at && 
                          `Created ${new Date(selectedNode.metadata.created_at).toLocaleDateString()}`}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => handleNodeNavigation(selectedNode)}
                        className="w-full"
                      >
                        View Details
                      </Button>
                      <div className="flex gap-2 mt-2">
                        {selectedNode.type === 'block' && (
                          <Button size="sm" variant="outline" onClick={() => { setPreview(null); setConfirming('archive'); fetch('/api/cascade/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basket_id: basketId, substrate_type: 'block', substrate_id: selectedNode.id }) }).then(r=>r.json()).then(d=>setPreview(d.preview)).catch(()=>{}); }}>Archive</Button>
                        )}
                        {selectedNode.type === 'dump' && (
                          <Button size="sm" variant="outline" onClick={() => { setPreview(null); setConfirming('redact'); fetch('/api/cascade/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basket_id: basketId, substrate_type: 'dump', substrate_id: selectedNode.id }) }).then(r=>r.json()).then(d=>setPreview(d.preview)).catch(()=>{}); }}>Redact</Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              
              {/* Layout Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Algorithm</label>
                    <select
                      value={graphLayout}
                      onChange={(e) => setGraphLayout(e.target.value as any)}
                      className="w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="force">Force Directed</option>
                      <option value="hierarchy">Hierarchical</option>
                      <option value="circular">Circular</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-labels"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                    />
                    <label htmlFor="show-labels" className="text-sm">Show Labels</label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-weights"
                      checked={showEdgeWeights}
                      onChange={(e) => setShowEdgeWeights(e.target.checked)}
                    />
                    <label htmlFor="show-weights" className="text-sm">Show Weights</label>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Actions */}
              {selectionMode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Settings className="h-4 w-4" />
                      Bulk Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-gray-600">Selected:</span>
                      <span className="rounded border px-2 py-0.5">Blocks {selectedBlocks.length}</span>
                      <span className="rounded border px-2 py-0.5">Dumps {selectedDumps.length}</span>
                      <Button size="sm" variant="ghost" onClick={() => { setSelected({}); setBulkPreview(null); }}>Clear</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={computeBulkPreview} disabled={busy || (selectedBlocks.length + selectedDumps.length) === 0}>
                        Preview Impact
                      </Button>
                      <Button size="sm" onClick={proposeBulk} disabled={busy || (selectedBlocks.length + selectedDumps.length) === 0}>
                        Propose Selected
                      </Button>
                    </div>
                    {bulkPreview && (
                      <div className="text-xs text-gray-700">
                        <div>Refs to detach: <span className="font-semibold">{bulkPreview.refs}</span></div>
                        <div>Relationships to prune: <span className="font-semibold">{bulkPreview.rels}</span></div>
                        <div>Affected documents: <span className="font-semibold">{bulkPreview.docs}</span></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Node Type Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4" />
                    Node Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(visibleTypes).map(([type, visible]) => (
                    <div key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={visible}
                        onChange={() => toggleNodeType(type as keyof typeof visibleTypes)}
                      />
                      <label htmlFor={type} className="text-sm flex items-center gap-2">
                        {getNodeTypeIcon(type)}
                        {type.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Graph Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Blocks:</span>
                    <span>{graphData.blocks?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Context Items:</span>
                    <span>{graphData.context_items?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dumps:</span>
                    <span>{graphData.dumps?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Relationships:</span>
                    <span>{graphData.relationships?.length ?? 0}</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<Network className="h-8 w-8 text-gray-400" />}
                title="No graph data yet"
                action={
                  <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
                    The knowledge graph will appear as you add content to your basket. 
                    Create documents, blocks, and connect them to see the relationships visualized.
                  </p>
                }
              />
            </CardContent>
          </Card>
        )}
      {/* Confirm Dialog for Archive/Redact */}
      {confirming && selectedNode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">{confirming === 'archive' ? 'Archive Block' : 'Redact Dump'}</h4>
            {preview ? (
              <div className="text-xs text-gray-700 space-y-1 mb-3">
                <div>References to detach: <span className="font-semibold">{preview.refs_detached_count}</span></div>
                <div>Relationships to prune: <span className="font-semibold">{preview.relationships_pruned_count}</span></div>
                <div>Affected documents: <span className="font-semibold">{preview.affected_documents_count}</span></div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-3">Loading preview…</div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setConfirming(null); setPreview(null); }} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={confirming === 'archive' ? async () => { setBusy(true); await fetch('/api/work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_type: 'MANUAL_EDIT', work_payload: { operations: [{ type: 'ArchiveBlock', data: { block_id: selectedNode.id } }], basket_id: basketId }, priority: 'normal' }) }); setBusy(false); setConfirming(null); setPreview(null);} : async () => { setBusy(true); await fetch('/api/work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_type: 'MANUAL_EDIT', work_payload: { operations: [{ type: 'RedactDump', data: { dump_id: selectedNode.id, scope: 'full', reason: 'user_requested' } }], basket_id: basketId }, priority: 'normal' }) }); setBusy(false); setConfirming(null); setPreview(null);} } disabled={busy || !preview}>
                {busy ? 'Working…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
