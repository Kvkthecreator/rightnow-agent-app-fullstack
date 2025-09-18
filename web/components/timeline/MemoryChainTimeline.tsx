"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import type { TimelineEventDTO } from "@/shared/contracts/timeline";

let dayjsRef: any;

interface MemoryChainTimelineProps {
  basketId: string;
  className?: string;
}

// Group events into processing chains
interface ProcessingChain {
  id: string;
  rootDumpId: string;
  startTime: string;
  events: TimelineEventDTO[];
  outcomes: {
    meanings: number;
    knowledgeBlocks: number;
    connections: number;
    reflections: number;
    documents: number;
  };
  status: 'processing' | 'completed' | 'failed';
}

export default function MemoryChainTimeline({ basketId, className = "" }: MemoryChainTimelineProps) {
  const [chains, setChains] = useState<ProcessingChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  if (!dayjsRef) {
    const d = require("dayjs");
    d.extend(require("dayjs/plugin/relativeTime"));
    dayjsRef = d;
  }

  useEffect(() => {
    loadEvents();
  }, [basketId]);

  async function loadEvents() {
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/timeline?limit=200`);
      if (!response.ok) throw new Error("Failed to load timeline");
      
      const data: any = await response.json();
      const events = mapApiResponse(data.items || []);
      
      // Group events into processing chains
      const chainMap = new Map<string, ProcessingChain>();
      
      events.forEach(event => {
        // Find or create chain based on dump/queue relationships
        let chainId = findChainId(event, events);
        
        if (!chainMap.has(chainId)) {
          chainMap.set(chainId, {
            id: chainId,
            rootDumpId: chainId,
            startTime: event.created_at,
            events: [],
            outcomes: {
              meanings: 0,
              knowledgeBlocks: 0,
              connections: 0,
              reflections: 0,
              documents: 0
            },
            status: 'processing'
          });
        }
        
        const chain = chainMap.get(chainId)!;
        chain.events.push(event);
        
        // Update outcomes
        if (event.event_type === 'block.created') chain.outcomes.knowledgeBlocks++;
        if (event.event_type === 'context_item.created') chain.outcomes.meanings++;
        if (event.event_type === 'relationship.created') chain.outcomes.connections++;
        if (event.event_type === 'reflection.computed') chain.outcomes.reflections++;
        if (event.event_type === 'document.created') chain.outcomes.documents++;
        
        // Update status
        if (event.event_type === 'queue.processing_completed') chain.status = 'completed';
        if (event.event_type === 'queue.processing_failed') chain.status = 'failed';
      });
      
      // Sort chains by recency and convert to array
      const sortedChains = Array.from(chainMap.values())
        .sort((a, b) => dayjsRef(b.startTime).valueOf() - dayjsRef(a.startTime).valueOf());
      
      setChains(sortedChains);
    } catch (err) {
      console.error("Timeline error:", err);
    } finally {
      setLoading(false);
    }
  }

  function mapApiResponse(items: any[]): TimelineEventDTO[] {
    return items.map(item => ({
      id: item.id || crypto.randomUUID(),
      basket_id: basketId,
      event_type: item.type || item.event_type || 'unknown',
      event_data: item.payload || {},
      created_at: item.ts || item.created_at || new Date().toISOString(),
      description: item.summary || item.description,
      processing_agent: item.processing_agent,
      agent_confidence: item.agent_confidence
    }));
  }

  function findChainId(event: TimelineEventDTO, allEvents: TimelineEventDTO[]): string {
    // Logic to find which processing chain this event belongs to
    if (event.event_type === 'dump.created') {
      return event.id;
    }
    
    // Look for related dump via queue_id or ref_id
    const queueId = event.event_data?.queue_id;
    const dumpId = event.event_data?.dump_id || event.event_data?.ref_id;
    
    if (dumpId && typeof dumpId === 'string') return dumpId;
    if (queueId && typeof queueId === 'string') {
      const relatedEvent = allEvents.find(e => 
        e.event_data?.queue_id === queueId && 
        e.event_data?.dump_id && 
        typeof e.event_data.dump_id === 'string'
      );
      if (relatedEvent && typeof relatedEvent.event_data.dump_id === 'string') {
        return relatedEvent.event_data.dump_id;
      }
    }
    
    return event.id; // Fallback to self
  }

  function toggleChain(chainId: string) {
    setExpandedChains(prev => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  }

  function getPipelineStage(eventType: string): string {
    if (eventType.startsWith('dump')) return 'P0';
    if (eventType.includes('block') || eventType.includes('context')) return 'P1';
    if (eventType.includes('relationship')) return 'P2';
    if (eventType.includes('reflection')) return 'P3';
    if (eventType.includes('document')) return 'P4';
    return 'Queue';
  }

  function getChainSummary(chain: ProcessingChain): string {
    const total = Object.values(chain.outcomes).reduce((a, b) => a + b, 0);
    if (total === 0) return "Processing memory...";
    
    const parts = [];
    if (chain.outcomes.meanings > 0) parts.push(`${chain.outcomes.meanings} meanings`);
    if (chain.outcomes.knowledgeBlocks > 0) parts.push(`${chain.outcomes.knowledgeBlocks} knowledge blocks`);
    if (chain.outcomes.connections > 0) parts.push(`${chain.outcomes.connections} connections`);
    if (chain.outcomes.reflections > 0) parts.push(`${chain.outcomes.reflections} reflections`);
    if (chain.outcomes.documents > 0) parts.push(`${chain.outcomes.documents} documents`);
    
    return parts.join(', ') || "Memory captured";
  }

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-pulse">Loading memory chains...</div>
      </div>
    );
  }

  if (chains.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">🧠</div>
        <p className="text-sm font-medium text-gray-600">No memories processed yet</p>
        <p className="text-xs text-gray-500">Add memories to watch intelligence emerge</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {chains.map(chain => {
        const isExpanded = expandedChains.has(chain.id);
        const hasOutcomes = Object.values(chain.outcomes).some(v => v > 0);
        
        return (
          <div key={chain.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Chain Header */}
            <button
              onClick={() => toggleChain(chain.id)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className={`w-2 h-2 rounded-full ${
                    chain.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    chain.status === 'completed' ? 'bg-green-500' :
                    'bg-red-500'
                  }`} />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Memory from {dayjsRef(chain.startTime).fromNow()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {getChainSummary(chain)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Pipeline Progress */}
                  {hasOutcomes && (
                    <div className="flex items-center gap-1">
                      {['P0', 'P1', 'P2', 'P3', 'P4'].map(stage => {
                        const hasEvents = chain.events.some(e => 
                          getPipelineStage(e.event_type) === stage
                        );
                        return (
                          <div
                            key={stage}
                            className={`w-8 h-1 rounded ${
                              hasEvents ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                            title={stage}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <span className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>
            </button>
            
            {/* Expanded Chain Details */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                <div className="p-4 space-y-3">
                  {/* Outcome Summary */}
                  {hasOutcomes && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                      {chain.outcomes.meanings > 0 && (
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-semibold text-blue-600">{chain.outcomes.meanings}</div>
                          <div className="text-xs text-gray-600">Meanings</div>
                        </div>
                      )}
                      {chain.outcomes.knowledgeBlocks > 0 && (
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-lg font-semibold text-orange-600">{chain.outcomes.knowledgeBlocks}</div>
                          <div className="text-xs text-gray-600">Knowledge Blocks</div>
                        </div>
                      )}
                      {chain.outcomes.connections > 0 && (
                        <div className="text-center p-2 bg-cyan-50 rounded">
                          <div className="text-lg font-semibold text-cyan-600">{chain.outcomes.connections}</div>
                          <div className="text-xs text-gray-600">Connections</div>
                        </div>
                      )}
                      {chain.outcomes.reflections > 0 && (
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-lg font-semibold text-purple-600">{chain.outcomes.reflections}</div>
                          <div className="text-xs text-gray-600">Reflections</div>
                        </div>
                      )}
                      {chain.outcomes.documents > 0 && (
                        <div className="text-center p-2 bg-indigo-50 rounded">
                          <div className="text-lg font-semibold text-indigo-600">{chain.outcomes.documents}</div>
                          <div className="text-xs text-gray-600">Documents</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Event Timeline */}
                  <div className="space-y-2">
                    {chain.events.map((event, idx) => {
                      const stage = getPipelineStage(event.event_type);
                      
                      return (
                        <div key={event.id} className="flex items-start gap-3 text-xs">
                          <div className={`font-mono ${
                            stage === 'P0' ? 'text-blue-600' :
                            stage === 'P1' ? 'text-orange-600' :
                            stage === 'P2' ? 'text-cyan-600' :
                            stage === 'P3' ? 'text-purple-600' :
                            stage === 'P4' ? 'text-indigo-600' :
                            'text-gray-600'
                          }`}>
                            {stage}
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-700">
                              {event.event_type.replace(/[._]/g, ' ')}
                            </span>
                            {event.processing_agent && (
                              <span className="text-gray-500 ml-1">
                                • {event.processing_agent}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400">
                            {dayjsRef(event.created_at).format('HH:mm:ss')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}