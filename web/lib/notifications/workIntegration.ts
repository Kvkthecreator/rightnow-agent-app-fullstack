/**
 * Work Activity Integration for Unified Notification System
 * 
 * Migrates legacy BasketNotificationsDrawer functionality into
 * the unified NotificationCenter system.
 */

import { useNotificationStore } from './store';
import { useEffect, useCallback } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { CreateNotificationRequest } from './types';

interface WorkActivity {
  work_id: string;
  work_type: string;
  status: string;
  created_at: string;
  last_activity?: string;
  dump_id?: string | null;
}

interface ProposalActivity {
  id: string;
  proposal_kind: string;
  status: string;
  created_at: string;
  impact_summary?: string;
}

interface TimelineEvent {
  id: string | number;
  event_type: string;
  created_at: string;
  preview?: string | null;
}

/**
 * Hook to integrate work activity into unified notifications
 */
export function useWorkNotificationIntegration(basketId?: string) {
  const { addNotification, getNotificationsByCategory } = useNotificationStore();

  // Get existing work notifications to avoid duplicates
  const existingWorkNotifications = getNotificationsByCategory('work');

  const createWorkNotifications = useCallback(async () => {
    if (!basketId) return;

    try {
      // Fetch current work activity using canon-compliant auth
      const [workRes, propRes] = await Promise.all([
        fetchWithToken(`/api/baskets/${basketId}/work`),
        fetchWithToken(`/api/baskets/${basketId}/proposals?status=PROPOSED`),
      ]);

      // Process active work
      if (workRes.ok) {
        const workData = await workRes.json();
        const activeWork = (workData.items || []).filter((w: WorkActivity) => 
          ['pending', 'claimed', 'processing', 'cascading'].includes(w.status)
        );

        // Create notifications for active work
        activeWork.forEach((work: WorkActivity) => {
          // Check if notification already exists
          const exists = existingWorkNotifications.some(n => 
            n.related_entities.work_id === work.work_id
          );

          if (!exists) {
            const notificationRequest: CreateNotificationRequest = {
              type: getWorkNotificationType(work.status),
              title: formatWorkTitle(work.work_type),
              message: getWorkMessage(work),
              severity: getWorkSeverity(work.status),
              channels: ['badge'], // Only show in badge count, no popups
              persistence: {
                cross_page: false, // Don't persist across pages to reduce noise
                auto_dismiss: true, // Auto-dismiss to keep it quiet
                requires_acknowledgment: false
              },
              related_entities: {
                basket_id: basketId,
                work_id: work.work_id
              },
              actions: work.status === 'failed' ? [{
                label: 'Retry',
                variant: 'primary',
                handler: () => retryWork(work.work_id)
              }] : undefined
            };

            addNotification(notificationRequest);
          }
        });
      }

      // Process governance proposals
      if (propRes.ok) {
        const propData = await propRes.json();
        (propData.items || []).forEach((proposal: ProposalActivity) => {
          // Check if notification already exists
          const exists = existingWorkNotifications.some(n => 
            n.related_entities.basket_id === basketId &&
            n.type === 'governance.approval.required'
          );

          if (!exists && proposal.status === 'PROPOSED') {
            const notificationRequest: CreateNotificationRequest = {
              type: 'governance.approval.required',
              title: 'Governance Review Required',
              message: `${proposal.proposal_kind}: ${proposal.impact_summary || 'Review needed'}`,
              severity: 'warning',
              channels: ['badge'], // Only show in badge, no persistent popups
              persistence: {
                cross_page: false, // Don't persist to reduce noise
                auto_dismiss: false, // Don't auto-dismiss governance items
                requires_acknowledgment: false // Don't require acknowledgment
              },
              related_entities: {
                basket_id: basketId
              },
              actions: [{
                label: 'Review',
                variant: 'primary',
                handler: () => {
                  window.location.href = `/baskets/${basketId}/governance`;
                }
              }]
            };

            addNotification(notificationRequest);
          }
        });
      }

    } catch (error) {
      console.error('Failed to create work notifications:', error);
    }
  }, [basketId, addNotification, existingWorkNotifications]);

  // Refresh work notifications periodically
  useEffect(() => {
    if (!basketId) return;

    createWorkNotifications();

    // Set up periodic refresh for active work
    const interval = setInterval(createWorkNotifications, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [basketId, createWorkNotifications]);

  return {
    refreshWorkNotifications: createWorkNotifications
  };
}

/**
 * Helper functions
 */

function getWorkNotificationType(status: string): 'work.queued' | 'work.processing' | 'work.completed' | 'work.failed' {
  switch (status) {
    case 'pending': return 'work.queued';
    case 'claimed':
    case 'processing': 
    case 'cascading': return 'work.processing';
    case 'completed': return 'work.completed';
    case 'failed': return 'work.failed';
    default: return 'work.queued';
  }
}

function formatWorkTitle(workType: string): string {
  return workType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getWorkMessage(work: WorkActivity): string {
  const type = formatWorkTitle(work.work_type);
  const timeAgo = formatTimeAgo(work.created_at);
  
  switch (work.status) {
    case 'pending': return `${type} queued ${timeAgo}`;
    case 'claimed': return `${type} claimed by system`;
    case 'processing': return `${type} in progress...`;
    case 'cascading': return `${type} cascading updates...`;
    case 'failed': return `${type} failed - requires attention`;
    default: return `${type} status: ${work.status}`;
  }
}

function getWorkSeverity(status: string): 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'failed': return 'error';
    case 'processing':
    case 'cascading': return 'info';
    case 'pending': return 'warning';
    default: return 'info';
  }
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

async function retryWork(workId: string): Promise<void> {
  try {
    const response = await fetchWithToken('/api/work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retry_work_id: workId })
    });
    
    if (response.ok) {
      // Show quiet success notification - only in badge count
      useNotificationStore.getState().addNotification({
        type: 'work.queued',
        title: 'Work Retried',
        message: 'Task has been queued for retry',
        severity: 'success',
        channels: ['badge'], // Quiet notification in badge only
        persistence: {
          cross_page: false,
          auto_dismiss: true,
          requires_acknowledgment: false
        }
      });
    }
  } catch (error) {
    console.error('Failed to retry work:', error);
  }
}