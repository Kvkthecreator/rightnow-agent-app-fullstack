import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { UnifiedNotification } from './types';

/**
 * Canon-compliant routing for notifications.
 * Maps notification types and related_entities to canonical app routes.
 * Returns true if a route was handled and navigation triggered.
 */
export function routeNotification(notification: UnifiedNotification, router: AppRouterInstance): boolean {
  try {
    const t = notification.type;
    const rel = notification.related_entities || {} as any;
    const basketId = rel.basket_id;
    const workId = rel.work_id;
    const documentId = rel.document_id;

    // Governance
    if (t === 'governance.approval.required' && basketId) {
      router.push(`/baskets/${basketId}/governance`);
      return true;
    }

    // Work orchestration
    if (t === 'work.queued' || t === 'work.processing' || t === 'work.failed' || t === 'work.completed') {
      if (documentId && basketId && t === 'work.completed') {
        // Prefer deep link to document if composition completed with doc id
        router.push(`/baskets/${basketId}/documents/${documentId}`);
        return true;
      }
      if (workId) {
        router.push(`/api/work/status/${workId}`);
        return true;
      }
    }

    // Presentation layer
    if (t === 'presentation.document.composed') {
      if (basketId && documentId) {
        router.push(`/baskets/${basketId}/documents/${documentId}`);
        return true;
      }
      if (documentId) {
        router.push(`/documents/${documentId}`);
        return true;
      }
    }

    // Substrate
    if (
      t === 'substrate.block.created' ||
      t === 'substrate.block.approved' ||
      t === 'substrate.block.rejected'
    ) {
      if (basketId) {
        router.push(`/baskets/${basketId}/building-blocks`);
        return true;
      }
    }

    // Reflections
    if (t === 'reflection.computed' && basketId) {
      router.push(`/baskets/${basketId}/reflections`);
      return true;
    }

    // System & settings
    if (t === 'governance.settings.changed') {
      router.push('/governance/settings');
      return true;
    }

    // No route handled
    return false;
  } catch {
    return false;
  }
}
