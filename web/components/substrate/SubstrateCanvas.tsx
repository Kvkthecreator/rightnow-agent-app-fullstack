// TRUE CONTEXT OS - The ONLY Composition Interface
// All substrate types as equals - no hierarchy

"use client";

import React, { useState } from 'react';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import { SubstrateType, SubstrateElement } from '@/lib/substrate/SubstrateTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Package, 
  Link2, 
  BookOpen, 
  FileEdit,
  Plus,
  Zap,
  Network,
  ArrowRight,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubstrateCanvasProps {
  basketId: string;
  workspaceId: string;
}

const SUBSTRATE_ICONS = {
  raw_dump: FileText,
  block: Package,
  context_item: Link2,
  narrative: BookOpen,
  document: FileEdit
};

const SUBSTRATE_COLORS = {
  raw_dump: 'bg-blue-50 border-blue-200 text-blue-800',
  block: 'bg-green-50 border-green-200 text-green-800',
  context_item: 'bg-purple-50 border-purple-200 text-purple-800',
  narrative: 'bg-orange-50 border-orange-200 text-orange-800',
  document: 'bg-gray-50 border-gray-200 text-gray-800'
};

export function SubstrateCanvas({ basketId, workspaceId }: SubstrateCanvasProps) {
  const substrate = useSubstrate(basketId, workspaceId);
  const [activeSection, setActiveSection] = useState<'explorer' | 'composer' | 'relationships'>('explorer');
  const [selectedElements, setSelectedElements] = useState<SubstrateElement[]>([]);
  const [newRawDump, setNewRawDump] = useState('');

  const handleAddRawDump = async () => {
    if (!newRawDump.trim()) return;
    
    await substrate.addRawDump(newRawDump);
    setNewRawDump('');
  };

  const handleProposeBlocks = async (rawDumpId: string) => {
    await substrate.proposeBlocks(rawDumpId);
  };

  const toggleElementSelection = (element: SubstrateElement) => {
    setSelectedElements(prev => {
      const isSelected = prev.some(e => e.id === element.id);
      if (isSelected) {
        return prev.filter(e => e.id !== element.id);
      } else {
        return [...prev, element];
      }
    });
  };

  const handleComposeDocument = async () => {
    if (selectedElements.length === 0) return;
    
    const composition = selectedElements.map((element, index) => ({
      type: element.type,
      id: element.id,
      order: index
    }));
    
    await substrate.composeDocument(
      `Composed Document ${new Date().toLocaleString()}`,
      composition
    );
    
    setSelectedElements([]);
  };

  return (
    <div className="substrate-canvas min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Context OS</h1>
            <p className="text-gray-600">Unified substrate composition system</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {substrate.totalSubstrateCount} Total Elements
            </Badge>
            <Badge variant="outline" className="text-xs">
              {substrate.proposedBlocksCount} Proposed Blocks
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant={activeSection === 'explorer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('explorer')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Explore
          </Button>
          <Button 
            variant={activeSection === 'composer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('composer')}
          >
            <FileEdit className="w-4 h-4 mr-2" />
            Compose
          </Button>
          <Button 
            variant={activeSection === 'relationships' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('relationships')}
          >
            <Network className="w-4 h-4 mr-2" />
            Relations
          </Button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-140px)]">
        {/* Left Panel - Substrate Explorer */}
        <div className="w-1/3 border-r bg-white p-6">
          <div className="space-y-6">
            {/* Add Raw Dump */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Raw Dump
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter your raw thoughts, ideas, or content..."
                  value={newRawDump}
                  onChange={(e) => setNewRawDump(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddRawDump} size="sm" className="w-full">
                  Add to Substrate
                </Button>
              </CardContent>
            </Card>

            {/* Substrate Types */}
            {Object.entries(substrate.substrate).map(([typeKey, elements]) => {
              const type = typeKey.replace(/s$/, '') as SubstrateType;
              const Icon = SUBSTRATE_ICONS[type];
              const colorClass = SUBSTRATE_COLORS[type];

              return (
                <Card key={type} className={cn("border-l-4", colorClass)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {type.replace('_', ' ').toUpperCase()} ({elements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {elements.map((element) => (
                        <div
                          key={element.id}
                          className={cn(
                            "p-3 rounded-md border cursor-pointer transition-all hover:shadow-sm",
                            selectedElements.some(e => e.id === element.id)
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 hover:bg-gray-100"
                          )}
                          onClick={() => toggleElementSelection(element)}
                        >
                          <div className="text-sm font-medium truncate">
                            {'title' in element ? element.title : `${type} ${element.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {'content' in element && element.content 
                              ? element.content.substring(0, 100) + '...'
                              : 'No preview available'}
                          </div>
                          
                          {type === 'raw_dump' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProposeBlocks(element.id);
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Propose Blocks
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {elements.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                          No {type.replace('_', ' ')} yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Center Panel - Composition Area */}
        <div className="flex-1 p-6">
          {activeSection === 'explorer' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Substrate Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(substrate.substrate).map(([typeKey, elements]) => {
                  const type = typeKey.replace(/s$/, '') as SubstrateType;
                  const Icon = SUBSTRATE_ICONS[type];
                  
                  return (
                    <Card key={type}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-gray-600" />
                          <div>
                            <div className="font-medium">{type.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-2xl font-bold">{elements.length}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {selectedElements.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Selected for Composition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {selectedElements.map((element, index) => (
                        <div key={element.id} className="flex items-center gap-2">
                          <span className="text-sm font-mono">{index + 1}.</span>
                          <Badge variant="outline">{element.type}</Badge>
                          <span className="text-sm truncate">
                            {'title' in element ? element.title : `${element.type} ${element.id.slice(0, 8)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleComposeDocument} className="w-full">
                      <FileEdit className="w-4 h-4 mr-2" />
                      Compose Document
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'composer' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Document Composer</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    Select substrate elements from the left panel to compose a document.
                    <br />
                    Selected elements: {selectedElements.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'relationships' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Substrate Relationships</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    Semantic relationship visualization coming soon.
                    <br />
                    This will show connections between all substrate types.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Context & Details */}
        <div className="w-1/4 border-l bg-white p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Context Insights</h3>
            
            {substrate.loading && (
              <div className="text-sm text-gray-500">Processing substrate...</div>
            )}
            
            {substrate.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {substrate.error}
              </div>
            )}
            
            <Card>
              <CardContent className="p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Raw Dumps:</span>
                    <span className="font-medium">{substrate.substrate.rawDumps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proposed Blocks:</span>
                    <span className="font-medium">{substrate.proposedBlocksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accepted Blocks:</span>
                    <span className="font-medium">{substrate.acceptedBlocksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documents:</span>
                    <span className="font-medium">{substrate.substrate.documents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}