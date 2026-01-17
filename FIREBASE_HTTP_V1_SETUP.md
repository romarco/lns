# Firebase Cloud Messaging - HTTP v1 Setup

## ⚡ Migración a HTTP v1 (API Moderna)

Google ha deprecado la API heredada de FCM y recomienda usar **HTTP v1**, que ofrece:
- ✅ Mayor seguridad con OAuth 2.0
- ✅ Mensajes específicos por plataforma (Android/iOS)
- ✅ Mejor manejo de errores
- ✅ Soporte a largo plazo garantizado

---

## 📋 Pasos de Configuración

### 1. Crear Proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Click en **"Agregar proyecto"**
3. Nombre: `Lawrance Network Services`
4. Acepta términos y continúa
5. Deshabilita Google Analytics (opcional)
6. Click en **"Crear proyecto"**

---

### 2. Habilitar Cloud Messaging API

1. En Firebase Console, ve a **Project Settings** (⚙️)
2. Click en la pestaña **"Cloud Messaging"**
3. Copia el **Project ID** (ejemplo: `lawrance-network-services`)
4. Actualiza en tu código:
   ```php
   // sys/notifications.php línea ~20
   define('FIREBASE_PROJECT_ID', 'lawrance-network-services');
   ```

---

### 3. Crear Cuenta de Servicio (Service Account)

Este paso es **CRÍTICO** para HTTP v1:

1. En Firebase Console, ve a **Project Settings** (⚙️)
2. Selecciona la pestaña **"Service accounts"**
3. Click en **"Generate new private key"**
4. Confirma y descarga el archivo JSON (ejemplo: `lawrance-network-services-firebase-adminsdk-xxxxx.json`)
5. **IMPORTANTE**: Renombra el archivo a `firebase-credentials.json`
6. Coloca el archivo en:
   ```
   C:\Users\romar\Dropbox\xampp\htdocs\MangoleStudio\workspace\app-lawrance-network-services\1.0.0\config\firebase-credentials.json
   ```

⚠️ **SEGURIDAD**: Este archivo contiene claves privadas. **NO** lo subas a Git. Agrégalo a `.gitignore`:
```
config/firebase-credentials.json
```

---

### 4. Registrar Aplicación Android

1. En Firebase Console, click en el ícono **Android** (o "Agregar app")
2. **Nombre del paquete**: `com.app-lawrance-network-services.app`
   - Debe coincidir EXACTAMENTE con el `id` en `config.xml`
3. **Apodo de la app** (opcional): "LNS Android"
4. **Certificado SHA-1** (opcional por ahora):
   - Para desarrollo: no es necesario
   - Para producción: genera con `keytool -list -v -keystore debug.keystore`
5. Click en **"Registrar app"**
6. **Descarga `google-services.json`**
7. Coloca el archivo en:
   ```
   C:\Users\romar\Dropbox\xampp\htdocs\apps\Factus\platforms\android\app\google-services.json
   ```

---

### 5. Registrar Aplicación iOS (si aplica)

1. En Firebase Console, click en el ícono **iOS** (manzana)
2. **Bundle ID**: `com.app-lawrance-network-services.app`
3. **Apodo de la app** (opcional): "LNS iOS"
4. Click en **"Registrar app"**
5. **Descarga `GoogleService-Info.plist`**
6. Coloca el archivo en:
   ```
   C:\Users\romar\Dropbox\xampp\htdocs\apps\Factus\platforms\ios\GoogleService-Info.plist
   ```
7. **APNs (Apple Push Notification service)**:
   - Ve a Firebase Console > Project Settings > Cloud Messaging
   - En la sección iOS, sube tu certificado APNs (.p8 o .p12)

---

### 6. Verificar Estructura de Archivos

Tu proyecto debe tener esta estructura:

```
MangoleStudio\workspace\app-lawrance-network-services\1.0.0\
├── config\
│   ├── config_global.php
│   └── firebase-credentials.json    ← NUEVO (Service Account)
├── sys\
│   └── notifications.php             ← Actualizado a HTTP v1
└── www\
    └── js\
        ├── notifications.js
        └── notification-panel.js

apps\Factus\
├── platforms\
│   ├── android\
│   │   └── app\
│   │       └── google-services.json  ← Para Android
│   └── ios\
│       └── GoogleService-Info.plist  ← Para iOS (si aplica)
└── config.xml
```

---

### 7. Generar CRON Token

Para las notificaciones programadas, genera un token seguro:

**PowerShell**:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Copia el resultado y actualiza en `sys/notifications.php`:
```php
define('CRON_TOKEN', 'abc123xyz789...');
```

---

### 8. Reconstruir Proyecto Cordova

Después de agregar los archivos de configuración:

```bash
cd "C:\Users\romar\Dropbox\xampp\htdocs\apps\Factus"

# Verificar que el plugin FCM esté instalado
cordova plugin ls

# Si no está, instalarlo
cordova plugin add cordova-plugin-fcm-with-dependecy-updated

# Reconstruir plataformas
cordova platform remove android
cordova platform add android
cordova build android
```

---

## 🧪 Pruebas

### Test 1: Verificar Credenciales

Crea un archivo de prueba `test-firebase.php`:

