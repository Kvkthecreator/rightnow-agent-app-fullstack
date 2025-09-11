"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithToken } from '@/lib/fetchWithToken';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { DocumentCreateButton } from '@/components/documents/DocumentCreateButton';
import { PenTool } from 'lucide-react';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';
import { useReflectionNotifications } from '@/lib/hooks/useReflectionNotifications';
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
              Refresh insights
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
              Memory Insights
              <span className="text-sm font-normal text-gray-500">
                {reflections.length} {reflections.length === 1 ? 'insight' : 'insights'}
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600">AI-discovered patterns and connections in your knowledge</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add some content to your knowledge base and insights will automatically be discovered.
                </p>
                <Button
                  onClick={refreshReflections}
                  variant="outline"
                  size="sm"
                  className="mx-auto"
                >
                  🔄 Check for Insights
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
                            Insight #{reflections.length - index}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Found {formatComputationTime(reflection.computation_timestamp)}
                          </p>
                        </div>
                      </div>
                      {reflection.meta?.substrate_dump_count && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          From {reflection.meta.substrate_dump_count} sources
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
                      View All {reflections.length} Insights
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