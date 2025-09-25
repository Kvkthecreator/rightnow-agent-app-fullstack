'use client';

import { useEffect } from 'react';
import { notificationAPI } from '@/lib/api/notifications';
import { ToastHost } from '@/components/notifications/ToastHost';
import { useAuth } from '@/lib/useAuth';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Only start realtime subscription when user is authenticated
    if (user) {
      notificationAPI.startRealtimeSubscription();
    }

    // Cleanup on unmount or when user logs out
    return () => {
      notificationAPI.stopRealtimeSubscription();
    };
  }, [user]);

  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}