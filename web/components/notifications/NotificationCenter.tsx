/**
 * Clean Notification Center - Canon v3.0
 * 
 * Minimal wrapper around new ActionCenter component
 * Maintains compatibility while using clean notification system
 */

"use client";

import React from 'react';

interface NotificationCenterProps {
  workspace_id?: string;
  user_id?: string;
  className?: string;
}

/**
 * Legacy notification center - now empty wrapper
 * Real notification functionality is handled by ActionCenter in TopBar
 */
export function NotificationCenter({ 
  workspace_id, 
  user_id, 
  className = "" 
}: NotificationCenterProps) {
  // No-op component - ActionCenter handles everything now
  return null;
}

/**
 * Legacy hook - minimal implementation for backward compatibility
 */
export function useNotifications() {
  return {
    // Stub state for compatibility
    notifications: [],
    unreadCount: 0,
    connectionStatus: 'connected' as const,
    hasPendingWork: false,
    
    // Stub actions for compatibility
    dismiss: () => {},
    markRead: () => {},
    acknowledge: () => {},
    clearAll: () => {},
    
    // Stub queries for compatibility
    getByCategory: () => [],
    getBadgeCount: () => 0,
    
    // Stub governance for compatibility
    governance: { auto_approve: false, confidence_threshold: 0.8 },
    updateGovernance: () => {}
  };
}
