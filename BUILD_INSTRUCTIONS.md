# 📱 Guía para Compilar App con GitHub Actions

Este proyecto utiliza **GitHub Actions** para compilar automáticamente la aplicación Android en la nube. Tienes dos métodos disponibles:

---

## 🚀 Método 1: Compilación desde MangoleStudio IDE (Recomendado)

### Requisitos Previos

1. **Repositorio en GitHub**
   - Tu proyecto debe estar en un repositorio de GitHub (público o privado)

2. **Personal Access Token de GitHub**
   - Ve a: https://github.com/settings/tokens
   - Click en "Generate new token" → "Generate new token (classic)"
   - Nombre: `MangoleStudio Builder`
   - **Permisos requeridos:**
     - ✅ `repo` (acceso completo al repositorio)
     - ✅ `workflow` (para disparar GitHub Actions)
   - Expiration: Sin expiración o 1 año
   - **¡Importante!** Copia el token (solo se muestra una vez)

3. **Secret GOOGLE_SERVICES_JSON en GitHub**
   - Obtén `google-services.json` desde Firebase Console
   - Codifícalo en base64:
     ```bash
     # En Linux/Mac:
     base64 google-services.json
     
     # En Windows PowerShell:
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json"))
     ```
   - Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
   - Click en **New repository secret**
   - Nombre: `GOOGLE_SERVICES_JSON`
   - Valor: el contenido base64 copiado

### Uso del Mobile Builder

1. **Accede al Builder**
   - Abre MangoleStudio en tu navegador
   - Ve a **Tools** → **Mobile App Builder**
   - O accede directamente: `http://localhost/MangoleStudio/tools/mobile-builder.php`

2. **Configura GitHub (primera vez)**
   - **GitHub Token**: Pega tu Personal Access Token
   - **Repositorio**: Formato `usuario/nombre-repo`
     - Ejemplo: `tuusuario/lawrance-app`
     - Ejemplo: `company/mobile-app`

3. **Inicializa Git automáticamente** ⭐ NUEVO
   - Click en **🔍 Verificar Estado Git**
   - Si no está inicializado, click en **📦 Inicializar Git**
   - El sistema automáticamente:
     - ✅ Crea el repositorio Git local
     - ✅ Crea .gitignore con exclusiones necesarias
     - ✅ Hace el commit inicial
     - ✅ Conecta con tu repositorio de GitHub
   
4. **Sube tu código a GitHub** ⭐ NUEVO
   - Click en **⬆️ Subir a GitHub**
   - El sistema automáticamente:
     - ✅ Agrega todos los archivos (git add)
     - ✅ Crea el commit con timestamp
     - ✅ Sube todo a GitHub (git push)
     - ✅ ¡Listo en segundos!

5. **Selecciona Opciones de Build**
   - **Proyecto**: app-lawrance-network-services
   - **Versión**: 1.0.0 (o la versión que desees compilar)
   - **Plataforma**: Android
   - **Tipo de Build**: 
     - **Debug** (para pruebas)
     - **Release** (para producción - requiere keystore configurado)

6. **Inicia la Compilación**
   - Click en **🚀 Compilar en GitHub Actions**
   - El sistema automáticamente:
     - ✅ Dispara el workflow en GitHub
     - ✅ Monitorea el progreso cada 30 segundos
     - ✅ Muestra logs en la consola del IDE
     - ✅ Notifica cuando el build esté listo

7. **Descarga el APK**
   - Tiempo típico de compilación: **5-10 minutos**
   - Cuando el build termine exitosamente:
     - Aparecerá el botón **📥 Descargar APK**
   - Click para descargar el archivo ZIP
   - Descomprime el ZIP para obtener el APK
   - Instala el APK en tu dispositivo Android

### ✨ Flujo Completo Automático

```
1. Verificar Git → 2. Inicializar (si es necesario) → 3. Subir a GitHub → 4. Compilar → 5. Descargar APK
```

**¡TODO desde el navegador, sin comandos manuales!**

### Verificar Estado de Build

- Si cierras el navegador durante la compilación:
  - Vuelve a abrir el Mobile Builder
  - Click en **🔄 Verificar Estado**
  - Ingresa el mismo token y repositorio
  - El sistema detectará el build en curso

---

## 🛠️ Método 2: Compilación Manual con GitHub Actions

### 1. Crear Repositorio en GitHub

