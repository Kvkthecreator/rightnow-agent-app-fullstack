"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Network, Search, Filter, Maximize2, Minimize2, HelpCircle, X } from 'lucide-react';

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

// Futuristic color palette - darker, more vibrant
const SEMANTIC_COLORS = {
  // Knowledge - cool blues/cyans
  fact: '#0EA5E9',
  metric: '#06B6D4',
  event: '#14B8A6',
  finding: '#10B981',

  // Meaning - electric purples/magentas
  insight: '#A855F7',
  intent: '#C026D3',
  objective: '#D946EF',
  principle: '#E879F9',
  rationale: '#F0ABFC',

  // Action - vibrant greens
  action: '#22C55E',

  // Observation - warm oranges/yellows
  observation: '#F59E0B',
  quote: '#FBBF24',
  summary: '#F97316',

  // Structural - pinks/reds
  entity: '#EC4899',
  reference: '#F43F5E',

  // Classification
  classification: '#8B5CF6',

  // Status
  status: '#6366F1',

  default: '#94A3B8'
};

type Node = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // Square side length
  color: string;
  label: string;
  type: string;
  block: Block;
  connections: number;
  clusterId?: number; // For cluster detection
};

type Link = {
  source: Node;
  target: Node;
  distance: number;
  reason: 'same_type' | 'temporal' | 'both';
};

type Cluster = {
  id: number;
  nodes: Node[];
  centerX: number;
  centerY: number;
  label: string;
};

