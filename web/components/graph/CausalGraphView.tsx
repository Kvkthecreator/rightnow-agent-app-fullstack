"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GitBranch, Filter, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

// ForceGraph relies on window, so load on client only
const ForceGraph2D = dynamic(async () => {
  const mod = await import('react-force-graph-2d');
  return mod.default;
}, { ssr: false });

type Block = {
  id: string;
  title?: string | null;
  content?: string | null;
  semantic_type?: string | null;
  confidence_score?: number | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
};

type Relationship = {
  id: string;
  from_block_id: string;
  to_block_id: string;
  relationship_type: 'addresses' | 'supports' | 'contradicts' | 'depends_on';
  confidence_score: number;
  metadata?: Record<string, any> | null;
};

interface GraphData {
  blocks: Block[];
  relationships: Relationship[];
}

interface CausalGraphViewProps {
  basketId: string;
  basketTitle: string;
  graphData: GraphData;
  canEdit: boolean;
}

type GraphNode = {
  id: string;
  label: string;
  semanticType: string | null | undefined;
  confidence: number;
  contentSnippet: string;
  inDegree: number;
  outDegree: number;
};

type GraphLink = {
  id: string;
  source: string;
  target: string;
  type: 'addresses' | 'supports' | 'contradicts' | 'depends_on';
  confidence: number;
};

const RELATIONSHIP_COLORS = {
  addresses: '#22c55e',    // green-500 - solving problems
  supports: '#3b82f6',     // blue-500 - reinforcing
  contradicts: '#ef4444',  // red-500 - conflicts
  depends_on: '#f59e0b',   // amber-500 - dependencies
};

const RELATIONSHIP_LABELS = {
  addresses: 'Addresses',
  supports: 'Supports',
  contradicts: 'Contradicts',
  depends_on: 'Depends On',
};

const SEMANTIC_TYPE_COLORS: Record<string, string> = {
  problem: '#dc2626',        // red-600
  solution: '#059669',       // emerald-600
  observation: '#0891b2',    // cyan-600
  insight: '#7c3aed',        // violet-600
  question: '#ea580c',       // orange-600
  evidence: '#0d9488',       // teal-600
  hypothesis: '#8b5cf6',     // violet-500
  default: '#64748b',        // slate-500
};

