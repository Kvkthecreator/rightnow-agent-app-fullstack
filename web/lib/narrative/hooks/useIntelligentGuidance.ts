/**
 * Narrative Hook: Intelligent Guidance
 * 
 * This hook provides strategic and tactical guidance through the narrative API layer.
 * It transforms technical analysis into actionable, user-friendly recommendations.
 * 
 * CRITICAL: This hook must NEVER expose technical substrate vocabulary.
 * All guidance is strategic advice in human-centered language.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

// User-facing guidance interfaces
export interface StrategicGuidance {
  title: string;
  description: string;
  recommendation: string;
  reasoning: string;
  actionPlan: ActionStep[];
  expectedOutcome: string;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  difficulty: 'beginner_friendly' | 'moderate_effort' | 'advanced_focus';
}

export interface ActionStep {
  step: string;
  description: string;
  userBenefit: string;
  estimatedTime: string;
  prerequisite?: string;
}

export interface ProjectHealthAssessment {
  overallHealth: 'excellent' | 'good' | 'developing' | 'needs_attention';
  strengths: string[];
  improvementAreas: string[];
  recommendations: HealthRecommendation[];
  progressTrajectory: 'accelerating' | 'steady' | 'slowing' | 'stalled';
}

export interface HealthRecommendation {
  focus: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'minimal' | 'moderate' | 'significant';
}

export interface CreativeOpportunity {
  opportunity: string;
  description: string;
  inspirationalPrompt: string;
  explorationSteps: string[];
  potentialOutcomes: string[];
}

export interface ProjectContext {
  currentUnderstanding: string;
  intelligenceLevel: string;
  confidenceLevel: string;
  discoveredThemes: number;
  nextSteps: string[];
}

interface UseIntelligentGuidanceOptions {
  focusArea?: 'development' | 'organization' | 'creativity' | 'completion';
  userGoal?: 'explore' | 'develop' | 'organize' | 'complete';
  includeHealthAssessment?: boolean;
  includeCreativeOpportunities?: boolean;
  autoRefresh?: boolean;
}

interface UseIntelligentGuidanceResult {
  // Core guidance data
  strategicGuidance: StrategicGuidance[];
  projectContext: ProjectContext | null;
  immediateActions: string[];
  
  // Optional assessments
  healthAssessment: ProjectHealthAssessment | null;
  creativeOpportunities: CreativeOpportunity[] | null;
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshGuidance: (newOptions?: { focusArea?: string; userGoal?: string }) => Promise<void>;
  requestComprehensiveGuidance: (analysisTypes: string[]) => Promise<void>;
  
  // Status
  isReady: boolean;
  guidanceLevel: string | null;
  processingTime: string | null;
}

/**
 * Hook for intelligent strategic guidance
 * 
 * Provides strategic and tactical guidance for project development.
 * Includes health assessment and creative opportunities when requested.
 */
