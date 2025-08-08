// SYSTEMATIC REBUILD - Clean UI with integrated Thinking Partner
// Replaces SimplifiedSubstrate with proper architecture

"use client";

import React, { useState, useEffect } from 'react';
import { Send, FileText, Loader2, Brain, CheckCircle, X, Plus, Eye } from 'lucide-react';
import { substrateService, type SubstrateData, type RawDump, type Block } from '@/lib/substrate/SubstrateService';

interface SubstrateManagerProps {
  basketId: string;
}

export function SubstrateManager({ basketId }: SubstrateManagerProps) {
  const [substrate, setSubstrate] = useState<SubstrateData>({
    rawDumps: [],
    blocks: [],
    contextItems: [],
    documents: []
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'input' | 'blocks' | 'context' | 'documents'>('input');

  // Note: Substrate loading moved into useEffect for better lifecycle management

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const loadSubstrateData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await substrateService.getAllSubstrate(basketId);
        if (isMounted) {
          setSubstrate(data);
        }
      } catch (err) {
        console.error('Failed to load substrate:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const setupSubscription = async () => {
      if (!isMounted) return;
      
      // Clean up any existing subscription
      if (channel) {
        console.log('Cleaning up existing subscription');
        await channel.unsubscribe();
      }
      
      try {
        channel = await substrateService.subscribeToBasket(basketId, () => {
          if (isMounted) {
            console.log('Realtime update received, reloading substrate...');
            loadSubstrateData();
          }
        });
        
        if (isMounted && channel) {
          console.log('Subscription established for basket:', basketId);
        }
      } catch (error) {
        console.error('Failed to setup subscription:', error);
      }
    };

    // Initial load
    loadSubstrateData();
    
    // Setup subscription after a small delay to ensure auth is ready
    const timer = setTimeout(() => {
      setupSubscription();
    }, 1000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (channel) {
        console.log('Unsubscribing from channel');
        channel.unsubscribe();
      }
    };
  }, [basketId]); // Only re-run if basketId changes

  // Add new raw dump
  const handleAddContent = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await substrateService.addRawDump(basketId, input);
      setInput('');
      // Data will refresh via subscription
    } catch (err) {
      console.error('Failed to add content:', err);
      setError(err instanceof Error ? err.message : 'Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  // Process raw dump to generate ALL substrate types
  const handleProcessRawDump = async (rawDumpId: string) => {
    setLoading(true);
    setProcessingStatus('Processing substrate with agent orchestra...');
    
    try {
      const results = await substrateService.processRawDump(rawDumpId);
      
      // Show results summary
      const totalGenerated = results.blocks.length + results.contextItems.length + 
                            results.narrative.length + results.relationships.length;
      
      setProcessingStatus(
        `✅ Generated: ${results.blocks.length} blocks, ${results.contextItems.length} context items, ${results.narrative.length} narrative, ${results.relationships.length} relationships`
      );
      
      setError(null);
      // Switch to blocks tab to show results
      setActiveTab('blocks');
      
      // Clear status after delay
      setTimeout(() => setProcessingStatus(''), 5000);
      
    } catch (err) {
      console.error('Failed to process raw dump:', err);
      setError(err instanceof Error ? err.message : 'Failed to process substrate');
      setProcessingStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Approve/reject blocks
  const handleBlockAction = async (blockId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await substrateService.approveBlock(blockId);
      } else {
        await substrateService.rejectBlock(blockId);
      }
    } catch (err) {
      console.error(`Failed to ${action} block:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} block`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddContent();
    }
  };

  const pendingBlocks = substrate.blocks.filter(b => b.status === 'proposed');
  const acceptedBlocks = substrate.blocks.filter(b => b.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Context OS</h1>
            <p className="text-gray-600">
              {substrate.rawDumps.length} raw dumps • {acceptedBlocks.length} blocks • {substrate.contextItems.length} context items
            </p>
          </div>
          
          {pendingBlocks.length > 0 && (
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingBlocks.length} pending review{pendingBlocks.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Left Panel - Input & Navigation */}
        <div className="w-1/3 bg-white border-r">
          {/* Tab Navigation */}
          <div className="border-b">
            {[
              { key: 'input', label: 'Add Content', icon: Plus },
              { key: 'blocks', label: `Blocks (${acceptedBlocks.length})`, icon: Brain },
              { key: 'context', label: `Context (${substrate.contextItems.length})`, icon: Eye },
              { key: 'documents', label: `Docs (${substrate.documents.length})`, icon: FileText }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="inline w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {processingStatus && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 text-sm">
                {processingStatus}
              </div>
            )}

            {/* Input Tab */}
            {activeTab === 'input' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Thinking Partner</h2>
                <p className="text-sm text-gray-600">
                  Share your thoughts, paste content, or upload files...
                </p>
                
                <div className="space-y-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your research content, notes, or paste documents..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Press Cmd/Ctrl+Enter to add
                    </div>
                    
                    <button
                      onClick={handleAddContent}
                      disabled={!input.trim() || loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Add to Research
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Blocks Tab */}
            {activeTab === 'blocks' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Blocks</h2>
                
                {pendingBlocks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-orange-600">Pending Review ({pendingBlocks.length})</h3>
                    {pendingBlocks.map(block => (
                      <div key={block.id} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <h4 className="font-medium text-sm">{block.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{block.body_md.slice(0, 100)}...</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleBlockAction(block.id, 'approve')}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleBlockAction(block.id, 'reject')}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-green-600">Accepted ({acceptedBlocks.length})</h3>
                  {acceptedBlocks.map(block => (
                    <div key={block.id} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h4 className="font-medium text-sm">{block.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{block.body_md.slice(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context Tab */}
            {activeTab === 'context' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Context Items</h2>
                {substrate.contextItems.map(item => (
                  <div key={item.id} className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mt-2 inline-block">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Documents</h2>
                {substrate.documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <h4 className="font-medium text-sm">{doc.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{doc.content.slice(0, 100)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Content Display */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Raw Dumps ({substrate.rawDumps.length})</h2>
            </div>
            
            {substrate.rawDumps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No content yet. Use Thinking Partner to add research.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-screen overflow-y-auto">
                {substrate.rawDumps.map((dump) => (
                  <div key={dump.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {new Date(dump.created_at).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleProcessRawDump(dump.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded hover:bg-purple-200 disabled:opacity-50"
                      >
                        <Brain className="w-3 h-3" />
                        Process Substrate
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {dump.body_md}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}