# Notification System - Configuration Guide

## Overview
Sistema centralizado de notificaciones con Firebase Cloud Messaging (FCM) para notificaciones push en móviles y web.

## Files Created
1. **Backend API**: `sys/notifications.php`
2. **Frontend Library**: `www/js/notifications.js`
3. **Database Table**: `scheduled_notifications` (SQL in `sql/scheduled_notifications.sql`)

---

## 1. Firebase Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "Lawrance Network Services")
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Get Server Key
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Select **Cloud Messaging** tab
3. Copy **Server key** (legacy)
4. Update `sys/notifications.php`:
   ```php
   define('FCM_SERVER_KEY', 'YOUR_SERVER_KEY_HERE');
   ```

### 1.3 Android Configuration
1. In Firebase Console, click **Add app** → Android
2. Register app with package name (from `config.xml`: `com.mangolestudio.lns`)
3. Download `google-services.json`
4. Place file in Cordova project root:
   ```
   platforms/android/app/google-services.json
   ```

### 1.4 iOS Configuration
1. In Firebase Console, click **Add app** → iOS
2. Register app with bundle ID (from `config.xml`: `com.mangolestudio.lns`)
3. Download `GoogleService-Info.plist`
4. Place file in Cordova project root:
   ```
   platforms/ios/GoogleService-Info.plist
   ```

### 1.5 Web Configuration (Optional)
1. In Firebase Console, click **Add app** → Web
2. Register app with name
3. Copy Firebase config object
4. Create `www/js/firebase-config.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "123456789",
     appId: "YOUR_APP_ID"
   };
   firebase.initializeApp(firebaseConfig);
   ```

---

## 2. Cordova Plugin Installation

### 2.1 Install FCM Plugin
```bash
cd /path/to/cordova/project
cordova plugin add cordova-plugin-fcm-with-dependecy-updated
```

### 2.2 Update config.xml
Add plugin to `config.xml`:
```xml
<plugin name="cordova-plugin-fcm-with-dependecy-updated" spec="^7.8.0" />
```

Add iOS permissions:
```xml
<edit-config file="*-Info.plist" mode="merge" target="NSPhotoLibraryUsageDescription">
    <string>To enable push notifications</string>
</edit-config>
```

### 2.3 Build Platforms
```bash
cordova platform remove android
cordova platform add android
cordova platform remove ios
cordova platform add ios
```

---

## 3. Database Configuration

### 3.1 Run SQL Scripts
Execute the following SQL on your MySQL database:

```sql
-- Already created: fcm_tokens table
-- Already created: notifications table

-- Create scheduled_notifications table
SOURCE sql/scheduled_notifications.sql;
```

Or manually run:
```sql
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    action_url VARCHAR(500),
    icon VARCHAR(100),
    scheduled_for DATETIME NOT NULL,
    status ENUM('pending','sent','error','cancelled') DEFAULT 'pending',
    sent_at DATETIME NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Frontend Integration

### 4.1 Add Script to index.html
```html
<!-- After other JS files -->
<script src="js/notifications.js"></script>
```

### 4.2 Initialize in index.js
Add to your app initialization:
```javascript
// In index.js or main app file
document.addEventListener('deviceready', function() {
    // Get session token from localStorage or global variable
    const sessionToken = localStorage.getItem('session_token') || window.SESSION_TOKEN;
    
    // Initialize notification manager
    notificationManager.init({
        apiUrl: 'sys/notifications.php',
        sessionToken: sessionToken,
        pollingInterval: 30000, // Check every 30 seconds
        enablePolling: true,
        
        // Callback when new notification arrives
        onNotification: function(notification) {
            console.log('New notification:', notification);
            // Play sound, show toast, update UI, etc.
        },
        
        // Callback when unread count changes
        onUnreadCountChange: function(newCount, oldCount) {
            console.log('Unread count changed:', oldCount, '->', newCount);
            updateNotificationBadge(newCount);
        }
    });
});
```

### 4.3 Add Notification Badge to UI
```html
<!-- In your header/nav -->
<button id="index-page0-header-notifications-button" class="nav-button">
    <i class="icon-campana"></i>
    <span id="notification-badge" class="badge" style="display: none;">0</span>
</button>
```

CSS:
```css
.badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: red;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: bold;
    min-width: 18px;
    text-align: center;
}
```

### 4.4 Create Notification Panel
```javascript
// Show notification panel when bell icon clicked
document.getElementById('index-page0-header-notifications-button').addEventListener('click', function() {
    showNotificationPanel();
});

