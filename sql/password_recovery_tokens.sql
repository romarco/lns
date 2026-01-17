-- =====================================================
-- Tabla: password_recovery_tokens
-- Tokens de recuperación de contraseña con seguridad
-- =====================================================

CREATE TABLE IF NOT EXISTS `password_recovery_tokens` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Usuario
  `user_id` INT(11) UNSIGNED NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  
  -- Token/Código
  `token` VARCHAR(6) NOT NULL COMMENT 'Código de 6 dígitos',
  `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hash del token para verificación',
  
  -- Control de seguridad
  `expires_at` DATETIME NOT NULL COMMENT 'Expiración (15 minutos)',
  `attempts` INT(11) DEFAULT 0 COMMENT 'Intentos de validación',
  `max_attempts` INT(11) DEFAULT 5 COMMENT 'Máximo de intentos',
  `used` TINYINT(1) DEFAULT 0 COMMENT '1=usado, 0=no usado',
  `used_at` DATETIME DEFAULT NULL,
  
  -- Auditoría
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_email` (`email`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_used` (`used`),
  
  CONSTRAINT `fk_recovery_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eliminar tokens expirados automáticamente (opcional, ejecutar periódicamente)
-- DELETE FROM password_recovery_tokens WHERE expires_at < NOW() OR used = 1;
