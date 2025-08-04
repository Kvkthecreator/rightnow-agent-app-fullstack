"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { SubstrateIntelligence } from '@/lib/substrate/types';
import type { IntelligenceEvent } from './changeDetection';

interface UseThinkingPartnerReturn {
  currentIntelligence: SubstrateIntelligence | null;
  pendingChanges: IntelligenceEvent[];
  isProcessing: boolean;
  error: string | null;
  hasActiveSessions: boolean;
  lastUpdateTime: string | null;
  
  // Actions
  generateIntelligence: () => Promise<void>;
  approveChanges: (eventId: string, sections: string[]) => Promise<void>;
  rejectChanges: (eventId: string, reason?: string) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  markAsReviewed: (eventId: string) => Promise<void>;
}

export function useThinkingPartner(basketId: string): UseThinkingPartnerReturn {
  const [currentIntelligence, setCurrentIntelligence] = useState<SubstrateIntelligence | null>(null);
  const [pendingChanges, setPendingChanges] = useState<IntelligenceEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSessions, setHasActiveSessions] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Activity detection for pausing background generation
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      setHasActiveSessions(true);
      clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        setHasActiveSessions(false);
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer(); // Initialize

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, []);

  // Fetch current approved intelligence
  const fetchCurrentIntelligence = useCallback(async () => {
    try {
      const response = await fetchWithToken(`/api/intelligence/approved/${basketId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentIntelligence(data.intelligence);
        setLastUpdateTime(data.lastApprovalDate);
      } else if (response.status === 404) {
        // No approved intelligence exists yet - this is normal for new baskets
        // Try substrate intelligence, but if that also doesn't exist, show honest empty state
        try {
          const fallbackResponse = await fetchWithToken(`/api/substrate/basket/${basketId}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setCurrentIntelligence(fallbackData);
          } else {
            // No intelligence available yet - show transparent empty state
            setCurrentIntelligence(null);
          }
        } catch (fallbackErr) {
          // Network error or substrate not ready - show honest empty state
          setCurrentIntelligence(null);
        }
      } else {
        // Other status codes - still try substrate fallback
        try {
          const fallbackResponse = await fetchWithToken(`/api/substrate/basket/${basketId}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setCurrentIntelligence(fallbackData);
          } else {
            setCurrentIntelligence(null);
          }
        } catch (fallbackErr) {
          setCurrentIntelligence(null);
        }
      }
    } catch (err) {
      // Network or other errors - try substrate fallback without logging errors
      try {
        const fallbackResponse = await fetchWithToken(`/api/substrate/basket/${basketId}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setCurrentIntelligence(fallbackData);
        } else {
          setCurrentIntelligence(null);
        }
      } catch (fallbackErr) {
        setCurrentIntelligence(null);
      }
    }
  }, [basketId]);

  // Fetch pending changes
  const fetchPendingChanges = useCallback(async () => {
    try {
      const response = await fetchWithToken(`/api/intelligence/pending/${basketId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPendingChanges(data.events || []);
      } else if (response.status === 404) {
        // No pending changes found, which is normal
        setPendingChanges([]);
      } else {
        console.log(`Pending changes API returned ${response.status}`);
        setPendingChanges([]);
      }
    } catch (err) {
      console.error('Failed to fetch pending changes:', err);
      // Don't fail the whole app for pending changes fetch failures
      setPendingChanges([]);
    }
  }, [basketId]);

  // Initial data load - run in parallel for better performance
  useEffect(() => {
    if (basketId) {
      Promise.all([
        fetchCurrentIntelligence(),
        fetchPendingChanges()
      ]).catch(err => {
        console.error('Failed to load initial data:', err);
      });
    }
  }, [basketId, fetchCurrentIntelligence, fetchPendingChanges]);

  // Check for updates periodically (only when not actively processing)
  useEffect(() => {
    if (!basketId || isProcessing) return;

    const interval = setInterval(() => {
      fetchPendingChanges();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [basketId, isProcessing, fetchPendingChanges]);

  // Generate new intelligence
  const generateIntelligence = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/intelligence/generate/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: 'manual',
          checkPending: true // Check for existing pending changes first
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate intelligence');
      }

      const result = await response.json();
      
      if (result.hasPendingChanges) {
        // Refresh pending changes instead of generating new
        await fetchPendingChanges();
      } else {
        // New intelligence generated, refresh pending changes
        await fetchPendingChanges();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate intelligence');
      console.error('Intelligence generation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [basketId, isProcessing, fetchPendingChanges]);

  // Approve changes
  const approveChanges = useCallback(async (eventId: string, sections: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/intelligence/approve/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          sections,
          partialApproval: sections.length > 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve changes');
      }

      // Refresh both current intelligence and pending changes
      await Promise.all([
        fetchCurrentIntelligence(),
        fetchPendingChanges()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve changes');
      console.error('Failed to approve changes:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [basketId, fetchCurrentIntelligence, fetchPendingChanges]);

  // Reject changes
  const rejectChanges = useCallback(async (eventId: string, reason?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetchWithToken(`/api/intelligence/reject/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject changes');
      }

      // Refresh pending changes
      await fetchPendingChanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject changes');
      console.error('Failed to reject changes:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [basketId, fetchPendingChanges]);

  // Check for updates manually
  const checkForUpdates = useCallback(async () => {
    await fetchPendingChanges();
  }, [fetchPendingChanges]);

  // Mark as reviewed (for tracking user engagement)
  const markAsReviewed = useCallback(async (eventId: string) => {
    try {
      await fetchWithToken(`/api/intelligence/mark-reviewed/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
    } catch (err) {
      console.error('Failed to mark as reviewed:', err);
    }
  }, [basketId]);

  return {
    currentIntelligence,
    pendingChanges,
    isProcessing,
    error,
    hasActiveSessions,
    lastUpdateTime,
    generateIntelligence,
    approveChanges,
    rejectChanges,
    checkForUpdates,
    markAsReviewed
  };
}