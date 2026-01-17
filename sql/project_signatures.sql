-- Tabla para guardar las firmas de los proyectos
-- Guarda la ruta del archivo PNG de la firma del cliente al completar el proyecto

CREATE TABLE IF NOT EXISTS project_signatures (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  signed_by INT UNSIGNED NOT NULL COMMENT 'ID del técnico que recibió la firma',
  signature_path VARCHAR(500) NOT NULL COMMENT 'Ruta al archivo PNG de la firma',
  client_name VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del cliente (opcional)',
  notes TEXT DEFAULT NULL COMMENT 'Notas adicionales sobre la firma',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_signed_by (signed_by),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentario:
-- Esta tabla almacena las firmas digitales de los clientes cuando completan un proyecto.
-- El técnico captura la firma en un canvas y se guarda como archivo PNG en el servidor.
