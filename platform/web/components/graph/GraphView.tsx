"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Network, Zap, Sparkles, GitMerge, Filter } from 'lucide-react';

// ForceGraph relies on window, so load on client only
const ForceGraph2D = dynamic(async () => {
  const mod = await import('react-force-graph-2d');
  return mod.default;
}, { ssr: false });

type SubstrateBlock = {
  id: string;
  title?: string | null;
  content?: string | null;
  semantic_type?: string | null;
  confidence_score?: number | null;
  status?: string | null;
  state?: string | null;
  metadata?: Record<string, any> | null;
};

type SubstrateContextItem = {
  id: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  semantic_meaning?: string | null;
  semantic_category?: string | null;
  status?: string | null;
  state?: string | null;
  metadata?: Record<string, any> | null;
};

type SubstrateRelationship = {
  id?: string | null;
  basket_id?: string | null;
  from_id: string;
  to_id: string;
  from_type: string;
  to_type: string;
  relationship_type: string;
  description?: string | null;
  strength?: number | null;
};

interface GraphData {
  blocks?: SubstrateBlock[];
  dumps?: any[];
  context_items?: SubstrateContextItem[];
  relationships?: SubstrateRelationship[];
}

interface GraphViewProps {
  basketId: string;
  basketTitle: string;
  graphData: GraphData;
  canEdit: boolean;
}

type CanonNode = {
  id: string;
  label: string;
  type: 'block' | 'context_item';
  semanticType?: string | null;
  confidence?: number;
  contentSnippet?: string;
  degree: number;
  archived: boolean;
};

type CanonLink = {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  description?: string | null;
  archived: boolean;
};

const NODE_COLORS: Record<CanonNode['type'], string> = {
  block: '#2563eb', // blue-600
  context_item: '#7c3aed', // violet-600
};

const RELATIONSHIP_COLOR = '#94a3b8';

const relationshipLabels: Record<string, string> = {
  semantic_similarity: 'Semantic Similarity',
  related_content: 'Related Content',
  thematic_connection: 'Thematic Connection',
  causal_relationship: 'Causal Relationship',
  temporal_sequence: 'Temporal Sequence',
  enablement_chain: 'Enablement Chain',
  impact_relationship: 'Impact Relationship',
  conditional_logic: 'Conditional Logic',
  context_reference: 'Context Reference',
};

