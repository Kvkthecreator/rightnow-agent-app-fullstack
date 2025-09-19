"use client";

import { useState, useEffect } from "react";
import { fetchWithToken } from "@/lib/fetchWithToken";
import type { TimelineEventDTO } from "@/shared/contracts/timeline";
import { FileText, Upload, Tag, Brain, Link2, FileCheck, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

let dayjsRef: any;

interface ProcessingStoryTimelineProps {
  basketId: string;
  className?: string;
}

// Group related events into user stories
interface ProcessingStory {
  id: string;
  triggerEvent: TimelineEventDTO;
  processingEvents: TimelineEventDTO[];
  outcomeEvents: TimelineEventDTO[];
  status: 'processing' | 'completed' | 'failed';
  startTime: string;
  summary: string;
}

// Translate technical events to user language
const EVENT_TRANSLATIONS: Record<string, { label: string; icon: any; color: string }> = {
  'dump.created': { label: 'Added', icon: Upload, color: 'text-blue-600' },
  'dump.queued': { label: 'Processing', icon: Clock, color: 'text-yellow-600' },
  'block.created': { label: 'Found insight', icon: Brain, color: 'text-purple-600' },
  'context_item.created': { label: 'Tagged concept', icon: Tag, color: 'text-green-600' },
  'relationship.created': { label: 'Connected ideas', icon: Link2, color: 'text-cyan-600' },
  'reflection.computed': { label: 'Generated reflection', icon: Brain, color: 'text-purple-600' },
  'document.created': { label: 'Created document', icon: FileText, color: 'text-indigo-600' },
  'queue.processing_started': { label: 'AI started working', icon: Clock, color: 'text-yellow-600' },
  'queue.processing_completed': { label: 'Finished processing', icon: FileCheck, color: 'text-green-600' },
  'queue.processing_failed': { label: 'Couldn\'t process', icon: AlertCircle, color: 'text-red-600' }
};

export default function ProcessingStoryTimeline({ basketId, className = "" }: ProcessingStoryTimelineProps) {
  const [stories, setStories] = useState<ProcessingStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  if (!dayjsRef) {
    const d = require("dayjs");
    d.extend(require("dayjs/plugin/relativeTime"));
    dayjsRef = d;
  }

  useEffect(() => {
    loadStories();
  }, [basketId]);

  async function loadStories() {
    try {
      const response = await fetchWithToken(`/api/baskets/${basketId}/timeline?limit=200`);
      if (!response.ok) throw new Error("Failed to load timeline");
      
      const data: any = await response.json();
      const events = mapApiResponse(data.items || []);
      
      // Group events into stories by user actions
      const storyMap = new Map<string, ProcessingStory>();
      
      // First pass: identify user trigger events
      events.forEach(event => {
        if (event.event_type === 'dump.created' || event.event_type === 'document.created') {
          storyMap.set(event.id, {
            id: event.id,
            triggerEvent: event,
            processingEvents: [],
            outcomeEvents: [],
            status: 'processing',
            startTime: event.created_at,
            summary: generateStorySummary(event)
          });
        }
      });
      
      // Second pass: associate related events within 5-minute windows
      events.forEach(event => {
        if (event.event_type !== 'dump.created' && event.event_type !== 'document.created') {
          // Find the closest trigger event within 5 minutes
          let closestStory: ProcessingStory | null = null;
          let closestTimeDiff = Infinity;
          
          storyMap.forEach(story => {
            const timeDiff = Math.abs(
              dayjsRef(event.created_at).diff(dayjsRef(story.startTime), 'second')
            );
            if (timeDiff < 300 && timeDiff < closestTimeDiff) { // 5 minutes
              closestTimeDiff = timeDiff;
              closestStory = story;
            }
          });
          
          if (closestStory) {
            if (event.event_type.includes('processing') || event.event_type.includes('queued')) {
              closestStory.processingEvents.push(event);
            } else {
              closestStory.outcomeEvents.push(event);
            }
            
            // Update status based on events
            if (event.event_type === 'queue.processing_completed') {
              closestStory.status = 'completed';
            } else if (event.event_type === 'queue.processing_failed') {
              closestStory.status = 'failed';
            }
          }
        }
      });
      
      // Sort stories by recency
      const sortedStories = Array.from(storyMap.values())
        .filter(story => story.triggerEvent) // Ensure we have a trigger
        .sort((a, b) => dayjsRef(b.startTime).valueOf() - dayjsRef(a.startTime).valueOf());
      
      setStories(sortedStories);
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

  function generateStorySummary(event: TimelineEventDTO): string {
    if (event.event_type === 'dump.created') {
      const fileName = event.event_data?.file_name || event.event_data?.title || 'content';
      return `You added "${fileName}"`;
    }
    if (event.event_type === 'document.created') {
      return 'You created a document';
    }
    return 'Processing your request';
  }

  function getEventTranslation(eventType: string) {
    return EVENT_TRANSLATIONS[eventType] || { 
      label: eventType.replace(/[._]/g, ' '), 
      icon: FileText, 
      color: 'text-gray-600' 
    };
  }

  function getOutcomeSummary(story: ProcessingStory): string {
    const outcomes = story.outcomeEvents.reduce((acc, event) => {
      if (event.event_type === 'block.created') acc.insights++;
      if (event.event_type === 'context_item.created') acc.concepts++;
      if (event.event_type === 'relationship.created') acc.connections++;
      if (event.event_type === 'reflection.computed') acc.reflections++;
      return acc;
    }, { insights: 0, concepts: 0, connections: 0, reflections: 0 });

    const parts = [];
    if (outcomes.insights > 0) parts.push(`${outcomes.insights} insight${outcomes.insights > 1 ? 's' : ''}`);
    if (outcomes.concepts > 0) parts.push(`${outcomes.concepts} concept${outcomes.concepts > 1 ? 's' : ''}`);
    if (outcomes.connections > 0) parts.push(`${outcomes.connections} connection${outcomes.connections > 1 ? 's' : ''}`);
    if (outcomes.reflections > 0) parts.push(`${outcomes.reflections} reflection${outcomes.reflections > 1 ? 's' : ''}`);

    if (parts.length === 0) {
      return story.status === 'processing' ? 'AI is working...' : 'Processing complete';
    }
    
    return `Found ${parts.join(', ')}`;
  }

  function toggleStory(storyId: string) {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-pulse">Loading your knowledge activity...</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">📚</div>
        <p className="text-sm font-medium text-gray-600">No activity yet</p>
        <p className="text-xs text-gray-500">Add content to see AI processing</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {stories.map(story => {
        const isExpanded = expandedStories.has(story.id);
        const triggerTranslation = getEventTranslation(story.triggerEvent.event_type);
        const TriggerIcon = triggerTranslation.icon;
        
        return (
          <div key={story.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Story Header */}
            <button
              onClick={() => toggleStory(story.id)}
              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className={`p-2 rounded-full ${
                    story.status === 'processing' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    story.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                    'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <TriggerIcon className={`w-4 h-4 ${triggerTranslation.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {story.summary}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dayjsRef(story.startTime).fromNow()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {getOutcomeSummary(story)}
                    </p>
                  </div>
                </div>
                
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} />
              </div>
            </button>
            
            {/* Expanded Story Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                <div className="space-y-3">
                  {/* Processing Steps */}
                  {story.processingEvents.length > 0 && (
                    <div className="pl-8 space-y-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">AI Processing:</p>
                      {story.processingEvents.map(event => {
                        const translation = getEventTranslation(event.event_type);
                        const EventIcon = translation.icon;
                        return (
                          <div key={event.id} className="flex items-center gap-2 text-xs">
                            <EventIcon className={`w-3 h-3 ${translation.color}`} />
                            <span className="text-gray-700 dark:text-gray-300">
                              {translation.label}
                              {event.agent_confidence && (
                                <span className="text-gray-500 ml-1">
                                  ({Math.round(event.agent_confidence * 100)}% confident)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Outcomes with Actions */}
                  {story.outcomeEvents.length > 0 && (
                    <div className="pl-8 space-y-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Results:</p>
                      {story.outcomeEvents.map(event => {
                        const translation = getEventTranslation(event.event_type);
                        const EventIcon = translation.icon;
                        const hasLink = event.event_type.includes('block') || 
                                       event.event_type.includes('context_item') ||
                                       event.event_type.includes('reflection') ||
                                       event.event_type.includes('document');
                        
                        return (
                          <div key={event.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <EventIcon className={`w-3 h-3 ${translation.color}`} />
                              <span className="text-gray-700 dark:text-gray-300">
                                {translation.label}: {event.description || translation.label}
                              </span>
                            </div>
                            {hasLink && event.event_data?.ref_id && (
                              <Link
                                href={`/baskets/${basketId}/${
                                  event.event_type.includes('block') ? 'building-blocks' :
                                  event.event_type.includes('context_item') ? 'building-blocks' :
                                  event.event_type.includes('reflection') ? 'reflections' :
                                  'documents'
                                }#${event.event_data.ref_id}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View →
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {story.status === 'failed' && (
                    <div className="pt-2 pl-8">
                      <Button size="sm" variant="outline" className="text-xs">
                        Retry Processing
                      </Button>
                    </div>
                  )}
                  
                  {story.status === 'completed' && story.outcomeEvents.length > 0 && (
                    <div className="pt-2 pl-8">
                      <Link href={`/baskets/${basketId}/building-blocks`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View All Results →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}