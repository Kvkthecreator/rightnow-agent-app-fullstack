# YARNNN Unified Notification Migration Guide
## Migrating from Legacy Notification Systems to Canon v1.0.0

This guide helps developers migrate existing notification code to the new unified notification architecture.

## Overview

The unified notification system replaces 5 fragmented notification approaches:
- `react-hot-toast` (simple toasts)
- Custom `yarnnn-notification` events (RealTimeNotifications)
- DocumentImpactNotification (specialized component)
- UniversalWorkStatusIndicator (work queue badges)
- Various toast/alert patterns

## Migration Patterns

### 1. React Hot Toast Migration

**Before (Legacy):**
```typescript
import { toast } from 'react-hot-toast';

// In component
toast.success('Block created ✓');
toast.error('Failed to create block');
toast.info('Review required');
```

**After (Unified):**
```typescript
import { notificationService } from '@/lib/notifications/service';

// Specific semantic notifications
notificationService.substrateApproved('Block Created', 'Successfully created new block');
notificationService.substrateRejected('Creation Failed', 'Failed to create block');
notificationService.approvalRequired('Review Required', 'Block requires admin approval');

// Or use legacy helper for gradual migration
import { legacyNotify } from '@/lib/notifications/service';
legacyNotify.success('Block created ✓'); // Auto-maps to appropriate unified type
```

### 2. Custom Event Migration

**Before (Legacy):**
```typescript
// Emitting custom notification event
window.dispatchEvent(new CustomEvent('yarnnn-notification', {
  detail: {
    type: 'change_applied',
    title: 'Document Composed',
    message: 'Successfully composed with 5 substrate items',
    timestamp: new Date().toISOString(),
    autoHide: true
  }
}));
```

**After (Unified):**
```typescript
import { notificationService } from '@/lib/notifications/service';

notificationService.documentComposed(
  'Document Composed',
  'Successfully composed with 5 substrate items',
  documentId,
  5 // substrate_count
);
```

### 3. Specialized Component Migration

**Before (Legacy):**
```typescript
// DocumentImpactNotification with custom badge logic
<DocumentImpactNotification 
  workspaceId={workspaceId}
  userId={userId}
/>
```

**After (Unified):**
```typescript
// NotificationCenter handles all notification types
<NotificationCenter /> // Already included in layout

// Create document impact notifications programmatically
notificationService.documentImpactReady(
  'Document Updates Available',
  '3 documents affected by recent substrate changes'
);
```

### 4. Work Status Badge Migration

**Before (Legacy):**
```typescript
// UniversalWorkStatusIndicator with custom badge
<UniversalWorkStatusIndicator />
// Custom badge counting logic
```

**After (Unified):**
```typescript
// Work notifications now flow through unified system
notificationService.workCompleted('Processing Complete', 'Substrate analysis finished');
notificationService.workFailed('Processing Failed', 'Error in substrate pipeline');

// Badge counts automatically managed by unified system
const { getBadgeCount } = useNotifications();
const workBadgeCount = getBadgeCount('badge');
```

## Component Integration

### Adding Notifications to Your Component

```typescript
import { notificationService } from '@/lib/notifications/service';
import { useNotifications } from '@/components/notifications/NotificationCenter';

function MyComponent() {
  const { unreadCount, dismiss } = useNotifications();

  const handleAction = async () => {
    try {
      await performAction();
      
      // Create success notification
      notificationService.substrateApproved(
        'Action Complete',
        'Your changes have been applied successfully'
      );
    } catch (error) {
      // Create error notification with action
      notificationService.substrateRejected(
        'Action Failed',
        error.message,
        ['substrate_id_123'],
        basketId
      );
    }
  };

  return (
    <div>
      <button onClick={handleAction}>
        Perform Action
      </button>
      {unreadCount > 0 && (
        <span>You have {unreadCount} notifications</span>
      )}
    </div>
  );
}
```

### Creating Custom Notification Types

