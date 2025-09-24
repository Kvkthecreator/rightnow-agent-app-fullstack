'use client';

import { useEffect } from 'react';
import { notificationAPI } from '@/lib/api/notifications';
import { ToastHost } from '@/components/notifications/ToastHost';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start realtime subscription when component mounts
    notificationAPI.startRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      notificationAPI.stopRealtimeSubscription();
    };
  }, []);

  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}