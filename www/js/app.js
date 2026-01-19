/**
 * MangoleStudio Mobile App
 * Bootstrap principal con autenticación persistente
 * Compatible con arquitectura web y sistema de auth
 */
// Inicializar objeto forms
if (!window.forms) {
    window.forms = {};
}
var forms = window.forms;
var app = {
    data: {
        modulesaccess: null,
        fieldConfigs: null,      // Configuraciones de campos cargadas
        config: {
            requiresAuth: true,      // true = requiere login, false = app pública
            authFlow: 'simple',      // 'simple' o 'multi-branch'
            version: '1.0.0',
            projectName: 'App: Lawrance Network Services',
            apiUrl: 'https://lawrancenetworkservices.com/sys/',       // ⚠️ CONFIGURAR: URL del servidor + /sys/
            serverRootUrl: 'https://lawrancenetworkservices.com',     // ⚠️ CONFIGURAR: URL raíz del servidor
            offlineMode: true,
            language: 'es',
            languageIndex: 0,
            // ===== CONFIGURACIÓN DE TRACKING GPS =====
            tracking: {
                enabled: true,                    // Habilitar/deshabilitar completamente
                mode: 'time',                     // 'time' o 'movement'
                interval: 10,                     // Minutos (si mode='time')
                activateMode: 'manual'            // 'always' o 'manual'
                // - 'always': tracking continuo en background
                // - 'manual': solo cuando técnico presiona "Iniciar trabajo"
            }
        }
    },
    initialize: function() {
        app.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener(window.cordova ? 'deviceready' : 'DOMContentLoaded', app.onDeviceReady, false);
        document.addEventListener('pause', app.onPause, false);
        document.addEventListener('resume', app.onResume, false);
        //BACK BUTTON
		document.addEventListener("backbutton", function(e){
			e.preventDefault();
			
			// Cerrar alertas y pickers antes de navegar
			if (window.msgalert && window.msgalert.opened == true){
				window.msgalert.removeAlert();
				return false;
			}
			if (window.jlistpicker && window.jlistpicker.opened == true){
				window.jlistpicker.removePicker();
				return false;
			}
			if (window.msginput && window.msginput.opened == true){
				window.msginput.removeMsg();
				return false;
			}

            if ( document.querySelector('#messenger-user-lightbox') ) {
				document.querySelector('#messenger-user-lightbox').remove();
				return false;
			}
			
			// Verificar si hay historial de navegación
			if (window.history.length > 1) {
				// Navegar atrás - esto dispara popstate automáticamente
				window.history.back();
			} else {
				// No hay historial - salir de la app
				navigator.app.exitApp();
			}
		}, false);
		
		// Escuchar cambios en el historial para cerrar modales automáticamente
		window.addEventListener('popstate', function(event) {
            // Obtener el hash actual después de la navegación
            const currentHash = window.location.hash || '#';
            
            // Revisar todos los formularios abiertos
            for (const slug in forms) {
                if (forms[slug] && forms[slug].opened && forms[slug].pages) {
                    // Revisar cada página del formulario
                    for (let pageIndex = 0; pageIndex < forms[slug].pages.length; pageIndex++) {
                        const pageControl = forms[slug].pages[pageIndex].controls[0];
                        if (pageControl && pageControl.controlType === 'form') {
                            const pageElement = document.getElementById(pageControl.id);
                            
                            // Si la página existe en el DOM
                            if (pageElement) {
                                // Verificar si esta página específica ya no está en el hash
                                const pageSlug = slug + '_p' + pageIndex;
                                if (!currentHash.includes(pageSlug)) {
                                    // Cerrar esta página sin modificar el historial (skipHistory = true)
                                    forms[slug].hide(pageIndex, null, true);
                                }
                            }
                        }
                    }
                }
            }
        });
    },
    onDeviceReady: function() {
        // Detectar y configurar idioma del dispositivo
        app.getLanguage();
        
        // Aplicar tema guardado
        app.applyTheme();
        
        // Inicializar Mangole Framework
        app.initializeMangole();
        
        // Cargar configuración
        app.loadConfig();
        
        // Inicializar SQLite si está habilitado
        if (typeof SQLite !== 'undefined') {
            var dbName = app.data.config.projectName.toLowerCase().replace(/\s+/g, '_') + '.db';
            var dbVersion = parseFloat(app.data.config.version) || 1;
            
            SQLite.init(dbName, dbVersion, function(error, db) {
                if (error) {
                    console.error('[app] Error inicializando SQLite:', error.message);
                }
            });
        }
        
        // Iniciar flujo de autenticación
        app.initializeAuth();
    },
    initializeMangole: function() {//Inicializar Mangole Framework
        // Inicializar objeto forms si no existe
        if (!window.forms) {
            window.forms = {};
        }
    },
    getLanguage: function() {// Detectar y configurar idioma desde user_data o sistema
        var languageMap = {
            'es': { code: 'es', index: 0 },
            'en': { code: 'en', index: 1 }
        };
        
        var langCode = 'es'; // Default
        
        // 1. Intentar obtener idioma de user_data
        var userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                var parsed = JSON.parse(userData);
                if (parsed.user && parsed.user.language) {
                    langCode = parsed.user.language;
                    console.log('[app] Idioma desde user_data:', langCode);
                    var lang = languageMap[langCode] || languageMap['es'];
                    app.data.config.language = lang.code;
                    app.data.config.languageIndex = lang.index;
                    
                    // Actualizar controls.js si está disponible
                    if (typeof mangole !== 'undefined' && typeof mangole.languageIndex !== 'undefined') {
                        mangole.languageIndex = lang.index;
                    }
                    return;
                }
            } catch (e) {
                console.error('[app] Error parseando user_data:', e);
            }
        }
        
        // 2. Si no existe user_data, detectar idioma del sistema
        if (window.cordova && navigator.globalization && navigator.globalization.getPreferredLanguage) {
            navigator.globalization.getPreferredLanguage(
                function(language) {
                    langCode = language.value.substring(0, 2).toLowerCase();
                    console.log('[app] Idioma desde sistema:', langCode);
                    var lang = languageMap[langCode] || languageMap['es'];
                    app.data.config.language = lang.code;
                    app.data.config.languageIndex = lang.index;
                    
                    if (typeof mangole !== 'undefined' && typeof mangole.languageIndex !== 'undefined') {
                        mangole.languageIndex = lang.index;
                    }
                },
                function() {
                    console.log('[app] Error detectando idioma, usando español');
                    app.data.config.language = 'es';
                    app.data.config.languageIndex = 0;
                    
                    if (typeof mangole !== 'undefined' && typeof mangole.languageIndex !== 'undefined') {
                        mangole.languageIndex = 0;
                    }
                }
            );
        } else {
            // Fallback: español
            console.log('[app] Idioma por defecto: español');
            app.data.config.language = 'es';
            app.data.config.languageIndex = 0;
            
            if (typeof mangole !== 'undefined' && typeof mangole.languageIndex !== 'undefined') {
                mangole.languageIndex = 0;
            }
        }
    },
    hasConnection: function() {
    /**
     * Verifica conexión a internet de forma confiable
     * Compatible con Cordova (plugin network-information) y navegadores web
     * @returns {boolean} true si hay conexión, false si no
     */
        // Si estamos en Cordova y el plugin está disponible
        if (window.cordova && navigator.connection && typeof navigator.connection.type !== 'undefined') {
            // Usar plugin cordova-plugin-network-information
            // Connection.NONE es cuando no hay conexión
            // Connection.UNKNOWN es cuando no se puede determinar
            return navigator.connection.type !== Connection.NONE && 
                   navigator.connection.type !== Connection.UNKNOWN;
        }
        
        // Fallback para navegadores web
        return navigator.onLine;
    },
    applyTheme: function() {// Aplicar tema guardado
        const savedTheme = localStorage.getItem('app_theme') || 'light';
        const html = document.documentElement;
        
        // Remover clases de tema anteriores
        html.classList.remove('theme-light', 'theme-dark');
        
        if (savedTheme === 'auto') {
            // Detectar preferencia del sistema
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
            
            // Escuchar cambios en la preferencia del sistema
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                    html.classList.remove('theme-light', 'theme-dark');
                    html.classList.add(e.matches ? 'theme-dark' : 'theme-light');
                    app.updateThemeColor(e.matches);
                });
            }
        } else {
            html.classList.add('theme-' + savedTheme);
        }
        
        // Actualizar meta theme-color
        app.updateThemeColor(html.classList.contains('theme-dark'));
    },
    updateThemeColor: function(isDark) {// Actualizar color de la barra del navegador
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = isDark ? '#1a1a2e' : '#667eea';
    },
    onPause: function() { // App pausada (enviada a background)
        // Guardar estado si es necesario
        // Pausar sincronizaciones
    },
    onResume: function() {// App resumida (vuelta de background)
        // Refrescar datos si es necesario
        // Reanudar sincronizaciones
    },
    loadConfig: function() {// Cargar configuración de la app
        // Configuración está en app.data.config
        // Crear alias global para compatibilidad con otros módulos
        //window.appConfig = this.data.config;
        
        //console.log('[app] Configuración cargada:', this.data.config);
    },
    applyLocationTracking: function(shareLocation) {// Aplicar configuración de tracking según preferencia del usuario
        if (!app.data.config.tracking) {
            console.warn('[app] app.data.config.tracking no existe');
            return;
        }
        
        switch(shareLocation) {
            case 'never':
                app.data.config.tracking.enabled = false;
                app.data.config.tracking.activateMode = 'manual';
                console.log('[app] Tracking deshabilitado (never)');
                break;
                
            case 'working':
                app.data.config.tracking.enabled = true;
                app.data.config.tracking.activateMode = 'manual';
                console.log('[app] Tracking habilitado en modo manual (working)');
                break;
                
            case 'always':
                app.data.config.tracking.enabled = true;
                app.data.config.tracking.activateMode = 'always';
                
                // Iniciar tracking automático
                if (typeof LocationService !== 'undefined') {
                    LocationService.init();
                }
                
                console.log('[app] Tracking habilitado en modo continuo (always)');
                break;
                
            default:
                console.warn('[app] Valor de share_location inválido:', shareLocation);
        }
    },
    initializeAuth: function() {// Iniciar flujo de autenticación
        // Si NO requiere autenticación → descargar TODOS los módulos disponibles
        if (!app.data.config.requiresAuth) {
            app.initializePublicApp();
            return;
        }
        
        // Requiere autenticación → verificar sesión desde user_data
        var userData = localStorage.getItem('user_data');
        var lastVerified = localStorage.getItem('last_verified');
        var now = Date.now();
        
        if (!userData) {
            // NO hay sesión → cargar login
            app.loadLogin();
            return;
        }
        
        // Parsear user_data para obtener session_token y modulesaccess
        var sessionToken;
        var parsed;
        try {
            parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
            
            // Llenar app.data.modulesaccess desde localStorage
            if (parsed.modulesaccess) {
                app.data.modulesaccess = parsed.modulesaccess;
            }
        } catch (e) {
            console.error('[app] Error parseando user_data:', e);
            app.loadLogin();
            return;
        }
        
        // HAY sesión → verificar si pasaron 29 días (antes de los 30 días del servidor)
        var twentyNineDays = 29 * 24 * 60 * 60 * 1000;
        var shouldVerify = !lastVerified || (now - parseInt(lastVerified)) > twentyNineDays;
        
        if (shouldVerify) {
            app.checkInternetAndVerify(sessionToken);
        } else {
            // Aplicar tracking desde user_data
            if (parsed.user && parsed.user.settings && parsed.user.settings.share_location) {
                app.applyLocationTracking(parsed.user.settings.share_location);
            }
            
            // Verificar si módulos están descargados antes de cargar app
            app.ensureModulesDownloaded(parsed.modulesaccess);
        }
    },
    checkInternetAndVerify: function(token) {// Verificar conexión y validar sesión con backend
        // Verificar conexión a internet
        if (!app.hasConnection()) {
            // Sin internet → verificar módulos descargados
            app.ensureModulesDownloaded(app.data.modulesaccess);
            return;
        }
        
        app.verifySessionAndLoad(token);
    },
    verifySessionAndLoad: function(token) {// Verificar sesión con backend
        fetch(app.data.config.apiUrl + 'auth.php?action=verify&session_token=' + encodeURIComponent(token))
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.authenticated) {
                    localStorage.setItem('last_verified', Date.now().toString());
                    
                    // Aplicar tracking desde user_data
                    const userData = JSON.parse(localStorage.getItem('user_data'));
                    if (userData && userData.user && userData.user.settings && userData.user.settings.share_location) {
                        app.applyLocationTracking(userData.user.settings.share_location);
                    }
                    
                    // Verificar módulos antes de cargar app
                    app.ensureModulesDownloaded(app.data.modulesaccess);
                } else {
                    localStorage.removeItem('last_verified');
                    localStorage.removeItem('user_data');
                    app.loadLogin();
                }
            })
            .catch(function(error) {
                // Error de red → permitir uso offline si hay módulos
                // Aplicar tracking desde user_data
                const userData = JSON.parse(localStorage.getItem('user_data'));
                if (userData && userData.user && userData.user.settings && userData.user.settings.share_location) {
                    app.applyLocationTracking(userData.user.settings.share_location);
                }
                
                app.ensureModulesDownloaded(app.data.modulesaccess);
            });
    },
    loadLogin: function() {// Renderiza login.js con página según authFlow
        var initialPage = (app.data.config.authFlow === 'simple') ? 0 : 1;
        
        if (typeof mangole !== 'undefined' && typeof forms.login !== 'undefined') {
            app.openScreen({screen: 'login', page: initialPage});
        } else {
            console.error('[app] Mangole o forms.login no están disponibles');
        }
    },
    loadMainApp: function() {//Renderiza index.js (dashboard)
        if (typeof mangole !== 'undefined' && typeof forms.index !== 'undefined') {
            mangole.loadForm({
                parent: '#body',
                form: 'index',
                page: 0
            });
        } else {
            console.error('[app] Mangole o forms.index no están disponibles');
        }
    },
    loadModulesInBrowser: function(modulesaccess, callback) {// Cargar módulos dinámicamente en navegador
        if (!modulesaccess) {
            console.error('[app] No hay modulesaccess para cargar');
            if (callback) callback();
            return;
        }
        
        var moduleKeys = Object.keys(modulesaccess).filter(function(key) {
            var module = modulesaccess[key];
            return module.permissions && module.permissions.read && module.js_path;
        });
        
        if (moduleKeys.length === 0) {
            console.log('[app] No hay módulos para cargar');
            if (callback) callback();
            return;
        }
        
        console.log('[app] Cargando ' + moduleKeys.length + ' módulo(s) en navegador...');
        
        var loaded = 0;
        var total = moduleKeys.length;
        
        moduleKeys.forEach(function(moduleKey) {
            var module = modulesaccess[moduleKey];
            // Construir ruta: js/screens/ + nombre_archivo
            var scriptPath = 'js/screens/' + module.js_path + '?v=' + Date.now();
            
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = scriptPath;
            script.async = false; // Mantener orden de carga
            
            script.onload = function() {
                loaded++;
                console.log('[app] Módulo cargado: ' + moduleKey + ' (' + loaded + '/' + total + ')');
                
                if (loaded === total) {
                    console.log('[app] Todos los módulos cargados exitosamente');
                    if (callback) callback();
                }
            };
            
            script.onerror = function() {
                loaded++;
                console.error('[app] Error cargando módulo: ' + moduleKey);
                
                if (loaded === total) {
                    console.warn('[app] Carga completada con errores');
                    if (callback) callback();
                }
            };
            
            document.head.appendChild(script);
        });
    },
    ensureModulesDownloaded: function(modulesaccess) {// Verificar que módulos estén descargados (requiresAuth=true con sesión previa)
        // Si NO estamos en Cordova (navegador) → cargar módulos dinámicamente
        if (!window.cordova) {
            console.log('[app] Modo navegador detectado - cargando módulos desde servidor');
            app.loadModulesInBrowser(modulesaccess, function() {
                app.loadMainApp();
            });
            return;
        }
        
        var metadata = localStorage.getItem('modules_metadata');
        
        // Si ya hay metadata → cargar field configs y luego app
        if (metadata) {
            app.loadFieldConfigsFromFile(function(success) {
                // Cargar app sin importar si field configs existen o no
                app.loadMainApp();
            });
            return;
        }
        
        // NO hay metadata → necesita descargar
        if (!app.hasConnection()) {
            // Sin conexión y sin módulos → no se puede usar
            window.msgalert.showAlert({
                title: 'Sin conexión',
                text: 'No hay módulos descargados y no hay conexión a internet. Por favor, conecte a internet.',
                icon: null,
                doneButtonLabel: { visible: true, label: 'Reintentar' },
                cancelButtonLabel: { visible: false }
            }, function() {
                window.location.reload();
            });
            return;
        }
        
        // Con conexión → descargar módulos
        window.msgalert.showAlert({
            title: 'Descargando módulos',
            text: 'Descargando módulos para uso offline...',
            icon: null,
            doneButtonLabel: { visible: false },
            cancelButtonLabel: { visible: false }
        });
        
        app.preloadUserModules(modulesaccess, function(succeeded, failed) {
            if (window.msgalert.removeAlert) window.msgalert.removeAlert();
            
            if (failed.length > 0) {
                // Retry recursivo
                var retryDownload = function() {
                    window.msgalert.showAlert({
                        title: 'Error de Descarga',
                        text: failed.length + ' módulo(s) no se pudieron descargar.',
                        icon: null,
                        doneButtonLabel: { visible: true, label: 'Reintentar' },
                        cancelButtonLabel: { visible: false }
                    }, function() {
                        app.ensureModulesDownloaded(modulesaccess);
                    });
                };
                retryDownload();
            } else {
                // Todo descargado → cargar app
                app.loadMainApp();
            }
        });
    },
    initializePublicApp: function() {// Inicializar app pública (requiresAuth = false)
        // Si NO estamos en Cordova (navegador) → cargar app directamente
        if (!window.cordova) {
            console.log('[app] Modo navegador detectado - cargando módulos desde servidor');
            app.loadMainApp();
            return;
        }
        
        // Verificar si ya hay módulos descargados
        var metadata = localStorage.getItem('modules_metadata');
        
        if (metadata) {
            // Validar que metadata no esté vacía
            try {
                var parsedMetadata = JSON.parse(metadata);
                var moduleCount = Object.keys(parsedMetadata).length;
                
                if (moduleCount > 0) {
                    if (!app.hasConnection()) {
                        // Ya hay módulos y sin conexión → cargar field configs y usar caché
                        app.loadFieldConfigsFromFile(function(success) {
                            app.loadMainApp();
                        });
                        return;
                    }
                    // Hay módulos Y conexión → cargar field configs y usar caché
                    app.loadFieldConfigsFromFile(function(success) {
                        app.loadMainApp();
                    });
                    return;
                }
            } catch (e) {
                console.error('[app] Error parseando metadata:', e);
                // Metadata corrupta → limpiar y recargar
                localStorage.removeItem('modules_metadata');
            }
        }
        
        if (!app.hasConnection()) {
            // Sin módulos y sin conexión → no se puede hacer nada
            window.msgalert.showAlert({
                title: 'Sin conexión',
                text: 'No hay conexión a internet y no hay módulos descargados. Por favor, conecte a internet.',
                icon: null,
                doneButtonLabel: { visible: true, label: 'Reintentar' },
                cancelButtonLabel: { visible: false }
            }, function() {
                window.location.reload();
            });
            return;
        }
        
        // Con conexión → descargar todos los módulos disponibles
        app.downloadAllModules();
    },
    
    /**
     * Descargar TODOS los módulos disponibles (para apps públicas, requiresAuth=false)
     */
    downloadAllModules: function() {
        // Mostrar loading
        if (typeof window.msgalert !== 'undefined') {
            window.msgalert.showAlert({
                title: 'Cargando módulos',
                text: 'Por favor espere mientras se descargan los módulos...',
                icon: null,
                doneButtonLabel: { visible: false },
                cancelButtonLabel: { visible: false }
            });
        }
        
        // Obtener lista de TODOS los módulos disponibles
        fetch(app.data.config.apiUrl + 'module-loader-api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'list_all',
                platform: 'mobile'
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.status !== 'success' || !result.modules) {
                throw new Error('No se pudieron obtener los módulos');
            }
            
            // Convertir array a objeto modulesaccess-like para reutilizar preloadUserModules
            var modulesForDownload = {};
            result.modules.forEach(function(module) {
                modulesForDownload[module.key] = {
                    metadata: module,
                    permissions: { read: true } // Sin autenticación, todos tienen permiso
                };
            });
            
            // Usar la función existente para descargar
            app.preloadUserModules(modulesForDownload, function(succeeded, failed) {
                if (window.msgalert.removeAlert) window.msgalert.removeAlert();
                
                if (failed.length > 0) {
                    // Retry recursivo
                    var retryDownload = function() {
                        window.msgalert.showAlert({
                            title: 'Error de Descarga',
                            text: failed.length + ' módulo(s) no se pudieron descargar.',
                            icon: null,
                            doneButtonLabel: { visible: true, label: 'Reintentar' },
                            cancelButtonLabel: { visible: false }
                        }, function() {
                            app.downloadAllModules();
                        });
                    };
                    retryDownload();
                } else {
                    // Módulos descargados → descargar field configs
                    app.downloadFieldConfigs(function(success, hasConfigs) {
                        if (!success && hasConfigs) {
                            // HAY configs pero fallaron - OBLIGATORIO reintentar
                            var retryFieldConfigs = function() {
                                window.msgalert.showAlert({
                                    title: 'Error de Descarga',
                                    text: 'No se pudieron descargar las configuraciones de campos. Se requieren para continuar.',
                                    icon: null,
                                    doneButtonLabel: { visible: true, label: 'Reintentar' },
                                    cancelButtonLabel: { visible: false }
                                }, function() {
                                    window.msgalert.showAlert({
                                        title: 'Descargando configuraciones',
                                        text: 'Por favor espere...',
                                        icon: null,
                                        doneButtonLabel: { visible: false },
                                        cancelButtonLabel: { visible: false }
                                    });
                                    
                                    setTimeout(function() {
                                        app.downloadFieldConfigs(function(success2, hasConfigs2) {
                                            if (window.msgalert.removeAlert) window.msgalert.removeAlert();
                                            
                                            if (!success2 && hasConfigs2) {
                                                // Aún falla - reintentar recursivamente
                                                retryFieldConfigs();
                                            } else {
                                                // Éxito o no hay configs - cargar app
                                                app.loadMainApp();
                                            }
                                        }, true);
                                    }, 500);
                                });
                            };
                            retryFieldConfigs();
                        } else {
                            // Éxito o no hay configs en DB - cargar app
                            app.loadMainApp();
                        }
                    });
                }
            });
        })
        .catch(function(error) {
            console.error('[app] Error obteniendo módulos:', error);
            if (window.msgalert.removeAlert) window.msgalert.removeAlert();
            
            window.msgalert.showAlert({
                title: 'Error',
                text: 'No se pudieron descargar los módulos. Por favor, intente nuevamente.',
                icon: null,
                doneButtonLabel: { visible: true, label: 'Reintentar' },
                cancelButtonLabel: { visible: false }
            }, function() {
                window.location.reload();
            });
        });
    },
    /**
     * Precargar módulos del usuario para modo offline (Cordova File API)
     * @param {object} modulesaccess - Objeto con permisos de módulos
     * @param {function} callback - Función callback(succeeded, failed) cuando termine
     */
    preloadUserModules: function(modulesaccess, callback) {
        if (!modulesaccess || !app.hasConnection()) {
            if (callback) callback([], []);
            return;
        }
        
        if (!window.cordova || !window.cordova.file) {
            console.warn('[app] Cordova File API no disponible - usando localStorage como fallback');
            if (callback) callback([], []);
            return;
        }
        
        var expectedModules = Object.keys(modulesaccess).filter(function(key) {
            var module = modulesaccess[key];
            return module.permissions && module.permissions.read;
        });
        
        if (expectedModules.length === 0) {
            if (callback) callback([], []);
            return;
        }
        
        // Verificar qué módulos YA están descargados
        var existingMetadata = localStorage.getItem('modules_metadata');
        var modulesMetadata = {};
        var alreadyCached = [];
        
        if (existingMetadata) {
            try {
                modulesMetadata = JSON.parse(existingMetadata);
                alreadyCached = Object.keys(modulesMetadata);
            } catch (e) {
                console.error('[app] Error parseando metadata existente:', e);
                modulesMetadata = {};
            }
        }
        
        // Filtrar solo los que FALTAN
        var moduleKeys = expectedModules.filter(function(key) {
            return alreadyCached.indexOf(key) === -1;
        });
        
        // Si TODOS ya están descargados
        if (moduleKeys.length === 0) {
            if (callback) callback(alreadyCached, []);
            return;
        }
        
        console.warn('[app] Descargando ' + moduleKeys.length + ' módulo(s) faltante(s):', moduleKeys);
        
        var completed = 0;
        var total = moduleKeys.length;
        var succeeded = [];
        var failed = [];
        
        moduleKeys.forEach(function(moduleKey) {
            // Obtener metadata del módulo
            fetch(app.data.config.apiUrl + 'module-loader-api.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    module_key: moduleKey,
                    platform: 'mobile'
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                if (result.status !== 'ok') throw new Error(result.message);
                
                var scriptPath = result.module.script_path + '?v=' + result.module.version;
                
                // Descargar el script
                return fetch(scriptPath).then(function(response) {
                    return response.text().then(function(scriptCode) {
                        return {
                            moduleKey: moduleKey,
                            metadata: result.module,
                            permissions: result.permissions,
                            scriptCode: scriptCode,
                            cachedAt: Date.now()
                        };
                    });
                });
            })
            .then(function(moduleData) {
                // Guardar en filesystem usando Cordova File API
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
                    var fileName = 'module_' + moduleData.moduleKey + '.js';
                    
                    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {
                            writer.onwriteend = function() {
                                // Guardar metadata
                                modulesMetadata[moduleData.moduleKey] = {
                                    metadata: moduleData.metadata,
                                    permissions: moduleData.permissions,
                                    cachedAt: moduleData.cachedAt,
                                    fileName: fileName
                                };
                                
                                succeeded.push(moduleData.moduleKey);
                                completed++;
                                
                                // Cuando terminen todos
                                if (completed === total) {
                                    // Agregar nuevos módulos exitosos a metadata existente
                                    succeeded.forEach(function(key) {
                                        if (modulesMetadata[key]) {
                                            // Ya existe en metadata (de iteración actual)
                                        }
                                    });
                                    
                                    // Guardar metadata actualizada (solo si hubo éxitos)
                                    if (succeeded.length > 0) {
                                        localStorage.setItem('modules_metadata', JSON.stringify(modulesMetadata));
                                        localStorage.setItem('modules_cache_timestamp', Date.now().toString());
                                    }
                                    
                                    // Agregar ya existentes a succeeded para reporte completo
                                    var allSucceeded = alreadyCached.concat(succeeded);
                                    
                                    if (callback) callback(allSucceeded, failed);
                                }
                            };
                            
                            writer.onerror = function(e) {
                                console.error('[app] Error escribiendo archivo:', e);
                                failed.push(moduleData.moduleKey);
                                completed++;
                                if (completed === total) {
                                    var allSucceeded = alreadyCached.concat(succeeded);
                                    if (callback) callback(allSucceeded, failed);
                                }
                            };
                            
                            var blob = new Blob([moduleData.scriptCode], {type: 'text/javascript'});
                            writer.write(blob);
                            
                        }, function(error) {
                            console.error('[app] Error createWriter:', error);
                            failed.push(moduleKey);
                            completed++;
                            if (completed === total) {
                                var allSucceeded = alreadyCached.concat(succeeded);
                                if (callback) callback(allSucceeded, failed);
                            }
                        });
                    }, function(error) {
                        console.error('[app] Error getFile:', error);
                        failed.push(moduleKey);
                        completed++;
                        if (completed === total) {
                            var allSucceeded = alreadyCached.concat(succeeded);
                            if (callback) callback(allSucceeded, failed);
                        }
                    });
                }, function(error) {
                    console.error('[app] Error resolveLocalFileSystemURL:', error);
                    failed.push(moduleKey);
                    completed++;
                    if (completed === total) {
                        var allSucceeded = alreadyCached.concat(succeeded);
                        if (callback) callback(allSucceeded, failed);
                    }
                });
            })
            .catch(function(error) {
                console.error('[app] Error cacheando módulo:', moduleKey, error);
                failed.push(moduleKey);
                completed++;
                if (completed === total) {
                    var allSucceeded = alreadyCached.concat(succeeded);
                    if (callback) callback(allSucceeded, failed);
                }
            });
        });
    },
    
    /**
     * Descargar configuraciones de campos para uso offline
     * @param {function} callback - Función callback(success, hasConfigs) cuando termine
     * @param {boolean} isRetry - Indica si es un reintento
     */
    downloadFieldConfigs: function(callback, isRetry) {
        if (!app.hasConnection()) {
            // Sin conexión, intentar cargar desde archivo
            app.loadFieldConfigsFromFile(function(success) {
                if (callback) callback(success, false);
            });
            return;
        }
        
        // Obtener customer y style desde user_data si existe
        var customer = null;
        var style = null;
        var projectId = 1; // Por defecto
        
        var userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                var parsed = JSON.parse(userData);
                customer = parsed.customer || null;
                style = parsed.style || null;
                projectId = parsed.project_id || 1;
            } catch (e) {
                console.error('[app] Error parseando user_data:', e);
            }
        }
        
        // Construir URL con parámetros
        var url = app.data.config.apiUrl + 'field_config_mobile_api.php?action=get_all_mobile&project_id=' + projectId;
        if (customer) url += '&customer=' + encodeURIComponent(customer);
        if (style) url += '&style=' + encodeURIComponent(style);
        
        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                if (result.status !== 'ok') {
                    throw new Error(result.message || 'Error descargando configuraciones');
                }
                
                // Verificar si hay configuraciones disponibles en la DB
                var hasConfigs = result.has_configs === true;
                
                if (!hasConfigs) {
                    // NO hay configuraciones en la DB - continuar sin ellas
                    console.log('[app] No hay configuraciones de campos en la base de datos');
                    app.data.fieldConfigs = {};
                    if (callback) callback(true, false);
                    return;
                }
                
                // HAY configuraciones - guardar
                app.data.fieldConfigs = result.configs;
                
                // Persistir en File API
                if (window.cordova && window.cordova.file) {
                    app.saveFieldConfigsToFile(result.configs, function(success) {
                        if (callback) callback(success, true);
                    });
                } else {
                    // Fallback a localStorage
                    try {
                        localStorage.setItem('field_configs', JSON.stringify(result.configs));
                        if (callback) callback(true, true);
                    } catch (e) {
                        console.error('[app] Error guardando field configs en localStorage:', e);
                        if (callback) callback(false, true);
                    }
                }
            })
            .catch(function(error) {
                console.error('[app] Error descargando field configs:', error);
                
                // Si es primer intento y hay error de red, intentar cargar desde archivo
                // Si hay archivo guardado, usarlo temporalmente
                if (!isRetry) {
                    app.loadFieldConfigsFromFile(function(success) {
                        // Si se cargó desde archivo, asumir que hay configs
                        // pero indicar que falló la descarga
                        if (callback) callback(false, success);
                    });
                } else {
                    // Es reintento y falló - reportar fallo
                    if (callback) callback(false, true);
                }
            });
    },
    
    /**
     * Guardar configuraciones en File API
     */
    saveFieldConfigsToFile: function(configs, callback) {
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
            var fileName = 'field_configs.json';
            
            dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
                fileEntry.createWriter(function(writer) {
                    writer.onwriteend = function() {
                        if (callback) callback(true);
                    };
                    
                    writer.onerror = function(e) {
                        console.error('[app] Error escribiendo field configs:', e);
                        if (callback) callback(false);
                    };
                    
                    var blob = new Blob([JSON.stringify(configs)], {type: 'application/json'});
                    writer.write(blob);
                }, function(error) {
                    console.error('[app] Error createWriter:', error);
                    if (callback) callback(false);
                });
            }, function(error) {
                console.error('[app] Error getFile:', error);
                if (callback) callback(false);
            });
        }, function(error) {
            console.error('[app] Error resolveLocalFileSystemURL:', error);
            if (callback) callback(false);
        });
    },
    
    /**
     * Cargar configuraciones desde File API o localStorage
     */
    loadFieldConfigsFromFile: function(callback) {
        if (window.cordova && window.cordova.file) {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
                dirEntry.getFile('field_configs.json', {create: false}, function(fileEntry) {
                    fileEntry.file(function(file) {
                        var reader = new FileReader();
                        reader.onloadend = function() {
                            try {
                                var configs = JSON.parse(this.result);
                                app.data.fieldConfigs = configs;
                                // Verificar si hay configs guardadas
                                var hasConfigs = configs && Object.keys(configs).length > 0;
                                if (callback) callback(hasConfigs);
                            } catch (e) {
                                console.error('[app] Error parseando field configs:', e);
                                app.data.fieldConfigs = null;
                                if (callback) callback(false);
                            }
                        };
                        reader.readAsText(file);
                    });
                }, function(error) {
                    // Archivo no existe, intentar localStorage
                    app.loadFieldConfigsFromLocalStorage(callback);
                });
            }, function(error) {
                app.loadFieldConfigsFromLocalStorage(callback);
            });
        } else {
            app.loadFieldConfigsFromLocalStorage(callback);
        }
    },
    
    /**
     * Cargar configuraciones desde localStorage (fallback)
     */
    loadFieldConfigsFromLocalStorage: function(callback) {
        try {
            var configs = localStorage.getItem('field_configs');
            if (configs) {
                var parsed = JSON.parse(configs);
                app.data.fieldConfigs = parsed;
                // Verificar si hay configs
                var hasConfigs = parsed && Object.keys(parsed).length > 0;
                if (callback) callback(hasConfigs);
            } else {
                app.data.fieldConfigs = null;
                if (callback) callback(false);
            }
        } catch (e) {
            console.error('[app] Error cargando field configs desde localStorage:', e);
            app.data.fieldConfigs = null;
            if (callback) callback(false);
        }
    },
    
    /**
     * Cerrar sesión manualmente
     */
    logout: function() {
        var self = this;
        
        window.msgalert.showAlert({
            title: 'Cerrar Sesión',
            text: '¿Está seguro que desea cerrar sesión?',
            icon: null,
            doneButtonLabel: {visible: true, label: 'Sí'},
            cancelButtonLabel: {visible: true, label: 'No'}
        }, function() {
            // Botón Sí
            var userData = localStorage.getItem('user_data');
            var sessionToken = null;
            
            // Obtener session_token desde user_data
            if (userData) {
                try {
                    var parsed = JSON.parse(userData);
                    sessionToken = parsed.session_token;
                } catch (e) {
                    console.error('[app] Error parseando user_data:', e);
                }
            }
            
            // Llamar al backend para invalidar sesión
            if (sessionToken && app.hasConnection()) {
                var formData = new FormData();
                formData.append('action', 'logout');
                formData.append('session_token', sessionToken);
                
                fetch(app.data.config.apiUrl + 'auth.php', {
                    method: 'POST',
                    body: formData
                }).then(function(response) {
                    return response.json();
                }).catch(function(error) {
                    console.error('[app] Error al hacer logout:', error);
                });
            }
            
            // Limpiar archivos de módulos del filesystem
            var metadata = localStorage.getItem('modules_metadata');
            if (metadata && window.cordova && window.cordova.file) {
                try {
                    var modulesMetadata = JSON.parse(metadata);
                    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
                        for (var key in modulesMetadata) {
                            var fileName = modulesMetadata[key].fileName;
                            if (fileName) {
                                dirEntry.getFile(fileName, {create: false}, function(fileEntry) {
                                    fileEntry.remove(function() {
                                        // Archivo eliminado
                                    }, function(error) {
                                        console.error('[app] Error eliminando archivo:', error);
                                    });
                                });
                            }
                        }
                    });
                } catch (e) {
                    console.error('[app] Error limpiando filesystem:', e);
                }
            }
            
            // Limpiar field configs del filesystem
            if (window.cordova && window.cordova.file) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dirEntry) {
                    dirEntry.getFile('field_configs.json', {create: false}, function(fileEntry) {
                        fileEntry.remove(function() {
                            // Archivo eliminado
                        }, function(error) {
                            console.error('[app] Error eliminando field_configs.json:', error);
                        });
                    });
                });
            }
            
            // Limpiar localStorage
            localStorage.removeItem('last_verified');
            localStorage.removeItem('user_data');
            localStorage.removeItem('modules_metadata');
            localStorage.removeItem('modules_cache_timestamp');
            localStorage.removeItem('field_configs');
            
            // Limpiar memoria
            app.data.fieldConfigs = null;
            
            // Recargar app para mostrar login
            window.location.reload();
        }, function() {
            // Botón No - no hacer nada
        });
    },
    openScreen: function(object) {
        /**
         * Abre una pantalla (formulario) en modo lightbox fullscreen
         * @param {object} object - Configuración {screen: 'projects', page: 0, params: {id: 1}}
         */
        if (!object || !object.screen) {
            console.error('[app] openScreen requiere objeto con propiedad "screen"');
            return;
        }
        
        var screen = object.screen;
        var page = object.page || 0;
        var params = object.params || {};

        // Renderizar formulario dentro del contenedor
        if (typeof mangole !== 'undefined' && typeof forms[screen] !== 'undefined') {
            forms[screen].params = params;
            forms[screen]._currentPage = page;
            mangole.loadForm({
                parent: '#body',
                form: screen,
                page: page,
                cleanBefore: false
            }, function() {
                // Renderizar formulario con parámetros
                if (forms[screen] && forms[screen].show) {
                    forms[screen].show();
                } else {
                    console.warn('[app] El formulario ' + screen + ' no tiene función show()');
                }
            });
        } else {
            console.error('[app] Formulario "' + screen + '" no está disponible');
        }
    }
};

