/**
 * Servicio de Tracking GPS
 * Sistema de seguimiento automático en background para técnicos
 * Usa cordova-background-geolocation-plugin
 */

(function() {
  window.LocationService = {
    // Estado
    isTracking: false,
    trackingTimer: null,
    lastLocation: null,
    currentProject: null,
    
    // =====================================================
    // INICIALIZACIÓN
    // =====================================================
    
    init: function() {
      if (!app.data.config.tracking.enabled) {
        console.log('[LocationService] Tracking deshabilitado en configuración');
        return;
      }
      
      console.log('[LocationService] Inicializando servicio de tracking');
      
      // Verificar si el plugin está disponible
      if (!window.cordova) {
        console.warn('[LocationService] Cordova no disponible - modo web');
        return;
      }
      
      // Configurar plugin de background geolocation
      if (window.BackgroundGeolocation) {
        this._configureBackgroundGeolocation();
      } else {
        console.warn('[LocationService] Plugin BackgroundGeolocation no disponible');
      }
      
      // Si es modo 'always', iniciar automáticamente
      if (app.data.config.tracking.activateMode === 'always') {
        this.startTracking(null);
      }
    },
    
    // =====================================================
    // CONFIGURACIÓN DEL PLUGIN
    // =====================================================
    
    _configureBackgroundGeolocation: function() {
      var trackingConfig = app.data.config.tracking;
      
      var config = {
        // Permisos y notificación
        desiredAccuracy: 10, // Mejor precisión en metros
        stationaryRadius: 50, // 50 metros para considerar "estacionario"
        distanceFilter: trackingConfig.mode === 'movement' ? 10 : -1, // 10m si movement, -1 si time
        notificationTitle: 'Seguimiento activo',
        notificationText: 'Registrando tu ubicación',
        notificationIconColor: '#2196F3',
        
        // Frecuencia
        locationTimeout: 30000, // 30 segundos timeout para obtener ubicación
        
        // Actividad
        activityRecognitionInterval: 10000, // 10 segundos
        stopOnStillActivity: false, // No parar si está quieto
        
        // Batería
        stopOnTerminate: false, // Continuar incluso si cierra la app
        startOnBoot: true, // Iniciar al reiniciar
        
        // Debug
        debug: false, // Cambiar a true para logs detallados
        logLevel: 0
      };
      
      // Si es por tiempo, configurar intervalo
      if (trackingConfig.mode === 'time') {
        config.interval = trackingConfig.interval * 60 * 1000; // Convertir a milisegundos
      }
      
      // Configurar el plugin
      BackgroundGeolocation.configure(config);
      
      // Escuchar ubicaciones
      BackgroundGeolocation.on('location', function(location) {
        console.log('[LocationService] Ubicación recibida:', location);
        window.LocationService._handleLocationUpdate(location);
      });
      
      // Escuchar errores
      BackgroundGeolocation.on('error', function(error) {
        console.error('[LocationService] Error de geolocalización:', error);
      });
      
      // Escuchar cambios de actividad
      BackgroundGeolocation.on('stationary', function(location) {
        console.log('[LocationService] Técnico parado en:', location);
      });
      
      console.log('[LocationService] Plugin configurado');
    },
    
    // =====================================================
    // CONTROL DE TRACKING
    // =====================================================
    
    startTracking: function(projectId) {
      if (!app.data.config.tracking.enabled) {
        console.log('[LocationService] Tracking deshabilitado');
        return false;
      }
      
      if (this.isTracking) {
        console.log('[LocationService] Tracking ya activo');
        return true;
      }
      
      this.currentProject = projectId;
      this.isTracking = true;
      
      console.log('[LocationService] Iniciando tracking para proyecto:', projectId);
      
      // Iniciar plugin si está disponible
      if (window.BackgroundGeolocation) {
        BackgroundGeolocation.start();
      }
      
      // Guardar estado en localStorage
      localStorage.setItem('tracking_active', 'true');
      localStorage.setItem('tracking_project_id', projectId || '');
      localStorage.setItem('tracking_start_time', new Date().toISOString());
      
      // Notificación local
      if (window.cordova && cordova.plugins.notification.local) {
        cordova.plugins.notification.local.schedule({
          id: 1,
          title: 'Tracking iniciado',
          text: 'Tu ubicación está siendo registrada',
          smallIcon: 'res://drawable-hdpi/ic_stat_onesignal_default.png',
          foreground: true
        });
      }
      
      return true;
    },
    
    stopTracking: function() {
      if (!this.isTracking) {
        console.log('[LocationService] Tracking no está activo');
        return true;
      }
      
      this.isTracking = false;
      this.currentProject = null;
      
      console.log('[LocationService] Deteniendo tracking');
      
      // Detener plugin
      if (window.BackgroundGeolocation) {
        BackgroundGeolocation.stop();
      }
      
      // Limpiar estado
      localStorage.removeItem('tracking_active');
      localStorage.removeItem('tracking_project_id');
      localStorage.removeItem('tracking_start_time');
      
      // Cancelar timer si existe
      if (this.trackingTimer) {
        clearInterval(this.trackingTimer);
        this.trackingTimer = null;
      }
      
      // Notificación local
      if (window.cordova && cordova.plugins.notification.local) {
        cordova.plugins.notification.local.cancel(1);
      }
      
      return true;
    },
    
    isTrackingActive: function() {
      return this.isTracking;
    },
    
    // =====================================================
    // PROCESAMIENTO DE UBICACIONES
    // =====================================================
    
    _handleLocationUpdate: function(location) {
      // Guardar última ubicación conocida
      this.lastLocation = location;
      
      // Enviar al servidor
      this._sendLocationToServer({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        altitude: location.altitude,
        tracking_mode: app.data.config.tracking.mode,
        location_type: 'auto_tracking',
        project_id: this.currentProject
      });
    },
    
    _sendLocationToServer: function(locationData) {
      var userData = localStorage.getItem('user_data');
      var sessionToken = null;
      
      if (userData) {
        try {
          var parsed = JSON.parse(userData);
          sessionToken = parsed.session_token;
        } catch (e) {
          console.error('[LocationService] Error parseando user_data:', e);
          return;
        }
      }
      
      if (!sessionToken) {
        console.warn('[LocationService] No hay sesión, no se envía ubicación');
        return;
      }
      
      locationData.session_token = sessionToken;
      locationData.action = 'save-location';
      
      fetch(app.data.config.apiUrl + 'sys/location.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(result) {
        if (result.status === 'success') {
          console.log('[LocationService] Ubicación enviada:', result.data);
        } else {
          console.error('[LocationService] Error en servidor:', result.message);
        }
      })
      .catch(function(error) {
        console.error('[LocationService] Error al enviar ubicación:', error);
      });
    },
    
    // =====================================================
    // MÉTODO MANUAL - CHECK-IN
    // =====================================================
    
    manualCheckIn: function(projectId) {
      console.log('[LocationService] Check-in manual en proyecto:', projectId);
      
      var userData = localStorage.getItem('user_data');
      var sessionToken = null;
      
      if (userData) {
        try {
          var parsed = JSON.parse(userData);
          sessionToken = parsed.session_token;
        } catch (e) {
          console.error('[LocationService] Error parseando user_data:', e);
          return Promise.reject('Sin sesión activa');
        }
      }
      
      if (!sessionToken) {
        return Promise.reject('No hay sesión activa');
      }
      
      // Obtener ubicación actual
      return new Promise(function(resolve, reject) {
        if (window.cordova && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(position) {
              // Enviar check-in
              var checkInData = {
                action: 'save-location',
                session_token: sessionToken,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                tracking_mode: 'manual',
                location_type: 'manual_checkin',
                project_id: projectId
              };
              
              fetch(app.data.config.apiUrl + 'sys/location.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkInData)
              })
              .then(function(response) {
                return response.json();
              })
              .then(function(result) {
                if (result.status === 'success') {
                  console.log('[LocationService] Check-in completado');
                  resolve(result.data);
                } else {
                  reject(result.message);
                }
              })
              .catch(reject);
            },
            function(error) {
              console.error('[LocationService] Error obteniendo ubicación:', error);
              reject('Error al obtener ubicación: ' + error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          reject('Geolocalización no disponible');
        }
      });
    },
    
    // =====================================================
    // CONSULTA DE UBICACIONES
    // =====================================================
    
    getLastLocation: function() {
      return this.lastLocation;
    },
    
    getTrackingStatus: function() {
      return {
        isTracking: this.isTracking,
        currentProject: this.currentProject,
        lastLocation: this.lastLocation,
        config: app.data.config.tracking
      };
    }
  };
  
  // Inicializar cuando Cordova esté listo
  if (window.cordova) {
    document.addEventListener('deviceready', function() {
      window.LocationService.init();
    });
  }
})();
