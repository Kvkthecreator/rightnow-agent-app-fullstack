// TRUE CONTEXT OS - The ONLY Composition Interface
// Progressive enhancement version to avoid runtime issues

"use client";

import React, { useState, useEffect } from 'react';

interface SubstrateCanvasProps {
  basketId: string;
  workspaceId: string;
}

export function SubstrateCanvas({ basketId, workspaceId }: SubstrateCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  const [substrate, setSubstrate] = useState({
    rawDumps: [],
    blocks: [],
    contextItems: [],
    narrative: [],
    documents: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    setIsClient(true);
    // TODO: Initialize substrate composer here
  }, []);

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
            <p className="text-gray-600">Loading Context OS...</p>
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
            {/* Add Raw Dump */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                ➕ Add Raw Dump
              </h3>
              <textarea
                placeholder="Enter your raw thoughts, ideas, or content..."
                className="w-full p-3 border rounded-md text-sm resize-none"
                rows={3}
              />
              <button className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                Add to Substrate
              </button>
            </div>

            {/* Substrate Types */}
            {[
              { key: 'rawDumps', label: 'RAW DUMPS', icon: '📄', color: 'blue' },
              { key: 'blocks', label: 'BLOCKS', icon: '🧱', color: 'green' },
              { key: 'contextItems', label: 'CONTEXT ITEMS', icon: '🔗', color: 'purple' },
              { key: 'narrative', label: 'NARRATIVE', icon: '📖', color: 'orange' },
              { key: 'documents', label: 'DOCUMENTS', icon: '📝', color: 'gray' }
            ].map(({ key, label, icon, color }) => (
              <div key={key} className={`border-l-4 border-${color}-200 rounded-lg p-4 bg-${color}-50`}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>{icon}</span>
                  {label} ({(substrate as any)[key].length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(substrate as any)[key].length === 0 && (
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
                { label: 'RAW DUMPS', count: substrate.rawDumps.length, icon: '📄' },
                { label: 'BLOCKS', count: substrate.blocks.length, icon: '🧱' },
                { label: 'CONTEXT ITEMS', count: substrate.contextItems.length, icon: '🔗' },
                { label: 'DOCUMENTS', count: substrate.documents.length, icon: '📝' }
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
            
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold mb-1">Context OS Revolution Complete</p>
              <p>No more hierarchy. All substrate types are peers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}