```typescript
import { notificationService } from '@/lib/notifications/service';

// Use the generic notify method for custom notifications
notificationService.notify({
  type: 'governance.approval.required',
  title: 'Custom Approval',
  message: 'This item needs your review',
  severity: 'warning',
  channels: ['badge', 'persistent'],
  persistence: {
    cross_page: true,
    auto_dismiss: false,
    requires_acknowledgment: true
  },
  actions: [{
    label: 'Review Now',
    variant: 'primary',
    handler: () => openReviewModal()
  }],
  related_entities: {
    basket_id: basketId,
    substrate_ids: ['sub_123']
  }
});
```

## Governance Integration

### Workspace Notification Settings

The unified system respects workspace-level governance settings:

```typescript
// Settings are automatically loaded from workspace_notification_settings table
// Users can configure:
// - Which notification categories to show
// - Auto-dismiss timing
// - Cross-page persistence
// - Badge visibility
// - Notification position
```

### Permission-Based Notifications

```typescript
// Notifications automatically respect user permissions
notificationService.notify({
  type: 'governance.approval.required',
  governance_context: {
    requires_approval: true,
    permission_level: 'admin', // Only shows to admins
    smart_review_eligible: true
  }
});
```

## Database Integration

### Notification Persistence

Notifications are automatically persisted to the database for cross-page continuity:

```sql
-- Notifications stored in user_notifications table
-- Workspace settings in workspace_notification_settings table
-- Automatic cleanup of old notifications
```

### Real-time Synchronization

```typescript
// Real-time updates via Supabase subscriptions
// Cross-device notification sync
// Automatic conflict resolution
```

## Testing Migration

### 1. Identify Legacy Notification Code

Search for these patterns in your codebase:

```bash
# Find react-hot-toast usage
grep -r "toast\." --include="*.tsx" --include="*.ts"

# Find custom notification events  
grep -r "yarnnn-notification" --include="*.tsx" --include="*.ts"

# Find specialized notification components
grep -r "DocumentImpactNotification\|UniversalWorkStatusIndicator" --include="*.tsx"
```

### 2. Test Migration

1. Replace legacy notification calls with unified equivalents
2. Test notification display across page navigation
3. Verify governance settings are respected
4. Check real-time synchronization works
5. Confirm database persistence

### 3. Cleanup Legacy Code

After confirming unified notifications work:

```typescript
// Remove legacy imports
// import { toast } from 'react-hot-toast'; ❌
// import { RealTimeNotifications } from '...'; ❌

// Remove legacy components from layout
// <Toaster position="top-right" /> ❌
// <RealTimeNotifications /> ❌
```

## Performance Considerations

### Notification Limits

- Max 100 notifications per user (auto-cleanup)
- Max 10 visible notifications (configurable)
- Auto-dismiss timing respects governance settings

### Real-time Efficiency

- Batch notification updates
- Intelligent filtering based on user preferences
- Minimal re-renders with optimized state management

## Troubleshooting

### Common Issues

**Notifications not showing:**
- Check workspace context is initialized
- Verify user has permissions for notification category
- Check governance settings allow notification type

**Real-time sync not working:**
- Verify Supabase real-time subscriptions are active
- Check network connectivity
- Review browser WebSocket policies

**Legacy notifications still appearing:**
- Gradually remove legacy notification calls
- Ensure NotificationCenter is included in layout
- Check for duplicate notification systems

### Debug Tools

```typescript
// Development-only notification debugging
if (process.env.NODE_ENV === 'development') {
  const { notifications, connectionStatus } = useNotifications();
  console.log('Notifications:', notifications);
  console.log('Connection:', connectionStatus);
}
```

## Migration Checklist

- [ ] Replace all `toast.*` calls with `notificationService.*`
- [ ] Remove custom `yarnnn-notification` event listeners
- [ ] Replace specialized notification components
- [ ] Add `<NotificationCenter />` to layout
- [ ] Run database migration for notification tables
- [ ] Test cross-page notification persistence
- [ ] Verify governance integration works
- [ ] Update notification-related tests
- [ ] Remove legacy notification imports
- [ ] Clean up unused notification components

## Support

For migration assistance:
- Review YARNNN_NOTIFICATION_CANON_v1.0.0.md for architectural details
- Check existing migrated components for patterns
- Test in development environment first
- Consider gradual migration using legacy compatibility helpers