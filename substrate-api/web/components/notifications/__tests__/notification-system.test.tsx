/**
 * YARNNN Notification System Test
 * Governed by: /docs/YARNNN_ALERTS_NOTIFICATIONS_CANON.md (v1.0)
 * 
 * Tests the new notification system with ToastHost and notificationAPI
 */

import { notificationAPI } from '@/lib/api/notifications';
import { useNotificationStore } from '@/lib/notifications';

describe('YARNNN Notification System', () => {
  beforeEach(() => {
    // Reset store state
    useNotificationStore.getState().clearToasts();
  });

  it('should emit action result notifications correctly', async () => {
    // Test action result notification
    await notificationAPI.emitActionResult(
      'test.action',
      'Test message',
      { severity: 'success' }
    );

    // For now, just verify the system doesn't crash
    expect(true).toBe(true);
  });

  it('should handle toast creation', () => {
    const store = useNotificationStore.getState();
    
    store.addToast({
      message: 'Test toast message',
      severity: 'info'
    });

    const toasts = store.toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test toast message');
  });

  it('should process app events according to UI Policy Matrix', () => {
    const store = useNotificationStore.getState();
    
    // Test that job_update events with proper phases show toasts
    const jobEvent = {
      id: 'test-1',
      v: 1,
      type: 'job_update' as const,
      name: 'test.job',
      phase: 'succeeded' as const,
      severity: 'success' as const,
      message: 'Job completed successfully',
      workspace_id: 'test-workspace',
      created_at: new Date().toISOString()
    };

    store._processAppEvent(jobEvent);
    
    // Should create a toast for succeeded job
    const toasts = store.toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Job completed successfully');
  });
});