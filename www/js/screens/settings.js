(function(){
  forms.settings = {
    _slug: 'settings',
    _shortIds: true,
    opened: false,
    _currentPage: 0,
    params: {},
    variables: {
      settings: null,
    },
    functions: {
      init: function() {
        forms.settings.functions.loadSettings();
        
        // Aplicar tema guardado al cargar la pantalla
        //const savedTheme = localStorage.getItem('app_theme') || 'light';
        //forms.settings.functions.applyTheme(savedTheme);
      },
      loadSettings: function() {
        const lang = app.data.config.languageIndex;
        
        // Mostrar loading inmediatamente
        blankwrapper('#settings-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando configuración...', 'Loading settings...'][lang]+'</div>');
        
        const userData = localStorage.getItem('user_data');
        if (!userData) return;
        
        try {
          const user = JSON.parse(userData);
          const sessionToken = user.session_token;
          
          if (!sessionToken) {
            console.warn('No hay session_token, mostrando valores por defecto');
            forms.settings.functions.displaySettings(forms.settings.functions.getDefaultSettings());
            return;
          }
          
          fetch(app.data.config.apiUrl + 'settings.php?action=get-settings&session_token=' + sessionToken, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success' && data.data && data.data.settings) {
              forms.settings.variables.settings = data.data.settings;
              
              // Agregar language desde user_data (no viene de user_settings)
              data.data.settings.language = user.user?.language || user.language || app.data.config.language || 'es';
              
              // Aplicar configuración de tracking según share_location
              if (data.data.settings.share_location) {
                forms.settings.functions.applyLocationTracking(data.data.settings.share_location);
              }
              
              forms.settings.functions.displaySettings(data.data.settings);
            } else {
              const defaultSettings = forms.settings.functions.getDefaultSettings();
              forms.settings.functions.displaySettings(defaultSettings);
              
              // Aplicar tracking con valor por defecto
              forms.settings.functions.applyLocationTracking(defaultSettings.share_location);
            }
          })
          .catch(error => {
            console.error('Error loading settings:', error);
            forms.settings.functions.displaySettings(forms.settings.functions.getDefaultSettings());
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      },
      getDefaultSettings: function() {
        return {
          theme: 'light',
          language: 'es',
          notifications_enabled: true,
          sound_enabled: true,
          vibration_enabled: true,
          notif_new_projects: true,
          notif_chat_messages: true,
          notif_status_changes: true,
          notif_task_reminders: true,
          share_location: 'working',
          show_online_status: true,
          show_last_seen: true
        };
      },
      displaySettings: function(settings) {
        const lang = app.data.config.languageIndex;
        
        const html = `
          <div class="settings-container">

            <!-- GENERALES -->
            <div class="settings-section">
              <div class="settings-section-title">
                <i class="icon-settings"></i> ${['General', 'General'][lang]}
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Tema', 'Theme'][lang]}</div>
                  <div class="settings-item-description">${['Apariencia de la aplicación', 'App appearance'][lang]}</div>
                </div>
                <select id="setting-theme" class="settings-select">
                  <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>${['Claro', 'Light'][lang]}</option>
                  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>${['Oscuro', 'Dark'][lang]}</option>
                  <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>${['Automático', 'Auto'][lang]}</option>
                </select>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Idioma', 'Language'][lang]}</div>
                  <div class="settings-item-description">${['Idioma de la aplicación', 'App language'][lang]}</div>
                </div>
                <select id="setting-language" class="settings-select">
                  <option value="0" ${settings.language === 'es' || settings.language === '0' ? 'selected' : ''}>Español</option>
                  <option value="1" ${settings.language === 'en' || settings.language === '1' ? 'selected' : ''}>English</option>
                </select>
              </div>
            </div>
            
            <!-- NOTIFICACIONES -->
            <div class="settings-section">
              <div class="settings-section-title">
                <i class="icon-bell"></i> ${['Notificaciones', 'Notifications'][lang]}
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Notificaciones activadas', 'Notifications enabled'][lang]}</div>
                  <div class="settings-item-description">${['Recibir notificaciones push', 'Receive push notifications'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-notifications-enabled" ${settings.notifications_enabled ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Sonido', 'Sound'][lang]}</div>
                  <div class="settings-item-description">${['Reproducir sonido en notificaciones', 'Play sound on notifications'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-sound-enabled" ${settings.sound_enabled ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Vibración', 'Vibration'][lang]}</div>
                  <div class="settings-item-description">${['Vibrar al recibir notificaciones', 'Vibrate on notifications'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-vibration-enabled" ${settings.vibration_enabled ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-subsection-title">${['Tipos de notificación', 'Notification types'][lang]}</div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Nuevos proyectos', 'New projects'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-notif-new-projects" ${settings.notif_new_projects ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Mensajes de chat', 'Chat messages'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-notif-chat-messages" ${settings.notif_chat_messages ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Cambios de estado', 'Status changes'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-notif-status-changes" ${settings.notif_status_changes ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Recordatorios de tareas', 'Task reminders'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-notif-task-reminders" ${settings.notif_task_reminders ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <!-- PRIVACIDAD Y UBICACIÓN -->
            <div class="settings-section">
              <div class="settings-section-title">
                <i class="icon-locate-user"></i> ${['Privacidad y Ubicación', 'Privacy & Location'][lang]}
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Compartir ubicación', 'Share location'][lang]}</div>
                  <div class="settings-item-description">${['Cuándo compartir tu ubicación', 'When to share your location'][lang]}</div>
                </div>
                <select id="setting-share-location" class="settings-select">
                  <option value="always" ${settings.share_location === 'always' ? 'selected' : ''}>${['Siempre', 'Always'][lang]}</option>
                  <option value="working" ${settings.share_location === 'working' ? 'selected' : ''}>${['Solo trabajando', 'Only working'][lang]}</option>
                  <option value="never" ${settings.share_location === 'never' ? 'selected' : ''}>${['Nunca', 'Never'][lang]}</option>
                </select>
              </div>
              
              <div class="settings-item" style="display:none;">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Estado online', 'Online status'][lang]}</div>
                  <div class="settings-item-description">${['Mostrar cuando estás en línea', 'Show when you are online'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-show-online-status" ${settings.show_online_status ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div class="settings-item" style="display:none;">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Última conexión', 'Last seen'][lang]}</div>
                  <div class="settings-item-description">${['Mostrar última vez visto', 'Show last seen time'][lang]}</div>
                </div>
                <label class="settings-toggle">
                  <input type="checkbox" id="setting-show-last-seen" ${settings.show_last_seen ? 'checked' : ''}>
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <!-- INFORMACIÓN -->
            <div class="settings-section">
              <div class="settings-section-title">
                <i class="icon-help-circle"></i> ${['Información', 'Information'][lang]}
              </div>
              
              <div class="settings-item settings-item-clickable" onclick="window.forms.settings.functions.showAbout()">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Acerca de', 'About'][lang]}</div>
                  <div class="settings-item-description">Lawrence Network Services</div>
                </div>
                <i class="icon-right-open"></i>
              </div>
              
              <div class="settings-item">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Versión', 'Version'][lang]}</div>
                </div>
                <span class="settings-item-value">1.0.0</span>
              </div>
              
              <div class="settings-item settings-item-clickable" onclick="window.forms.settings.functions.showPrivacyPolicy()">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Política de privacidad', 'Privacy Policy'][lang]}</div>
                </div>
                <i class="icon-right-open"></i>
              </div>
              
              <div class="settings-item settings-item-clickable" onclick="window.forms.settings.functions.showTerms()">
                <div class="settings-item-info">
                  <div class="settings-item-label">${['Términos y condiciones', 'Terms & Conditions'][lang]}</div>
                </div>
                <i class="icon-right-open"></i>
              </div>
            </div>
            
            <!-- BOTONES DE ACCIÓN -->
            <div class="settings-actions">
              <button class="settings-btn settings-btn-primary" onclick="window.forms.settings.functions.saveSettings()">
                <i class="icon-floppy"></i> ${['Guardar cambios', 'Save changes'][lang]}
              </button>
              
              <button class="settings-btn settings-btn-secondary" onclick="window.forms.settings.functions.clearCache()">
                <i class="icon-trash"></i> ${['Limpiar caché', 'Clear cache'][lang]}
              </button>
            </div>
          </div>
        `;
        
        blankwrapper('#settings-page0-form-wrapper').content.html(html);
      },
      saveSettings: function() {
        const lang = app.data.config.languageIndex;
        
        // Capturar valores ANTES del fetch
        const newLangIndex = document.getElementById('setting-language').value;
        const newLangCode = newLangIndex === '0' ? 'es' : 'en';
        const newTheme = document.getElementById('setting-theme').value;
        
        const settings = {
          theme: newTheme,
          language: newLangCode,
          notifications_enabled: document.getElementById('setting-notifications-enabled').checked,
          sound_enabled: document.getElementById('setting-sound-enabled').checked,
          vibration_enabled: document.getElementById('setting-vibration-enabled').checked,
          notif_new_projects: document.getElementById('setting-notif-new-projects').checked,
          notif_chat_messages: document.getElementById('setting-notif-chat-messages').checked,
          notif_status_changes: document.getElementById('setting-notif-status-changes').checked,
          notif_task_reminders: document.getElementById('setting-notif-task-reminders').checked,
          share_location: document.getElementById('setting-share-location').value,
          show_online_status: document.getElementById('setting-show-online-status').checked,
          show_last_seen: document.getElementById('setting-show-last-seen').checked
        };
        
        const userData = localStorage.getItem('user_data');
        if (!userData) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Sesión no encontrada', 'Session not found'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        const user = JSON.parse(userData);
        const sessionToken = user.session_token;
        
        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Sesión inválida', 'Invalid session'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Deshabilitar botón de guardar
        const saveBtn = document.querySelector('.settings-btn-primary');
        if (saveBtn) {
          saveBtn.disabled = true;
        }
        
        fetch(app.data.config.apiUrl + 'settings.php?action=update-settings&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
          // Re-habilitar botón
          if (saveBtn) {
            saveBtn.disabled = false;
          }
          
          if (data.status === 'success') {
            // Actualizar user_data en localStorage antes del alert
            const userData = localStorage.getItem('user_data');
            if (userData) {
              try {
                const parsed = JSON.parse(userData);
                if (parsed.user) {
                  // Actualizar language si cambió
                  if (parseInt(newLangIndex) !== app.data.config.languageIndex) {
                    parsed.user.language = newLangCode;
                  }
                  // Actualizar todos los settings
                  parsed.user.settings = settings;
                  localStorage.setItem('user_data', JSON.stringify(parsed));
                }
              } catch (e) {
                console.error('Error actualizando user_data:', e);
              }
            }
            
            // Si cambió el tema, aplicarlo inmediatamente
            forms.settings.functions.applyTheme(newTheme);
            localStorage.setItem('app_theme', newTheme);
            
            // Actualizar configuración de tracking según share_location
            forms.settings.functions.applyLocationTracking(settings.share_location);
            
            // Verificar si cambió el idioma
            const languageChanged = parseInt(newLangIndex) !== app.data.config.languageIndex;
            
            // Mostrar alert con opción de recargar
            window.msgalert.showAlert({
              title: ['Ajustes Guardados', 'Settings Saved'][lang],
              text: languageChanged 
                ? ['Los ajustes se guardaron correctamente. Es necesario recargar la aplicación para aplicar el cambio de idioma. ¿Desea recargar ahora?', 
                   'Settings saved successfully. The app needs to be reloaded to apply the language change. Do you want to reload now?'][lang]
                : ['Los ajustes se guardaron correctamente. Para ver todos los efectos en la aplicación, puede recargar. ¿Desea recargar la aplicación ahora?', 
                   'Settings saved successfully. To see all effects in the app, you can reload. Do you want to reload the app now?'][lang],
              icon: true,
              doneButtonLabel: {visible: true, label: languageChanged ? ['Recargar', 'Reload'][lang] : ['Sí, Recargar', 'Yes, Reload'][lang]},
              cancelButtonLabel: {visible: true, label: languageChanged ? ['Después', 'Later'][lang] : ['No', 'No'][lang]}
            }, 
            function() {
              // Usuario eligió RECARGAR la app completa
              if (languageChanged) {
                app.data.config.languageIndex = parseInt(newLangIndex);
                app.data.config.language = newLangCode;
              }
              // Recargar la app completa
              location.reload();
            }, 
            function() {
              // Usuario eligió NO recargar o recargar SOLO los ajustes
              if (languageChanged) {
                // Si cambió idioma, recargar solo la página de settings para mostrar nuevo idioma
                app.data.config.languageIndex = parseInt(newLangIndex);
                app.data.config.language = newLangCode;
                forms.settings.functions.loadSettings();
              }
              // Si no cambió idioma, no hacer nada (ya se aplicaron tema y tracking)
            });
            
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['Error al guardar', 'Error saving'][lang],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        })
        .catch(error => {
          // Re-habilitar botón
          if (saveBtn) {
            saveBtn.disabled = false;
          }
          
          console.error('Error saving settings:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      clearCache: function() {
        const lang = app.data.config.languageIndex;
        
        window.msgalert.showAlert({
          title: ['Confirmar', 'Confirm'],
          text: ['¿Deseas limpiar la caché de la aplicación? Esto borrará datos temporales.', 'Do you want to clear app cache? This will delete temporary data.'][lang],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Confirmar', 'Confirm']},
          cancelButtonLabel: {visible: true, label: ['Cancelar', 'Cancel']}
        }, function() {
          // Limpiar localStorage excepto user_data y app_language
          const userData = localStorage.getItem('user_data');
          const appLanguage = localStorage.getItem('app_language');
          
          localStorage.clear();
          
          if (userData) localStorage.setItem('user_data', userData);
          if (appLanguage) localStorage.setItem('app_language', appLanguage);
          
          window.msgalert.showAlert({
            title: ['Éxito', 'Success'],
            text: ['Caché limpiada correctamente', 'Cache cleared successfully'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        }, function() { });
      },
      showAbout: function() {
        const lang = app.data.config.languageIndex;
        
        window.msgalert.showAlert({
          title: ['Acerca de', 'About'],
          text: ['Lawrence Network Services v1.0.0\n\nSistema de gestión de servicios técnicos.\n\n© 2026 Todos los derechos reservados.', 'Lawrence Network Services v1.0.0\n\nTechnical services management system.\n\n© 2026 All rights reserved.'][lang],
          icon: false,
          doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
          cancelButtonLabel: {visible: false, label: null}
        }, function() { }, function() { });
      },
      showPrivacyPolicy: function() {
        app.openScreen({ screen: 'settings', page: 1 });
      },
      showTerms: function() {
        app.openScreen({ screen: 'settings', page: 2 });
      },
      applyTheme: function(theme) {
        const html = document.documentElement;
        
        // Remover clases de tema anteriores
        html.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'auto') {
          // Detectar preferencia del sistema
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          html.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
          html.classList.add('theme-' + theme);
        }
        
        // Actualizar meta theme-color para la barra del navegador
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.name = 'theme-color';
          document.head.appendChild(metaThemeColor);
        }
        
        const isDark = html.classList.contains('theme-dark');
        metaThemeColor.content = isDark ? '#1a1a2e' : '#667eea';
      },
      applyLocationTracking: function(shareLocation) {
        /**
         * Actualizar app.data.config.tracking según preferencia de share_location
         * 
         * Mapeo:
         * - 'never': tracking.enabled = false
         * - 'working': tracking.enabled = true, activateMode = 'manual'
         * - 'always': tracking.enabled = true, activateMode = 'always'
         */
        
        if (!app.data.config.tracking) {
          console.warn('[Settings] app.data.config.tracking no existe');
          return;
        }
        
        switch(shareLocation) {
          case 'never':
            app.data.config.tracking.enabled = false;
            app.data.config.tracking.activateMode = 'manual';
            
            // Detener tracking si está activo
            if (typeof LocationService !== 'undefined' && LocationService.isTracking) {
              LocationService.stopTracking();
            }
            
            console.log('[Settings] Tracking deshabilitado (never)');
            break;
            
          case 'working':
            app.data.config.tracking.enabled = true;
            app.data.config.tracking.activateMode = 'manual';
            
            // Detener tracking automático si estaba activo
            if (typeof LocationService !== 'undefined' && LocationService.isTracking) {
              LocationService.stopTracking();
            }
            
            console.log('[Settings] Tracking habilitado en modo manual (working)');
            break;
            
          case 'always':
            app.data.config.tracking.enabled = true;
            app.data.config.tracking.activateMode = 'always';
            
            // Iniciar tracking automático
            if (typeof LocationService !== 'undefined') {
              LocationService.init();
            }
            
            console.log('[Settings] Tracking habilitado en modo continuo (always)');
            break;
            
          default:
            console.warn('[Settings] Valor de share_location inválido:', shareLocation);
        }
      },
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'settings-page0-frmSettings',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#settings-page0-frmSettings',
            id: 'settings-page0-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #f1f1f1;',
              'footer': 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 0,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#settings-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page0-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 0,
            function: function() { forms.settings.hide(0);
},
          },
          {
            controlType: 'label',
            parent: '#settings-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page0-title',
            value: [
              'Ajustes',
              'Settings'
            ],
            css: null,
            class: 'header-title',
            pageNum: 0,
          },
        ],
        onLoad: function(){
        forms.settings.functions.loadSettings();
      }
      },
      {
        pageName: 'page1',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'settings-page1-frmSettings',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 1,
          },
          {
            controlType: 'blankwrapper',
            parent: '#settings-page1-frmSettings',
            id: 'settings-page1-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #f1f1f1;',
              'footer': 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 1,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#settings-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page1-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            function: function() { forms.settings.hide(1);
            },
            pageNum: 1,
          },
          {
            controlType: 'label',
            parent: '#settings-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page1-title',
            value: ['Política de Privacidad', 'Privacy Policy'],
            css: null,
            class: 'header-title',
            pageNum: 1,
          },
        ],
        onLoad: function(){
            // Cargar contenido de Política de Privacidad
            const lang = app.data.config.languageIndex;
            const langCode = lang === 0 ? 'es' : 'en';
            
            // Mostrar loading
            blankwrapper('#settings-page1-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando...', 'Loading...'][lang]+'</div>');
            
            fetch(app.data.config.apiUrl + 'settings.php?action=get-legal-document&type=privacy&language=' + langCode, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
            })
            .then(response => response.json())
            .then(data => {
            if (data.status === 'success' && data.data && data.data.document) {
                const doc = data.data.document;
                
                const html = `
                <div class="legal-document-container">
                    <div class="legal-document-content">
                    ${doc.content}
                    </div>
                    <div class="legal-document-footer">
                    <p><strong>${['Versión:', 'Version:'][lang]}</strong> ${doc.version}</p>
                    <p><strong>${['Última actualización:', 'Last updated:'][lang]}</strong> ${new Date(doc.updated_at).toLocaleDateString(langCode === 'es' ? 'es-ES' : 'en-US')}</p>
                    </div>
                </div>
                `;
                
                blankwrapper('#settings-page1-form-wrapper').content.html(html);
            } else {
                blankwrapper('#settings-page1-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>' + (data.message || ['Error al cargar documento', 'Error loading document'][lang]) + '</div>');
            }
            })
            .catch(error => {
            console.error('Error loading legal document:', error);
            blankwrapper('#settings-page1-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>'+['Error de conexión', 'Connection error'][lang]+'</div>');
            });
        }
      },
      {
        pageName: 'page2',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'settings-page2-frmSettings',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 2,
          },
          {
            controlType: 'blankwrapper',
            parent: '#settings-page2-frmSettings',
            id: 'settings-page2-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #f1f1f1;',
              'footer': 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 2,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#settings-page2-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page2-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            function: function() { forms.settings.hide(2); },
            pageNum: 2,
          },
          {
            controlType: 'label',
            parent: '#settings-page2-form-wrapper > .mangole-blank-wrapper-header',
            id: 'settings-page2-title',
            value: ['Términos y Condiciones', 'Terms & Conditions'],
            css: null,
            class: 'header-title',
            pageNum: 2,
          },
        ],
        onLoad: function(){
            const lang = app.data.config.languageIndex;
            const langCode = lang === 0 ? 'es' : 'en';
            
            // Mostrar loading
            blankwrapper('#settings-page2-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando...', 'Loading...'][lang]+'</div>');
            
            fetch(app.data.config.apiUrl + 'settings.php?action=get-legal-document&type=terms&language=' + langCode, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
            })
            .then(response => response.json())
            .then(data => {
            if (data.status === 'success' && data.data && data.data.document) {
                const doc = data.data.document;
                
                const html = `
                <div class="legal-document-container">
                    <div class="legal-document-content">
                    ${doc.content}
                    </div>
                    <div class="legal-document-footer">
                    <p><strong>${['Versión:', 'Version:'][lang]}</strong> ${doc.version}</p>
                    <p><strong>${['Última actualización:', 'Last updated:'][lang]}</strong> ${new Date(doc.updated_at).toLocaleDateString(langCode === 'es' ? 'es-ES' : 'en-US')}</p>
                    </div>
                </div>
                `;
                
                blankwrapper('#settings-page2-form-wrapper').content.html(html);
            } else {
                blankwrapper('#settings-page2-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>' + (data.message || ['Error al cargar documento', 'Error loading document'][lang]) + '</div>');
            }
            })
            .catch(error => {
            console.error('Error loading legal document:', error);
            blankwrapper('#settings-page2-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>'+['Error de conexión', 'Connection error'][lang]+'</div>');
            });
        }
      },
    ],
    show: function(_callback){
        this.opened = true;
        
        // Agregar entrada al historial del navegador con el slug del formulario + número de página
        const currentHash = window.location.hash || '#';
        const pageNum = this._currentPage || 0;
        
        // Construir hash: slug_pN (ej: photogallery_p0, photogallery_p1)
        const slugWithPage = this._slug + '_p' + pageNum;
        const newHash = currentHash + (currentHash === '#' ? '' : '/') + slugWithPage;
        
        window.history.pushState({ 
            formSlug: this._slug,
            pageNum: pageNum
        }, '', newHash);
        
        // Extraer ID del control form desde la página actual
        const formControl = this.pages[this._currentPage].controls[0];
        const formId = formControl.id;
        
        // Validar que el primer control sea un form
        if (formControl.controlType !== 'form') {
            return;
        }
        
        // Aplicar visibilidad inicial
        const formElement = document.getElementById(formId);
        if (formElement) {
            formElement.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
            formElement.style.opacity = '0';
            formElement.style.visibility = 'hidden';
        }
        
        // Esperar renderizado y hacer visible
        const checkInterval = setInterval(() => {
            const formElement = document.getElementById(formId);
            if (formElement) {
                clearInterval(checkInterval);
                // Forzar reflow para que la transición funcione
                formElement.offsetHeight;
                formElement.style.opacity = '1';
                formElement.style.visibility = 'visible';
                
                if (typeof _callback === "function"){
                    _callback();
                }
            }
        }, 10);
    },
    hide: function(_page, _callback, skipHistory){
        if (!this.opened) return;
        
        // Si no se especifica página, usar página 0 por defecto
        if (_page === undefined || _page === null) {
            _page = 0;
        }
        
        // Buscar el form de la página específica
        const pageControl = this.pages[_page].controls[0];
        if (pageControl.controlType !== 'form') {
            if (typeof _callback === "function") {
                _callback();
            }
            return;
        }
        
        const formElement = document.getElementById(pageControl.id);
        if (!formElement) {
            if (typeof _callback === "function") {
                _callback();
            }
            return;
        }
        
        // Asegurar que la transición esté aplicada
        formElement.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        
        // Aplicar visibilidad oculta con transición
        const handleTransitionEnd = () => {
            formElement.removeEventListener('transitionend', handleTransitionEnd);
            formElement.remove();
            
            // Verificar si quedan otras páginas abiertas
            let otherPagesOpen = false;
            for (let i = 0; i < this.pages.length; i++) {
                const otherPageControl = this.pages[i].controls[0];
                if (otherPageControl.controlType === 'form') {
                    const otherElement = document.getElementById(otherPageControl.id);
                    if (otherElement) {
                        otherPagesOpen = true;
                        break;
                    }
                }
            }
            
            // Solo cerrar el formulario si no hay otras páginas abiertas
            if (!otherPagesOpen) {
                this.opened = false;
                this.params = {};
            }
            
            if (typeof _callback === "function") {
                _callback();
            }
        };
        
        formElement.addEventListener('transitionend', handleTransitionEnd);
        formElement.style.opacity = '0';
        
        // Solo ir atrás en el historial si no se llamó desde popstate
        if (!skipHistory) {
            window.history.back();
        }
    },
  };
})();