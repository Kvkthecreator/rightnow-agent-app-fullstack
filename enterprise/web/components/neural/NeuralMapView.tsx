"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brain, Play, Pause, RotateCcw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

type Block = {
  id: string;
  title?: string | null;
  content?: string | null;
  semantic_type?: string | null;
  confidence_score?: number | null;
  created_at: string;
  metadata?: Record<string, any> | null;
};

interface NeuralMapViewProps {
  basketId: string;
  basketTitle: string;
  blocks: Block[];
  canEdit: boolean;
}

// Brain region colors - mapped to semantic types
const BRAIN_REGIONS = {
  // Knowledge types (Hippocampus - memory formation)
  fact: { color: '#3b82f6', region: 'Hippocampus', label: 'Facts' },
  metric: { color: '#06b6d4', region: 'Hippocampus', label: 'Metrics' },
  event: { color: '#0891b2', region: 'Hippocampus', label: 'Events' },

  // Meaning types (Prefrontal Cortex - higher reasoning)
  insight: { color: '#8b5cf6', region: 'Prefrontal Cortex', label: 'Insights' },
  intent: { color: '#a855f7', region: 'Prefrontal Cortex', label: 'Intents' },
  objective: { color: '#7c3aed', region: 'Prefrontal Cortex', label: 'Objectives' },
  principle: { color: '#6d28d9', region: 'Prefrontal Cortex', label: 'Principles' },

  // Action types (Motor Cortex - execution)
  action: { color: '#10b981', region: 'Motor Cortex', label: 'Actions' },
  finding: { color: '#059669', region: 'Motor Cortex', label: 'Findings' },

  // Observation types (Sensory Cortex - perception)
  observation: { color: '#f59e0b', region: 'Sensory Cortex', label: 'Observations' },
  quote: { color: '#d97706', region: 'Sensory Cortex', label: 'Quotes' },
  summary: { color: '#ea580c', region: 'Sensory Cortex', label: 'Summaries' },

  // Structural types (Cerebellum - coordination)
  entity: { color: '#ec4899', region: 'Cerebellum', label: 'Entities' },
  reference: { color: '#db2777', region: 'Cerebellum', label: 'References' },

  // Default
  default: { color: '#64748b', region: 'Cortex', label: 'Memory' }
};

type Neuron = {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  region: string;
  label: string;
  block: Block;
  cluster: number;
};

type Connection = {
  from: Neuron;
  to: Neuron;
  strength: number;
};

