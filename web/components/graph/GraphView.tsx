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
import { SubpageHeader } from '@/components/basket/SubpageHeader';

interface GraphNode {
  id: string;
  type: 'document' | 'block' | 'dump';
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
  role?: string;
  type: 'reference' | 'creation' | 'semantic';
  color: string;
  width: number;
}

interface GraphData {
  documents: any[];
  blocks: any[];
  dumps: any[];
  references: any[];
}

interface GraphViewProps {
  basketId: string;
  basketTitle: string;
  graphData: GraphData;
  canEdit: boolean;
}

export function GraphView({ basketId, basketTitle, graphData, canEdit }: GraphViewProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [visibleTypes, setVisibleTypes] = useState({
    document: true,
    block: true,
    dump: true
  });
  const [graphLayout, setGraphLayout] = useState<'force' | 'hierarchy' | 'circular'>('force');
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeWeights, setShowEdgeWeights] = useState(false);
  
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

    // Create document nodes
    if (visibleTypes.document) {
      graphData.documents.forEach(doc => {
        nodeMap.set(doc.id, {
          id: doc.id,
          type: 'document',
          title: doc.title,
          label: doc.title.length > 20 ? doc.title.substring(0, 20) + '...' : doc.title,
          color: '#3b82f6', // blue
          size: 20,
          metadata: doc
        });
      });
    }

    // Create block nodes (Canon compliant - using semantic_type)
    if (visibleTypes.block) {
      graphData.blocks.forEach(block => {
        nodeMap.set(block.id, {
          id: block.id,
          type: 'block',
          title: `${block.semantic_type} block`,
          label: block.semantic_type.length > 15 ? 
                 block.semantic_type.substring(0, 15) + '...' : 
                 block.semantic_type,
          color: getBlockColor(block.confidence_score),
          size: 15,
          metadata: block
        });
      });
    }

    // Create dump nodes
    if (visibleTypes.dump) {
      graphData.dumps.forEach(dump => {
        nodeMap.set(dump.id, {
          id: dump.id,
          type: 'dump',
          title: `${dump.source_type} dump`,
          label: `${dump.source_type}`,
          color: '#10b981', // green
          size: 12,
          metadata: dump
        });
      });
    }

    // Context items removed - not part of Canon v1.4.0 architecture

    // Create edges from substrate references
    graphData.references.forEach(ref => {
      const sourceNode = nodeMap.get(ref.document_id);
      const targetNode = nodeMap.get(ref.substrate_id);
      
      if (sourceNode && targetNode) {
        edgeList.push({
          id: ref.id,
          source: ref.document_id,
          target: ref.substrate_id,
          weight: ref.weight || 0.5,
          role: ref.role,
          type: 'reference',
          color: getReferenceColor(ref.role),
          width: Math.max(1, (ref.weight || 0.5) * 4)
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

  const getReferenceColor = (role?: string) => {
    switch (role) {
      case 'primary': return '#dc2626'; // red
      case 'supporting': return '#2563eb'; // blue
      case 'citation': return '#7c3aed'; // purple
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
        // Simple hierarchy based on node types (Canon compliant)
        const typeOrder = ['document', 'block', 'dump'];
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

    setSelectedNode(clickedNode || null);
  };

  const handleNodeNavigation = (node: GraphNode) => {
    switch (node.type) {
      case 'document':
        router.push(`/baskets/${basketId}/documents/${node.id}`);
        break;
      case 'block':
        router.push(`/baskets/${basketId}/blocks`);
        break;
      case 'dump':
        router.push(`/baskets/${basketId}/timeline`);
        break;
    }
  };

  const resetGraph = () => {
    setZoom(1);
    setSelectedNode(null);
    buildGraph();
  };

  const toggleNodeType = (type: keyof typeof visibleTypes) => {
    setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6 max-w-7xl px-4">
        
        {/* Header */}
        <SubpageHeader title="Knowledge Graph" basketId={basketId} />

        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Graph Visualization */}
            <div className="lg:col-span-3">
              <Card className="h-[600px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Memory Graph ({nodes.length} nodes, {edges.length} connections)
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
                    <span>Documents:</span>
                    <span>{graphData.documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blocks:</span>
                    <span>{graphData.blocks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dumps:</span>
                    <span>{graphData.dumps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>References:</span>
                    <span>{graphData.references.length}</span>
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

      </div>
    </div>
  );
}