export function useIntelligentGuidance(
  basketId: string,
  options: UseIntelligentGuidanceOptions = {}
): UseIntelligentGuidanceResult {
  const { user } = useAuth();
  const [strategicGuidance, setStrategicGuidance] = useState<StrategicGuidance[]>([]);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [immediateActions, setImmediateActions] = useState<string[]>([]);
  const [healthAssessment, setHealthAssessment] = useState<ProjectHealthAssessment | null>(null);
  const [creativeOpportunities, setCreativeOpportunities] = useState<CreativeOpportunity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [guidanceLevel, setGuidanceLevel] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<string | null>(null);

  const {
    focusArea,
    userGoal,
    includeHealthAssessment = false,
    includeCreativeOpportunities = false,
    autoRefresh = false
  } = options;

  /**
   * Fetch strategic guidance from narrative API
   */
  const fetchGuidance = useCallback(async (requestOptions?: { focusArea?: string; userGoal?: string }) => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      const currentFocusArea = requestOptions?.focusArea || focusArea;
      const currentUserGoal = requestOptions?.userGoal || userGoal;
      
      if (currentFocusArea) params.set('focusArea', currentFocusArea);
      if (currentUserGoal) params.set('userGoal', currentUserGoal);
      if (includeHealthAssessment) params.set('includeHealth', 'true');
      if (includeCreativeOpportunities) params.set('includeCreative', 'true');

      // Call narrative guidance API
      const url = `/api/intelligence/narrative/${basketId}/guidance?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get strategic guidance');
      }

      const data = await response.json();

      if (!data.success) {
        // Handle fallback guidance
        if (data.fallbackGuidance) {
          setStrategicGuidance(data.fallbackGuidance);
          setImmediateActions([data.suggestion || "Continue building your project"]);
          return;
        }
        
        throw new Error(data.error || 'Invalid response from guidance API');
      }

      // Update guidance data
      setStrategicGuidance(data.guidance || []);
      setProjectContext(data.projectContext || null);
      setImmediateActions(data.immediateActions || []);

      // Update optional assessments
      if (data.healthAssessment) {
        setHealthAssessment(data.healthAssessment);
      }

      if (data.creativeOpportunities) {
        setCreativeOpportunities(data.creativeOpportunities);
      }

      // Update metadata
      setGuidanceLevel(data.metadata?.guidanceLevel || null);
      setProcessingTime(data.metadata?.processingTime || null);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get guidance';
      setError(errorMessage);
      console.error('Strategic guidance error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId, focusArea, userGoal, includeHealthAssessment, includeCreativeOpportunities]);

  /**
   * Refresh guidance with new options
   */
  const refreshGuidance = useCallback(async (newOptions?: { focusArea?: string; userGoal?: string }) => {
    await fetchGuidance(newOptions);
  }, [fetchGuidance]);

  /**
   * Request comprehensive guidance with multiple analysis types
   */
  const requestComprehensiveGuidance = useCallback(async (analysisTypes: string[]) => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        focusArea,
        userGoal,
        requestedAnalysis: analysisTypes,
        refreshCache: false
      };

      const response = await fetch(`/api/intelligence/narrative/${basketId}/guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get comprehensive guidance');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid comprehensive guidance response');
      }

      // Update all guidance data
      setStrategicGuidance(data.strategicGuidance || []);
      setProjectContext({
        currentUnderstanding: data.projectUnderstanding?.currentUnderstanding || '',
        intelligenceLevel: data.projectUnderstanding?.intelligenceLevel?.stage || 'unknown',
        confidenceLevel: data.projectUnderstanding?.confidence?.level || 'unknown',
        discoveredThemes: data.projectUnderstanding?.themes?.length || 0,
        nextSteps: data.projectUnderstanding?.nextSteps || []
      });

      // Update comprehensive analysis results
      if (data.analysis?.healthAssessment) {
        setHealthAssessment(data.analysis.healthAssessment);
      }

      if (data.analysis?.creativeOpportunities) {
        setCreativeOpportunities(data.analysis.creativeOpportunities);
      }

      // Update insights and progress if available
      if (data.insights) {
        // Could be used for additional guidance context
      }

      if (data.learningProgress) {
        // Could be used for progress-based recommendations
      }

      setGuidanceLevel(data.metadata?.guidanceLevel || null);
      setProcessingTime(data.metadata?.processingTime || null);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get comprehensive guidance';
      setError(errorMessage);
      console.error('Comprehensive guidance error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId, focusArea, userGoal]);

  // Initial fetch on mount and dependency changes
  useEffect(() => {
    fetchGuidance();
  }, [fetchGuidance]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user || !basketId) return;

    const interval = setInterval(() => {
      fetchGuidance();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [autoRefresh, fetchGuidance, user, basketId]);

  // Derived state
  const isReady = !loading && strategicGuidance.length > 0 && error === null;

  return {
    // Core guidance data
    strategicGuidance,
    projectContext,
    immediateActions,
    
    // Optional assessments
    healthAssessment,
    creativeOpportunities,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshGuidance,
    requestComprehensiveGuidance,
    
    // Status
    isReady,
    guidanceLevel,
    processingTime
  };
}

/**
 * Simplified hook for basic strategic guidance
 */
export function useBasicGuidance(
  basketId: string,
  focusArea?: 'development' | 'organization' | 'creativity' | 'completion'
) {
  return useIntelligentGuidance(basketId, {
    focusArea,
    includeHealthAssessment: false,
    includeCreativeOpportunities: false
  });
}

/**
 * Comprehensive hook for full guidance with health and creative analysis
 */
export function useComprehensiveGuidance(
  basketId: string,
  userGoal?: 'explore' | 'develop' | 'organize' | 'complete'
) {
  return useIntelligentGuidance(basketId, {
    userGoal,
    includeHealthAssessment: true,
    includeCreativeOpportunities: true,
    autoRefresh: true
  });
}

/**
 * Hook specifically for project health assessment
 */
export function useProjectHealth(basketId: string) {
  const result = useIntelligentGuidance(basketId, {
    includeHealthAssessment: true,
    includeCreativeOpportunities: false
  });

  return {
    healthAssessment: result.healthAssessment,
    loading: result.loading,
    error: result.error,
    lastUpdated: result.lastUpdated,
    refreshAssessment: () => result.refreshGuidance(),
    isReady: result.isReady && result.healthAssessment !== null
  };
}

/**
 * Hook specifically for creative opportunities
 */
export function useCreativeOpportunities(basketId: string) {
  const result = useIntelligentGuidance(basketId, {
    focusArea: 'creativity',
    includeHealthAssessment: false,
    includeCreativeOpportunities: true
  });

  return {
    creativeOpportunities: result.creativeOpportunities,
    strategicGuidance: result.strategicGuidance,
    loading: result.loading,
    error: result.error,
    lastUpdated: result.lastUpdated,
    refreshOpportunities: () => result.refreshGuidance({ focusArea: 'creativity' }),
    isReady: result.isReady && result.creativeOpportunities !== null
  };
}