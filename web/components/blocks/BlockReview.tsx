'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Block {
  id: string;
  content: string;
  state: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'LOCKED';
  semantic_type: string;
  created_by_agent: boolean;
  agent_source?: string;
  created_at: string;
  basket_id: string;
  workspace_id: string;
}

interface BlockReviewProps {
  basketId: string;
}

export function BlockReview({ basketId }: BlockReviewProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBlock, setProcessingBlock] = useState<string | null>(null);

  useEffect(() => {
    fetchProposedBlocks();
  }, [basketId]);

  const fetchProposedBlocks = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('basket_id', basketId)
        .eq('state', 'PROPOSED')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching proposed blocks:', error);
        return;
      }

      setBlocks(data || []);
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (blockId: string) => {
    setProcessingBlock(blockId);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Update block state to ACCEPTED
      const { error } = await supabase
        .from('blocks')
        .update({ 
          state: 'ACCEPTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) {
        console.error('Error accepting block:', error);
        return;
      }

      // Log acceptance event
      await supabase
        .from('events')
        .insert({
          basket_id: basketId,
          type: 'block_accepted',
          data: {
            block_id: blockId,
            previous_state: 'PROPOSED',
            new_state: 'ACCEPTED'
          }
        });

      // Refresh the blocks list
      await fetchProposedBlocks();
    } catch (error) {
      console.error('Failed to accept block:', error);
    } finally {
      setProcessingBlock(null);
    }
  };

  const handleReject = async (blockId: string) => {
    setProcessingBlock(blockId);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Update block state to REJECTED
      const { error } = await supabase
        .from('blocks')
        .update({ 
          state: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) {
        console.error('Error rejecting block:', error);
        return;
      }

      // Log rejection event
      await supabase
        .from('events')
        .insert({
          basket_id: basketId,
          type: 'block_rejected',
          data: {
            block_id: blockId,
            previous_state: 'PROPOSED',
            new_state: 'REJECTED'
          }
        });

      // Refresh the blocks list
      await fetchProposedBlocks();
    } catch (error) {
      console.error('Failed to reject block:', error);
    } finally {
      setProcessingBlock(null);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'PROPOSED': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'LOCKED': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading proposed blocks...</span>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Blocks Pending Review</h3>
        <p className="text-gray-600">
          Agent-proposed blocks will appear here for your review and approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Blocks Pending Review ({blocks.length})
        </h3>
        <Button 
          onClick={fetchProposedBlocks}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <Badge className={`px-2 py-1 text-xs font-medium rounded-full border ${getStateColor(block.state)}`}>
                  {block.semantic_type || 'Unknown Type'}
                </Badge>
                <Badge className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs border border-yellow-300">
                  {block.state}
                </Badge>
              </div>
              {block.agent_source && (
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="mr-1">🤖</span>
                  Created by {block.agent_source}
                </div>
              )}
            </div>

            <div className="mb-3">
              <p className="text-gray-700 leading-relaxed">
                {block.content.length > 300 
                  ? `${block.content.slice(0, 300)}...` 
                  : block.content
                }
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Created {formatDate(block.created_at)}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAccept(block.id)}
                  disabled={processingBlock === block.id}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  {processingBlock === block.id ? 'Accepting...' : 'Accept'}
                </Button>
                <Button
                  onClick={() => handleReject(block.id)}
                  disabled={processingBlock === block.id}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
                >
                  {processingBlock === block.id ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>

            {block.content.length > 300 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  Show full content
                </summary>
                <p className="mt-2 text-gray-700 leading-relaxed">
                  {block.content}
                </p>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Review and approve AI-generated blocks to include them in your documents.
        </p>
      </div>
    </div>
  );
}