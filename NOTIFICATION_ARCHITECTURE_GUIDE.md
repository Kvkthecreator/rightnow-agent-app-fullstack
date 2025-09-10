# YARNNN Unified Notification Architecture Guide
## Canon v1.0.0 - Complete Implementation

This guide documents the unified notification architecture that has replaced all legacy notification systems in YARNNN.

## Overview

The unified notification system has successfully replaced all legacy notification approaches:
- ✅ `react-hot-toast` - REMOVED from all components and package.json
- ✅ Custom `yarnnn-notification` events - DELETED with RealTimeNotifications
- ✅ DocumentImpactNotification - INTEGRATED into unified channels
- ✅ UniversalWorkStatusIndicator - MIGRATED to unified notifications
- ✅ Various toast/alert patterns - STANDARDIZED

## Current Implementation

### 1. Basic Notification Usage

**Standard Pattern:**
```typescript
import { notificationService } from '@/lib/notifications/service';

// Substrate notifications
notificationService.substrateApproved('Block Created', 'Successfully created new block');
notificationService.substrateRejected('Creation Failed', 'Failed to create block');

// Document notifications
notificationService.documentComposed('Document Ready', 'Composition complete', documentId);
notificationService.documentCompositionFailed('Failed', 'Error composing document', documentId);

// Work notifications
notificationService.workCompleted('Processing Done', 'Your request has been processed');
notificationService.workFailed('Processing Failed', 'Unable to complete your request');

// Governance notifications
notificationService.approvalRequired('Review Required', 'Block requires admin approval');
```

### 2. Real-Time Notifications
The NotificationCenter component in the layout automatically:
- Handles real-time subscriptions via Supabase
- Manages cross-page notification persistence
- Auto-detects workspace context from current route
- Syncs notifications across devices/tabs

```typescript
// Already included in root layout
<NotificationCenter />
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

## ✅ Migration Complete

All legacy notification systems have been removed and replaced:

- ✅ All `toast.*` calls replaced with `notificationService.*`
- ✅ Custom `yarnnn-notification` event system deleted
- ✅ RealTimeNotifications.tsx component removed
- ✅ Toast.tsx component removed
- ✅ `<NotificationCenter />` added to root layout
- ✅ Database migration created for notification tables
- ✅ react-hot-toast removed from package.json
- ✅ All components updated to use unified notifications
- ✅ Legacy imports and exports cleaned up

## Support

For migration assistance:
- Review YARNNN_NOTIFICATION_CANON_v1.0.0.md for architectural details
- Check existing migrated components for patterns
- Test in development environment first
- Consider gradual migration using legacy compatibility helpers