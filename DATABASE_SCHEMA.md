# Database Schema Documentation - Lawrance Network Services

**Base de datos:** `db_lns`  
**Fecha de documentación:** 22 de diciembre de 2025  
**Versión del sistema:** 1.0.0

---

## 📋 Índice de Tablas

1. [Usuarios y Autenticación](#usuarios-y-autenticación)
2. [Proyectos y Gestión](#proyectos-y-gestión)
3. [Asignaciones y Aplicaciones](#asignaciones-y-aplicaciones)
4. [Tareas y Fotos](#tareas-y-fotos)
5. [Mensajería y Notificaciones](#mensajería-y-notificaciones)
6. [Materiales e Inventario](#materiales-e-inventario)
7. [Documentos y Firmas](#documentos-y-firmas)
8. [Ubicación y Tracking](#ubicación-y-tracking)
9. [Sistema y Configuración](#sistema-y-configuración)

---

## Usuarios y Autenticación

### `users`
**Propósito:** Almacena información de todos los usuarios del sistema (admins, técnicos, clientes)

**Campos principales:**
- `id` - Identificador único
- `email` - Email único (login)
- `password` - Contraseña hasheada
- `full_name` - Nombre completo
- `role` - Rol: admin, technician, client
- `status` - Estado activo/inactivo (1/0)
- `phone`, `mobile` - Teléfonos de contacto
- `avatar` - Ruta de foto de perfil
- `address`, `city`, `state`, `zip`, `country` - Dirección
- `language` - Idioma preferido (es/en)
- `modulesaccess` - JSON con permisos de módulos
- `total_projects_completed` - Contador de proyectos completados
- `average_rating` - Calificación promedio (0.00-5.00)
- `email_verified` - Si el email fue verificado
- `is_verified` - Verificación general del usuario
- `login_attempts` - Intentos de login fallidos
- `locked_until` - Fecha hasta que está bloqueado
- `last_login` - Última fecha de login
- `deleted_at` - Soft delete (NULL = activo)

**Relaciones:**
- Uno a muchos con `projects` (client_id, assigned_technician_id, created_by)
- Uno a muchos con `sessions`
- Uno a muchos con `project_technicians`
- Uno a muchos con `ratings`

**Notas de uso:**
- Campo `allowed_branches` y `allowed_versions` son JSON arrays
- `modulesaccess` es un JSON con estructura de permisos por módulo

---

### `sessions`
**Propósito:** Maneja sesiones activas de usuarios (tokens de autenticación)

**Campos principales:**
- `id` - Identificador único
- `user_id` - FK a users
- `session_token` - Token único de 64 caracteres
- `ip_address` - IP del dispositivo
- `user_agent` - Navegador/app info
- `device_info` - JSON con info del dispositivo
- `branch_id` - Sucursal (si aplica)
- `expires_at` - Fecha de expiración
- `last_activity` - Última actividad
- `created_at` - Fecha de creación

**Relaciones:**
- Muchos a uno con `users`

**Notas de uso:**
- Duración configurada en `.env` (SESSION_LIFETIME=720 horas = 30 días)
- Se valida contra este token en cada request a la API

---

### `fcm_tokens`
**Propósito:** Almacena tokens de Firebase Cloud Messaging para push notifications

**Campos principales:**
- `id` - Identificador único
- `user_id` - FK a users
- `token` - Token FCM
- `device_type` - android/ios/web
- `device_name` - Nombre del dispositivo
- `is_active` - Token activo/inactivo

**Relaciones:**
- Muchos a uno con `users`

**Notas de uso:**
- Un usuario puede tener múltiples tokens (varios dispositivos)
- Los tokens inactivos no reciben notificaciones

---

## Proyectos y Gestión

### `projects`
**Propósito:** Tabla principal de proyectos de servicios técnicos

**Campos principales:**
- `id` - Identificador único
- `title` - Título del proyecto
- `description` - Descripción detallada
- `project_code` - Código único alfanumérico
- `client_id` - FK a users (cliente)
- `store_id` - FK a stores (tienda/sucursal)
- `client_name`, `client_phone`, `client_email` - Info del cliente
- `address`, `city` - Ubicación del trabajo
- `latitude`, `longitude` - Coordenadas GPS
- `assigned_technician_id` - FK a users (técnico asignado - campo legacy)
- `assigned_by` - FK a users (quién asignó)
- `assigned_at` - Fecha de asignación
- `status` - Estado: draft, published, assigned, in_progress, completed, cancelled, on_hold
- `priority` - Prioridad: low, medium, high, urgent
- `start_date`, `end_date` - Fechas planificadas
- `expected_duration` - Duración estimada en días
- `actual_completion_date` - Fecha real de finalización
- `progress_percentage` - Porcentaje de avance (0-100)
- `total_tasks`, `completed_tasks` - Contadores de tareas
- `estimated_cost`, `final_cost` - Costos
- `is_public` - Si es visible para todos los técnicos (1) o solo asignados (0)
- `created_by` - FK a users (creador)
- `deleted_at` - Soft delete

**Relaciones:**
- Muchos a uno con `users` (client_id, assigned_technician_id, assigned_by, created_by)
- Muchos a uno con `stores`
- Uno a muchos con `project_tasks`
- Uno a muchos con `project_photos`
- Uno a muchos con `project_technicians`
- Uno a muchos con `project_timeline`
- Uno a muchos con `ratings`

**Notas de uso:**
- `is_public = 1`: Visible en el feed para todos los técnicos
- `is_public = 0`: Solo visible para técnicos asignados en `project_technicians`
- El campo `assigned_technician_id` es legacy, se usa `project_technicians` para asignaciones múltiples

---

### `stores`
**Propósito:** Tiendas/sucursales de clientes donde se realizan trabajos

**Campos principales:**
- `id` - Identificador único
- `client_id` - FK a users (dueño de la tienda)
- `store_code` - Código único
- `store_name` - Nombre de la tienda
- `address`, `city`, `province` - Ubicación
- `phone` - Teléfono de la tienda
- `contact_person`, `contact_phone` - Contacto en sitio
- `latitude`, `longitude` - Coordenadas GPS
- `is_active` - Estado activo/inactivo
- `notes` - Notas adicionales
- `deleted_at` - Soft delete

**Relaciones:**
- Muchos a uno con `users` (client_id)
- Uno a muchos con `projects`

**Notas de uso:**
- Permite que un cliente tenga múltiples ubicaciones de trabajo
- Se usa para autocompletar dirección en proyectos

---

### `project_timeline`
**Propósito:** Registro cronológico de eventos del proyecto (auditoría)

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `user_id` - FK a users (quien realizó la acción)
- `event_type` - Tipo: created, published, assigned, started, task_completed, photo_uploaded, status_changed, completed, cancelled, commented
- `event_title` - Título del evento
- `event_description` - Descripción detallada
- `old_value`, `new_value` - Valores antes/después (para cambios)
- `created_at` - Timestamp del evento

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users`

**Notas de uso:**
- Se registra automáticamente en acciones importantes
- Útil para auditoría y historial de cambios
- Se muestra en la interfaz de detalle del proyecto

---

## Asignaciones y Aplicaciones

### `project_technicians`
**Propósito:** Técnicos actualmente asignados a un proyecto (asignaciones múltiples)

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `technician_id` - FK a users
- `role` - Rol: lead (líder), technician (técnico), assistant (asistente)
- `assigned_at` - Timestamp de asignación
- `assigned_by` - FK a users (quien asignó)
- `is_active` - Si la asignación está activa (1) o fue removida (0)
- `notes` - Notas sobre la asignación

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (technician_id, assigned_by)

**Notas de uso:**
- **TABLA PRINCIPAL** para determinar quién está asignado a un proyecto
- Un proyecto puede tener múltiples técnicos
- El `role` determina permisos: 'lead' puede modificar tareas de otros
- `is_active = 0` indica que fue desasignado (pero mantiene historial)

---

### `project_assignments`
**Propósito:** Historial completo de asignaciones y desasignaciones (auditoría)

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `technician_id` - FK a users
- `assigned_by` - FK a users (quien asignó)
- `assigned_at` - Fecha de asignación
- `unassigned_at` - Fecha de desasignación (NULL si aún asignado)
- `reason` - Razón de la desasignación

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (technician_id, assigned_by)

**Notas de uso:**
- **NO se usa actualmente** - reservado para futura implementación
- Propósito: Mantener historial completo de todas las asignaciones
- Se debe insertar registro al:
  - Asignar técnico a proyecto
  - Desasignar técnico de proyecto (actualizar unassigned_at)

---

### `project_applications`
**Propósito:** Solicitudes de técnicos para unirse a un proyecto

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `technician_id` - FK a users (técnico que aplica)
- `message` - Mensaje opcional del técnico
- `status` - Estado: pending, approved, rejected
- `applied_at` - Fecha de aplicación
- `reviewed_at` - Fecha de revisión
- `reviewed_by` - FK a users (supervisor que revisó)

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (technician_id, reviewed_by)

**Notas de uso:**
- **IMPLEMENTADO** - endpoint: `apply-to-project`
- Técnico aplica cuando ve un proyecto público
- Supervisor debe aprobar/rechazar solicitud
- Al aprobar, agregar registro en `project_technicians`
- **PENDIENTE**: Implementar interfaz de supervisor para gestionar solicitudes

---

## Tareas y Fotos

### `project_tasks`
**Propósito:** Tareas/checklist de un proyecto

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `title` - Título de la tarea
- `description` - Descripción detallada
- `task_order` - Orden de visualización
- `is_completed` - Si está completada (1) o pendiente (0)
- `requires_photo` - Si requiere foto de evidencia
- `completed_at` - Timestamp de completado
- `completed_by` - FK a users (quien completó)
- `completion_notes` - Notas del técnico sobre el trabajo realizado
- `created_at` - Fecha de creación

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (completed_by)
- Uno a muchos con `project_photos` (task_id)

**Notas de uso:**
- **IMPLEMENTADO**: Endpoints `complete-task` y `uncomplete-task`
- Solo puede modificar una tarea completada:
  - El técnico que la completó
  - El líder del equipo (role='lead')
  - Admin
- Al marcar tarea completada:
  - Se actualiza `progress_percentage` del proyecto automáticamente
  - Se registra en `project_timeline`
- `completion_notes` para documentar trabajo realizado

---

### `project_photos`
**Propósito:** Fotos/evidencias del proyecto

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `task_id` - FK a project_tasks (NULL si es foto general)
- `uploaded_by` - FK a users
- `filename` - Nombre del archivo
- `file_path` - Ruta completa del archivo
- `file_size` - Tamaño en bytes
- `mime_type` - Tipo MIME (image/jpeg, etc)
- `photo_type` - Tipo: before, during, after, other
- `caption` - Descripción/título
- `latitude`, `longitude` - Coordenadas donde se tomó
- `taken_at` - Fecha/hora de captura (del EXIF)
- `uploaded_at` - Fecha de subida al servidor

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `project_tasks` (opcional)
- Muchos a uno con `users` (uploaded_by)

**Notas de uso:**
- **PENDIENTE**: Implementar endpoint `upload-photo`
- Fotos pueden estar asociadas a una tarea específica o al proyecto general
- Se debe capturar GPS location y timestamp al tomar foto
- `photo_type` útil para organizar en galería

---

## Mensajería y Notificaciones

### `conversations`
**Propósito:** Conversaciones/chats (entre técnicos, con cliente, etc)

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `conversation_type` - Tipo: project_chat, private_chat
- `title` - Título de la conversación
- `created_at` - Fecha de creación
- `updated_at` - Última actualización

**Relaciones:**
- Muchos a uno con `projects`
- Uno a muchos con `messages`

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para chat
- `project_chat`: Chat grupal del proyecto
- `private_chat`: Mensajes privados 1-a-1

---

### `messages`
**Propósito:** Mensajes individuales dentro de una conversación

**Campos principales:**
- `id` - Identificador único
- `conversation_id` - FK a conversations
- `sender_id` - FK a users
- `message_type` - Tipo: text, image, file
- `message_text` - Texto del mensaje
- `file_url`, `file_name` - Para archivos adjuntos
- `is_read` - Si fue leído
- `read_at` - Fecha de lectura
- `sent_at` - Timestamp de envío

**Relaciones:**
- Muchos a uno con `conversations`
- Muchos a uno con `users` (sender_id)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para chat
- Soporta texto, imágenes y archivos
- Sistema de lectura para indicadores visuales

---

### `notifications`
**Propósito:** Notificaciones para usuarios

**Campos principales:**
- `id` - Identificador único
- `user_id` - FK a users (destinatario)
- `notification_type` - Tipo: project_assigned, project_application, task_completed, message_received, project_completed, rating_received, system
- `title` - Título de la notificación
- `message` - Mensaje de la notificación
- `action_url` - URL para abrir al hacer clic
- `related_project_id` - FK a projects (si aplica)
- `is_read` - Si fue leída
- `read_at` - Fecha de lectura
- `created_at` - Timestamp de creación

**Relaciones:**
- Muchos a uno con `users`
- Muchos a uno con `projects` (opcional)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para notificaciones
- Debe integrarse con `fcm_tokens` para push notifications
- `action_url` para deep linking en la app

---

## Materiales e Inventario

### `materials`
**Propósito:** Catálogo de materiales/insumos

**Campos principales:**
- `id` - Identificador único
- `name` - Nombre del material
- `description` - Descripción
- `unit` - Unidad de medida (metros, unidades, etc)
- `unit_price` - Precio unitario
- `stock_quantity` - Cantidad en inventario
- `is_active` - Activo/inactivo

**Relaciones:**
- Uno a muchos con `project_materials`

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para gestión de materiales
- Para tracking de insumos usados en proyectos

---

### `project_materials`
**Propósito:** Materiales usados en un proyecto específico

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `material_id` - FK a materials
- `quantity` - Cantidad usada
- `unit_price` - Precio al momento de uso
- `total_price` - Cantidad × precio
- `notes` - Notas adicionales
- `added_at` - Fecha de registro
- `added_by` - FK a users

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `materials`
- Muchos a uno con `users` (added_by)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para gestión de materiales
- Para cálculo de costos reales del proyecto

---

## Documentos y Firmas

### `invoices`
**Propósito:** Facturas generadas para proyectos

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `invoice_number` - Número único de factura
- `client_id` - FK a users
- `client_name`, `client_email`, `client_address` - Info del cliente
- `subtotal`, `tax_rate`, `tax_amount`, `total_amount` - Cálculos
- `currency` - Moneda (USD, DOP, etc)
- `notes` - Notas de la factura
- `pdf_file_path` - Ruta del PDF generado
- `pdf_generated_at` - Fecha de generación PDF
- `status` - Estado: draft, sent, paid, cancelled
- `sent_at`, `paid_at`, `due_date` - Fechas importantes
- `created_by` - FK a users

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (client_id, created_by)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para facturación
- Genera PDF automáticamente al cambiar a estado 'sent'

---

### `work_orders`
**Propósito:** Órdenes de trabajo para proyectos

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `order_number` - Número único de orden
- `pdf_file_path` - Ruta del PDF
- `pdf_generated_at` - Fecha de generación
- `status` - Estado: draft, sent, signed, cancelled
- `created_at` - Fecha de creación
- `created_by` - FK a users

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (created_by)
- Uno a muchos con `signatures`

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para órdenes de trabajo
- Documento que firma el cliente al iniciar/terminar trabajo

---

### `signatures`
**Propósito:** Firmas digitales de clientes/técnicos

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `work_order_id` - FK a work_orders (opcional)
- `signer_id` - FK a users
- `signer_name` - Nombre del firmante
- `signature_image_path` - Ruta de imagen de firma
- `latitude`, `longitude` - Ubicación donde se firmó
- `ip_address`, `device_info` - Info del dispositivo
- `signed_at` - Timestamp de firma

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `work_orders` (opcional)
- Muchos a uno con `users` (signer_id)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para firmas digitales
- Captura firma en canvas HTML5
- Guarda coordenadas GPS para validar ubicación

---

## Ubicación y Tracking

### `location_logs`
**Propósito:** Registro de ubicaciones GPS de técnicos

**Campos principales:**
- `id` - Identificador único
- `user_id` - FK a users
- `project_id` - FK a projects (NULL si es ubicación general)
- `latitude`, `longitude` - Coordenadas GPS
- `accuracy` - Precisión en metros
- `log_type` - Tipo: check_in, check_out, auto, manual
- `recorded_at` - Timestamp del registro

**Relaciones:**
- Muchos a uno con `users`
- Muchos a uno con `projects` (opcional)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para tracking
- `auto`: Registros automáticos periódicos
- `manual`: Usuario marcó ubicación manualmente
- `check_in/check_out`: Al entrar/salir de un proyecto
- Útil para rutas, tiempo en sitio, verificación

---

### `ratings`
**Propósito:** Calificaciones de técnicos por clientes

**Campos principales:**
- `id` - Identificador único
- `project_id` - FK a projects
- `technician_id` - FK a users (técnico calificado)
- `client_id` - FK a users (quien califica)
- `rating` - Calificación (1-5)
- `comment` - Comentario opcional
- `rated_at` - Timestamp de calificación

**Relaciones:**
- Muchos a uno con `projects`
- Muchos a uno con `users` (technician_id, client_id)

**Notas de uso:**
- **NO IMPLEMENTADO** - reservado para calificaciones
- Al insertar, recalcular `average_rating` del técnico
- Solo clientes pueden calificar a técnicos

---

## Sistema y Configuración

### `system_modules`
**Propósito:** Definición de módulos y permisos del sistema

**Campos principales:**
- `id` - Identificador único
- `code` - Código único del módulo
- `parent_code` - Código del módulo padre (para jerarquía)
- `module_name` - Nombre del módulo
- `module_key` - Clave única
- `module_type` - Tipo: module, parent, standalone
- `function_name` - Función JS para abrir
- `has_children` - Si tiene submódulos
- `available_permissions` - JSON con permisos disponibles
- `api_path` - Ruta del archivo PHP de API
- `js_path` - Ruta del archivo JS
- `db_table` - Tabla principal del módulo
- `icon_css`, `icon_code`, `icon_image` - Iconos
- `menu_label` - Etiqueta en menú
- `menu_order` - Orden de visualización
- `is_active` - Activo/inactivo
- `style` - Estilo de visualización
- `project_id` - ID del proyecto (0 para global)

**Relaciones:**
- Ninguna directa (tabla de configuración)

**Notas de uso:**
- Define estructura de módulos de la app
- `available_permissions` formato JSON: read, add, edit, delete, etc.
- Se copia a `users.modulesaccess` al asignar permisos

---

### `system_field_config`
**Propósito:** Configuración de campos por módulo y página

**Campos principales:**
- `id` - Identificador único
- `project_id` - ID del proyecto (0 para global)
- `module_code` - Código del módulo
- `page_number` - Número de página
- `field_id` - ID del campo
- `control_type` - Tipo de control (textbox, dropdown, etc)
- `style` - Estilo visual
- `customer` - Cliente específico (NULL para todos)
- `visibility` - Estado: visible, disabled, hidden
- `is_required` - Si es campo requerido

**Relaciones:**
- Ninguna directa (tabla de configuración)

**Notas de uso:**
- Permite personalizar formularios por cliente
- Controla visibilidad, estado y requerido de campos
- Se consulta al cargar formularios dinámicamente

---

## 📊 Resumen de Relaciones Principales

```
users
├─ projects (client_id, assigned_technician_id, created_by)
├─ project_technicians (technician_id)
├─ project_applications (technician_id)
├─ project_tasks (completed_by)
├─ project_photos (uploaded_by)
├─ sessions
└─ ratings

projects
├─ project_tasks
├─ project_photos
├─ project_technicians
├─ project_applications
├─ project_timeline
├─ project_materials
└─ ratings

stores
└─ projects
```

---

## ✅ Estado de Implementación

### Completamente Implementado
- ✅ `users` - Gestión de usuarios y autenticación
- ✅ `sessions` - Manejo de tokens de sesión
- ✅ `projects` - CRUD de proyectos
- ✅ `project_tasks` - Tareas con complete/uncomplete
- ✅ `project_technicians` - Asignaciones múltiples
- ✅ `project_applications` - Solicitudes de técnicos
- ✅ `project_timeline` - Registro de eventos
- ✅ `stores` - Tiendas/sucursales

### Parcialmente Implementado
- 🟡 `project_photos` - Estructura lista, falta endpoint upload
- 🟡 `project_assignments` - Tabla creada, no se usa

### Pendiente de Implementar
- ❌ `conversations` - Sistema de mensajería
- ❌ `messages` - Mensajes individuales
- ❌ `notifications` - Notificaciones push
- ❌ `fcm_tokens` - Tokens de Firebase
- ❌ `materials` - Catálogo de materiales
- ❌ `project_materials` - Materiales por proyecto
- ❌ `invoices` - Facturación
- ❌ `work_orders` - Órdenes de trabajo
- ❌ `signatures` - Firmas digitales
- ❌ `location_logs` - Tracking GPS
- ❌ `ratings` - Sistema de calificaciones

---

## 🔐 Notas de Seguridad

1. **Soft Deletes**: Las tablas `users`, `projects`, `stores` usan `deleted_at` para eliminación lógica
2. **Auditoría**: `project_timeline` y `project_assignments` mantienen historial completo
3. **Permisos**: Validar permisos en `project_technicians` antes de permitir acciones
4. **Tokens**: Los `session_token` expiran según configuración (30 días default)
5. **GPS**: Capturar ubicación en acciones críticas (fotos, firmas, check-in/out)

---

## 📝 Convenciones de Nomenclatura

- **Tablas**: Plural en inglés (projects, users)
- **FK**: nombre_id (project_id, user_id)
- **Timestamps**: created_at, updated_at, deleted_at
- **Soft delete**: deleted_at IS NULL para registros activos
- **Enums**: lowercase, snake_case
- **Estados**: Siempre enum para consistencia
- **JSON**: longtext con JSON válido

---

**Documento generado automáticamente**  
**Última actualización:** 22/12/2025