```php
<?php
require_once 'sys/notifications.php';

// Test 1: Verificar que el archivo de credenciales existe
if (!file_exists(FIREBASE_CREDENTIALS_PATH)) {
    die("ERROR: firebase-credentials.json no encontrado\n");
}

// Test 2: Verificar Project ID
if (FIREBASE_PROJECT_ID === 'YOUR_FIREBASE_PROJECT_ID') {
    die("ERROR: FIREBASE_PROJECT_ID no configurado\n");
}

echo "Project ID: " . FIREBASE_PROJECT_ID . "\n";

// Test 3: Obtener Access Token
$token = getFirebaseAccessToken();
if ($token) {
    echo "✓ Access token obtenido correctamente: " . substr($token, 0, 50) . "...\n";
} else {
    echo "✗ Error al obtener access token\n";
}
```

Ejecuta:
```bash
php test-firebase.php
```

### Test 2: Enviar Notificación de Prueba

```bash
curl -X POST http://localhost/MangoleStudio/workspace/app-lawrance-network-services/1.0.0/sys/notifications.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-notification",
    "session_token": "YOUR_ADMIN_SESSION_TOKEN",
    "user_id": 1,
    "notification_type": "test",
    "title": "Test FCM v1",
    "message": "Prueba de notificación con HTTP v1",
    "send_push": true
  }'
```

---

## 🔍 Troubleshooting

### Error: "Firebase credentials file not found"

**Solución**: Verifica que `firebase-credentials.json` esté en `config/`:
```bash
ls "C:\Users\romar\Dropbox\xampp\htdocs\MangoleStudio\workspace\app-lawrance-network-services\1.0.0\config\firebase-credentials.json"
```

### Error: "Invalid private key"

**Solución**: El archivo JSON descargado de Firebase está corrupto o mal formateado. Descárgalo nuevamente:
1. Firebase Console > Project Settings > Service Accounts
2. Generate new private key

### Error: "Invalid access token" o HTTP 401

**Solución**: El token OAuth2 expiró o es inválido:
- El token se genera automáticamente cada vez
- Verifica que las credenciales sean correctas
- Asegúrate de que la cuenta de servicio tenga permisos de "Firebase Cloud Messaging Admin"

### Error: HTTP 404 "Project not found"

**Solución**: El `FIREBASE_PROJECT_ID` está mal configurado:
```php
// Debe coincidir con el Project ID en Firebase Console
define('FIREBASE_PROJECT_ID', 'lawrance-network-services'); // Cambia esto
```

### Error: "INVALID_ARGUMENT" o token no válido

**Solución**: El token FCM del dispositivo es inválido o expiró:
- El sistema automáticamente marca tokens inválidos como `is_active = 0`
- El usuario debe volver a abrir la app para registrar un nuevo token

### Notificaciones no llegan en iOS

**Solución**:
1. Verifica que el certificado APNs esté configurado en Firebase Console
2. Asegúrate de que el Bundle ID coincida exactamente
3. En producción, necesitas un certificado APNs de producción (no desarrollo)

---

## 📊 Ventajas de HTTP v1

| Característica | API Heredada | HTTP v1 |
|---|---|---|
| Autenticación | Server Key estática | OAuth 2.0 dinámico |
| Seguridad | ⚠️ Key expuesta | ✅ Tokens temporales |
| Plataforma específica | ❌ No soportado | ✅ Android/iOS configs |
| Manejo de errores | ⚠️ Básico | ✅ Detallado |
| Soporte futuro | ❌ Deprecado | ✅ Garantizado |
| Token inválido | Manual | ✅ Auto-detección |

---

## 🔐 Seguridad

### Proteger firebase-credentials.json

**Opción 1: .gitignore**
```
config/firebase-credentials.json
```

**Opción 2: Fuera del DocumentRoot**
```php
define('FIREBASE_CREDENTIALS_PATH', '/var/secrets/firebase-credentials.json');
```

**Opción 3: Variable de entorno**
```php
$credentialsPath = getenv('FIREBASE_CREDENTIALS_PATH') ?: __DIR__ . '/../config/firebase-credentials.json';
```

### Permisos del archivo

En Linux/Mac:
```bash
chmod 600 config/firebase-credentials.json
chown www-data:www-data config/firebase-credentials.json
```

---

## 📚 Referencias

- **Firebase HTTP v1 API**: https://firebase.google.com/docs/cloud-messaging/migrate-v1
- **Service Account Keys**: https://console.cloud.google.com/iam-admin/serviceaccounts
- **OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **FCM Errors**: https://firebase.google.com/docs/cloud-messaging/send-message#rest

---

## ✅ Checklist Final

Antes de desplegar a producción:

- [ ] `firebase-credentials.json` descargado y colocado en `config/`
- [ ] `FIREBASE_PROJECT_ID` configurado en `notifications.php`
- [ ] `google-services.json` en `platforms/android/app/`
- [ ] `GoogleService-Info.plist` en `platforms/ios/` (si aplica)
- [ ] Certificado APNs configurado para iOS (si aplica)
- [ ] Plugin FCM instalado: `cordova plugin ls`
- [ ] Plataformas reconstruidas: `cordova build`
- [ ] Archivo de credenciales en `.gitignore`
- [ ] Permisos del archivo correctos (600)
- [ ] Test de notificación exitoso
- [ ] `CRON_TOKEN` generado y configurado

---

**Migración completada a HTTP v1** ✅

¿Problemas? Revisa los logs:
```bash
tail -f /var/log/apache2/error.log  # Linux
# o
Get-Content "C:\xampp\apache\logs\error.log" -Tail 50 -Wait  # Windows
```
