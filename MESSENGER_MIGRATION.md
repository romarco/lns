# Migration Guide: Messenger to Centralized Notifications

## Overview
This guide shows how to migrate the existing messenger.php to use the new centralized notification system.

## Changes Required

### 1. Replace sendPushNotification function in messenger.php

**OLD CODE (lines 83-142 in sys/messenger.php):**
```php
function sendPushNotification($recipientUserId, $title, $body, $data = []) {
    // Old implementation with duplicate FCM logic
}
```

**NEW CODE:**
```php
/**
 * Send push notification using centralized notification system
 * This function now uses the centralized notifications system
 */
function sendPushNotification($recipientUserId, $title, $body, $data = [], $icon = 'icon-message') {
    // Use the centralized notification system
    require_once __DIR__ . '/notifications.php';
    
    // Store in notifications table for in-app display
    $pdo = getDatabaseConnection();
    if (!$pdo) return false;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                user_id, notification_type, title, message, 
                data, action_url, icon
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        // Determine action URL based on data
        $actionUrl = 'messenger.html';
        if (isset($data['chat_id'])) {
            $actionUrl = 'messenger.html?chat_id=' . $data['chat_id'];
        }
        
        $stmt->execute([
            $recipientUserId,
            'message_received',
            $title,
            $body,
            json_encode($data),
            $actionUrl,
            $icon
        ]);
        
        // Send push notification via FCM
        \NotificationSystem\sendPushNotification(
            $recipientUserId, 
            $title, 
            $body, 
            $data, 
            $icon
        );
        
        return true;
    } catch (PDOException $e) {
        error_log("ERROR SEND PUSH: " . $e->getMessage());
        return false;
    }
}
```

### 2. Update notification calls in messenger.php

Find all calls to `sendPushNotification` and update them:

**Example - In handleSendMessage function:**

**OLD:**
```php
sendPushNotification(
    $recipientId,
    "New message from " . $senderName,
    $messageText,
    [
        'chat_id' => $chatId,
        'message_id' => $messageId,
        'sender_id' => $senderId
    ]
);
```

**NEW (same, but now uses centralized system):**
```php
sendPushNotification(
    $recipientId,
    "New message from " . $senderName,
    $messageText,
    [
        'chat_id' => $chatId,
        'message_id' => $messageId,
        'sender_id' => $senderId,
        'type' => 'chat_message'
    ],
    'icon-message' // Optional icon parameter
);
```

### 3. Benefits of Migration

1. **Unified System**: All notifications (chat, tasks, projects) use same API
2. **In-App Notifications**: Messages stored in database for notification panel
3. **Better Error Handling**: Centralized logging and error management
4. **Scheduled Notifications**: Can now schedule reminder messages
5. **Multi-Device**: Better support for multiple devices per user
6. **Analytics**: Track notification delivery and read status
7. **Consistency**: Same notification format across entire app

### 4. No Frontend Changes Required

The frontend messenger.js does NOT need changes because:
- Push notifications arrive automatically via FCM
- In-app notification panel shows all notifications (not just messages)
- Chat functionality remains unchanged

### 5. Testing After Migration

1. Send a test message in messenger
2. Verify notification appears in:
   - Push notification (mobile/web)
   - Notification panel (bell icon)
   - Database tables: `notifications` and `fcm_tokens`
3. Check notification badge updates
4. Verify clicking notification opens correct chat

### 6. Optional Enhancements

#### 6.1 Typing Indicators with Notifications
```php
// When user starts typing
function sendTypingNotification($chatId, $userId) {
    require_once __DIR__ . '/notifications.php';
    
    // Send realtime notification without storing in DB
    \NotificationSystem\sendPushNotification(
        $recipientId,
        "",
        "",
        [
            'type' => 'typing',
            'chat_id' => $chatId,
            'user_id' => $userId
        ],
        '',
        '' // No sound for typing
    );
}
```

#### 6.2 Message Reactions
```php
// When user reacts to message
sendPushNotification(
    $messageOwnerId,
    "$userName reacted to your message",
    "❤️",
    [
        'type' => 'message_reaction',
        'message_id' => $messageId,
        'chat_id' => $chatId,
        'reaction' => '❤️'
    ],
    'icon-heart'
);
```

#### 6.3 Group Message Mentions
```php
// When user mentioned in group chat
sendPushNotification(
    $mentionedUserId,
    "$senderName mentioned you",
    $messageText,
    [
        'type' => 'mention',
        'chat_id' => $groupChatId,
        'message_id' => $messageId
    ],
    'icon-mention'
);
```

### 7. Rollback Plan

If issues occur, you can temporarily keep both systems:

```php
function sendPushNotification($recipientUserId, $title, $body, $data = [], $icon = 'icon-message') {
    // Try new system
    try {
        require_once __DIR__ . '/notifications.php';
        \NotificationSystem\sendPushNotification($recipientUserId, $title, $body, $data, $icon);
    } catch (Exception $e) {
        error_log("New notification system failed, using fallback: " . $e->getMessage());
        
        // Fallback to old system
        sendPushNotificationOld($recipientUserId, $title, $body, $data);
    }
}

function sendPushNotificationOld($recipientUserId, $title, $body, $data = []) {
    // Keep old implementation as backup
    // ... (original code)
}
```

---

## Complete Example

Here's a complete example showing the migration:

**Before:**
```php
// In messenger.php
function sendPushNotification($recipientUserId, $title, $body, $data = []) {
    $pdo = getDatabaseConnection();
    // ... 60 lines of FCM code ...
}

// Usage
sendPushNotification($recipientId, "New message", $text, ['chat_id' => 123]);
```

**After:**
```php
// In messenger.php
function sendPushNotification($recipientUserId, $title, $body, $data = [], $icon = 'icon-message') {
    require_once __DIR__ . '/notifications.php';
    
    // Store in database
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, notification_type, title, message, data, action_url, icon) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $recipientUserId,
        'message_received',
        $title,
        $body,
        json_encode($data),
        'messenger.html?chat_id=' . ($data['chat_id'] ?? ''),
        $icon
    ]);
    
    // Send push
    \NotificationSystem\sendPushNotification($recipientUserId, $title, $body, $data, $icon);
}

// Usage (same as before)
sendPushNotification($recipientId, "New message", $text, ['chat_id' => 123]);
```

---

## Summary

✅ Replace sendPushNotification function in messenger.php
✅ Function calls remain the same (backward compatible)
✅ Notifications now appear in notification panel
✅ Better error handling and logging
✅ Foundation for future features (scheduled messages, etc.)

No breaking changes - existing messenger functionality preserved!
