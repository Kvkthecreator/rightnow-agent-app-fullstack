/**
 * Document Impact Notification Component
 * 
 * Displays notification badge and handles document impact checkpoint UI trigger.
 * Maintains canon purity - completely separate from substrate governance notifications.
 */

"use client";

import { useState, useEffect } from 'react';
import { Bell, BookOpen, X, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/clients';
import { DocumentImpactCheckpoint } from './DocumentImpactCheckpoint';
import { useAuth } from '@/lib/useAuth';

interface DocumentImpactNotificationProps {
  workspaceId: string;
  userId: string;
  className?: string;
}

interface NotificationData {
  pending_count: number;
  high_confidence_count: number;
  should_notify: boolean;
}

export function DocumentImpactNotification({ 
  workspaceId, 
  userId,
  className = "" 
}: DocumentImpactNotificationProps) {
  const { user } = useAuth();
  const [notificationData, setNotificationData] = useState<NotificationData>({
    pending_count: 0,
    high_confidence_count: 0,
    should_notify: false
  });
  const [loading, setLoading] = useState(true);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    fetchNotificationData();
    
    // Set up real-time subscription for document impact events only when authenticated
    const supabase = createBrowserClient();
    
    const subscription = supabase
      .channel('document_impacts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_impacts',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        // Refresh notification data when impacts change
        fetchNotificationData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [workspaceId, userId, user]);

  const fetchNotificationData = async () => {
    try {
      const supabase = createBrowserClient();
      
      const { shouldNotifyUser } = await import('@/lib/artifacts/substrateCommitHandler');
      const data = await shouldNotifyUser(supabase, workspaceId, userId);
      
      setNotificationData(data);
    } catch (error) {
      console.error('Failed to fetch notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckpoint = () => {
    setShowCheckpoint(true);
    setShowDropdown(false);
  };

  const handleCloseCheckpoint = () => {
    setShowCheckpoint(false);
    fetchNotificationData(); // Refresh after checkpoint closes
  };

  const handleDismissNotification = async () => {
    // Mark all pending impacts as "user_deferred" to temporarily dismiss notification
    try {
      const response = await fetch('/api/artifacts/document-impacts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId })
      });

      if (response.ok) {
        setNotificationData(prev => ({ ...prev, should_notify: false }));
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="h-5 w-5 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (!notificationData.should_notify || notificationData.pending_count === 0) {
    return null; // Don't show anything if no pending impacts
  }

  return (
    <>
      {/* Notification Bell */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title={`${notificationData.pending_count} document updates pending`}
        >
          <BookOpen className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
            {notificationData.pending_count > 9 ? '9+' : notificationData.pending_count}
          </Badge>
        </button>

        {/* Notification Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    Document Updates Available
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {notificationData.pending_count} document{notificationData.pending_count === 1 ? '' : 's'} affected by recent substrate changes
                  </p>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {notificationData.high_confidence_count} high confidence
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {notificationData.pending_count - notificationData.high_confidence_count} need review
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleOpenCheckpoint}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Review Updates
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismissNotification}
                  className="text-gray-600"
                >
                  Later
                </Button>
              </div>

              {/* Info Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  💡 Document updates are handled separately from substrate changes to maintain canon purity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Impact Checkpoint Modal */}
      {showCheckpoint && (
        <DocumentImpactCheckpoint
          workspaceId={workspaceId}
          onClose={handleCloseCheckpoint}
          onImpactProcessed={fetchNotificationData}
        />
      )}
    </>
  );
}