# Plantilla de Proyecto Cordova para Mangole Studio

Esta es la estructura base de un proyecto Cordova que se usa como template en Mangole Studio.

## Estructura del Proyecto

```
mobile/
├── config.xml              # Configuración de Cordova
├── package.json            # Dependencias NPM
├── platforms/              # Plataformas (Android, iOS)
├── plugins/                # Plugins instalados
├── hooks/                  # Scripts de build
└── www/                    # Carpeta principal de la aplicación
    ├── index.html          # Punto de entrada
    ├── css/
    │   ├── index.css       # Estilos base
    │   └── styles.css      # Estilos de layouts (generados)
    ├── js/
    │   ├── index.js        # Script principal
    │   └── screens/
    │       └── screens.js  # Gestor de pantallas
    └── img/                # Imágenes y recursos
```

## Uso

Al crear un nuevo proyecto móvil desde Mangole Studio, esta estructura se copiará a `workspace/{proyecto}/{version}/`.

Los archivos generados desde el editor (formularios/screens) se guardarán en:
- `www/js/screens/{nombre}.js` - Código JavaScript de la pantalla
- `www/css/styles.css` - CSS del layout seleccionado (sobrescrito)

## Comandos Cordova

```bash
# Agregar plataforma
cordova platform add android
cordova platform add ios

# Agregar plugin
cordova plugin add cordova-plugin-device

# Compilar
cordova build android
cordova build ios

# Ejecutar
cordova run android
cordova run ios
```

## Placeholders

Los archivos con placeholders serán reemplazados al crear el proyecto:
- `{PROJECT_SLUG}` - Slug del proyecto
- `{PROJECT_NAME}` - Nombre del proyecto
- `{VERSION}` - Versión activa