window.handleLoginSuccess = function(userData) {// Función global para manejar login exitoso (llamada desde login.js)
    // Guardar datos de sesión (incluye session_token, modulesaccess, branch, user, etc.)
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('last_verified', Date.now().toString());
    localStorage.setItem('app_theme', userData.user.settings.theme || 'light');
    
    // Precargar módulos para modo offline (solo si NO están descargados)
    if (userData.modulesaccess && app.hasConnection()) {
        // Mostrar loading
        if (typeof window.msgalert !== 'undefined') {
            window.msgalert.showAlert({
                title: 'Descargando módulos',
                text: 'Por favor espere mientras se descargan los módulos para uso offline...',
                icon: null,
                doneButtonLabel: { visible: false },
                cancelButtonLabel: { visible: false }
            });
        }
        
        setTimeout(function() {
            app.preloadUserModules(userData.modulesaccess, function(succeeded, failed) {
                // Cerrar loading
                if (typeof window.msgalert !== 'undefined' && window.msgalert.removeAlert) {
                    window.msgalert.removeAlert();
                }
                
                if (failed.length > 0) {
                    console.warn('[app] Algunos módulos no se descargaron:', failed);
                    
                    // Función recursiva para reintentar hasta que TODO esté descargado
                    var retryDownload = function() {
                        window.msgalert.showAlert({
                            title: 'Error de Descarga',
                            text: failed.length + ' módulo(s) no se pudieron descargar. Todos los módulos deben descargarse para continuar.',
                            icon: null,
                            doneButtonLabel: { visible: true, label: 'Reintentar' },
                            cancelButtonLabel: { visible: false }
                        }, function() {
                            // Botón Reintentar - volver a intentar descarga
                            window.msgalert.showAlert({
                                title: 'Descargando módulos',
                                text: 'Reintentando descarga de módulos faltantes...',
                                icon: null,
                                doneButtonLabel: { visible: false },
                                cancelButtonLabel: { visible: false }
                            });
                            
                            setTimeout(function() {
                                app.preloadUserModules(userData.modulesaccess, function(succeeded2, failed2) {
                                    if (window.msgalert.removeAlert) window.msgalert.removeAlert();
                                    
                                    if (failed2.length > 0) {
                                        // Aún hay fallos - llamar recursivamente
                                        failed = failed2;
                                        retryDownload();
                                    } else {
                                        // TODO descargado exitosamente
                                        window.location.reload();
                                    }
                                });
                            }, 500);
                        });
                    };
                    
                    retryDownload();
                } else {
                    // Módulos descargados exitosamente - descargar field configs
                    app.downloadFieldConfigs(function(success, hasConfigs) {
                        if (!success && hasConfigs) {
                            // HAY configs pero fallaron al descargar - OBLIGATORIO reintentar
                            var retryFieldConfigs = function() {
                                window.msgalert.showAlert({
                                    title: 'Error de Descarga',
                                    text: 'No se pudieron descargar las configuraciones de campos. Se requieren para continuar.',
                                    icon: null,
                                    doneButtonLabel: { visible: true, label: 'Reintentar' },
                                    cancelButtonLabel: { visible: false }
                                }, function() {
                                    window.msgalert.showAlert({
                                        title: 'Descargando configuraciones',
                                        text: 'Por favor espere...',
                                        icon: null,
                                        doneButtonLabel: { visible: false },
                                        cancelButtonLabel: { visible: false }
                                    });
                                    
                                    setTimeout(function() {
                                        app.downloadFieldConfigs(function(success2, hasConfigs2) {
                                            if (window.msgalert.removeAlert) window.msgalert.removeAlert();
                                            
                                            if (!success2 && hasConfigs2) {
                                                // Aún falla - reintentar recursivamente
                                                retryFieldConfigs();
                                            } else {
                                                // Éxito o no hay configs - continuar
                                                window.location.reload();
                                            }
                                        }, true);
                                    }, 500);
                                });
                            };
                            retryFieldConfigs();
                        } else {
                            // Éxito o no hay configs en DB - continuar
                            window.location.reload();
                        }
                    });
                }
            });
        }, 1000); // Delay 1s para que Cordova esté listo
    } else {
        // Sin conexión o sin módulos - recargar directo
        window.location.reload();
    }
};

// Inicializar app cuando se cargue el DOM
app.initialize();
