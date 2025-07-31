/**
 * Narrative Hook: Project Understanding
 * 
 * This hook provides user-facing project understanding through the narrative API layer.
 * It transforms technical analysis into human-centered insights and explanations.
 * 
 * CRITICAL: This hook must NEVER expose technical substrate vocabulary.
 * All data consumed and returned is in narrative, user-friendly format.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

// User-facing narrative interfaces
export interface ProjectUnderstanding {
  greeting: string;
  currentUnderstanding: string;
  intelligenceLevel: {
    stage: 'learning' | 'understanding' | 'insights' | 'deep_knowledge';
    description: string;
    progressIndicator: string;
    capabilities: string[];
  };
  confidence: {
    level: 'just_getting_started' | 'building_understanding' | 'solid_grasp' | 'comprehensive_knowledge';
    explanation: string;
    visualDescription: string;
  };
  themes: Array<{
    name: string;
    description: string;
    relevance: 'central' | 'supporting' | 'emerging';
    explanation: string;
  }>;
  nextSteps: string[];
  recommendedActions: string[];
}

export interface ProjectInsight {
  insight: string;
  supportingEvidence: string[];
  actionableAdvice: string;
  relatedThemes: string[];
}

export interface LearningProgress {
  currentStage: string;
  progressDescription: string;
  recentDiscoveries: string[];
  nextLearningOpportunities: string[];
  memoryGrowth: string;
}

interface UseProjectUnderstandingOptions {
  includeInsights?: boolean;
  includeProgress?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  userContext?: {
    name?: string;
    projectType?: string;
  };
}

interface UseProjectUnderstandingResult {
  // Core understanding data
  understanding: ProjectUnderstanding | null;
  insights: ProjectInsight[] | null;
  learningProgress: LearningProgress | null;
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshUnderstanding: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Status indicators
  isReady: boolean;
  processingTime: string | null;
  intelligenceLevel: string | null;
}

/**
 * Hook for accessing narrative project understanding
 * 
 * Provides user-friendly AI understanding of the project with narrative language.
 * Automatically manages caching, refreshing, and error handling.
 */
export function useProjectUnderstanding(
  basketId: string,
  options: UseProjectUnderstandingOptions = {}
): UseProjectUnderstandingResult {
  const { user } = useAuth();
  const [understanding, setUnderstanding] = useState<ProjectUnderstanding | null>(null);
  const [insights, setInsights] = useState<ProjectInsight[] | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [processingTime, setProcessingTime] = useState<string | null>(null);
  const [intelligenceLevel, setIntelligenceLevel] = useState<string | null>(null);

  const {
    includeInsights = true,
    includeProgress = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    userContext
  } = options;

  /**
   * Fetch project understanding from narrative API
   */
  const fetchUnderstanding = useCallback(async (forceRefresh = false) => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      if (userContext?.name) params.set('userName', userContext.name);
      if (userContext?.projectType) params.set('projectType', userContext.projectType);
      if (includeProgress) params.set('includeProgress', 'true');
      if (includeInsights) params.set('includeInsights', 'true');

      // Call narrative understanding API
      const url = `/api/intelligence/narrative/${basketId}/understanding?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get project understanding');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from understanding API');
      }

      // Update state with narrative understanding
      setUnderstanding({
        greeting: data.understanding.greeting,
        currentUnderstanding: data.understanding.currentUnderstanding,
        intelligenceLevel: data.understanding.intelligenceLevel,
        confidence: data.understanding.confidence,
        themes: data.themes || [],
        nextSteps: data.nextSteps || [],
        recommendedActions: data.recommendedActions || []
      });

      // Update optional data
      if (data.insights) {
        setInsights(data.insights);
      }

      if (data.learningProgress) {
        setLearningProgress(data.learningProgress);
      }

      // Update metadata
      setProcessingTime(data.metadata?.processingTime || null);
      setIntelligenceLevel(data.metadata?.intelligenceLevel || null);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to understand project';
      setError(errorMessage);
      console.error('Project understanding error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId, includeInsights, includeProgress, userContext]);

  /**
   * Refresh understanding with cache clearing
   */
  const refreshUnderstanding = useCallback(async () => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        userContext,
        options: {
          includeInsights,
          includeProgress,
          analysisDepth: 'standard'
        },
        refreshCache: false
      };

      const response = await fetch(`/api/intelligence/narrative/${basketId}/understanding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh understanding');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid refresh response');
      }

      // Update with comprehensive understanding
      setUnderstanding({
        greeting: data.understanding.personalizedGreeting,
        currentUnderstanding: data.understanding.currentUnderstanding,
        intelligenceLevel: data.understanding.intelligenceLevel,
        confidence: data.understanding.confidence,
        themes: data.understanding.discoveredThemes || [],
        nextSteps: data.understanding.nextSteps || [],
        recommendedActions: data.metadata?.recommendedActions || []
      });

      if (data.insights) {
        setInsights(data.insights);
      }

      if (data.learningProgress) {
        setLearningProgress(data.learningProgress);
      }

      setProcessingTime(data.metadata?.processingTime || null);
      setIntelligenceLevel(data.metadata?.intelligenceLevel || null);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh understanding';
      setError(errorMessage);
      console.error('Understanding refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId, includeInsights, includeProgress, userContext]);

  /**
   * Clear cache and force fresh analysis
   */
  const clearCache = useCallback(async () => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        userContext,
        options: {
          includeInsights,
          includeProgress,
          analysisDepth: 'comprehensive'
        },
        refreshCache: true
      };

      const response = await fetch(`/api/intelligence/narrative/${basketId}/understanding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear cache and refresh');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid cache clear response');
      }

      // Update with fresh understanding
      setUnderstanding({
        greeting: data.understanding.personalizedGreeting,
        currentUnderstanding: data.understanding.currentUnderstanding,
        intelligenceLevel: data.understanding.intelligenceLevel,
        confidence: data.understanding.confidence,
        themes: data.understanding.discoveredThemes || [],
        nextSteps: data.understanding.nextSteps || [],
        recommendedActions: data.metadata?.recommendedActions || []
      });

      if (data.insights) {
        setInsights(data.insights);
      }

      if (data.learningProgress) {
        setLearningProgress(data.learningProgress);
      }

      setProcessingTime(data.metadata?.processingTime || null);
      setIntelligenceLevel(data.metadata?.intelligenceLevel || null);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
      console.error('Cache clear error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId, includeInsights, includeProgress, userContext]);

  // Initial fetch on mount and dependency changes
  useEffect(() => {
    fetchUnderstanding();
  }, [fetchUnderstanding]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user || !basketId) return;

    const interval = setInterval(() => {
      fetchUnderstanding();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchUnderstanding, user, basketId]);

  // Derived state
  const isReady = !loading && understanding !== null && error === null;

  return {
    // Core data
    understanding,
    insights,
    learningProgress,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshUnderstanding,
    clearCache,
    
    // Status
    isReady,
    processingTime,
    intelligenceLevel
  };
}

/**
 * Simplified hook for basic project understanding without insights or progress
 */
export function useBasicProjectUnderstanding(
  basketId: string,
  userContext?: { name?: string; projectType?: string }
) {
  return useProjectUnderstanding(basketId, {
    includeInsights: false,
    includeProgress: false,
    userContext
  });
}

/**
 * Comprehensive hook for full project understanding with all features
 */
export function useComprehensiveProjectUnderstanding(
  basketId: string,
  userContext?: { name?: string; projectType?: string }
) {
  return useProjectUnderstanding(basketId, {
    includeInsights: true,
    includeProgress: true,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    userContext
  });
}