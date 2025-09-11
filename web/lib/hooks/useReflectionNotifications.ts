import { useEffect } from 'react';
import { useBasketEvents } from './useBasketEvents';
import { notificationService } from '@/lib/notifications/service';

/**
 * Listen for reflection.computed events for a basket and surface
 * a unified notification to the user.
 */
export function useReflectionNotifications(basketId: string) {
  const { lastEvent } = useBasketEvents(basketId);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'reflection.computed') {
      const refId = lastEvent.payload?.reflection_id as string | undefined;
      const docId = lastEvent.payload?.document_id as string | undefined;
      notificationService.reflectionComputed(
        'New Insight Available',
        'A new reflection was computed from your recent activity.',
        { basket_id: basketId, reflection_id: refId, document_id: docId }
      );
    }
  }, [basketId, lastEvent]);
}