function showNotificationPanel() {
    notificationManager.getNotifications(1, 20).then(notifications => {
        // Build notification list UI
        let html = '<div class="notification-panel">';
        html += '<h3>Notifications</h3>';
        
        if (notifications.length === 0) {
            html += '<p class="no-notifications">No notifications</p>';
        } else {
            notifications.forEach(notif => {
                html += `
                    <div class="notification-item ${notif.is_read ? '' : 'unread'}" 
                         data-id="${notif.id}">
                        <i class="${notif.icon || 'icon-bell'}"></i>
                        <div class="notif-content">
                            <strong>${notif.title}</strong>
                            <p>${notif.message}</p>
                            <span class="notif-time">${formatTime(notif.created_at)}</span>
                        </div>
                        <button class="mark-read" onclick="markNotifAsRead(${notif.id})">
                            <i class="icon-check"></i>
                        </button>
                    </div>
                `;
            });
        }
        
        html += '<button onclick="markAllAsRead()">Mark all as read</button>';
        html += '</div>';
        
        // Show in modal/popup using your UI framework
        // Example with Mangole controls:
        if (window.controls && controls.createPopup) {
            controls.createPopup({
                title: 'Notifications',
                content: html,
                width: '90%',
                maxWidth: '500px'
            });
        }
    });
}

function markNotifAsRead(id) {
    notificationManager.markAsRead(id).then(response => {
        if (response.success) {
            // Update UI
            const item = document.querySelector(`.notification-item[data-id="${id}"]`);
            if (item) {
                item.classList.remove('unread');
            }
        }
    });
}

function markAllAsRead() {
    notificationManager.markAllAsRead().then(response => {
        if (response.success) {
            // Update all items in UI
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
        }
    });
}
```

---

## 5. Backend Integration

### 5.1 Send Notification from PHP
```php
// In any PHP file where you want to send notifications
require_once 'sys/notifications.php';

// Example: Send notification when new message received
$userId = 123;
$title = "New Message";
$message = "You have a new message from John Doe";
$data = [
    'type' => 'message',
    'message_id' => 456,
    'sender_id' => 789
];
$actionUrl = "messenger.html?chat_id=789";
$icon = "icon-message";

sendPushNotification($userId, $title, $message, $data, $icon);

// Also create in-app notification record
$stmt = $pdo->prepare("
    INSERT INTO notifications (
        user_id, notification_type, title, message, 
        data, action_url, icon
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $userId,
    'message_received',
    $title,
    $message,
    json_encode($data),
    $actionUrl,
    $icon
]);
```

### 5.2 Schedule Notification
```php
// Example: Schedule project reminder 3 days before deadline
$userId = 123;
$projectId = 45;
$projectName = "Website Redesign";
$projectDeadline = "2024-03-15 23:59:59";

// Calculate reminder time (3 days before deadline)
$reminderTime = date('Y-m-d H:i:s', strtotime($projectDeadline . ' -3 days'));

$stmt = $pdo->prepare("
    INSERT INTO scheduled_notifications (
        user_id, notification_type, title, message,
        data, action_url, icon, scheduled_for
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $userId,
    'project_reminder',
    'Project Deadline Approaching',
    "Project \"$projectName\" is due in 3 days",
    json_encode(['project_id' => $projectId, 'days_remaining' => 3]),
    "projects.html?id=$projectId",
    'icon-calendar',
    $reminderTime
]);
```

---

## 6. Cron Job Setup

### 6.1 Generate Cron Token
```php
// In sys/notifications.php, set:
define('CRON_TOKEN', 'YOUR_SECURE_RANDOM_TOKEN_HERE');
```

Generate a secure token:
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### 6.2 Configure Cron Job
Add to crontab (Linux/Mac) or Task Scheduler (Windows):

**Every minute:**
```cron
* * * * * curl -X POST "https://yourdomain.com/sys/notifications.php?action=process-scheduled&cron_token=YOUR_TOKEN"
```

**Or use wget:**
```cron
* * * * * wget -q -O /dev/null "https://yourdomain.com/sys/notifications.php?action=process-scheduled&cron_token=YOUR_TOKEN"
```

**Windows Task Scheduler:**
- Action: Start a program
- Program: `curl.exe`
- Arguments: `-X POST "http://localhost/MangoleStudio/workspace/app-lawrance-network-services/1.0.0/sys/notifications.php?action=process-scheduled&cron_token=YOUR_TOKEN"`
- Trigger: Every 1 minute

---

## 7. Testing

### 7.1 Test Device Registration
```javascript
// In browser console or app
notificationManager.getConfig(); // Should show fcmToken
```

### 7.2 Test Push Notification
Use Postman or curl to send test notification:
```bash
curl -X POST http://localhost/sys/notifications.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-notification",
    "session_token": "YOUR_SESSION_TOKEN",
    "user_id": 1,
    "notification_type": "test",
    "title": "Test Notification",
    "message": "This is a test notification",
    "send_push": true
  }'
