'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNotificationStore } from '@/lib/notifications';

export function PurgeSuccessToast() {
  const searchParams = useSearchParams();
  const { addToast } = useNotificationStore();

  useEffect(() => {
    if (searchParams.get('purged') === 'true') {
      addToast({
        message: 'Workspace data purged successfully. All projects, work sessions, and context have been permanently deleted.',
        severity: 'success',
        dedupe_key: 'workspace_purged',
      });

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('purged');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, addToast]);

  return null;
}