export default function NeuralMapView({ basketId, basketTitle, blocks, canEdit }: NeuralMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedNeuron, setSelectedNeuron] = useState<Neuron | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredNeuron, setHoveredNeuron] = useState<Neuron | null>(null);

  // Cluster blocks into brain regions using simple k-means approximation
  const { neurons, connections, clusters } = useMemo(() => {
    if (blocks.length === 0) {
      return { neurons: [], connections: [], clusters: new Map() };
    }

    // Group by semantic_type (brain regions)
    const regionGroups = new Map<string, Block[]>();
    blocks.forEach(block => {
      const type = block.semantic_type || 'default';
      if (!regionGroups.has(type)) {
        regionGroups.set(type, []);
      }
      regionGroups.get(type)!.push(block);
    });

    // Create neurons with clustered positioning
    const neurons: Neuron[] = [];
    let clusterIndex = 0;
    const clusterMap = new Map<string, number>();

    regionGroups.forEach((blocksInRegion, semanticType) => {
      const regionInfo = BRAIN_REGIONS[semanticType as keyof typeof BRAIN_REGIONS] || BRAIN_REGIONS.default;
      clusterMap.set(semanticType, clusterIndex);

      // Position neurons in circular clusters
      const clusterAngle = (clusterIndex / regionGroups.size) * Math.PI * 2;
      const clusterRadius = 200;
      const clusterX = Math.cos(clusterAngle) * clusterRadius;
      const clusterZ = Math.sin(clusterAngle) * clusterRadius;

      blocksInRegion.forEach((block, idx) => {
        // Spread neurons within cluster
        const angle = (idx / blocksInRegion.length) * Math.PI * 2;
        const spread = 80;
        const x = clusterX + Math.cos(angle) * spread;
        const z = clusterZ + Math.sin(angle) * spread;
        const y = (Math.random() - 0.5) * 50; // Slight vertical variation

        neurons.push({
          id: block.id,
          x,
          y,
          z,
          size: (block.confidence_score || 0.5) * 8 + 4,
          color: regionInfo.color,
          region: regionInfo.region,
          label: block.title || 'Untitled Memory',
          block,
          cluster: clusterIndex
        });
      });

      clusterIndex++;
    });

    // Create connections between nearby neurons (simulating synapses)
    const connections: Connection[] = [];
    const maxConnections = 3; // Limit connections per neuron

    neurons.forEach(neuron => {
      // Find nearest neighbors
      const distances = neurons
        .filter(other => other.id !== neuron.id)
        .map(other => ({
          neuron: other,
          distance: Math.sqrt(
            Math.pow(other.x - neuron.x, 2) +
            Math.pow(other.y - neuron.y, 2) +
            Math.pow(other.z - neuron.z, 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxConnections);

      distances.forEach(({ neuron: other, distance }) => {
        // Only create connection if within reasonable distance
        if (distance < 150) {
          connections.push({
            from: neuron,
            to: other,
            strength: 1 - (distance / 150)
          });
        }
      });
    });

    return { neurons, connections, clusters: clusterMap };
  }, [blocks]);

  // Canvas rendering with 3D projection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || neurons.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simple 3D to 2D projection
    const project = (neuron: Neuron) => {
      const rotatedX = neuron.x * Math.cos(rotation) - neuron.z * Math.sin(rotation);
      const rotatedZ = neuron.x * Math.sin(rotation) + neuron.z * Math.cos(rotation);

      const scale = 500 / (500 + rotatedZ);
      const x2d = centerX + rotatedX * scale * zoom;
      const y2d = centerY + neuron.y * scale * zoom;
      const size2d = neuron.size * scale * zoom;

      return { x: x2d, y: y2d, size: size2d, scale };
    };

    const render = () => {
      // Clear canvas with dark background (brain scan aesthetic)
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw connections (synapses) first
      connections.forEach(conn => {
        const from = project(conn.from);
        const to = project(conn.to);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        // Gradient for synaptic connection
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, conn.from.color + '40');
        gradient.addColorStop(1, conn.to.color + '40');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = conn.strength * 1.5;
        ctx.stroke();
      });

      // Sort neurons by Z (depth) for proper layering
      const sortedNeurons = [...neurons].sort((a, b) => {
        const aZ = a.x * Math.sin(rotation) + a.z * Math.cos(rotation);
        const bZ = b.x * Math.sin(rotation) + b.z * Math.cos(rotation);
        return aZ - bZ;
      });

      // Draw neurons
      sortedNeurons.forEach(neuron => {
        const { x, y, size, scale } = project(neuron);

        // Neuron glow (electrical activity)
        const glowSize = size * 2;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, neuron.color + 'ff');
        gradient.addColorStop(0.5, neuron.color + '80');
        gradient.addColorStop(1, neuron.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Neuron core
        ctx.fillStyle = neuron.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight if hovered or selected
        if (hoveredNeuron?.id === neuron.id || selectedNeuron?.id === neuron.id) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / scale;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = `${12 / scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(neuron.label.slice(0, 30), x, y + size + 15);
        }
      });

      if (isAnimating) {
        setRotation(r => r + 0.003);
      }
    };

    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [neurons, connections, rotation, zoom, isAnimating, hoveredNeuron, selectedNeuron]);

  // Handle canvas interactions
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked neuron (simplified hit detection)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (const neuron of neurons) {
      const rotatedX = neuron.x * Math.cos(rotation) - neuron.z * Math.sin(rotation);
      const rotatedZ = neuron.x * Math.sin(rotation) + neuron.z * Math.cos(rotation);
      const scale = 500 / (500 + rotatedZ);
      const x2d = centerX + rotatedX * scale * zoom;
      const y2d = centerY + neuron.y * scale * zoom;
      const size2d = neuron.size * scale * zoom;

      const dist = Math.sqrt(Math.pow(x - x2d, 2) + Math.pow(y - y2d, 2));
      if (dist < size2d * 2) {
        setSelectedNeuron(neuron);
        return;
      }
    }

    setSelectedNeuron(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (const neuron of neurons) {
      const rotatedX = neuron.x * Math.cos(rotation) - neuron.z * Math.sin(rotation);
      const rotatedZ = neuron.x * Math.sin(rotation) + neuron.z * Math.cos(rotation);
      const scale = 500 / (500 + rotatedZ);
      const x2d = centerX + rotatedX * scale * zoom;
      const y2d = centerY + neuron.y * scale * zoom;
      const size2d = neuron.size * scale * zoom;

      const dist = Math.sqrt(Math.pow(x - x2d, 2) + Math.pow(y - y2d, 2));
      if (dist < size2d * 2) {
        setHoveredNeuron(neuron);
        return;
      }
    }

    setHoveredNeuron(null);
  };

  // Stats
  const regionStats = useMemo(() => {
    const stats = new Map<string, { count: number; color: string; label: string }>();

    neurons.forEach(neuron => {
      if (!stats.has(neuron.region)) {
        stats.set(neuron.region, {
          count: 0,
          color: neuron.color,
          label: BRAIN_REGIONS[neuron.block.semantic_type as keyof typeof BRAIN_REGIONS]?.label || 'Memory'
        });
      }
      stats.get(neuron.region)!.count++;
    });

    return Array.from(stats.entries()).map(([region, data]) => ({
      region,
      ...data
    }));
  }, [neurons]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Neural Map</h2>
                <p className="text-sm text-gray-600">
                  {neurons.length} active neurons across {regionStats.length} brain regions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRotation(0); setZoom(1); }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brain Regions Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Active Brain Regions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {regionStats.map(({ region, count, color, label }) => (
              <Badge
                key={region}
                variant="outline"
                className="border-2"
                style={{
                  borderColor: color,
                  color: color
                }}
              >
                {region}: {count} {label.toLowerCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Neural Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={1200}
            height={700}
            className="w-full h-[700px] cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        </CardContent>
      </Card>

      {/* Selected Neuron Details */}
      {selectedNeuron && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Title</div>
              <div className="text-gray-900">{selectedNeuron.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Brain Region</div>
              <Badge style={{ backgroundColor: selectedNeuron.color, color: 'white' }}>
                {selectedNeuron.region}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Activation Strength</div>
              <div className="text-gray-900">
                {((selectedNeuron.block.confidence_score || 0.5) * 100).toFixed(0)}%
              </div>
            </div>
            {selectedNeuron.block.content && (
              <div>
                <div className="text-sm font-medium text-gray-700">Content</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                  {selectedNeuron.block.content.slice(0, 200)}
                  {selectedNeuron.block.content.length > 200 && '...'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
