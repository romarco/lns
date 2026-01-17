/**
 * Screen: notifications
 * Creado: 2026-01-02 22:39:33
 */
(function(){
  forms.notifications = {
    _slug: 'notifications',
    _shortIds: true,
    opened: false,
    _currentPage: 0,
    params: {},
    variables: {
      // Estado del sistema de notificaciones
      sessionToken: null,
      fcmToken: null,
      apiUrl: null,
      pollingTimer: null,
      pollingInterval: 30000, // 30 segundos
      unreadCount: 0,
      notificationsList: [],
      currentPage: 1,
      isLoading: false
    },
    functions: {
      init: function() {
        /* 
        Este formulario se puede abrir con:
        
        app.openScreen({
          screen: 'notifications',
          page: 0,
          params: {
            sessionToken: 'xxx',  // Token de sesión del usuario
            apiUrl: 'sys/notifications.php'  // URL del API (opcional)
          }
        });
        */
        
        // Configurar desde params o usar valores por defecto
        forms.notifications.variables.sessionToken = forms.notifications.params.sessionToken || forms.notifications.functions._getSessionToken();
        forms.notifications.variables.apiUrl = forms.notifications.params.apiUrl || (app.data.config.apiUrl + 'notifications.php');
        
        if (!forms.notifications.variables.sessionToken) {
          console.error('[Notifications] No session_token disponible');
          return;
        }
        
        console.log('[Notifications] Inicializando sistema de notificaciones');
        
        // Inicializar FCM para push notifications
        forms.notifications.functions._initFCM();
        
        // Cargar notificaciones iniciales
        forms.notifications.functions._loadNotifications();
        
        // Iniciar polling para actualizar contador
        forms.notifications.functions._startPolling();
      },
      
      // =====================================================
      // FUNCIONES PRIVADAS - Gestión FCM
      // =====================================================
      
      _getSessionToken: function() {
        // Intentar obtener session_token desde localStorage
        try {
          var userData = localStorage.getItem('user_data');
          if (userData) {
            var parsed = JSON.parse(userData);
            return parsed.session_token;
          }
        } catch (e) {
          console.error('[Notifications] Error parseando user_data:', e);
        }
        return null;
      },
      
      _initFCM: function() {
        // Modo Cordova (mobile)
        if (window.cordova && window.FCMPlugin) {
          FCMPlugin.getToken(
            function(token) {
              console.log('[Notifications] FCM Token (Mobile):', token);
              forms.notifications.variables.fcmToken = token;
              forms.notifications.functions._registerDevice(token, 'mobile');
            },
            function(err) {
              console.error('[Notifications] Error getting FCM token:', err);
            }
          );
          
          // Escuchar notificaciones
          FCMPlugin.onNotification(
            function(data) {
              console.log('[Notifications] FCM Notification received:', data);
              if (data.wasTapped) {
                forms.notifications.functions._handleNotificationTap(data);
              } else {
                forms.notifications.functions._handleForegroundNotification(data);
              }
            },
            function(msg) {
              console.log('[Notifications] onNotification registered:', msg);
            },
            function(err) {
              console.error('[Notifications] Error registering onNotification:', err);
            }
          );
        }
        // Modo Web (Firebase)
        else if (window.firebase && firebase.messaging) {
          var messaging = firebase.messaging();
          messaging.requestPermission()
            .then(function() {
              return messaging.getToken();
            })
            .then(function(token) {
              console.log('[Notifications] FCM Token (Web):', token);
              forms.notifications.variables.fcmToken = token;
              forms.notifications.functions._registerDevice(token, 'web');
            })
            .catch(function(err) {
              console.error('[Notifications] Unable to get permission or token:', err);
            });
          
          messaging.onMessage(function(payload) {
            forms.notifications.functions._handleForegroundNotification(payload.data || payload.notification);
          });
        }
        // Modo Browser Preview (sin FCM)
        else {
          console.info('[Notifications] FCM not available - running in polling mode');
          console.info('[Notifications] Push notifications will work on mobile device');
          forms.notifications.functions._registerDevice('browser-preview', 'browser');
        }
      },
      
      _registerDevice: function(token, deviceType) {
        var deviceName = forms.notifications.functions._getDeviceName();
        
        forms.notifications.functions._makeRequest('register-device', {
          fcm_token: token,
          device_type: deviceType,
          device_name: deviceName
        }).then(function(response) {
          if (response.success) {
            console.log('[Notifications] Device registered successfully');
          }
        });
      },
      
      _getDeviceName: function() {
        if (window.device && device.model) {
          return device.model + ' (' + device.platform + ')';
        }
        return navigator.userAgent || 'Web Browser';
      },
      
      _handleForegroundNotification: function(notification) {
        console.log('[Notifications] Foreground notification:', notification);
        
        // Reproducir sonido si está habilitado
        forms.notifications.functions._playSoundIfEnabled();
        
        // Vibrar si está habilitado en settings
        forms.notifications.functions._vibrateIfEnabled();
        
        // Actualizar contador
        forms.notifications.functions._getUnreadCount();
        
        // Mostrar toast
        forms.notifications.functions._showNotificationToast(notification);
        
        // Recargar lista si el formulario está abierto
        if (forms.notifications.opened) {
          forms.notifications.functions._loadNotifications();
        }
      },
      
      _playSoundIfEnabled: function() {
        try {
          // Obtener configuración del usuario
          var userData = localStorage.getItem('user_data');
          if (!userData) return;
          
          var user = JSON.parse(userData);
          var settings = user.settings || {};
          
          // Verificar si sonido está habilitado
          if (settings.sound_enabled) {
            // Crear audio element con sonido de notificación
            var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwNUqjk77RgGgU7k9n0yHMpBS1+zPLaizsKGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSl7yvLekToJFmG36+mjUxELTqbj8bhkGwU5kdj0zHYrBTB+zvLdiTkJGWW77OegURILTqfk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjUxELT6fk8bhlHAU3j9b0z3wvBSl7yvLekzsKGGO36+mjU=');
            audio.volume = 0.5;
            audio.play().catch(function(e) {
              //console.log('[Notifications] Error playing sound:', e);
            });
            //console.log('[Notifications] Sound triggered');
          }
        } catch (e) {
          console.error('[Notifications] Error checking sound settings:', e);
        }
      },
      
      _vibrateIfEnabled: function() {
        try {
          // Obtener configuración del usuario
          var userData = localStorage.getItem('user_data');
          if (!userData) return;
          
          var user = JSON.parse(userData);
          var settings = user.settings || {};
          
          // Verificar si vibración está habilitada
          if (settings.vibration_enabled && navigator.vibrate) {
            // Patrón: vibra 200ms, pausa 100ms, vibra 200ms
            navigator.vibrate([200, 100, 200]);
            //console.log('[Notifications] Vibration triggered');
          }
        } catch (e) {
          console.error('[Notifications] Error checking vibration settings:', e);
        }
      },
      
      _handleNotificationTap: function(notification) {
        console.log('[Notifications] Notification tapped:', notification);
        
        // Navegar si hay URL
        if (notification.action_url) {
          forms.notifications.functions._navigateToUrl(notification.action_url);
        }
        
        // Marcar como leída
        if (notification.notification_id) {
          forms.notifications.functions.markAsRead(notification.notification_id);
        }
      },
      
      _showNotificationToast: function(notification) {
        var lang = app.data.config.languageIndex;
        var defaultTitle = ['Notificación', 'Notification'][lang];
        var title = notification.title || notification.notification_title || defaultTitle;
        var message = notification.body || notification.message || '';
        
        if (window.controls && controls.createNotification) {
          controls.createNotification({
            text: '<strong>' + title + '</strong><br>' + message,
            type: 'info',
            duration: 5000
          });
        }
      },
      
      // =====================================================
      // FUNCIONES PRIVADAS - Polling
      // =====================================================
      
      _startPolling: function() {
        if (forms.notifications.variables.pollingTimer) {
          clearInterval(forms.notifications.variables.pollingTimer);
        }
        
        forms.notifications.variables.pollingTimer = setInterval(function() {
          forms.notifications.functions._getUnreadCount();
        }, forms.notifications.variables.pollingInterval);
        
        console.log('[Notifications] Polling started (interval: ' + forms.notifications.variables.pollingInterval + 'ms)');
      },
      
      _stopPolling: function() {
        if (forms.notifications.variables.pollingTimer) {
          clearInterval(forms.notifications.variables.pollingTimer);
          forms.notifications.variables.pollingTimer = null;
          console.log('[Notifications] Polling stopped');
        }
      },
      
      // =====================================================
      // FUNCIONES PRIVADAS - API Calls
      // =====================================================
      
      _makeRequest: function(action, data) {
        var url = forms.notifications.variables.apiUrl;
        
        data = data || {};
        data.action = action;
        data.session_token = forms.notifications.variables.sessionToken;
        
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
          }
          
          var contentType = response.headers.get('content-type');
          if (!contentType || contentType.indexOf('application/json') === -1) {
            return response.text().then(function(text) {
              console.error('[Notifications] Server returned non-JSON:', text.substring(0, 200));
              throw new Error('Server returned non-JSON response');
            });
          }
          
          return response.json();
        })
        .catch(function(err) {
          console.error('[Notifications] API request error:', err);
          return { success: false, error: err.message };
        });
      },
      
      _loadNotifications: function(page) {
        page = page || 1;
        
        if (forms.notifications.variables.isLoading) return;
        forms.notifications.variables.isLoading = true;
        
        // Mostrar loading solo en la primera carga
        if (page === 1) {
          const lang = app.data.config.languageIndex;
          blankwrapper('#notifications-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando notificaciones...', 'Loading notifications...'][lang]+'</div>');
        }
        
        forms.notifications.functions._makeRequest('get-notifications', {
          page: page,
          limit: 20
        }).then(function(response) {
          forms.notifications.variables.isLoading = false;
          
          if (response.status == 'success') {
            var notifications = response.data.notifications || [];
            
            if (page === 1) {
              forms.notifications.variables.notificationsList = notifications;
            } else {
              forms.notifications.variables.notificationsList = forms.notifications.variables.notificationsList.concat(notifications);
            }
            
            forms.notifications.variables.currentPage = page;
            
            // Renderizar UI
            forms.notifications.functions._renderNotifications();
            console.log('[Notifications] Loaded', notifications.length, 'notifications');
          }
        });
      },
      
      _getUnreadCount: function() {
        forms.notifications.functions._makeRequest('get-unread-count', {}).then(function(response) {
          if (response.success) {
            var count = response.data.unread_count || 0;
            forms.notifications.variables.unreadCount = count;
            
            // Actualizar badge en header del index
            forms.notifications.functions._updateBadge(count);
            console.log('[Notifications] Unread count:', count);
          }
        });
      },
      
      _updateBadge: function(count) {
        // Actualizar badge en el botón de notificaciones del index
        var badge = document.getElementById('notification-badge');
        if (badge) {
          if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
          } else {
            badge.style.display = 'none';
          }
        }
      },
      
      _renderNotifications: function() {
        var notifications = forms.notifications.variables.notificationsList;
        var lang = app.data.config.languageIndex;
        var emptyText = ['No hay notificaciones', 'No notifications'][lang];
        var html = '';
        
        if (notifications.length === 0) {
          html = '<div class="notifications-empty">' +
                 '<div class="notifications-empty-icon">📭</div>' +
                 '<div class="notifications-empty-text">' + emptyText + '</div>' +
                 '</div>';
        } else {
          html = '<div class="notifications-list-container">';
          
          for (var i = 0; i < notifications.length; i++) {
            html += forms.notifications.functions._createNotificationCard(notifications[i]);
          }
          
          html += '</div>';
        }
        
        // Renderizar en el content del blankwrapper
        window.blankwrapper('#notifications-page0-form-wrapper').content.html(html);
        
        // Adjuntar eventos de long tap
        forms.notifications.functions._attachLongTapEvents();
      },
      
      _createNotificationCard: function(notification) {
        var isRead = notification.is_read == 1;
        var iconClass = forms.notifications.functions._getIconForType(notification.notification_type);
        var timeAgo = forms.notifications.functions._formatTimeAgo(notification.created_at);
        
        var html = '<div class="notifications-card' + (isRead ? '' : ' unread') + '" data-id="' + notification.id + '">';
        
        // Badge de no leída (círculo azul)
        if (!isRead) {
          html += '<div class="notifications-badge"></div>';
        }
        
        // Contenido principal
        html += '<div class="notifications-content">';
        
        // Fila superior: ícono + título + tiempo
        html += '<div class="notifications-header">';
        html += '<i class="' + iconClass + ' notifications-icon"></i>';
        html += '<span class="notifications-title' + (isRead ? '' : ' unread') + '">' + 
                forms.notifications.functions._escapeHtml(notification.title) + '</span>';
        html += '<span class="notifications-time">' + timeAgo + '</span>';
        html += '</div>';
        
        // Mensaje
        if (notification.message) {
          html += '<div class="notifications-message">' +
                  forms.notifications.functions._escapeHtml(notification.message) + '</div>';
        }
        
        html += '</div>'; // cierra contenido principal
        html += '</div>'; // cierra card
        
        return html;
      },
      
      _attachLongTapEvents: function() {
        var cards = document.querySelectorAll('.notifications-card');
        
        for (var i = 0; i < cards.length; i++) {
          (function(card) {
            var longTapTimer = null;
            var tapStarted = false;
            
            // Touch events
            card.addEventListener('touchstart', function(e) {
              tapStarted = true;
              longTapTimer = setTimeout(function() {
                if (tapStarted) {
                  forms.notifications.functions._showNotificationOptions(card.dataset.id);
                }
              }, 500); // 500ms para long tap
            });
            
            card.addEventListener('touchend', function(e) {
              if (longTapTimer) {
                clearTimeout(longTapTimer);
              }
              if (tapStarted) {
                tapStarted = false;
                // Tap normal - navegar si hay URL
                var notif = forms.notifications.functions._getNotificationById(card.dataset.id);
                if (notif && notif.action_url) {
                  forms.notifications.functions._navigateToUrl(notif.action_url);
                }
                // Marcar como leída si no lo está
                if (notif && notif.is_read == 0) {
                  forms.notifications.functions.markAsRead(card.dataset.id);
                }
              }
            });
            
            card.addEventListener('touchmove', function(e) {
              tapStarted = false;
              if (longTapTimer) {
                clearTimeout(longTapTimer);
              }
            });
            
            // Mouse events para desktop
            card.addEventListener('mousedown', function(e) {
              tapStarted = true;
              longTapTimer = setTimeout(function() {
                if (tapStarted) {
                  forms.notifications.functions._showNotificationOptions(card.dataset.id);
                }
              }, 500);
            });
            
            card.addEventListener('mouseup', function(e) {
              if (longTapTimer) {
                clearTimeout(longTapTimer);
              }
              if (tapStarted) {
                tapStarted = false;
                var notif = forms.notifications.functions._getNotificationById(card.dataset.id);
                if (notif && notif.action_url) {
                  forms.notifications.functions._navigateToUrl(notif.action_url);
                }
                if (notif && notif.is_read == 0) {
                  forms.notifications.functions.markAsRead(card.dataset.id);
                }
              }
            });
            
            card.addEventListener('mouseleave', function(e) {
              tapStarted = false;
              if (longTapTimer) {
                clearTimeout(longTapTimer);
              }
            });
          })(cards[i]);
        }
      },
      
      _showNotificationOptions: function(notificationId) {
        var notif = forms.notifications.functions._getNotificationById(notificationId);
        if (!notif) return;
        
        var options = [];
        
        // Opción: Marcar como leída (solo si no está leída)
        if (notif.is_read == 0) {
          options.push({
            text: ['Marcar como leída', 'Mark as read'],
            value: 'mark-read'
          });
        }
        
        // Opción: Eliminar
        options.push({
          text: ['Eliminar', 'Delete'],
          value: 'delete'
        });
        
        jlistpicker.showPicker({
          title: ['Opciones', 'Options'],
          items: options,
          hideButtons: true,
          hideRadioCircles: true
        }, function() {
          if (!jlistpicker.sel_option) {
            return;
          }
          
          var selectedValue = jlistpicker.sel_option.dataset.value;
          
          if (selectedValue === 'mark-read') {
            forms.notifications.functions.markAsRead(notificationId);
          } else if (selectedValue === 'delete') {
            forms.notifications.functions.deleteNotification(notificationId);
          }
        });
      },
      
      _getNotificationById: function(id) {
        var notifications = forms.notifications.variables.notificationsList;
        for (var i = 0; i < notifications.length; i++) {
          if (notifications[i].id == id) {
            return notifications[i];
          }
        }
        return null;
      },
      
      _getIconForType: function(type) {
        var icons = {
          'info': 'icon-bell',
          'success': 'icon-check-circle',
          'warning': 'icon-warning',
          'error': 'icon-error',
          'message': 'icon-chat',
          'task': 'icon-projects',
          'reminder': 'icon-bell',
          'project': 'icon-folder',
          'user': 'icon-user',
          'mail': 'icon-mail'
        };
        return icons[type] || 'icon-bell';
      },
      
      _formatTimeAgo: function(dateString) {
        var date = new Date(dateString);
        var now = new Date();
        var seconds = Math.floor((now - date) / 1000);
        
        var lang = app.data.config.languageIndex;
        
        var texts = {
          now: ['Ahora', 'Now'],
          ago: ['Hace ', ''],
          suffix: ['', ' ago'],
          week: [' sem', ' wk']
        };
        
        if (seconds < 60) return texts.now[lang];
        
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return texts.ago[lang] + minutes + 'm' + texts.suffix[lang];
        
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return texts.ago[lang] + hours + 'h' + texts.suffix[lang];
        
        var days = Math.floor(hours / 24);
        if (days < 7) return texts.ago[lang] + days + 'd' + texts.suffix[lang];
        
        if (days < 30) {
          var weeks = Math.floor(days / 7);
          return texts.ago[lang] + weeks + texts.week[lang] + texts.suffix[lang];
        }
        
        // Fecha completa
        var dd = date.getDate();
        var mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();
        return dd + '/' + mm + '/' + yyyy;
      },
      
      _escapeHtml: function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      },
      
      _navigateToUrl: function(url) {
        if (!url) return;
        
        // Usar router de MangoleStudio si existe
        if (window.router && router.navigate) {
          var match = url.match(/([^\/]+)\.html/);
          if (match) {
            var page = match[1];
            var params = url.split('?')[1] || '';
            router.navigate(page, params);
            return;
          }
        }
        
        // Fallback
        if (url.indexOf('http') === 0) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      },
      
      // =====================================================
      // FUNCIONES PÚBLICAS - API para UI
      // =====================================================
      
      markAsRead: function(notificationId) {
        forms.notifications.functions._makeRequest('mark-as-read', {
          notification_id: notificationId
        }).then(function(response) {
          if (response.status == 'success') {
            // Actualizar contador
            forms.notifications.functions._getUnreadCount();
            
            // Actualizar item en lista
            for (var i = 0; i < forms.notifications.variables.notificationsList.length; i++) {
              if (forms.notifications.variables.notificationsList[i].id == notificationId) {
                forms.notifications.variables.notificationsList[i].is_read = 1;
                break;
              }
            }
            
            // Re-renderizar la lista
            forms.notifications.functions._renderNotifications();
          }
        });
      },
      
      markAllAsRead: function() {
        forms.notifications.functions._makeRequest('mark-all-as-read', {}).then(function(response) {
          if (response.status == 'success') {
            // Actualizar todas las notificaciones
            for (var i = 0; i < forms.notifications.variables.notificationsList.length; i++) {
              forms.notifications.variables.notificationsList[i].is_read = 1;
            }
            
            forms.notifications.variables.unreadCount = 0;
            
            // Re-renderizar la lista
            forms.notifications.functions._renderNotifications();
            forms.notifications.functions._updateBadge(0);
          }
        });
      },
      
      deleteNotification: function(notificationId) {
        forms.notifications.functions._makeRequest('delete-notification', {
          notification_id: notificationId
        }).then(function(response) {
          if (response.status == 'success') {
            // Remover de la lista
            forms.notifications.variables.notificationsList = forms.notifications.variables.notificationsList.filter(function(n) {
              return n.id != notificationId;
            });
            
            // Actualizar contador
            forms.notifications.functions._getUnreadCount();
            
            // Re-renderizar la lista
            forms.notifications.functions._renderNotifications();
          }
        });
      },
      
      loadMore: function() {
        var nextPage = forms.notifications.variables.currentPage + 1;
        forms.notifications.functions._loadNotifications(nextPage);
      },
      
      refresh: function() {
        forms.notifications.functions._loadNotifications(1);
        forms.notifications.functions._getUnreadCount();
      }
    },
    pages: [{
      controls: [
    {
        "controlType": "form",
        "parent": null,
        "id": "notifications-page0-frmNotifications",
        "content": null,
        css: 'z-index: 9998; background-color: #fff;',
        "pageNum": 0
    },
    {
        "controlType": "blankwrapper",
        "parent": "#notifications-page0-frmNotifications",
        "id": "notifications-page0-form-wrapper",
        "css": {
            "parent": "position: relative; display: flex; width: 100%; height: 100%;",
            "header": "position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;",
            "content": "background-color: #fff;",
            "footer": "position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;"
        },
        "content": null,
        "pageNum": 0,
        "hasHeader": true,
        "hasFooter": false
    },
    {
        "controlType": "blankbutton",
        "parent": "#notifications-page0-form-wrapper > .mangole-blank-wrapper-header",
        "id": "notifications-page0-btn-back",
        "label": null,
        "tooltip": null,
        "disabled": false,
        "tabindex": null,
        "class": "header-button icon-back",
        "css": null,
        "function": function() {
            forms.notifications.hide(0);
        },
        "pageNum": 0
    },
    {
        "controlType": "label",
        "parent": "#notifications-page0-form-wrapper > .mangole-blank-wrapper-header",
        "id": "notifications-page0-title",
        "value": ["Notificaciones", "Notifications"],
        "css": null,
        "class": "header-title",
        "pageNum": 0
    }
],
      onLoad: function(){
        // Inicialización del formulario
        forms.notifications.functions.init();
      }
    }],
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
    }
  };
})();
