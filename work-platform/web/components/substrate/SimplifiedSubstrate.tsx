// EMERGENCY FIX - Simple working substrate component
// Direct Supabase queries, no abstractions

"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';
import { Send, FileText, Loader2 } from 'lucide-react';

interface SimplifiedSubstrateProps {
  basketId: string;
}

interface RawDump {
  id: string;
  body_md: string;
  created_at: string;
  workspace_id: string;
}

export function SimplifiedSubstrate({ basketId }: SimplifiedSubstrateProps) {
  const [rawDumps, setRawDumps] = useState<RawDump[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createBrowserClient();

  // Direct query - no abstractions
  useEffect(() => {
    const loadRawDumps = async () => {
      try {
        const { data, error } = await supabase
          .from('raw_dumps')
          .select('id, body_md, created_at, workspace_id')
          .eq('basket_id', basketId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setRawDumps(data || []);
      } catch (err) {
        console.error('Failed to load raw dumps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    };

    loadRawDumps();
  }, [basketId, supabase]);

  // Direct insert - no composers
  const handleAdd = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('raw_dumps')
        .insert({ 
          basket_id: basketId,
          body_md: input,
          workspace_id: 'default'
        })
        .select('id, body_md, created_at, workspace_id')
        .single();
      
      if (error) throw error;
      
      if (data) {
        setRawDumps([data, ...rawDumps]);
        setInput('');
      }
    } catch (err) {
      console.error('Failed to add raw dump:', err);
      setError(err instanceof Error ? err.message : 'Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Substrate</h1>
            <p className="text-gray-600">Raw Dumps: {rawDumps.length}</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Input Panel */}
        <div className="w-1/2 p-6 bg-white border-r">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add Content</h2>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your research content, notes, or paste documents..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Press Cmd/Ctrl+Enter to add
                </div>
                
                <button
                  onClick={handleAdd}
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
                      Add Content
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Content ({rawDumps.length})</h2>
            
            {rawDumps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No content yet. Add some research to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-screen overflow-y-auto">
                {rawDumps.map((dump) => (
                  <div key={dump.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(dump.created_at).toLocaleString()}
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