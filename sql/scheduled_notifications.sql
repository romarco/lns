-- Table for scheduled notifications (for project reminders, etc.)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    notification_type VARCHAR(50) NOT NULL COMMENT 'Type: project_reminder, task_reminder, etc.',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON COMMENT 'Additional data as JSON (project_id, task_id, etc.)',
    action_url VARCHAR(500) COMMENT 'URL to open when notification clicked',
    icon VARCHAR(100) COMMENT 'Icon name or URL',
    scheduled_for DATETIME NOT NULL COMMENT 'When to send the notification',
    status ENUM('pending','sent','error','cancelled') DEFAULT 'pending',
    sent_at DATETIME NULL COMMENT 'When the notification was actually sent',
    error_message TEXT NULL COMMENT 'Error details if status=error',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_status (status),
    INDEX idx_status_scheduled (status, scheduled_for) COMMENT 'Optimized for cron job'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example: Schedule a project reminder 3 days before deadline
-- INSERT INTO scheduled_notifications (
--     user_id, 
--     notification_type, 
--     title, 
--     message, 
--     data, 
--     action_url, 
--     icon,
--     scheduled_for
-- ) VALUES (
--     1, 
--     'project_reminder', 
--     'Project Deadline Approaching', 
--     'Project "Website Redesign" is due in 3 days', 
--     '{"project_id": 45, "days_remaining": 3}',
--     'projects.html?id=45',
--     'icon-calendar',
--     DATE_SUB(project_deadline, INTERVAL 3 DAY)
-- );
