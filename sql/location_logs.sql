-- Tabla para guardar historial de ubicaciones del técnico
CREATE TABLE IF NOT EXISTS location_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED,
    latitude DECIMAL(10, 8) NOT NULL COMMENT 'Latitud de la ubicación',
    longitude DECIMAL(11, 8) NOT NULL COMMENT 'Longitud de la ubicación',
    accuracy FLOAT COMMENT 'Precisión en metros',
    speed FLOAT COMMENT 'Velocidad en m/s',
    heading FLOAT COMMENT 'Dirección en grados',
    altitude FLOAT COMMENT 'Altura en metros',
    tracking_mode VARCHAR(20) COMMENT 'time o movement',
    location_type ENUM('auto_tracking', 'manual_checkin') DEFAULT 'auto_tracking' COMMENT 'Tipo de registro',
    address VARCHAR(500) COMMENT 'Dirección formateada (reverse geocoding)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_created_at (created_at),
    INDEX idx_user_project (user_id, project_id),
    INDEX idx_coordinates (latitude, longitude),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para búsquedas geoespaciales
CREATE INDEX idx_location_time ON location_logs(user_id, created_at DESC);
