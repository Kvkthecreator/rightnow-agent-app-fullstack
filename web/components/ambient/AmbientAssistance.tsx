"use client";

import { useState, useEffect, useCallback } from "react";
import { GentleNotification } from "./GentleNotification";
import { AmbientUpdate } from "./AmbientUpdate";
import { useMemoryInsights } from "@/lib/intelligence/useMemoryInsights";
import { useDocumentIntelligence } from "@/lib/intelligence/useDocumentIntelligence";
import { useRevelationTiming } from "@/lib/ambient/revelationChoreographer";

interface AmbientAssistanceProps {
  userActivity: 'active_work' | 'exploring' | 'paused' | 'idle';
  revelationStrategy: 'wait' | 'gentle_notification' | 'immediate' | 'ambient_update';
  view: string;
  basketId?: string;
}

interface PendingRevelation {
  id: string;
  type: 'insight' | 'connection' | 'suggestion' | 'progress';
  content: any;
  priority: 'high' | 'medium' | 'low';
  timing: number;
}

export function AmbientAssistance({ 
  userActivity, 
  revelationStrategy,
  view,
  basketId 
}: AmbientAssistanceProps) {
  const [pendingRevelations, setPendingRevelations] = useState<PendingRevelation[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);
  
  const memoryInsights = useMemoryInsights(basketId || '');
  const documentIntelligence = useDocumentIntelligence(basketId || '');
  const revelationTiming = useRevelationTiming(userActivity);

  // Process new insights based on user activity
  useEffect(() => {
    // Mock insights for now - in production this would use actual data
    const mockInsights = basketId ? [
      {
        id: `insight-${Date.now()}`,
        type: 'insight' as const,
        message: 'I\'m learning from your work patterns',
        confidence: 0.7,
        relevance: 0.8,
        urgency: 0.3
      }
    ] : [];

    mockInsights.forEach(insight => {
      if (!pendingRevelations.find(r => r.id === insight.id)) {
        const revelation: PendingRevelation = {
          id: insight.id,
          type: 'insight',
          content: insight,
          priority: determinePriority(insight),
          timing: revelationTiming.calculateTiming(insight, userActivity)
        };

        if (shouldReveal(revelation, revelationStrategy)) {
          scheduleRevelation(revelation);
        }
      }
    });
  }, [basketId, userActivity, revelationStrategy]);

  const determinePriority = (insight: any): 'high' | 'medium' | 'low' => {
    if (insight.confidence > 0.9 || insight.relevance > 0.9) return 'high';
    if (insight.confidence > 0.7 || insight.relevance > 0.7) return 'medium';
    return 'low';
  };

  const shouldReveal = (revelation: PendingRevelation, strategy: string): boolean => {
    // Don't reveal during active work unless high priority
    if (strategy === 'wait' && revelation.priority !== 'high') {
      return false;
    }
    
    // Respect user's focus
    if (userActivity === 'active_work' && revelation.priority === 'low') {
      return false;
    }
    
    return true;
  };

  const scheduleRevelation = useCallback((revelation: PendingRevelation) => {
    setPendingRevelations(prev => [...prev, revelation]);
    
    setTimeout(() => {
      revealInsight(revelation);
    }, revelation.timing);
  }, []);

  const revealInsight = useCallback((revelation: PendingRevelation) => {
    if (revelationStrategy === 'immediate' || revelation.priority === 'high') {
      setActiveNotifications(prev => [...prev, revelation.id]);
    } else if (revelationStrategy === 'gentle_notification') {
      // Gentle reveal for medium priority
      setActiveNotifications(prev => [...prev, revelation.id]);
    }
    
    // Remove from pending after reveal
    setPendingRevelations(prev => prev.filter(r => r.id !== revelation.id));
  }, [revelationStrategy]);

  const dismissNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(nId => nId !== id));
  }, []);

  // Don't show anything during deep focus
  if (userActivity === 'active_work' && revelationStrategy === 'wait') {
    return null;
  }

  return (
    <div className="ambient-assistance pointer-events-none fixed inset-0 z-40">
      {/* Gentle Notifications Layer */}
      <div className="absolute top-4 right-4 space-y-2 pointer-events-auto">
        {activeNotifications
          .filter(id => {
            const revelation = pendingRevelations.find(r => r.id === id);
            return revelation && revelation.priority !== 'low';
          })
          .map(id => {
            const revelation = pendingRevelations.find(r => r.id === id);
            
            if (!revelation) return null;
            
            return (
              <GentleNotification
                key={id}
                id={id}
                type={revelation.type}
                content={revelation.content}
                onDismiss={dismissNotification}
                autoHide={revelation.priority === 'low'}
                duration={revelation.priority === 'high' ? 10000 : 5000}
              />
            );
          })}
      </div>

      {/* Ambient Updates Layer */}
      {revelationStrategy === 'ambient_update' && (
        <div className="absolute bottom-4 left-80 right-80 pointer-events-auto">
          <AmbientUpdate
            updates={pendingRevelations.filter(r => r.priority === 'low')}
            view={view}
          />
        </div>
      )}

      {/* Progress Indicators */}
      {basketId && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-background/90 backdrop-blur border rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <span>Learning from your work...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}