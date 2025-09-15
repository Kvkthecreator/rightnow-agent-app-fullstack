"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { DocumentCreateButton } from '@/components/documents/DocumentCreateButton';
import { PenTool, TrendingUp, Target } from 'lucide-react';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';
import { useReflectionNotifications } from '@/lib/hooks/useReflectionNotifications';
import { useBasket } from '@/contexts/BasketContext';
import type { GetReflectionsResponse, ReflectionDTO } from '@/shared/contracts/reflections';

interface Props {
  basketId: string;
  needsOnboarding?: boolean;
}

export default function MemoryClient({ basketId, needsOnboarding }: Props) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [reflections, setReflections] = useState<ReflectionDTO[]>([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(true);
  const [reflectionsError, setReflectionsError] = useState<string | null>(null);
  const router = useRouter();
  
  // Get basket maturity data for adaptive content
  const { maturity, maturityGuidance, stats } = useBasket();
  const refreshDocuments = () => {
    // Prefer soft refresh to avoid jarring redirects
    try { router.refresh(); } catch {}
  };

  // Load reflections from API
  async function loadReflections() {
    try {
      setReflectionsLoading(true);
      setReflectionsError(null);
      
      const url = new URL(`/api/baskets/${basketId}/reflections`, window.location.origin);
      url.searchParams.set("limit", "5"); // Show recent 5 in memory view
      
      const response = await fetchWithToken(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load reflections");
      }

      const data: GetReflectionsResponse = await response.json();
      setReflections(data.reflections);
    } catch (err) {
      setReflectionsError(err instanceof Error ? err.message : "Failed to load reflections");
    } finally {
      setReflectionsLoading(false);
    }
  }

  // Force refresh reflections (when user clicks refresh)
  async function refreshReflections() {
    try {
      await fetch('/api/reflections/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_id: basketId }),
      });
    } catch (err) {
      console.error('Failed to trigger reflection refresh:', err);
    }
    
    // Reload reflections after triggering
    setTimeout(loadReflections, 1000);
  }

  // Format computation time for display
  function formatComputationTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffHours * 60);
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)} hours ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} days ago`;
    }
  }

  // Human-readable knowledge growth helpers
  const getGrowthStage = (level: number, phase: string): string => {
    switch (level) {
      case 1: return 'Building foundation';
      case 2: return 'Growing connections';
      case 3: return 'Rich knowledge base';
      case 4: return 'Comprehensive understanding';
      default: return phase;
    }
  };

  const getKnowledgeDescription = (maturity: any, stats: any): string => {
    if (!stats) return 'Building your knowledge base';
    
    const totalMemories = maturity.substrateDensity || 0;
    const categories = Object.values(stats).filter(count => (count as number) > 0).length;
    
    if (totalMemories === 0) return 'Ready to capture your first thoughts';
    if (totalMemories < 10) return `${totalMemories} memories captured so far`;
    if (categories <= 1) return `${totalMemories} memories in ${categories} area`;
    
    return `${totalMemories} memories spanning ${categories} different areas`;
  };

  const getProgressLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Building your foundation';
      case 2: return 'Growing your knowledge';
      case 3: return 'Enriching connections';
      default: return 'Expanding understanding';
    }
  };

  const getGrowthMessage = (maturity: any): string => {
    const remaining = maturity.nextLevelAt - maturity.score;
    const nextStage = getGrowthStage(maturity.level + 1, '');
    
    if (remaining <= 5) {
      return `Almost ready for ${nextStage.toLowerCase()} stage!`;
    }
    if (remaining <= 15) {
      return `Getting closer to ${nextStage.toLowerCase()} stage`;
    }
    return `Add ${remaining} more thoughts to reach ${nextStage.toLowerCase()} stage`;
  };

  const humanizeGuidanceStep = (step: string): string => {
    return step
      .replace(/substrate/gi, 'content')
      .replace(/dump/gi, 'memory')
      .replace(/context item/gi, 'note')
      .replace(/building block/gi, 'knowledge piece')
      .replace(/ontology/gi, 'topic structure')
      .replace(/vector/gi, 'similarity')
      .replace(/embedding/gi, 'connection');
  };

  // Load reflections on mount
  useEffect(() => {
    loadReflections();
  }, [basketId]);

  // Micro-reflection notifications for this basket
  useReflectionNotifications(basketId);

  return (
    <div className="space-y-6">
      
      <SubpageHeader
        title="Your Memory"
        basketId={basketId}
        description="Capture thoughts and create documents to organize your knowledge"
        rightContent={
          <div className="flex items-center gap-3">
            <DocumentCreateButton basketId={basketId} />
            <Button
              onClick={refreshReflections}
              variant="ghost"
              size="sm"
              className="text-sm"
            >
              Find new patterns
            </Button>
            <Button
              onClick={() => setShowAddMemory(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Add Memory
            </Button>
          </div>
        }
      />

      {needsOnboarding && (
        <OnboardingPanel 
          basketId={basketId}
          onComplete={() => window.location.reload()}
        />
      )}
      
      <div className="space-y-6">
        
        {/* Knowledge Base Growth */}
        {maturity && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Your Knowledge Growth
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  maturity.level === 1 ? 'bg-orange-100 text-orange-700' :
                  maturity.level === 2 ? 'bg-yellow-100 text-yellow-700' :
                  maturity.level === 3 ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {getGrowthStage(maturity.level, maturity.phase)}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {getKnowledgeDescription(maturity, stats)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Growth Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{getProgressLabel(maturity.level)}</span>
                    <span className="font-medium">{Math.round(maturity.progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${maturity.progressPercent}%` }}
                    ></div>
                  </div>
                  {maturity.nextLevelAt && (
                    <div className="text-xs text-gray-500">
                      {getGrowthMessage(maturity)}
                      {maturity.varietyBonus && ' 🌟 Great variety in your knowledge!'}
                    </div>
                  )}
                </div>
                
                {/* What's Next */}
                {maturityGuidance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">What to focus on next</span>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {maturityGuidance.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{humanizeGuidanceStep(step)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsList basketId={basketId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Patterns I've Found
              <span className="text-sm font-normal text-gray-500">
                {reflections.length} {reflections.length === 1 ? 'discovery' : 'discoveries'}
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {maturityGuidance?.memoryInsightsMessage || "Interesting connections I've discovered in your thoughts"}
            </p>
          </CardHeader>
          <CardContent>
            {reflectionsLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
                <div className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
                <div className="animate-pulse bg-gray-100 h-28 rounded-lg"></div>
              </div>
            ) : reflectionsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                  <span>⚠️</span>
                  <span>Failed to load insights</span>
                </div>
                <p className="text-red-700 text-sm">{reflectionsError}</p>
                <button
                  onClick={loadReflections}
                  className="mt-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : reflections.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤔</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  As you add more thoughts and ideas, I'll start finding interesting connections for you.
                </p>
                <Button
                  onClick={refreshReflections}
                  variant="outline"
                  size="sm"
                  className="mx-auto"
                >
                  🔍 Look for Patterns
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reflections.slice(0, 3).map((reflection, index) => (
                  <div key={reflection.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Pattern #{reflections.length - index}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Discovered {formatComputationTime(reflection.computation_timestamp)}
                          </p>
                        </div>
                      </div>
                      {reflection.meta?.substrate_dump_count && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          From {reflection.meta.substrate_dump_count} of your thoughts
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {reflection.reflection_text.length > 300 
                        ? reflection.reflection_text.substring(0, 300) + "..."
                        : reflection.reflection_text
                      }
                    </div>
                  </div>
                ))}
                
                {reflections.length > 3 && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => router.push(`/baskets/${basketId}/reflections`)}
                      variant="outline"
                      size="sm"
                    >
                      View All {reflections.length} Patterns
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={() => {
          setShowAddMemory(false);
          refreshDocuments();
        }}
      />
    </div>
  );
}