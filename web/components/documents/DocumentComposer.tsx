'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AgentAttribution } from '@/components/ui/AgentAttribution';

interface Block {
  id: string;
  content: string;
  state: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'LOCKED';
  semantic_type: string;
  created_by_agent: boolean;
  agent_source?: string;
  created_at: string;
  confidence?: number;
  basket_id: string;
}

interface DocumentComposerProps {
  basketId: string;
  onDocumentCreated?: (documentId: string) => void;
}

export function DocumentComposer({ basketId, onDocumentCreated }: DocumentComposerProps) {
  const [acceptedBlocks, setAcceptedBlocks] = useState<Block[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [narrative, setNarrative] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAcceptedBlocks();
  }, [basketId]);

  const fetchAcceptedBlocks = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('basket_id', basketId)
        .eq('state', 'ACCEPTED')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching accepted blocks:', error);
        return;
      }

      setAcceptedBlocks(data || []);
    } catch (error) {
      console.error('Failed to fetch accepted blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlocks(prev =>
      prev.includes(blockId)
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const createDocument = async () => {
    if (selectedBlocks.length === 0 || !title.trim()) {
      return;
    }

    setCreating(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Get selected block data for composition
      const selectedBlockData = acceptedBlocks.filter(block => 
        selectedBlocks.includes(block.id)
      );

      // Create document content structure
      const documentContent = {
        blocks: selectedBlockData.map(block => ({
          id: block.id,
          content: block.content,
          semantic_type: block.semantic_type,
          agent_source: block.agent_source
        })),
        narrative,
        composition_type: 'block_based',
        created_at: new Date().toISOString()
      };

      // Create the document
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          basket_id: basketId,
          title: title.trim(),
          content: JSON.stringify(documentContent),
          metadata: {
            block_count: selectedBlocks.length,
            composition_method: 'user_selected',
            narrative_length: narrative.length
          }
        })
        .select()
        .single();

      if (documentError) {
        console.error('Error creating document:', documentError);
        return;
      }

      // Log document creation event
      await supabase
        .from('events')
        .insert({
          basket_id: basketId,
          type: 'document_composed',
          data: {
            document_id: documentData.id,
            block_ids: selectedBlocks,
            block_count: selectedBlocks.length,
            composition_method: 'user_selected'
          }
        });

      // Update blocks to LOCKED state (they're now used in a document)
      await supabase
        .from('blocks')
        .update({ state: 'LOCKED' })
        .in('id', selectedBlocks);

      // Reset form
      setSelectedBlocks([]);
      setNarrative('');
      setTitle('');
      
      // Refresh blocks to show new states
      await fetchAcceptedBlocks();

      if (onDocumentCreated && documentData.id) {
        onDocumentCreated(documentData.id);
      }

    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setCreating(false);
    }
  };

  const getBlockPreview = (content: string, maxLength = 100) => {
    return content.length > maxLength 
      ? `${content.slice(0, maxLength)}...`
      : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading accepted blocks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4">
          Create Document from Accepted Blocks
        </h3>
        
        {acceptedBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No accepted blocks available.</p>
            <p className="text-sm mt-1">Review and accept some AI-proposed blocks first.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document title..."
              />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">
                Available Blocks ({acceptedBlocks.length})
              </h4>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {acceptedBlocks.map((block) => (
                  <div 
                    key={block.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedBlocks.includes(block.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleBlockSelection(block.id)}
                  >
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBlocks.includes(block.id)}
                        onChange={() => toggleBlockSelection(block.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 text-xs rounded-full">
                            {block.semantic_type || 'Content Block'}
                          </Badge>
                          <Badge className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs rounded-full">
                            ACCEPTED
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">
                          {getBlockPreview(block.content)}
                        </p>
                        <AgentAttribution
                          agentSource={block.agent_source}
                          createdByAgent={block.created_by_agent}
                          confidence={block.confidence}
                          timestamp={block.created_at}
                        />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narrative Context
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add narrative context to connect your selected blocks. This will help readers understand how the blocks relate to each other..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Add context, transitions, or explanations that will weave your blocks together.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedBlocks.length} block{selectedBlocks.length !== 1 ? 's' : ''} selected
              </div>
              
              <Button
                onClick={createDocument}
                disabled={selectedBlocks.length === 0 || !title.trim() || creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating 
                  ? 'Creating Document...' 
                  : `Create Document from ${selectedBlocks.length} Block${selectedBlocks.length !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}