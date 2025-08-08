// TRUE CONTEXT OS - The ONLY Composition Interface
// Progressive enhancement version to avoid runtime issues

"use client";

import React, { useState, useEffect } from 'react';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import { CompositeRawDumpInput } from './CompositeRawDumpInput';
import { FileFragmentHandler } from '@/lib/substrate/FileFragmentHandler';
import { Fragment } from '@/lib/substrate/FragmentTypes';

interface SubstrateCanvasProps {
  basketId: string;
  workspaceId: string;
}

export function SubstrateCanvas({ basketId, workspaceId }: SubstrateCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const substrate = useSubstrate(basketId, workspaceId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmitComposite = async (fragments: Fragment[]) => {
    setProcessingStatus('Processing your input...');
    
    try {
      // Process any file fragments
      const processedFragments = await FileFragmentHandler.processFragments(
        fragments,
        (status, fragmentIndex) => {
          setProcessingStatus(`[${fragmentIndex + 1}/${fragments.length}] ${status}`);
        }
      );
      
      setProcessingStatus('Creating unified raw dump...');
      
      // Submit as unified raw dump
      await substrate.addRawDump(processedFragments);
      
      setProcessingStatus('Complete!');
      setTimeout(() => setProcessingStatus(''), 2000);
      
    } catch (error) {
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setProcessingStatus(''), 5000);
    }
  };

  if (!isClient) {
    // Server-side render: show loading state
    return (
      <div className="substrate-canvas min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Context OS</h1>
              <p className="text-gray-600">Initializing unified substrate system...</p>
            </div>
          </div>
        </div>
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">{processingStatus || 'Loading Context OS...'}</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="px-3 py-1 bg-blue-50 text-blue-800 text-xs rounded-md font-mono">
              {basketId}
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-800 text-xs rounded-md">
              {workspaceId}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mt-4">
          <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
            🔍 Explore
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
            ✏️ Compose
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
            🕸️ Relations
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-140px)]">
        {/* Left Panel - Substrate Explorer */}
        <div className="w-1/3 border-r bg-white p-6">
          <div className="space-y-6">
            {/* Composite Raw Dump Input */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                ➕ Add to Research
                <span className="text-xs font-normal text-gray-500">(unified context)</span>
              </h3>
              <CompositeRawDumpInput 
                onSubmit={handleSubmitComposite}
                className="border-0 shadow-sm"
              />
            </div>

            {/* Substrate Types */}
            {[
              { 
                key: 'rawDumps', 
                label: 'RAW DUMPS', 
                icon: '📄', 
                color: 'blue',
                description: 'Unprocessed content from files, text, or clipboard',
                helpText: 'Your original input materials'
              },
              { 
                key: 'blocks', 
                label: 'BLOCKS', 
                icon: '🧱', 
                color: 'green',
                description: 'Structured knowledge fragments proposed by AI',
                helpText: 'AI-identified key concepts and insights'
              },
              { 
                key: 'contextItems', 
                label: 'CONTEXT ITEMS', 
                icon: '🔗', 
                color: 'purple',
                description: 'Tagged connections and relationships',
                helpText: 'Themes, questions, and cross-references'
              },
              { 
                key: 'narrative', 
                label: 'NARRATIVE', 
                icon: '📖', 
                color: 'orange',
                description: 'Coherent stories and explanations',
                helpText: 'Synthesized understanding and insights'
              },
              { 
                key: 'documents', 
                label: 'DOCUMENTS', 
                icon: '📝', 
                color: 'gray',
                description: 'Final composed outputs and reports',
                helpText: 'Polished deliverables and presentations'
              }
            ].map(({ key, label, icon, color, description, helpText }) => (
              <div key={key} className={`border-l-4 border-${color}-200 rounded-lg p-4 bg-${color}-50`}>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <span>{icon}</span>
                  {label} ({(substrate.substrate as any)[key].length})
                </h3>
                <p className="text-xs text-gray-600 mb-2">{description}</p>
                <p className="text-xs text-gray-500 italic mb-3">{helpText}</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(substrate.substrate as any)[key].length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No {key.replace(/([A-Z])/g, ' $1').toLowerCase()} yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel - Composition Area */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Substrate Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'RAW DUMPS', count: substrate.substrate.rawDumps.length, icon: '📄' },
                { label: 'BLOCKS', count: substrate.substrate.blocks.length, icon: '🧱' },
                { label: 'CONTEXT ITEMS', count: substrate.substrate.contextItems.length, icon: '🔗' },
                { label: 'DOCUMENTS', count: substrate.substrate.documents.length, icon: '📝' }
              ].map(({ label, count, icon }) => (
                <div key={label} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to the TRUE Context OS
              </h3>
              <p className="text-gray-600 mb-4">
                All substrate types are now treated as equals in this unified system.
              </p>
              <p className="text-sm text-gray-500">
                Start by adding some raw content in the left panel.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Context & Details */}
        <div className="w-1/4 border-l bg-white p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">System Status</h3>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-green-600">🟢 Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium">Unified</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend:</span>
                  <span className="font-medium">Connected</span>
                </div>
              </div>
            </div>
            
            {/* Processing Status Display */}
            {processingStatus && (
              <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                <h4 className="text-sm font-semibold mb-2 text-blue-800">Processing</h4>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-700">{processingStatus}</span>
                </div>
              </div>
            )}
            
            {/* Executive Summary */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Executive Summary</h4>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{substrate.totalSubstrateCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-medium text-green-600">High</span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage:</span>
                  <span className="font-medium text-yellow-600">Partial</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold mb-1">Context OS Revolution Complete</p>
              <p>No more hierarchy. All substrate types are peers.</p>
              <p className="mt-2 text-gray-600">💡 Upload multiple files with text to create unified context</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}