-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` int(10) unsigned NOT NULL,
  
  -- Generales
  `theme` enum('light','dark','auto') DEFAULT 'light',
  `language` varchar(10) DEFAULT 'es',
  
  -- Notificaciones
  `notifications_enabled` tinyint(1) DEFAULT 1,
  `sound_enabled` tinyint(1) DEFAULT 1,
  `vibration_enabled` tinyint(1) DEFAULT 1,
  `notif_new_projects` tinyint(1) DEFAULT 1,
  `notif_chat_messages` tinyint(1) DEFAULT 1,
  `notif_status_changes` tinyint(1) DEFAULT 1,
  `notif_task_reminders` tinyint(1) DEFAULT 1,
  
  -- Privacidad y Ubicación
  `share_location` enum('always','working','never') DEFAULT 'working',
  `show_online_status` tinyint(1) DEFAULT 1,
  `show_last_seen` tinyint(1) DEFAULT 1,
  
  -- Datos y Sincronización
  `auto_sync` tinyint(1) DEFAULT 1,
  `sync_frequency` int(11) DEFAULT 15 COMMENT 'minutos',
  `use_mobile_data` tinyint(1) DEFAULT 1,
  `auto_download_images` enum('always','wifi','manual') DEFAULT 'wifi',
  
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