function formatRelationship(type: string) {
  return relationshipLabels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const INITIAL_FILTER = {
  block: true,
  context_item: true,
};

export function GraphView({ basketId, basketTitle, graphData }: GraphViewProps) {
  const graphRef = useRef<ForceGraphMethods | null>(null);
  const [activeNode, setActiveNode] = useState<CanonNode | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<Record<CanonNode['type'], boolean>>(INITIAL_FILTER);
  const [includeArchived, setIncludeArchived] = useState(true);

  const allNodes = useMemo<CanonNode[]>(() => {
    const blocks = (graphData.blocks ?? []).map((block): CanonNode => {
      const label = block.title?.trim() || 'Untitled Block';
      const archived = (block.status ?? '').toLowerCase() === 'archived';
      return {
        id: block.id,
        label,
        type: 'block',
        semanticType: block.semantic_type,
        confidence: block.confidence_score ?? undefined,
        contentSnippet: block.content ?? undefined,
        degree: 0,
        archived,
      };
    });

    const contextItems = (graphData.context_items ?? []).map((item): CanonNode => {
      const label = item.title?.trim() || item.content?.trim() || 'Unnamed Meaning';
      const archivedState = item.state ? item.state !== 'ACTIVE' : false;
      const archived = (item.status ?? '').toLowerCase() === 'archived' || archivedState;
      return {
        id: item.id,
        label,
        type: 'context_item',
        semanticType: item.type ?? item.semantic_category ?? undefined,
        contentSnippet: item.semantic_meaning ?? item.content ?? undefined,
        degree: 0,
        archived,
      };
    });

    return [...blocks, ...contextItems];
  }, [graphData.blocks, graphData.context_items]);

  const nodeLookup = useMemo(() => {
    const map = new Map<string, CanonNode>();
    allNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [allNodes]);

  const allLinks = useMemo<CanonLink[]>(() => {
    const relationships = graphData.relationships ?? [];
    return relationships
      .filter(rel => nodeLookup.has(rel.from_id) && nodeLookup.has(rel.to_id))
      .map((rel, index) => ({
        id: rel.id ?? `${rel.from_id}-${rel.to_id}-${index}`,
        source: rel.from_id,
        target: rel.to_id,
        type: rel.relationship_type,
        strength: rel.strength ?? 0.5,
        description: rel.description,
        archived: Boolean(nodeLookup.get(rel.from_id)?.archived || nodeLookup.get(rel.to_id)?.archived),
      }));
  }, [graphData.relationships, nodeLookup]);

  useEffect(() => {
    // Populate degree counts
    nodeLookup.forEach(node => {
      node.degree = 0;
    });
    allLinks.forEach(link => {
      const from = nodeLookup.get(link.source);
      const to = nodeLookup.get(link.target);
      if (from) from.degree += 1;
      if (to) to.degree += 1;
    });
  }, [allLinks, nodeLookup]);

  const filteredNodes = useMemo(() =>
    allNodes.filter(node => typeFilter[node.type] && (includeArchived || !node.archived)),
  [allNodes, typeFilter, includeArchived]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(node => node.id)), [filteredNodes]);

  const filteredLinks = useMemo(() =>
    allLinks.filter(link => filteredNodeIds.has(String(link.source)) && filteredNodeIds.has(String(link.target))),
  [allLinks, filteredNodeIds]);

  const graphPayload = useMemo(() => ({
    nodes: filteredNodes.map(node => ({ ...node })),
    links: filteredLinks.map(link => ({ ...link })),
  }), [filteredNodes, filteredLinks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (graphPayload.nodes.length > 0 && graphPayload.links.length > 0) {
        handleResetView();
      }
    }, 120);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphPayload.nodes.length, graphPayload.links.length]);

  const stats = useMemo(() => {
    const totalBlocks = allNodes.filter(node => node.type === 'block').length;
    const archivedBlocks = allNodes.filter(node => node.type === 'block' && node.archived).length;
    const totalContext = allNodes.filter(node => node.type === 'context_item').length;
    const archivedContext = allNodes.filter(node => node.type === 'context_item' && node.archived).length;
    const totalRelationships = allLinks.length;
    const archivedRelationships = allLinks.filter(link => link.archived).length;

    return {
      blocks: { total: totalBlocks, archived: archivedBlocks },
      contextItems: { total: totalContext, archived: archivedContext },
      relationships: { total: totalRelationships, archived: archivedRelationships },
    };
  }, [allNodes, allLinks]);

  useEffect(() => {
    if (!activeNode) return;
    if (!filteredNodeIds.has(activeNode.id)) {
      setActiveNode(null);
    }
  }, [filteredNodeIds, activeNode]);

  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 80);
    }
  };

  const hasAnyRelationships = allLinks.length > 0;
  const hasGraphContent = filteredNodes.length > 0 && filteredLinks.length > 0;
  const relationshipsFilteredOut = hasAnyRelationships && !hasGraphContent;
  const archivedOnly = !includeArchived && stats.relationships.archived === stats.relationships.total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Basket</p>
            <h1 className="text-2xl font-semibold text-slate-900">{basketTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2 bg-blue-50 text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              {stats.blocks.total - stats.blocks.archived} active blocks
              {stats.blocks.archived > 0 ? ` (+${stats.blocks.archived} archived)` : ''}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 bg-violet-50 text-violet-700">
              <Network className="h-3.5 w-3.5" />
              {stats.contextItems.total - stats.contextItems.archived} active meanings
              {stats.contextItems.archived > 0 ? ` (+${stats.contextItems.archived} archived)` : ''}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 bg-slate-100 text-slate-700">
              <GitMerge className="h-3.5 w-3.5" />
              {stats.relationships.total - stats.relationships.archived} active relationships
              {stats.relationships.archived > 0 ? ` (+${stats.relationships.archived} archived)` : ''}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Filter nodes</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['block', 'context_item'] satisfies CanonNode['type'][]).map(type => {
              const active = typeFilter[type];
              const label = type === 'block' ? 'Structured Knowledge' : 'Semantic Meanings';
              return (
                <Button
                  key={type}
                  size="sm"
                  variant={active ? 'default' : 'ghost'}
                  className={active ? 'bg-slate-900 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900'}
                  onClick={() => setTypeFilter(prev => ({ ...prev, [type]: !prev[type] }))}
                >
                  <span className="text-xs font-medium">{label}</span>
                </Button>
              );
            })}
            <Button size="sm" variant="outline" onClick={() => setTypeFilter(INITIAL_FILTER)}>
              Reset
            </Button>
            <Button size="sm" variant="ghost" onClick={handleResetView}>
              Center
            </Button>
            <Button
              size="sm"
              variant={includeArchived ? 'default' : 'outline'}
              className={includeArchived ? 'bg-amber-600 hover:bg-amber-500 border-amber-600' : ''}
              onClick={() => setIncludeArchived(prev => !prev)}
            >
              {includeArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          {hasGraphContent ? (
            <div className="p-4 sm:p-6">
            <div className="grid min-h-[640px] grid-rows-[minmax(0,1fr)_auto] gap-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1">
              <div className="relative order-1 overflow-hidden rounded-t-lg bg-slate-900/5 lg:order-none lg:rounded-l-lg lg:rounded-tr-none">
                <div className="h-[520px] w-full sm:h-[560px] lg:h-full">
                <ForceGraph2D
                  ref={graphRef as any}
                  graphData={graphPayload}
                  backgroundColor="#ffffff"
                  cooldownTicks={120}
                  onEngineStop={() => handleResetView()}
                  nodeRelSize={6}
                  nodeLabel={node => (node as CanonNode).label}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const canonNode = node as CanonNode & { x?: number; y?: number };
                    const color = NODE_COLORS[canonNode.type];
                    const radius = Math.max(6, Math.min(14, 6 + canonNode.degree));
                    const x = canonNode.x ?? 0;
                    const y = canonNode.y ?? 0;

                    ctx.save();
                    ctx.globalAlpha = canonNode.archived ? 0.35 : 1;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();

                    const label = canonNode.label;
                    const fontSize = 12 / globalScale;
                    const paddingX = 6;
                    const paddingY = 4;
                    ctx.font = `${fontSize}px var(--font-sans, 'Inter', sans-serif)`;
                    ctx.textBaseline = 'middle';
                    const textWidth = ctx.measureText(label).width;
                    const rectX = x + radius + 6;
                    const rectY = y - fontSize / 2 - paddingY / 2;
                    const rectWidth = textWidth + paddingX * 2;
                    const rectHeight = fontSize + paddingY;

                    ctx.fillStyle = canonNode.archived ? 'rgba(226,232,240,0.8)' : 'rgba(15,23,42,0.85)';
                    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                    ctx.fillStyle = canonNode.archived ? '#334155' : '#f8fafc';
                    ctx.fillText(label, rectX + paddingX, y);
                    ctx.restore();
                  }}
                  nodePointerAreaPaint={(node, color, ctx) => {
                    const canonNode = node as CanonNode & { x?: number; y?: number };
                    const radius = Math.max(6, Math.min(14, 6 + canonNode.degree)) + 4;
                    ctx.beginPath();
                    ctx.arc(canonNode.x ?? 0, canonNode.y ?? 0, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();
                  }}
                  linkColor={link => (link as CanonLink).archived ? 'rgba(148,163,184,0.45)' : RELATIONSHIP_COLOR}
                  linkDirectionalParticles={hoveredLinkId ? 2 : 0}
                  linkDirectionalParticleSpeed={link => 0.002 + ((link as CanonLink).strength ?? 0.5) * 0.004}
                  linkWidth={link => {
                    const canonLink = link as CanonLink;
                    const base = Math.max(0.8, canonLink.strength * 2);
                    return hoveredLinkId === canonLink.id ? base + 1.2 : base;
                  }}
                  onNodeClick={node => setActiveNode(node as CanonNode)}
                  onLinkHover={link => setHoveredLinkId(link ? (link as CanonLink).id : null)}
                />
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4">
                  <Badge variant="outline" className="border-slate-200 bg-white/80 text-xs text-slate-600">
                    {graphPayload.nodes.length} nodes
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white/80 text-xs text-slate-600">
                    {graphPayload.links.length} connections
                  </Badge>
                </div>
              </div>

              <aside className="order-2 flex max-h-[520px] flex-col gap-4 overflow-hidden border-t border-slate-100 bg-slate-50/70 p-4 lg:order-none lg:border-t-0 lg:border-l lg:overflow-y-auto">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-800">Relationship spotlight</span>
                </div>

                {hoveredLinkId ? (
                  (() => {
                    const link = filteredLinks.find(item => item.id === hoveredLinkId);
                    if (!link) return null;
                    const from = nodeLookup.get(String(link.source));
                    const to = nodeLookup.get(String(link.target));
                    return (
                      <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Relationship</p>
                        <p className="text-sm font-medium text-slate-900">{formatRelationship(link.type)}</p>
                        <p className="text-sm text-slate-500">{link.description ?? 'Agent-detected connection between your knowledge elements.'}</p>
                        {from && to && (
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold text-slate-700">{from.label}</p>
                            <p className="font-semibold text-slate-700">→ {to.label}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : activeNode ? (
                  <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Selected node</p>
                    <p className="text-base font-semibold text-slate-900">{activeNode.label}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {activeNode.type === 'block' ? 'Structured knowledge' : 'Semantic meaning'}
                      </Badge>
                      {activeNode.semanticType && (
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {activeNode.semanticType}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {activeNode.degree} connections
                      </Badge>
                    </div>
                    {activeNode.contentSnippet && (
                      <p className="rounded border border-slate-100 bg-slate-50 p-2 text-sm text-slate-600">
                        {activeNode.contentSnippet.slice(0, 240)}{activeNode.contentSnippet.length > 240 ? '…' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Hover a connection or click a node to explore details
                  </div>
                )}

                <div className="mt-auto text-xs text-slate-500">
                  Graph layout updates automatically as you add new knowledge. Relationships are generated by the P2 Graph agent after governance approves substrate changes.
                </div>
              </aside>
            </div>
            </div>
          ) : relationshipsFilteredOut ? (
            <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-amber-50 p-10 text-center">
              <Network className="h-20 w-20 text-amber-300" />
              <h3 className="text-xl font-semibold text-amber-800">
                {archivedOnly ? 'Relationships live in archived knowledge' : 'Relationships hidden by filters'}
              </h3>
              <p className="max-w-md text-sm text-amber-700">
                {archivedOnly
                  ? 'Every connection in this basket currently links archived blocks or meanings. Show archived nodes to review historical context or restore the relevant knowledge to make the graph active again.'
                  : 'Connections exist in this basket, but they don’t match the current filters. Enable more node types or reset filters to see the full graph.'}
              </p>
            </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <Network className="h-20 w-20 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-800">No relationships yet</h3>
              <p className="max-w-md text-sm text-slate-600">
                Add a few related thoughts and let the governance workflow approve them. Once approved, the P2 graph agent will automatically map how your knowledge and meanings connect.
              </p>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