```

### 7.3 Test Scheduled Notification
```bash
curl -X POST http://localhost/sys/notifications.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "schedule-notification",
    "session_token": "ADMIN_SESSION_TOKEN",
    "user_id": 1,
    "notification_type": "test_scheduled",
    "title": "Scheduled Test",
    "message": "This should arrive in 1 minute",
    "scheduled_for": "'$(date -d '+1 minute' '+%Y-%m-%d %H:%M:%S')'"
  }'
```

### 7.4 Test Cron Processor
```bash
curl -X POST "http://localhost/sys/notifications.php?action=process-scheduled&cron_token=YOUR_TOKEN"
```

---

## 8. Usage Examples

### 8.1 Messenger Integration
```php
// In sys/messenger.php, when new message received
sendPushNotification(
    $recipientId,
    "New Message from " . $senderName,
    $messageText,
    ['chat_id' => $chatId, 'message_id' => $messageId],
    'icon-message'
);
```

### 8.2 Task Assignment
```php
// When task assigned to user
sendPushNotification(
    $assigneeId,
    "New Task Assigned",
    "You've been assigned: " . $taskTitle,
    ['task_id' => $taskId, 'project_id' => $projectId],
    'icon-task'
);
```

### 8.3 Project Reminders
```php
// When project created with deadline, schedule reminders
$deadlines = [
    ['days' => 7, 'message' => '1 week'],
    ['days' => 3, 'message' => '3 days'],
    ['days' => 1, 'message' => '1 day']
];

foreach ($deadlines as $reminder) {
    $scheduledFor = date('Y-m-d H:i:s', strtotime($projectDeadline . ' -' . $reminder['days'] . ' days'));
    
    // Insert into scheduled_notifications table
    // (See section 5.2 for full code)
}
```

---

## 9. Troubleshooting

### 9.1 Push Notifications Not Working
- Verify FCM_SERVER_KEY is correct in notifications.php
- Check Firebase Console > Cloud Messaging > Logs
- Ensure google-services.json (Android) or GoogleService-Info.plist (iOS) are in correct locations
- Rebuild Cordova platforms after adding config files
- Check device has internet connection
- Verify app has notification permissions

### 9.2 Token Not Registered
- Check browser console for FCM errors
- Verify session_token is valid
- Check database: `SELECT * FROM fcm_tokens WHERE user_id = ?`
- Ensure notifications.php returns success on register-device

### 9.3 Scheduled Notifications Not Sending
- Verify cron job is running: check server cron logs
- Test manually: `curl process-scheduled endpoint`
- Check scheduled_notifications table: `SELECT * FROM scheduled_notifications WHERE status='pending'`
- Verify CRON_TOKEN matches in cron URL and notifications.php
- Check error_message column for failed notifications

### 9.4 Unread Count Not Updating
- Check polling is enabled: `notificationManager.getConfig().enablePolling`
- Verify session_token is valid
- Check browser network tab for API errors
- Test manually: `notificationManager.getUnreadCount()`

---

## 10. Security Notes

1. **Server Key**: Keep FCM_SERVER_KEY private, never expose in frontend code
2. **Cron Token**: Use a strong random token for cron job authentication
3. **Session Validation**: Backend validates session_token on every request
4. **User Authorization**: Users can only access their own notifications
5. **Admin Only**: send-notification and schedule-notification require admin role
6. **SQL Injection**: All queries use prepared statements
7. **XSS Prevention**: Sanitize notification content before displaying in UI

---

## 11. Next Steps

1. Configure Firebase project and get Server Key
2. Install FCM Cordova plugin
3. Add notification badge to UI
4. Implement notification panel popup
5. Set up cron job for scheduled notifications
6. Integrate with messenger, tasks, projects, etc.
7. Test on real devices (Android/iOS)
8. Monitor Firebase Console for delivery metrics

---

## Support

For issues or questions, refer to:
- Firebase Cloud Messaging Docs: https://firebase.google.com/docs/cloud-messaging
- Cordova FCM Plugin: https://github.com/andrehtissot/cordova-plugin-fcm-with-dependecy-updated
- API Reference: See comments in sys/notifications.php and www/js/notifications.js