export default function MemoryNetworkView({ basketId, basketTitle, blocks }: MemoryNetworkViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('all');
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [showClusters, setShowClusters] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Build force-directed graph
  const { nodes, links } = useMemo(() => {
    if (blocks.length === 0) return { nodes: [], links: [] };

    const width = 1200;
    const height = 700;

    // Create nodes (blocks as squares)
    const nodes: Node[] = blocks.map((block, idx) => ({
      id: block.id,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      size: Math.sqrt((block.confidence_score || 0.5) * 200) + 12, // Larger base size for squares
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
          const reason: 'same_type' | 'temporal' | 'both' =
            sameType && closeInTime ? 'both' :
            sameType ? 'same_type' : 'temporal';

          links.push({
            source: node,
            target,
            distance: sameType ? 80 : 120,
            reason
          });
          node.connections++;
          target.connections++;
        }
      });
    });

    return { nodes, links };
  }, [blocks]);

  // Filter nodes based on search, type selection, and time
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    // Time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const timeThreshold = timeFilter === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

      filtered = filtered.filter(node => {
        const createdAt = new Date(node.block.created_at).getTime();
        return (now - createdAt) <= timeThreshold;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.label.toLowerCase().includes(query) ||
        node.block.content?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(node => selectedTypes.has(node.type));
    }

    return filtered;
  }, [nodes, searchQuery, selectedTypes, timeFilter]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => nodeIds.has(link.source.id) && nodeIds.has(link.target.id));
  }, [links, filteredNodes]);

  // Detect clusters (groups of 3+ highly connected nodes)
  const clusters = useMemo(() => {
    if (!showClusters || filteredNodes.length < 3) return [];

    const detected: Cluster[] = [];
    const visited = new Set<string>();

    filteredNodes.forEach(node => {
      if (visited.has(node.id) || node.connections < 2) return;

      // Find connected neighbors
      const connectedNodes = [node];
      const queue = [node];
      visited.add(node.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = filteredLinks
          .filter(link =>
            (link.source.id === current.id || link.target.id === current.id) &&
            link.reason !== 'temporal' // Only cluster by semantic similarity
          )
          .map(link => link.source.id === current.id ? link.target : link.source)
          .filter(n => !visited.has(n.id) && n.connections >= 2);

        neighbors.forEach(neighbor => {
          visited.add(neighbor.id);
          connectedNodes.push(neighbor);
          queue.push(neighbor);
        });
      }

      // Only create cluster if 3+ nodes
      if (connectedNodes.length >= 3) {
        const centerX = connectedNodes.reduce((sum, n) => sum + n.x, 0) / connectedNodes.length;
        const centerY = connectedNodes.reduce((sum, n) => sum + n.y, 0) / connectedNodes.length;
        const primaryType = connectedNodes[0].type;

        detected.push({
          id: detected.length,
          nodes: connectedNodes,
          centerX,
          centerY,
          label: `${primaryType} (${connectedNodes.length})`
        });

        // Mark nodes as clustered
        connectedNodes.forEach(n => n.clusterId = detected.length - 1);
      }
    });

    return detected;
  }, [filteredNodes, filteredLinks, showClusters]);

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

        // Keep within bounds (squares)
        const canvas = canvasRef.current;
        if (canvas) {
          const halfSize = node.size / 2;
          node.x = Math.max(halfSize, Math.min(canvas.width - halfSize, node.x));
          node.y = Math.max(halfSize, Math.min(canvas.height - halfSize, node.y));
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

  // Add wheel event listener with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleCanvasWheel);
    };
  }, [handleCanvasWheel]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Dark futuristic background
      ctx.fillStyle = '#0F172A'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply pan and zoom transformations
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw cluster backgrounds
      if (showClusters) {
        clusters.forEach(cluster => {
          // Calculate cluster radius
          const distances = cluster.nodes.map(n =>
            Math.sqrt(Math.pow(n.x - cluster.centerX, 2) + Math.pow(n.y - cluster.centerY, 2))
          );
          const radius = Math.max(...distances) + 40;

          // Draw cluster circle with subtle glow
          ctx.beginPath();
          ctx.arc(cluster.centerX, cluster.centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'; // Very subtle blue
          ctx.fill();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Cluster label
          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cluster.label, cluster.centerX, cluster.centerY - radius - 8);
        });
      }

      // Draw links with glow effect
      filteredLinks.forEach(link => {
        const isHighlighted = selectedNode?.id === link.source.id || selectedNode?.id === link.target.id ||
                              hoveredNode?.id === link.source.id || hoveredNode?.id === link.target.id;

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);

        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // Bright blue when highlighted
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'; // Subtle gray connections
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      });

      // Draw nodes as rounded squares (blocks)
      filteredNodes.forEach(node => {
        const halfSize = node.size / 2;
        const isHighlighted = selectedNode?.id === node.id || hoveredNode?.id === node.id;

        // Shadow/glow for depth
        if (isHighlighted) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 8;
        }

        // Draw rounded square (block)
        const cornerRadius = 6;
        ctx.beginPath();
        ctx.moveTo(node.x - halfSize + cornerRadius, node.y - halfSize);
        ctx.lineTo(node.x + halfSize - cornerRadius, node.y - halfSize);
        ctx.quadraticCurveTo(node.x + halfSize, node.y - halfSize, node.x + halfSize, node.y - halfSize + cornerRadius);
        ctx.lineTo(node.x + halfSize, node.y + halfSize - cornerRadius);
        ctx.quadraticCurveTo(node.x + halfSize, node.y + halfSize, node.x + halfSize - cornerRadius, node.y + halfSize);
        ctx.lineTo(node.x - halfSize + cornerRadius, node.y + halfSize);
        ctx.quadraticCurveTo(node.x - halfSize, node.y + halfSize, node.x - halfSize, node.y + halfSize - cornerRadius);
        ctx.lineTo(node.x - halfSize, node.y - halfSize + cornerRadius);
        ctx.quadraticCurveTo(node.x - halfSize, node.y - halfSize, node.x - halfSize + cornerRadius, node.y - halfSize);
        ctx.closePath();

        ctx.fillStyle = node.color;
        ctx.fill();

        // Border on highlight
        if (isHighlighted) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.shadowBlur = 0; // Reset shadow

        // Label on hover/select
        if (isHighlighted) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';

          // Add background to label for readability
          const labelText = node.label.slice(0, 30);
          const metrics = ctx.measureText(labelText);
          const labelPadding = 6;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(
            node.x - metrics.width / 2 - labelPadding,
            node.y - halfSize - 28,
            metrics.width + labelPadding * 2,
            20
          );

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, node.x, node.y - halfSize - 12);
        }

        // Connection count badge for highly connected nodes
        if (node.connections > 3) {
          const badgeSize = 18;
          const badgeX = node.x + halfSize - badgeSize / 2;
          const badgeY = node.y - halfSize - badgeSize / 2;

          // Badge background
          ctx.fillStyle = '#EF4444'; // Red for high connectivity
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
          ctx.fill();

          // Badge border
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Badge text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.connections.toString(), badgeX, badgeY);
        }
      });

      // Restore context
      ctx.restore();

      requestAnimationFrame(render);
    };

    render();
  }, [filteredNodes, filteredLinks, selectedNode, hoveredNode, clusters, showClusters, pan, zoom]);

  // Convert mouse coordinates to canvas space (accounting for pan/zoom)
  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Account for pan and zoom
    const x = (canvasX - pan.x) / zoom;
    const y = (canvasY - pan.y) / zoom;

    return { x, y };
  }, [pan, zoom]);

  // Handle canvas interactions (square hit detection with pan/zoom)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;

    const { x, y } = getCanvasCoordinates(e);

    for (const node of filteredNodes) {
      const halfSize = node.size / 2;
      if (x >= node.x - halfSize && x <= node.x + halfSize &&
          y >= node.y - halfSize && y <= node.y + halfSize) {
        setSelectedNode(node);
        return;
      }
    }

    setSelectedNode(null);
  }, [filteredNodes, isPanning, getCanvasCoordinates]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      canvas.style.cursor = 'grabbing';
      return;
    }

    const { x, y } = getCanvasCoordinates(e);

    for (const node of filteredNodes) {
      const halfSize = node.size / 2;
      if (x >= node.x - halfSize && x <= node.x + halfSize &&
          y >= node.y - halfSize && y <= node.y + halfSize) {
        setHoveredNode(node);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredNode(null);
    canvas.style.cursor = 'grab';
  }, [filteredNodes, isPanning, panStart, getCanvasCoordinates]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    const clickedNode = filteredNodes.find(node => {
      const halfSize = node.size / 2;
      return x >= node.x - halfSize && x <= node.x + halfSize &&
             y >= node.y - halfSize && y <= node.y + halfSize;
    });

    if (!clickedNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [filteredNodes, getCanvasCoordinates]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleCanvasDoubleClick = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

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

  // Mobile view - show message
  if (isMobile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Network className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Desktop View Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Memory Network visualization requires a larger screen to explore patterns effectively.
            </p>
            <p className="text-xs text-gray-500">
              Visit on desktop or tablet to discover how your {blocks.length} memories connect and cluster.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters - Show first */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Explore Patterns
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {nodes.length} memories • {links.length} connections • {clusters.length} patterns
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpModal(true)}
                title="How does this work?"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
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

          {/* Time filter */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Time Range</div>
            <div className="flex gap-2">
              <Button
                variant={timeFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('week')}
                className="flex-1"
              >
                Last Week
              </Button>
              <Button
                variant={timeFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('month')}
                className="flex-1"
              >
                Last Month
              </Button>
              <Button
                variant={timeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter('all')}
                className="flex-1"
              >
                All Time
              </Button>
            </div>
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

      {/* Network Canvas with Pan/Zoom */}
      <div className="relative">
        <Card>
          <CardContent className="p-0">
            <canvas
              ref={canvasRef}
              width={1200}
              height={isFullscreen ? 900 : 700}
              className={`w-full ${isFullscreen ? 'h-[900px]' : 'h-[700px]'} cursor-grab`}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseDown={handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
            />
          </CardContent>
        </Card>

        {/* Floating Selected Memory Panel */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 w-96 max-w-[calc(100%-2rem)]">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Selected Memory</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</div>
                  <div className="text-gray-900 font-medium mt-0.5">{selectedNode.label}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</div>
                  <Badge style={{ backgroundColor: selectedNode.color, color: 'white' }} className="mt-0.5">
                    {selectedNode.type}
                  </Badge>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Connections</div>
                    <div className="text-gray-900 font-medium mt-0.5">{selectedNode.connections}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</div>
                    <div className="text-gray-900 font-medium mt-0.5">
                      {((selectedNode.block.confidence_score || 0.5) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                {selectedNode.block.content && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content</div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border mt-0.5 max-h-32 overflow-y-auto">
                      {selectedNode.block.content.slice(0, 200)}
                      {selectedNode.block.content.length > 200 && '...'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">How Memory Network Works</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelpModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* How Patterns Emerge */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">How Patterns Emerge</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Same type:</span> Memories with the same classification naturally group together
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Created together:</span> Thoughts captured within 24 hours connect temporally
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">Patterns:</span> Clusters of 3+ connected memories reveal thinking patterns
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas Interactions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Canvas Interactions</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono">🖱️</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Click:</span> Select a memory to view details in the floating panel
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono">🖐️</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Drag:</span> Click and drag background to pan around the network
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono">🖱️</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Scroll wheel:</span> Zoom in and out (0.1x to 5x)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono">2x</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Double-click:</span> Reset pan and zoom to default view
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono">⌨️</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Hover:</span> Highlight connections and see labels
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
