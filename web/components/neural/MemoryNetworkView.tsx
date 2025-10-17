"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Network, Search, Filter, Maximize2, Minimize2 } from 'lucide-react';

type Block = {
  id: string;
  title?: string | null;
  content?: string | null;
  semantic_type?: string | null;
  confidence_score?: number | null;
  created_at: string;
  metadata?: Record<string, any> | null;
};

interface MemoryNetworkViewProps {
  basketId: string;
  basketTitle: string;
  blocks: Block[];
  canEdit: boolean;
}

// Semantic type colors - YARNNN terminology
const SEMANTIC_COLORS = {
  // Knowledge
  fact: '#3b82f6',
  metric: '#06b6d4',
  event: '#0891b2',
  finding: '#059669',

  // Meaning
  insight: '#8b5cf6',
  intent: '#a855f7',
  objective: '#7c3aed',
  principle: '#6d28d9',
  rationale: '#9333ea',

  // Action
  action: '#10b981',

  // Observation
  observation: '#f59e0b',
  quote: '#d97706',
  summary: '#ea580c',

  // Structural
  entity: '#ec4899',
  reference: '#db2777',

  default: '#64748b'
};

type Node = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  type: string;
  block: Block;
  connections: number;
};

type Link = {
  source: Node;
  target: Node;
  distance: number;
};

export default function MemoryNetworkView({ basketId, basketTitle, blocks }: MemoryNetworkViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build force-directed graph
  const { nodes, links } = useMemo(() => {
    if (blocks.length === 0) return { nodes: [], links: [] };

    const width = 1200;
    const height = 700;

    // Create nodes
    const nodes: Node[] = blocks.map((block, idx) => ({
      id: block.id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      radius: Math.sqrt((block.confidence_score || 0.5) * 100) + 5,
      color: SEMANTIC_COLORS[block.semantic_type as keyof typeof SEMANTIC_COLORS] || SEMANTIC_COLORS.default,
      label: block.title || 'Untitled',
      type: block.semantic_type || 'memory',
      block,
      connections: 0
    }));

    // Create links based on temporal proximity and semantic similarity
    const links: Link[] = [];
    const sortedNodes = [...nodes].sort((a, b) =>
      new Date(a.block.created_at).getTime() - new Date(b.block.created_at).getTime()
    );

    sortedNodes.forEach((node, idx) => {
      // Connect to temporally nearby nodes (created around same time)
      const nearbyNodes = sortedNodes.slice(Math.max(0, idx - 3), idx + 4).filter(n => n.id !== node.id);

      nearbyNodes.forEach(target => {
        // Connect if same semantic type or temporally close
        const timeDiff = Math.abs(
          new Date(node.block.created_at).getTime() - new Date(target.block.created_at).getTime()
        );
        const sameType = node.type === target.type;
        const closeInTime = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours

        if (sameType || closeInTime) {
          links.push({
            source: node,
            target,
            distance: sameType ? 80 : 120
          });
          node.connections++;
          target.connections++;
        }
      });
    });

    return { nodes, links };
  }, [blocks]);

  // Filter nodes based on search and type selection
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.label.toLowerCase().includes(query) ||
        node.block.content?.toLowerCase().includes(query)
      );
    }

    if (selectedTypes.size > 0) {
      filtered = filtered.filter(node => selectedTypes.has(node.type));
    }

    return filtered;
  }, [nodes, searchQuery, selectedTypes]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => nodeIds.has(link.source.id) && nodeIds.has(link.target.id));
  }, [links, filteredNodes]);

  // Force simulation
  useEffect(() => {
    if (filteredNodes.length === 0) return;

    let animationId: number;
    const alpha = 0.5;
    const decay = 0.97;
    let currentAlpha = alpha;

    const simulate = () => {
      // Apply forces
      filteredLinks.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = (distance - link.distance) * 0.1;

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        link.source.vx += fx;
        link.source.vy += fy;
        link.target.vx -= fx;
        link.target.vy -= fy;
      });

      // Repulsion between nodes
      filteredNodes.forEach((nodeA, i) => {
        filteredNodes.slice(i + 1).forEach(nodeB => {
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const force = (100 - distance) * 0.5;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        });
      });

      // Update positions with velocity damping
      filteredNodes.forEach(node => {
        node.x += node.vx * currentAlpha;
        node.y += node.vy * currentAlpha;
        node.vx *= 0.8;
        node.vy *= 0.8;

        // Keep within bounds
        const canvas = canvasRef.current;
        if (canvas) {
          node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
        }
      });

      currentAlpha *= decay;

      if (currentAlpha > 0.01) {
        animationId = requestAnimationFrame(simulate);
      }
    };

    simulate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [filteredNodes, filteredLinks]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw links
      filteredLinks.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw nodes
      filteredNodes.forEach(node => {
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Highlight if selected or hovered
        if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label.slice(0, 30), node.x, node.y - node.radius - 10);
        }

        // Connection count badge for highly connected nodes
        if (node.connections > 3) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(node.x + node.radius - 5, node.y - node.radius + 5, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.connections.toString(), node.x + node.radius - 5, node.y - node.radius + 9);
        }
      });

      requestAnimationFrame(render);
    };

    render();
  }, [filteredNodes, filteredLinks, selectedNode, hoveredNode]);

  // Handle canvas interactions
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of filteredNodes) {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (distance < node.radius) {
        setSelectedNode(node);
        return;
      }
    }

    setSelectedNode(null);
  }, [filteredNodes]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of filteredNodes) {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (distance < node.radius) {
        setHoveredNode(node);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredNode(null);
    canvas.style.cursor = 'default';
  }, [filteredNodes]);

  // Stats
  const typeStats = useMemo(() => {
    const stats = new Map<string, number>();
    nodes.forEach(node => {
      stats.set(node.type, (stats.get(node.type) || 0) + 1);
    });
    return Array.from(stats.entries())
      .map(([type, count]) => ({ type, count, color: SEMANTIC_COLORS[type as keyof typeof SEMANTIC_COLORS] || SEMANTIC_COLORS.default }))
      .sort((a, b) => b.count - a.count);
  }, [nodes]);

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Network className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Memory Network</h2>
                <p className="text-sm text-gray-600">
                  {nodes.length} memories • {links.length} connections
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Memories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type filters */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Memory Types</div>
            <div className="flex flex-wrap gap-2">
              {typeStats.map(({ type, count, color }) => (
                <Badge
                  key={type}
                  variant={selectedTypes.has(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: selectedTypes.has(type) ? color : 'transparent',
                    borderColor: color,
                    color: selectedTypes.has(type) ? 'white' : color
                  }}
                  onClick={() => toggleTypeFilter(type)}
                >
                  {type} ({count})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={1200}
            height={isFullscreen ? 900 : 700}
            className={`w-full ${isFullscreen ? 'h-[900px]' : 'h-[700px]'} cursor-default`}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        </CardContent>
      </Card>

      {/* Selected Memory Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Title</div>
              <div className="text-gray-900">{selectedNode.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Type</div>
              <Badge style={{ backgroundColor: selectedNode.color, color: 'white' }}>
                {selectedNode.type}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Connections</div>
              <div className="text-gray-900">{selectedNode.connections} related memories</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Confidence</div>
              <div className="text-gray-900">
                {((selectedNode.block.confidence_score || 0.5) * 100).toFixed(0)}%
              </div>
            </div>
            {selectedNode.block.content && (
              <div>
                <div className="text-sm font-medium text-gray-700">Content</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                  {selectedNode.block.content.slice(0, 300)}
                  {selectedNode.block.content.length > 300 && '...'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