export default function CausalGraphView({ basketId, basketTitle, graphData }: CausalGraphViewProps) {
  const graphRef = useRef<any>();
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [relationshipFilter, setRelationshipFilter] = useState<Record<string, boolean>>({
    addresses: true,
    supports: true,
    contradicts: true,
    depends_on: true,
  });
  const [minConfidence, setMinConfidence] = useState(0.7);

  // Build graph nodes and links
  const { nodes, links } = useMemo(() => {
    const blockMap = new Map(graphData.blocks.map(b => [b.id, b]));

    // Calculate degrees
    const inDegrees = new Map<string, number>();
    const outDegrees = new Map<string, number>();

    graphData.relationships.forEach(rel => {
      inDegrees.set(rel.to_block_id, (inDegrees.get(rel.to_block_id) || 0) + 1);
      outDegrees.set(rel.from_block_id, (outDegrees.get(rel.from_block_id) || 0) + 1);
    });

    // Create nodes
    const nodes: GraphNode[] = graphData.blocks.map(block => {
      const label = block.title?.trim() || 'Untitled Block';
      const contentSnippet = (block.content || '').slice(0, 200);

      return {
        id: block.id,
        label,
        semanticType: block.semantic_type,
        confidence: block.confidence_score || 0.5,
        contentSnippet,
        inDegree: inDegrees.get(block.id) || 0,
        outDegree: outDegrees.get(block.id) || 0,
      };
    });

    // Create links (filtered)
    const links: GraphLink[] = graphData.relationships
      .filter(rel => {
        // Filter by relationship type
        if (!relationshipFilter[rel.relationship_type]) return false;

        // Filter by confidence
        if (rel.confidence_score < minConfidence) return false;

        // Filter out relationships where blocks don't exist
        if (!blockMap.has(rel.from_block_id) || !blockMap.has(rel.to_block_id)) return false;

        return true;
      })
      .map(rel => ({
        id: rel.id,
        source: rel.from_block_id,
        target: rel.to_block_id,
        type: rel.relationship_type,
        confidence: rel.confidence_score,
      }));

    return { nodes, links };
  }, [graphData, relationshipFilter, minConfidence]);

  // Filter to show only nodes with at least one connection
  const filteredNodes = useMemo(() => {
    const connectedIds = new Set<string>();
    links.forEach(link => {
      // Links are strings before graph rendering
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
      connectedIds.add(sourceId);
      connectedIds.add(targetId);
    });
    return nodes.filter(node => connectedIds.has(node.id));
  }, [nodes, links]);

  const handleNodeClick = (node: any) => {
    setActiveNode(node as GraphNode);
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.5, 400);
    }
  };

  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  // Auto-fit on load
  useEffect(() => {
    if (graphRef.current && filteredNodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400);
      }, 100);
    }
  }, [filteredNodes.length]);

  const stats = {
    totalBlocks: graphData.blocks.length,
    totalRelationships: graphData.relationships.length,
    visibleNodes: filteredNodes.length,
    visibleLinks: links.length,
    byType: Object.fromEntries(
      Object.keys(RELATIONSHIP_LABELS).map(type => [
        type,
        graphData.relationships.filter(r => r.relationship_type === type).length
      ])
    ),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600">Blocks</div>
            <div className="text-2xl font-semibold text-slate-900">{stats.totalBlocks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600">Relationships</div>
            <div className="text-2xl font-semibold text-slate-900">{stats.totalRelationships}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600">Visible Nodes</div>
            <div className="text-2xl font-semibold text-slate-900">{stats.visibleNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-600">Visible Links</div>
            <div className="text-2xl font-semibold text-slate-900">{stats.visibleLinks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Relationship type filters */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Relationship Types</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(RELATIONSHIP_LABELS).map(([type, label]) => (
                <Badge
                  key={type}
                  variant={relationshipFilter[type] ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: relationshipFilter[type] ? RELATIONSHIP_COLORS[type as keyof typeof RELATIONSHIP_COLORS] : 'transparent',
                    borderColor: RELATIONSHIP_COLORS[type as keyof typeof RELATIONSHIP_COLORS],
                    color: relationshipFilter[type] ? 'white' : RELATIONSHIP_COLORS[type as keyof typeof RELATIONSHIP_COLORS],
                  }}
                  onClick={() => setRelationshipFilter(prev => ({ ...prev, [type]: !prev[type] }))}
                >
                  {label} ({stats.byType[type] || 0})
                </Badge>
              ))}
            </div>
          </div>

          {/* Confidence filter */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">
              Min Confidence: {minConfidence.toFixed(2)}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-600" />
            Causal Relationship Graph
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetView}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNodes.length === 0 ? (
            <div className="h-96 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <div className="text-center">
                <Info className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No relationships to display</p>
                <p className="text-sm text-slate-500 mt-1">
                  {stats.totalRelationships === 0
                    ? 'Add memories to generate causal relationships'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-white">
              <ForceGraph2D
                ref={graphRef}
                graphData={{ nodes: filteredNodes, links }}
                nodeId="id"
                nodeLabel={(node: any) => `${node.label} (${node.semanticType || 'unknown'})`}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const size = 4 + (node.inDegree + node.outDegree);
                  const color = SEMANTIC_TYPE_COLORS[node.semanticType || 'default'] || SEMANTIC_TYPE_COLORS.default;

                  // Draw node circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();

                  // Draw border if active
                  if (activeNode?.id === node.id) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();
                  }

                  // Draw label
                  const label = node.label;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#1e293b';
                  ctx.fillText(label, node.x, node.y + size + fontSize);
                }}
                linkColor={(link: any) => RELATIONSHIP_COLORS[link.type]}
                linkWidth={(link: any) => (hoveredLinkId === link.id ? 3 : 1.5)}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkLabel={(link: any) => `${RELATIONSHIP_LABELS[link.type]} (${(link.confidence * 100).toFixed(0)}%)`}
                onNodeClick={handleNodeClick}
                onLinkHover={(link: any) => setHoveredLinkId(link?.id || null)}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected node details */}
      {activeNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Block</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-700">Title</div>
              <div className="text-slate-900">{activeNode.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Type</div>
              <Badge
                style={{
                  backgroundColor: SEMANTIC_TYPE_COLORS[activeNode.semanticType || 'default'],
                  color: 'white',
                }}
              >
                {activeNode.semanticType || 'unknown'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Confidence</div>
              <div className="text-slate-900">{(activeNode.confidence * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Connections</div>
              <div className="text-slate-900">
                {activeNode.inDegree} incoming, {activeNode.outDegree} outgoing
              </div>
            </div>
            {activeNode.contentSnippet && (
              <div>
                <div className="text-sm font-medium text-slate-700">Content Preview</div>
                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  {activeNode.contentSnippet}
                  {activeNode.contentSnippet.length >= 200 && '...'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
