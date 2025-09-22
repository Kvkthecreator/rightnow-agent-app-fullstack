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
  const router = useRouter();
  
  // Canon-compliant substrate statistics
  const substrateStats = {
    structuredKnowledge: graphData.blocks?.length || 0,
    semanticMeaning: graphData.context_items?.length || 0,
    relationships: graphData.relationships?.length || 0,
    connectionDensity: 0
  };

  const hasData = (graphData.blocks?.length || 0) > 0 || (graphData.context_items?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Connections</h1>
            <p className="text-gray-600">Explore relationships between your structured knowledge and semantic meanings</p>
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="p-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center max-w-md mx-auto">
                <Network className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Knowledge Graph</h3>
                <p className="text-gray-600 mb-6">
                  Your knowledge network contains {substrateStats.structuredKnowledge} structured knowledge items 
                  and {substrateStats.semanticMeaning} semantic meanings.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>Structured Knowledge: {substrateStats.structuredKnowledge}</div>
                  <div>Semantic Meanings: {substrateStats.semanticMeaning}</div>
                  <div>Relationships: {substrateStats.relationships}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
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
                <Button 
                  onClick={() => router.push(`/baskets/${basketId}/add-memory`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Memory to Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}