```bash
cd C:\Users\romar\Dropbox\xampp\htdocs\MangoleStudio\workspace\app-lawrance-network-services\1.0.0

# Inicializar git
git init

# Crear .gitignore
echo "node_modules/" > .gitignore
echo "platforms/" >> .gitignore
echo "plugins/" >> .gitignore
echo "config/firebase-credentials.json" >> .gitignore
echo ".env" >> .gitignore

# Hacer commit inicial
git add .
git commit -m "Initial commit"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/lawrance-network-services.git
git branch -M main
git push -u origin main
```

### 2. Configurar Google Services en GitHub Secrets

El archivo `google-services.json` no debe subirse a GitHub por seguridad. En su lugar:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Nombre: `GOOGLE_SERVICES_JSON`
5. Valor: Pega todo el contenido del archivo `google-services.json`
6. Save

### 3. Ejecutar Build Automático

Una vez subido a GitHub, el workflow se ejecuta automáticamente cuando:
- Haces push a `main` o `develop`
- Creas un Pull Request
- Lo ejecutas manualmente desde Actions tab

### 4. Descargar APK Compilado

1. Ve a tu repositorio en GitHub
2. Click en **"Actions"**
3. Selecciona el workflow ejecutado
4. En "Artifacts", descarga `app-debug.apk`
5. Transfiere el APK a tu teléfono Android
6. Instala (debes habilitar instalación de apps desconocidas)

---

## 📱 Compilación Local (Alternativa)

Si prefieres compilar localmente sin GitHub:

### Requisitos:
- Node.js 18+
- Java JDK 17
- Android SDK (Android Studio)
- Cordova CLI

### Comandos:

```bash
cd C:\Users\romar\Dropbox\xampp\htdocs\MangoleStudio\workspace\app-lawrance-network-services\1.0.0

# Instalar Cordova globalmente
npm install -g cordova

# Instalar dependencias
npm install

# Agregar plataforma Android
cordova platform add android

# Instalar todos los plugins (desde config.xml)
cordova prepare

# Compilar APK Debug
cordova build android --debug

# El APK estará en:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔐 Compilar APK Firmado (Release)

Para crear un APK listo para Google Play Store:

### 1. Crear Keystore

```bash
keytool -genkey -v -keystore lawrance.keystore -alias lawrance -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Crear archivo build.json

```json
{
  "android": {
    "release": {
      "keystore": "lawrance.keystore",
      "storePassword": "tu_password",
      "alias": "lawrance",
      "password": "tu_password",
      "keystoreType": ""
    }
  }
}
```

### 3. Compilar Release

```bash
cordova build android --release --buildConfig=build.json
```

El APK firmado estará en:
```
platforms/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Solución de Problemas

### Error: "Google Services file missing"
- Asegúrate de que `google-services.json` esté en `platforms/android/app/`
- O configúralo como GitHub Secret

### Error: "Plugin not found"
```bash
cordova plugin add NOMBRE_DEL_PLUGIN
```

### Error: "Android SDK not found"
- Instala Android Studio
- Configura ANDROID_HOME en variables de entorno

### Rebuild completo
```bash
cordova clean
rm -rf platforms plugins node_modules
npm install
cordova platform add android
cordova prepare
cordova build android
```

---

## 📦 Estructura de Archivos

```
1.0.0/
├── .github/
│   └── workflows/
│       └── build-android.yml    ← GitHub Actions config
├── www/                         ← Tu código web
├── config.xml                   ← Configuración Cordova
├── package.json                 ← Dependencias
└── platforms/                   ← (Generado, no subir a Git)
    └── android/
        └── app/
            ├── google-services.json
            └── build/
                └── outputs/
                    └── apk/
                        ├── debug/
                        │   └── app-debug.apk
                        └── release/
                            └── app-release.apk
```

---

## ✅ Checklist Pre-Build

Antes de compilar, verifica:

- [ ] `config.xml` actualizado con ID y versión correctos
- [ ] Todos los plugins listados en `config.xml`
- [ ] `google-services.json` presente (local) o configurado (GitHub)
- [ ] Permisos Android en `config.xml`
- [ ] Icons y splash screens configurados
- [ ] `.gitignore` configurado correctamente
- [ ] Variables de entorno en `.env` (no subir a Git)

---

## 🌐 URLs Útiles

- **GitHub Actions**: https://github.com/TU_USUARIO/TU_REPO/actions
- **Cordova Docs**: https://cordova.apache.org/docs/
- **Android Studio**: https://developer.android.com/studio
- **Signing APKs**: https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#signing-an-app

---

**¿Necesitas ayuda?** Revisa los logs en GitHub Actions o ejecuta con `--verbose`:
```bash
cordova build android --verbose
```
