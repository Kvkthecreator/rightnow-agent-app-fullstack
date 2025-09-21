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
import { enqueueWork } from '@/lib/work/enqueueWork';
/* Canon-Compliant Graph View - Redesigned UX
   Knowledge-first approach with substrate equality and deliberate narrative
   Clear distinction between structured knowledge (blocks) and semantic meaning (context_items)
   Prominent connection mapping as core Canon operation
*/

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
    context_item: true,
    dump: false, // Canon: Focus on structured knowledge and meaning, not raw input
  });
  const [graphLayout, setGraphLayout] = useState<'force' | 'hierarchy' | 'circular'>('force');
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeWeights, setShowEdgeWeights] = useState(false);
  const [confirming, setConfirming] = useState<null | 'archive' | 'redact'>(null);
  const [preview, setPreview] = useState<{refs_detached_count:number;relationships_pruned_count:number;affected_documents_count:number} | null>(null);
  const [busy, setBusy] = useState(false);
  const [mappingConnections, setMappingConnections] = useState(false);
  
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

    // Create meaning nodes (semantic connections)
    if (visibleTypes.context_item) {
      (graphData.context_items || []).forEach(item => {
        const title = toStringSafe(item?.title, toStringSafe(item?.normalized_label, toStringSafe(item?.type, 'meaning')));
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

    // Create knowledge block nodes
    if (visibleTypes.block) {
      (graphData.blocks || []).forEach(block => {
        const semantic = toStringSafe(block?.semantic_type, toStringSafe(block?.title, 'knowledge block'));
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

    // Create source note nodes
    if (visibleTypes.dump) {
      (graphData.dumps || []).forEach(dump => {
        const sourceType = toStringSafe(dump?.source_meta?.source_type, 'note');
        nodeMap.set(dump.id, {
          id: dump.id,
          type: 'dump',
          title: `${sourceType} note`,
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

  const triggerConnectionMapping = async () => {
    if (mappingConnections) return;
    
    setMappingConnections(true);
    
    try {
      // Count substrate for better operation data
      const blockCount = graphData.blocks?.length || 0;
      const contextItemCount = graphData.context_items?.length || 0;
      const totalSubstrate = blockCount + contextItemCount;
      
      await enqueueWork({
        workType: 'P2_GRAPH',
        workPayload: {
          operations: [{
            type: 'MapRelationships',
            data: {
              basket_id: basketId,
              workspace_id: graphData.blocks?.[0]?.workspace_id, // Include workspace_id if available
              trigger: 'user_manual_mapping',
              substrate_count: totalSubstrate,
              blocks_count: blockCount,
              context_items_count: contextItemCount,
              relationship_scope: 'basket_wide',
              agent_id: 'graph_ui_manual'
            },
          }],
          basket_id: basketId,
          confidence_score: 0.9,
          user_override: 'allow_auto',
          trace_id: `graph_mapping_${Date.now()}`,
          provenance: ['user_graph_ui', 'manual_trigger']
        },
        priority: 'high',
        pendingTitle: 'Mapping connections…',
        pendingMessage: `Analyzing ${totalSubstrate} knowledge items for relationships...`,
        successTitle: 'Connections mapped',
        successMessage: status => {
          const count = status?.substrate_impact?.relationships_mapped ?? 0;
          return count
            ? `Created ${count} relationships. Refresh the graph to view them.`
            : 'Graph mapping completed.';
        },
        failureTitle: 'Connection mapping failed',
        failureMessage: msg => msg || 'Unable to map connections. Check governance for details.',
      });
    } catch (error) {
      console.error('Error triggering P2 mapping:', error);
    } finally {
      setMappingConnections(false);
    }
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
      case 'context_item': return <Lightbulb className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getNodeTypeDisplayName = (type: string) => {
    switch (type) {
      case 'block': return 'Knowledge Block';
      case 'context_item': return 'Meaning';
      case 'dump': return 'Source Note';
      default: return type;
    }
  };

  const totalNodes = Object.values(visibleTypes).filter(Boolean).length;
  const hasData = nodes.length > 0;
  const hasRelationships = edges.length > 0;
  const canMapConnections = nodes.length >= 2; // Canon: Any 2+ substrate can have relationships
  const isKnowledgeRich = (graphData.blocks?.length || 0) >= 3 && (graphData.context_items?.length || 0) >= 2;
  
  // Canon-compliant substrate statistics
  const substrateStats = {
    structuredKnowledge: graphData.blocks?.length || 0,
    semanticMeaning: graphData.context_items?.length || 0,
    relationships: graphData.relationships?.length || 0,
    connectionDensity: hasData ? (graphData.relationships?.length || 0) / Math.max(1, nodes.length) : 0
  };
  
  const [view, setView] = useState<'graph' | 'insights'>('graph');

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Connections</h1>
            <p className="text-gray-600">Explore relationships between your structured knowledge and semantic meanings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'graph' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('graph')}
              >
                <Network className="h-4 w-4 mr-2" />
                Graph View
              </Button>
              <Button
                variant={view === 'insights' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('insights')}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Connection Insights
              </Button>
            </div>
          </div>
        </div>
      </div>

      {hasData ? (
        view === 'graph' ? (
          /* Graph Visualization View */
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Main Graph Area */}
              <div className="lg:col-span-3">
                <Card className="h-[600px]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Knowledge Network ({substrateStats.structuredKnowledge + substrateStats.semanticMeaning} items, {substrateStats.relationships} connections)
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
                          <span className="font-medium">{getNodeTypeDisplayName(selectedNode.type)}</span>
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
                        {getNodeTypeDisplayName(type)}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Canon-Compliant Connection Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4" />
                    Connection Discovery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Primary Canon Operation */}
                  <Button 
                    onClick={triggerConnectionMapping}
                    disabled={mappingConnections || !canMapConnections}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {mappingConnections ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Discovering Connections...
                      </>
                    ) : (
                      <>
                        <Network className="h-4 w-4 mr-2" />
                        {hasRelationships ? 'Discover More' : 'Map Knowledge Connections'}
                      </>
                    )}
                  </Button>
                  
                  {canMapConnections && (
                    <p className="text-xs text-gray-600 text-center">
                      Canon P2 Agent will analyze semantic relationships between your structured knowledge and meanings
                    </p>
                  )}
                  
                  {substrateStats.connectionDensity > 0 && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Connection Density:</span>
                        <span>{(substrateStats.connectionDensity * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Substrate Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Knowledge Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-orange-600" />
                      Structured Knowledge:
                    </span>
                    <span className="font-medium">{substrateStats.structuredKnowledge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-blue-600" />
                      Semantic Meanings:
                    </span>
                    <span className="font-medium">{substrateStats.semanticMeaning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Network className="h-3 w-3 text-green-600" />
                      Relationships:
                    </span>
                    <span className="font-medium">{substrateStats.relationships}</span>
                  </div>
                  
                  {visibleTypes.dump && (
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3 text-gray-500" />
                        Source Notes:
                      </span>
                      <span className="text-gray-500">{graphData.dumps?.length ?? 0}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        ) : (
          /* Connection Insights View */
          <div className="p-6 space-y-6">
            {/* Knowledge Network Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('graph')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{substrateStats.structuredKnowledge}</div>
                      <div className="text-sm text-gray-600">Structured Knowledge</div>
                      <div className="text-xs text-gray-500">Facts, insights, findings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('graph')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{substrateStats.semanticMeaning}</div>
                      <div className="text-sm text-gray-600">Semantic Meanings</div>
                      <div className="text-xs text-gray-500">Concepts, themes, patterns</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('graph')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Network className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{substrateStats.relationships}</div>
                      <div className="text-sm text-gray-600">Connections</div>
                      <div className="text-xs text-gray-500">Relationships mapped</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Discovery CTA */}
            {canMapConnections && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Network className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    {hasRelationships ? 'Discover More Connections' : 'Map Knowledge Connections'}
                  </h3>
                  <p className="text-blue-700 mb-4 max-w-md mx-auto">
                    {hasRelationships 
                      ? `Analyze ${substrateStats.structuredKnowledge + substrateStats.semanticMeaning} items to discover additional semantic relationships.`
                      : `Start connecting your ${substrateStats.structuredKnowledge + substrateStats.semanticMeaning} knowledge items to reveal hidden patterns and relationships.`
                    }
                  </p>
                  <Button 
                    onClick={triggerConnectionMapping}
                    disabled={mappingConnections}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {mappingConnections ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Canon P2 Agent Working...
                      </>
                    ) : (
                      <>
                        <Network className="h-4 w-4 mr-2" />
                        {hasRelationships ? 'Discover More Connections' : 'Begin Connection Discovery'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Relationship Insights */}
            {hasRelationships && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Connection Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Connection Density</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{width: `${Math.min(100, substrateStats.connectionDensity * 100)}%`}}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {(substrateStats.connectionDensity * 100).toFixed(1)}% of possible connections discovered
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Network Health</h4>
                      <div className="text-sm space-y-1">
                        {substrateStats.connectionDensity > 0.3 ? (
                          <div className="text-green-600">✓ Well-connected knowledge network</div>
                        ) : substrateStats.connectionDensity > 0.1 ? (
                          <div className="text-yellow-600">⚡ Moderate connectivity</div>
                        ) : (
                          <div className="text-blue-600">🔗 Ready for more connections</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" onClick={() => setView('graph')} className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Explore Graph Visualization
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )
        ) : (
          /* Canon-compliant empty state */
          <div className="p-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center max-w-md mx-auto">
                  <Network className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Knowledge Network</h3>
                  <p className="text-gray-600 mb-6">
                    Your knowledge connections will appear here as you add content. 
                    Start by adding memory to create structured knowledge and semantic meanings.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="text-left space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Database className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">Structured Knowledge</div>
                          <div className="text-gray-500">Facts, insights, and findings from your content</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Semantic Meanings</div>
                          <div className="text-gray-500">Concepts, themes, and patterns across your knowledge</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Network className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Knowledge Connections</div>
                          <div className="text-gray-500">Semantic relationships discovered by Canon P2 Agent</div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => router.push(`/baskets/${basketId}/add-memory`)}
                      className="bg-blue-600 hover:bg-blue-700 mt-6"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Memory to Start
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      {/* Confirm Dialog for Archive/Redact */}
      {confirming && selectedNode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">{confirming === 'archive' ? 'Archive Knowledge Block' : 'Redact Source Note'}</h4>
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
