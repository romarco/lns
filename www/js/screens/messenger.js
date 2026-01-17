(function(){
  forms.messenger = {
    _slug: 'messenger',
    _shortIds: true,
    opened: false,
    params: {},
    variables: {
      current_row: null,
      id_messenger: null,
      conversation_id: null,
      project_id: null,
      polling_interval: null,
      last_message_id: 0,
      oldest_message_id: 0,
      has_older_messages: false,
      is_loading_older: false,
      participants: [],
      search_query: '',
    },
    functions: {
      init: function() {

      },
      renderConversations: function(conversations) {
        const lang = app.data.config.languageIndex;
        
        if (!conversations || conversations.length === 0) {
          const emptyTexts = ['No hay conversaciones', 'No conversations'];
          blankwrapper('#messenger-page0-form-wrapper').content.html('<div class="lns-feed-empty"><i class="icon-chat"></i> ' + emptyTexts[lang] + '</div>');
          return;
        }
        
        let html = '<div class="lns-conversations-list">';
        
        conversations.forEach(function(conv) {
          const hasUnread = conv.unread_count > 0;
          const badgeHtml = hasUnread ? '<span class="lns-badge">' + conv.unread_count + '</span>' : '';
          
          // Formatear fecha relativa
          const timeAgo = forms.messenger.functions.formatTimeAgo(conv.last_message_at);
          
          html += '<div class="lns-conversation-card ' + (hasUnread ? 'has-unread' : '') + '" data-conversation-id="' + conv.id + '" data-project-id="' + conv.project_id + '">';
          html += '  <div class="lns-conversation-avatar">';
          html += '    <i class="icon-projects"></i>';
          html += '  </div>';
          html += '  <div class="lns-conversation-content">';
          html += '    <div class="lns-conversation-header">';
          html += '      <h3 class="lns-conversation-title">' + conv.project_title + '</h3>';
          html += '      <span class="lns-conversation-time">' + timeAgo + '</span>';
          html += '    </div>';
          html += '    <div class="lns-conversation-preview">';
          html += '      <span class="lns-last-sender">' + (conv.last_sender_name || '') + ': </span>';
          html += '      <span class="lns-last-message">' + (conv.last_message_preview || '') + '</span>';
          html += '    </div>';
          html += '  </div>';
          html += '  ' + badgeHtml;
          html += '</div>';
        });
        
        html += '</div>';
        
        blankwrapper('#messenger-page0-form-wrapper').content.html(html);
        
        // Agregar event listeners
        document.querySelectorAll('.lns-conversation-card').forEach(function(card) {
          card.addEventListener('click', function() {
            const conversationId = parseInt(this.getAttribute('data-conversation-id'));
            const projectId = parseInt(this.getAttribute('data-project-id'));
            
            forms.messenger.variables.conversation_id = conversationId;
            forms.messenger.variables.project_id = projectId;
            forms.messenger.variables.last_message_id = 0;
            
            // Navegar a page1
            app.openScreen({
              screen: 'messenger',
              page: 1
            });

          });
        });
      },
      formatTimeAgo: function(dateString) {
        if (!dateString) return '';
        
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Justo ahora';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' h';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' d';
        
        return date.toLocaleDateString();
      },
      renderChatWithSidebar: function(data) {
        const lang = app.data.config.languageIndex;
        
        // Guardar datos en variables
        forms.messenger.variables.conversation_id = data.conversation_id;
        forms.messenger.variables.participants = data.participants || [];
        forms.messenger.variables.has_older_messages = data.has_older_messages || false;
        
        if (data.messages && data.messages.length > 0) {
          forms.messenger.variables.last_message_id = data.messages[data.messages.length - 1].id;
          forms.messenger.variables.oldest_message_id = data.messages[0].id;
        }

        document.querySelector('#messenger-page1-header-title > span.project-name').textContent = data.project_title || '-';

        let html = '';
        //Contenedor de participantes
        data.participants.forEach(function(participant) {
          const avatar = participant.avatar || 'img/default-avatar.png';
          const avatarUrl = avatar.startsWith('https') ? avatar : app.data.config.serverRootUrl + avatar;
          const isOnline = participant.is_online ? 'online' : '';
          html += '    <div class="chat-participant-avatar ' + isOnline + '" data-user-id="' + participant.user_id + '" title="' + participant.full_name + '" onclick="window.forms.messenger.functions.showUserProfile(' + participant.user_id + ')" style="background-image: url(\'' + avatarUrl + '\'); background-size: cover; background-position: center;">';
          if (participant.is_online) {
            html += '      <span class="chat-online-indicator"></span>';
          }
          html += '    </div>';
        });
        structuredlayout('#messenger-page1-stl-wrapper').leftMenu.html(html);

        //Contenedor de mensajes
        html = '    <div class="chat-messages" id="messenger-chat-container">';
        if (data.has_older_messages) {
          html += '      <div class="chat-load-more-messages" id="messenger-load-more">';
          html += '        <button class="chat-load-more-btn" onclick="window.forms.messenger.functions.loadOlderMessages();">' + ['Cargar mensajes anteriores', 'Load older messages'][lang] + '</button>';
          html += '      </div>';
        }
        data.messages.forEach(function(msg) {
          html += forms.messenger.functions.createMessageBubbleWithAvatar(msg);
        });
        html += '    </div>';
        structuredlayout('#messenger-page1-stl-wrapper').content.html(html);
        
        /*
        // Buscador
        html += '    <div class="chat-search">';
        html += '      <input type="text" id="messenger-search-input" placeholder="' + ['Buscar mensajes...', 'Search messages...'][lang] + '" class="chat-search-input">';
        html += '      <button class="chat-search-btn icon-search" id="messenger-search-btn"></button>';
        html += '    </div>';*/

        forms.messenger.functions.addChatInput();
        forms.messenger.functions.scrollToBottom();
        
        // Agregar event listeners de long press a todas las burbujas
        const bubbles = document.querySelectorAll('.chat-message-bubble');
        bubbles.forEach(function(bubble) {
          forms.messenger.functions.addLongPressListener(bubble);
        });
        
        // Event listener para avatares
        const avatars = document.querySelectorAll('.chat-message-avatar');
        avatars.forEach(function(avatar) {
          avatar.addEventListener('click', function() {
            const userId = parseInt(this.getAttribute('data-user-id'));
            forms.messenger.functions.showUserProfile(userId);
          });
        });
        
      },
      createMessageBubbleWithAvatar: function(msg) {
        const isOwn = msg.is_own;
        const bubbleClass = isOwn ? 'own' : 'other';
        const avatar = msg.sender_avatar || 'img/default-avatar.png';
        let contentHtml = '';
        
        if (msg.message_type === 'text') {
          contentHtml = '<p class="chat-message-text">' + msg.message_text + '</p>';
        } else if (msg.message_type === 'image') {
          contentHtml = '<img src="' + app.data.config.serverRootUrl + msg.file_url + '" class="chat-message-image" alt="Imagen">';
        } else if (msg.message_type === 'audio') {
          const duration = msg.duration ? Math.floor(msg.duration / 60) + ':' + (msg.duration % 60).toString().padStart(2, '0') : '0:00';
          contentHtml = '<div class="chat-message-audio">';
          contentHtml += '  <button class="chat-audio-play-btn icon-play" data-audio-url="' + app.data.config.serverRootUrl + msg.file_url + '"></button>';
          contentHtml += '  <span class="chat-audio-duration">' + duration + '</span>';
          contentHtml += '</div>';
        }
        
        let html = '<div class="chat-message-bubble ' + bubbleClass + '" data-message-id="' + msg.id + '" data-message-text="' + (msg.message_type === 'text' ? msg.message_text.replace(/"/g, '&quot;') : '') + '">';
        
        if (!isOwn) {
          const avatarUrl = avatar.startsWith('https') ? avatar : app.data.config.serverRootUrl + avatar;
          html += '  <div class="chat-message-avatar" data-user-id="' + msg.sender_id + '" style="background-image: url(\'' + avatarUrl + '\'); background-size: cover; background-position: center;">';
          html += '  </div>';
        }
        
        html += '  <div class="chat-message-wrapper">';
        if (!isOwn) {
          html += '    <div class="chat-message-sender">' + msg.sender_name + '</div>';
        }
        html += '    <div class="chat-message-content">' + contentHtml + '</div>';
        html += '    <div class="chat-message-time">' + forms.messenger.functions.formatMessageTime(msg.sent_at) + '</div>';
        html += '  </div>';
        html += '</div>';
        
        return html;
      },
      loadOlderMessages: function() {
        if (forms.messenger.variables.is_loading_older || !forms.messenger.variables.has_older_messages) {
          return;
        }
        
        forms.messenger.variables.is_loading_older = true;
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        const projectId = forms.messenger.variables.project_id;
        const beforeMessageId = forms.messenger.variables.oldest_message_id;
        
        if (!sessionToken) return;
        
        // Mostrar loading en el botón
        const loadMoreBtn = document.querySelector('#messenger-load-more button');
        if (loadMoreBtn) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.innerHTML = '<i class="icon-cloud-sync"></i> ' + ['Cargando...', 'Loading...'][lang];
        }
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=get-chat-data&project_id=' + projectId + '&before_message_id=' + beforeMessageId + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.messages) {
            const container = document.getElementById('messenger-chat-container');
            if (!container) return;
            
            // Guardar posición actual del scroll
            const scrollHeight = container.scrollHeight;
            
            // Agregar mensajes viejos al inicio
            result.data.messages.forEach(function(msg) {
              const bubble = forms.messenger.functions.createMessageBubbleWithAvatar(msg);
              const loadMoreDiv = document.getElementById('messenger-load-more');
              if (loadMoreDiv) {
                loadMoreDiv.insertAdjacentHTML('afterend', bubble);
              } else {
                container.insertAdjacentHTML('afterbegin', bubble);
              }
            });
            
            // Actualizar oldest_message_id
            if (result.data.messages.length > 0) {
              forms.messenger.variables.oldest_message_id = result.data.messages[0].id;
            }
            
            // Actualizar flag de has_older_messages
            forms.messenger.variables.has_older_messages = result.data.has_older_messages;
            
            // Si no hay más mensajes viejos, ocultar botón
            if (!result.data.has_older_messages) {
              const loadMoreDiv = document.getElementById('messenger-load-more');
              if (loadMoreDiv) loadMoreDiv.remove();
            } else {
              // Re-habilitar botón
              if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = ['Cargar mensajes anteriores', 'Load older messages'][lang];
              }
            }
            
            // Restaurar posición del scroll (mantener en el mismo lugar visual)
            container.scrollTop = container.scrollHeight - scrollHeight;
            
            // Agregar event listeners a avatares de mensajes nuevos
            container.querySelectorAll('.chat-message-avatar').forEach(function(avatar) {
              avatar.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                forms.messenger.functions.showUserProfile(userId);
              });
            });
          }
          
          forms.messenger.variables.is_loading_older = false;
        })
        .catch(function(error) {
          console.error('[messenger] Error cargando mensajes viejos:', error);
          forms.messenger.variables.is_loading_older = false;
          
          if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = ['Cargar mensajes anteriores', 'Load older messages'][lang];
          }
        });
      },
      highlightSearchTerms: function(text, query) {
        if (!query || !text) return text;
        
        // Escapar caracteres especiales de regex
        const words = query.trim().split(/\s+/);
        let highlightedText = text;
        
        words.forEach(function(word) {
          if (word.length > 0) {
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp('(' + escapedWord + ')', 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
          }
        });
        
        return highlightedText;
      },
      searchMessages: function(_callback) {
        const query = textbox('#messenger-page1-messenger-search-input').value().trim();
        
        if (query == "") {
          // Si está vacío, recargar chat normal
          forms.messenger.variables.search_query = '';
          //app.openScreen({ screen: 'messenger', page: 1 });
          if (typeof _callback === "function"){
            _callback();
          }
          return;
        }
        
        // Guardar query para usar en resaltado
        forms.messenger.variables.search_query = query;
        
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        const conversationId = forms.messenger.variables.conversation_id;
        
        if (!sessionToken) return;
        
        // Mostrar loading
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          container.innerHTML = '<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + ['Buscando...', 'Searching...'][lang] + '</div>';
        }
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=search-messages&conversation_id=' + conversationId + '&search=' + encodeURIComponent(query) + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data) {
            if (result.data.messages.length === 0) {
              if (container) {
                container.innerHTML = '<div class="lns-feed-empty"><i class="icon-search"></i> ' + ['No se encontraron resultados', 'No results found'][lang] + '</div>';
              }
            } else {
              let html = '';
              result.data.messages.forEach(function(msg) {
                // Aplicar resaltado al texto del mensaje
                msg.message_text = forms.messenger.functions.highlightSearchTerms(msg.message_text, query);
                html += forms.messenger.functions.createMessageBubbleWithAvatar(msg);
              });
              if (container) {
                container.innerHTML = html;
              }
              
              // Agregar event listeners a los bubbles
              const bubbles = container.querySelectorAll('.chat-message-bubble');
              bubbles.forEach(function(bubble) {
                forms.messenger.functions.addLongPressListener(bubble);
              });
            }
          } else {
            if (container) {
              container.innerHTML = '<div class="lns-feed-error"><i class="icon-warning"></i> ' + ['Error al buscar', 'Search error'][lang] + '</div>';
            }
          }
          if (typeof _callback === "function"){
            _callback();
          }
        })
        .catch(function(error) {
          console.error('[messenger] Error buscando:', error);
          if (container) {
            container.innerHTML = '<div class="lns-feed-error"><i class="icon-warning"></i> ' + ['Error de conexión', 'Connection error'][lang] + '</div>';
          }
          if (typeof _callback === "function"){
            _callback();
          }
        });
      },
      _queueLock: false,
      _getQueueSafe: function() {
        try {
          const queueStr = localStorage.getItem('messenger_queue') || '[]';
          const queue = JSON.parse(queueStr);
          // Eliminar duplicados por tempId
          const uniqueQueue = [];
          const seenIds = {};
          queue.forEach(function(msg) {
            if (!seenIds[msg.tempId]) {
              seenIds[msg.tempId] = true;
              uniqueQueue.push(msg);
            }
          });
          return uniqueQueue;
        } catch (e) {
          console.error('[messenger] Error leyendo queue:', e);
          return [];
        }
      },
      _setQueueSafe: function(queue) {
        try {
          localStorage.setItem('messenger_queue', JSON.stringify(queue));
          return true;
        } catch (e) {
          console.error('[messenger] Error escribiendo queue:', e);
          return false;
        }
      },
      saveToQueue: function(message) {
        // Simple mutex
        if (forms.messenger.functions._queueLock) {
          //console.log('[messenger] Queue bloqueada, esperando...');
          setTimeout(function() {
            forms.messenger.functions.saveToQueue(message);
          }, 50);
          return;
        }
        
        forms.messenger.functions._queueLock = true;
        
        try {
          const queue = forms.messenger.functions._getQueueSafe();
          
          // Validar que no exista ya en la queue
          const exists = queue.some(function(msg) { return msg.tempId === message.tempId; });
          if (exists) {
            //console.log('[messenger] Mensaje ya existe en queue:', message.tempId);
            forms.messenger.functions._queueLock = false;
            return;
          }
          
          queue.push(message);
          forms.messenger.functions._setQueueSafe(queue);
          //console.log('[messenger] Mensaje guardado en queue:', message.tempId);
        } catch (e) {
          console.error('[messenger] Error guardando en queue:', e);
        } finally {
          forms.messenger.functions._queueLock = false;
        }
      },
      removeFromQueue: function(tempId) {
        // Simple mutex
        if (forms.messenger.functions._queueLock) {
          //console.log('[messenger] Queue bloqueada, esperando...');
          setTimeout(function() {
            forms.messenger.functions.removeFromQueue(tempId);
          }, 50);
          return;
        }
        
        forms.messenger.functions._queueLock = true;
        
        try {
          const queue = forms.messenger.functions._getQueueSafe();
          const originalLength = queue.length;
          const filtered = queue.filter(function(msg) { return msg.tempId !== tempId; });
          
          if (originalLength !== filtered.length) {
            forms.messenger.functions._setQueueSafe(filtered);
            //console.log('[messenger] Mensaje removido de queue:', tempId);
          } else {
            //console.log('[messenger] Mensaje no encontrado en queue:', tempId);
          }
        } catch (e) {
          console.error('[messenger] Error removiendo de queue:', e);
        } finally {
          forms.messenger.functions._queueLock = false;
        }
      },
      getQueue: function() {
        return forms.messenger.functions._getQueueSafe();
      },
      processMessageQueue: function() {
        const lang = app.data.config.languageIndex;
        const queue = forms.messenger.functions.getQueue();
        const conversationId = forms.messenger.variables.conversation_id;
        
        if (queue.length === 0) {
          //console.log('[messenger] No hay mensajes pendientes en queue');
          return;
        }
        
        //console.log('[messenger] Procesando', queue.length, 'mensajes pendientes');
        
        // Filtrar solo mensajes de esta conversación
        const conversationQueue = queue.filter(function(msg) {
          return msg.conversation_id === conversationId;
        });
        
        if (conversationQueue.length === 0) {
          //console.log('[messenger] No hay mensajes pendientes para esta conversación');
          return;
        }
        
        // Procesar cada mensaje
        conversationQueue.forEach(function(queuedMsg) {
          // Verificar si el mensaje ya existe en el DOM
          const existingBubble = document.querySelector('[data-message-id="' + queuedMsg.tempId + '"]');
          
          if (!existingBubble) {
            // Renderizar mensaje con loading
            const container = document.getElementById('messenger-chat-container');
            if (container) {
              const tempMessage = {
                id: queuedMsg.tempId,
                message_text: queuedMsg.message_text,
                message_type: 'text',
                is_own: true,
                sender_name: '',
                sent_at: queuedMsg.sent_at,
                sending: true
              };
              const bubble = forms.messenger.functions.createMessageBubble(tempMessage);
              container.insertAdjacentHTML('beforeend', bubble);
              
              const newBubble = document.querySelector('[data-message-id="' + queuedMsg.tempId + '"]');
              if (newBubble) {
                forms.messenger.functions.addLongPressListener(newBubble);
              }
            }
          }
          
          // Reintentar envío
          forms.messenger.functions.sendQueuedMessage(queuedMsg);
        });
      },
      sendQueuedMessage: function(queuedMsg) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
            return;
          }
        }
        
        if (!sessionToken) {
          console.error('[messenger] No hay sessionToken para mensaje en queue');
          return;
        }
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=send-message&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_id: queuedMsg.conversation_id,
            message_text: queuedMsg.message_text
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.message) {
            // Remover de queue
            forms.messenger.functions.removeFromQueue(queuedMsg.tempId);
            
            // Reemplazar mensaje temporal con el real
            const tempBubble = document.querySelector('[data-message-id="' + queuedMsg.tempId + '"]');
            if (tempBubble) {
              const realBubble = forms.messenger.functions.createMessageBubble(result.data.message);
              tempBubble.outerHTML = realBubble;
              
              const newBubble = document.querySelector('[data-message-id="' + result.data.message.id + '"]');
              if (newBubble) {
                forms.messenger.functions.addLongPressListener(newBubble);
              }
            }
            
            forms.messenger.variables.last_message_id = result.data.message.id;
            //console.log('[messenger] Mensaje de queue enviado exitosamente:', queuedMsg.tempId);
          } else {
            console.error('[messenger] Error permanente al enviar mensaje de queue:', result.message);
            // Remover de queue (error del servidor no tiene sentido reintentar)
            forms.messenger.functions.removeFromQueue(queuedMsg.tempId);
            
            // Eliminar del DOM pero mostrar error
            const tempBubble = document.querySelector('[data-message-id="' + queuedMsg.tempId + '"]');
            if (tempBubble) {
              const statusIcon = tempBubble.querySelector('.chat-message-status');
              if (statusIcon) {
                statusIcon.innerHTML = '<i class="icon-warning" style="color: #f44336;" title="Error: ' + (result.message || 'Error desconocido') + '"></i>';
              }
            }
          }
        })
        .catch(function(error) {
          console.error('[messenger] Error de red al enviar mensaje de queue:', error);
          // Mantener en queue, se reintentará la próxima vez que se abre el chat
          const tempBubble = document.querySelector('[data-message-id="' + queuedMsg.tempId + '"]');
          if (tempBubble) {
            const statusIcon = tempBubble.querySelector('.chat-message-status');
            if (statusIcon) {
              statusIcon.innerHTML = '<i class="icon-warning" style="color: #ff9800;" title="Sin conexión"></i>';
            }
          }
        });
      },
      copyToClipboard: function(text) {
        const lang = app.data.config.languageIndex;
        
        // Usar navigator.clipboard si está disponible
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            /*window.msgalert.showAlert({
              title: ['Copiado', 'Copied'],
              text: ['Texto copiado al portapapeles', 'Text copied to clipboard'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});*/
          }).catch(function(err) {
            console.error('[messenger] Error al copiar:', err);
          });
        } else {
          // Fallback para navegadores antiguos
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            /*window.msgalert.showAlert({
              title: ['Copiado', 'Copied'],
              text: ['Texto copiado al portapapeles', 'Text copied to clipboard'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});*/
          } catch (err) {
            console.error('[messenger] Error al copiar:', err);
          }
          document.body.removeChild(textarea);
        }
      },
      showMessageInfo: function(messageId) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) return;
        
        // Mostrar loading
        window.msgalert.showAlert({
          title: ['Información del mensaje', 'Message information'],
          text: ['Cargando...', 'Loading...'],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Cerrar', 'Close']},
          cancelButtonLabel: {visible: false, label: null}
        }, function() {}, function() {});
        
        // Obtener info del servidor
        fetch(app.data.config.apiUrl + 'messenger.php?action=get-message-read-status&message_id=' + messageId + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data) {
            const readUsers = result.data.read_by || [];
            const unreadUsers = result.data.not_read_by || [];
            
            let infoText = '';
            
            if (readUsers.length > 0) {
              infoText += ['<b>Leído por:</b><br>', '<b>Read by:</b><br>'][lang];
              readUsers.forEach(function(user) {
                infoText += '• ' + user.full_name + '<br>';
              });
            }
            
            if (unreadUsers.length > 0) {
              if (readUsers.length > 0) infoText += '<br>';
              infoText += ['<b>No leído por:</b><br>', '<b>Not read by:</b><br>'][lang];
              unreadUsers.forEach(function(user) {
                infoText += '• ' + user.full_name + '<br>';
              });
            }
            
            if (readUsers.length === 0 && unreadUsers.length === 0) {
              infoText = ['No hay información de lectura disponible', 'No read information available'][lang];
            }
            
            window.msgalert.showAlert({
              title: ['Información del mensaje', 'Message information'],
              text: [infoText, infoText],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Cerrar', 'Close']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: ['No se pudo obtener la información', 'Could not get information'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Cerrar', 'Close']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          console.error('[messenger] Error al obtener info:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Cerrar', 'Close']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        });
      },
      showMessageOptions: function(messageId, messageText) {
        const lang = app.data.config.languageIndex;
        
        window.jlistpicker.showPicker({
          title: ['Opciones', 'Options'],
          items: [
            { text: ['Copiar', 'Copy'], value: 'copy' },
            { text: ['Información', 'Information'], value: 'info' }
          ],
          selectedValue: null,
          doneButtonLabel: ['Aceptar', 'Accept'],
          cancelButtonLabel: ['Cancelar', 'Cancel'],
          hideTitle: true,
          hideRadioCircles: true,
          hideButtons: true
        }, function(selected) {
          if (selected.value === 'copy') {
            forms.messenger.functions.copyToClipboard(messageText);
          } else if (selected.value === 'info') {
            forms.messenger.functions.showMessageInfo(messageId);
          }
        });
      },
      addLongPressListener: function(bubbleElement) {
        let pressTimer = null;
        
        const startPress = function(e) {
          pressTimer = setTimeout(function() {
            const messageId = bubbleElement.getAttribute('data-message-id');
            const messageText = bubbleElement.getAttribute('data-message-text');
            
            // Solo mostrar menú si el mensaje tiene texto y no es temporal
            if (messageText && !messageId.startsWith('temp_')) {
              forms.messenger.functions.showMessageOptions(messageId, messageText);
            }
          }, 500); // 500ms para long press
        };
        
        const cancelPress = function() {
          if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        };
        
        // Touch events
        bubbleElement.addEventListener('touchstart', startPress);
        bubbleElement.addEventListener('touchend', cancelPress);
        bubbleElement.addEventListener('touchcancel', cancelPress);
        bubbleElement.addEventListener('touchmove', cancelPress);
        
        // Mouse events (para testing en desktop)
        bubbleElement.addEventListener('mousedown', startPress);
        bubbleElement.addEventListener('mouseup', cancelPress);
        bubbleElement.addEventListener('mouseleave', cancelPress);
      },
      showUserProfile: function(userId) {
        const participant = forms.messenger.variables.participants.find(p => p.user_id === userId);
        if (!participant) return;
        
        const lang = app.data.config.languageIndex;
        const avatar = participant.avatar || 'img/default-avatar.png';
        
        // Crear lightbox
        let html = '<div class="chat-lightbox" id="messenger-user-lightbox">';
        html += '  <div class="chat-lightbox-overlay"></div>';
        html += '  <div class="chat-lightbox-content">';
        html += '    <button class="chat-lightbox-close icon-close"></button>';
        html += '    <div class="chat-user-profile">';
        html += '      <img src="' + (avatar.startsWith('https') ? avatar : app.data.config.serverRootUrl + avatar) + '" class="chat-user-profile-avatar" alt="' + participant.full_name + '">';
        html += '      <h2 class="chat-user-profile-name">' + participant.full_name + '</h2>';
        html += '      <p class="chat-user-profile-role">' + participant.role + '</p>';
        //html += '      <button class="chat-btn-primary" id="messenger-dm-btn">';
        //html += '        <i class="icon-chat"></i> ' + ['Mensaje privado', 'Private message'][lang];
        //html += '      </button>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Event listeners
        const lightbox = document.getElementById('messenger-user-lightbox');
        const closeBtn = lightbox.querySelector('.chat-lightbox-close');
        const overlay = lightbox.querySelector('.chat-lightbox-overlay');
        const dmBtn = document.getElementById('messenger-dm-btn');
        
        const closeLightbox = function() {
          lightbox.remove();
        };
        
        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        
        dmBtn.addEventListener('click', function() {
          // TODO: Implementar chat 1-a-1 en page2
          closeLightbox();
          //window.msgalert.show(['Chat privado próximamente', 'Private chat coming soon']);
        });
      },
      loadMessages: function(isPolling) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        const lastMessageId = isPolling ? forms.messenger.variables.last_message_id : 0;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
          }
        }
        
        if (!sessionToken || !conversationId) {
          return;
        }
        
        // Solo renderizar loading si es polling y hay error
        const url = app.data.config.apiUrl + 'messenger.php?action=get-messages&conversation_id=' + conversationId + '&last_message_id=' + lastMessageId + '&session_token=' + sessionToken;
        
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.messages) {
            if (isPolling) {
              // Agregar solo mensajes nuevos
              forms.messenger.functions.appendMessages(result.data.messages);
            } else {
              // Renderizar todos los mensajes
              forms.messenger.functions.renderMessages(result.data.messages);
            }
            
            // Marcar como leídos
            forms.messenger.functions.markAsRead();
          } else if (!isPolling) {
            const emptyTexts = ['No hay mensajes', 'No messages'];
            const html = '<div class="chat-messages"><div class="lns-feed-empty"><i class="icon-chat"></i> ' + emptyTexts[lang] + '</div></div>';
            structuredlayout('#messenger-page1-stl-wrapper').content.html(html);
            forms.messenger.functions.addChatInput();
          }
        })
        .catch(function(error) {
          console.error('[messenger] Error al cargar mensajes:', error);
          if (!isPolling) {
            const errorTexts = ['Error al cargar mensajes', 'Error loading messages'];
            structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
          }
        });
      },
      renderMessages: function(messages) {
        let html = '<div class="chat-messages" id="messenger-chat-container">';
        
        messages.forEach(function(msg) {
          html += forms.messenger.functions.createMessageBubble(msg);
        });
        
        html += '</div>';
        
        structuredlayout('#messenger-page1-stl-wrapper').content.html(html);
        forms.messenger.functions.addChatInput();
        forms.messenger.functions.scrollToBottom();
        
        // Agregar event listeners a todas las burbujas
        const bubbles = document.querySelectorAll('.chat-message-bubble');
        bubbles.forEach(function(bubble) {
          forms.messenger.functions.addLongPressListener(bubble);
        });
        
        // Actualizar last_message_id
        if (messages.length > 0) {
          forms.messenger.variables.last_message_id = messages[messages.length - 1].id;
        }
      },
      appendMessages: function(messages) {
        if (messages.length === 0) return;
        
        const container = document.getElementById('messenger-chat-container');
        if (!container) return;
        
        messages.forEach(function(msg) {
          const bubble = forms.messenger.functions.createMessageBubble(msg);
          container.insertAdjacentHTML('beforeend', bubble);
          
          // Agregar event listener al mensaje recién agregado
          const lastBubble = container.lastElementChild;
          if (lastBubble && lastBubble.classList.contains('chat-message-bubble')) {
            forms.messenger.functions.addLongPressListener(lastBubble);
          }
        });
        
        forms.messenger.functions.scrollToBottom();
        
        // Actualizar last_message_id
        forms.messenger.variables.last_message_id = messages[messages.length - 1].id;
      },
      createMessageBubble: function(msg) {
        const isOwn = msg.is_own;
        const bubbleClass = isOwn ? 'own' : 'other';
        let contentHtml = '';
        
        if (msg.message_type === 'text') {
          contentHtml = '<p class="chat-message-text">' + msg.message_text + '</p>';
        } else if (msg.message_type === 'image') {
          contentHtml = '<img src="' + app.data.config.serverRootUrl + msg.file_url + '" class="chat-message-image" alt="Imagen">';
        } else if (msg.message_type === 'audio') {
          const duration = msg.duration ? Math.floor(msg.duration / 60) + ':' + (msg.duration % 60).toString().padStart(2, '0') : '0:00';
          contentHtml = '<div class="chat-message-audio">';
          contentHtml += '  <button class="chat-audio-play-btn icon-play" data-audio-url="' + app.data.config.serverRootUrl + msg.file_url + '"></button>';
          contentHtml += '  <span class="chat-audio-duration">' + duration + '</span>';
          contentHtml += '</div>';
        }
        
        // Icono de estado (loading o nada para chats grupales)
        let statusIcon = '';
        if (msg.sending) {
          statusIcon = '<i class="icon-clock chat-message-status"></i> ';
        }
        
        let html = '<div class="chat-message-bubble ' + bubbleClass + '" data-message-id="' + msg.id + '" data-message-text="' + (msg.message_type === 'text' ? msg.message_text.replace(/"/g, '&quot;') : '') + '">';
        if (!isOwn) {
          html += '  <div class="chat-message-sender">' + msg.sender_name + '</div>';
        }
        html += '  <div class="chat-message-content">' + contentHtml + '</div>';
        html += '  <div class="chat-message-time">' + statusIcon + forms.messenger.functions.formatMessageTime(msg.sent_at) + '</div>';
        html += '</div>';
        
        return html;
      },
      formatMessageTime: function(dateString) {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return hours + ':' + minutes;
      },
      addChatInput: function() {
        const lang = app.data.config.languageIndex;
        const placeholders = ['Escribir mensaje...', 'Type a message...'];
        
        let html = '<div class="chat-input-wrapper">';
        html += '  <button class="chat-btn icon-attachment" id="messenger-attach-btn"></button>';
        html += '  <textarea class="chat-input" id="messenger-text-input" placeholder="' + placeholders[lang] + '" rows="1"></textarea>';
        html += '  <button class="chat-btn icon-microphone" id="messenger-audio-btn"></button>';
        html += '  <button class="chat-btn primary icon-send" id="messenger-send-btn"></button>';
        html += '</div>';
        
        structuredlayout('#messenger-page1-stl-wrapper').footer.html(html);
        
        // Event listeners
        document.getElementById('messenger-send-btn').addEventListener('click', forms.messenger.functions.sendTextMessage);
        document.getElementById('messenger-attach-btn').addEventListener('click', forms.messenger.functions.attachImage);
        document.getElementById('messenger-audio-btn').addEventListener('click', forms.messenger.functions.recordAudio);
        
        // Enter para enviar (solo en navegador, no en móvil)
        const input = document.getElementById('messenger-text-input');
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            // Solo enviar en navegador (cuando hay window.cordova significa móvil)
            if (!window.cordova) {
              e.preventDefault();
              forms.messenger.functions.sendTextMessage();
            }
            // En móvil, dejar el comportamiento por defecto (salto de línea)
          }
        });
      },
      sendTextMessage: function() {
        const lang = app.data.config.languageIndex;
        const input = document.getElementById('messenger-text-input');
        const text = input.value.trim();
        
        if (!text) return;
        
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
            return;
          }
        }
        
        if (!sessionToken) return;
        
        // Generar ID temporal
        const tempId = 'temp_' + Date.now();
        
        // Crear mensaje optimista con loading
        const tempMessage = {
          id: tempId,
          message_text: text,
          message_type: 'text',
          is_own: true,
          sender_name: '',
          sent_at: new Date().toISOString(),
          sending: true
        };
        
        // Guardar en queue ANTES de enviar
        forms.messenger.functions.saveToQueue({
          tempId: tempId,
          conversation_id: conversationId,
          message_text: text,
          sent_at: tempMessage.sent_at
        });
        
        // Limpiar input
        input.value = '';
        
        // Deshabilitar botón
        const sendBtn = document.getElementById('messenger-send-btn');
        sendBtn.disabled = true;
        
        // Mostrar mensaje optimista
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          const bubble = forms.messenger.functions.createMessageBubble(tempMessage);
          container.insertAdjacentHTML('beforeend', bubble);
          forms.messenger.functions.scrollToBottom();
        }
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=send-message&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message_text: text
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.message) {
            // Remover de queue (envío exitoso)
            forms.messenger.functions.removeFromQueue(tempId);
            
            // Reemplazar mensaje temporal con el real
            const tempBubble = document.querySelector('[data-message-id="' + tempId + '"]');
            if (tempBubble) {
              const realBubble = forms.messenger.functions.createMessageBubble(result.data.message);
              tempBubble.outerHTML = realBubble;
              
              // Agregar event listener al mensaje real
              const newBubble = document.querySelector('[data-message-id="' + result.data.message.id + '"]');
              if (newBubble) {
                forms.messenger.functions.addLongPressListener(newBubble);
              }
            }
            forms.messenger.variables.last_message_id = result.data.message.id;
          } else {
            // Eliminar de queue (error de servidor)
            forms.messenger.functions.removeFromQueue(tempId);
            
            // Eliminar mensaje temporal
            const tempBubble = document.querySelector('[data-message-id="' + tempId + '"]');
            if (tempBubble) tempBubble.remove();
            
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: result.message || ['Error al enviar mensaje', 'Error sending message'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          console.error('[messenger] Error al enviar mensaje:', error);
          
          // NO eliminar de queue en caso de error de red (se reintenta al reabrir)
          // Solo marcar visualmente que falló
          const tempBubble = document.querySelector('[data-message-id="' + tempId + '"]');
          if (tempBubble) {
            const statusIcon = tempBubble.querySelector('.chat-message-status');
            if (statusIcon) {
              statusIcon.className = 'chat-message-status';
              statusIcon.innerHTML = '<i class="icon-warning" style="color: #f44336;"></i>';
            }
          }
          
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión. El mensaje se reintentará.', 'Connection error. Message will retry.'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        })
        .finally(function() {
          sendBtn.disabled = false;
        });
      },
      attachImage: function() {
        // Crear input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif';
        
        input.onchange = function(e) {
          const file = e.target.files[0];
          if (!file) return;
          
          // Validar tamaño (20MB)
          if (file.size > 20 * 1024 * 1024) {
            window.msgalert.showAlert({
              title: ['Advertencia', 'Warning'],
              text: ['La imagen es muy grande (máximo 20MB)', 'Image too large (max 20MB)'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
            return;
          }
          
          forms.messenger.functions.uploadFile(file, 'image');
        };
        
        input.click();
      },
      recordAudio: function() {
        const lang = app.data.config.languageIndex;
        
        // Detectar entorno: Cordova (mobile) o Web (navegador)
        const isCordova = window.cordova && navigator.device && navigator.device.capture;
        
        if (isCordova) {
          // Usar Cordova Media Capture para mobile
          forms.messenger.functions.recordAudioMobile();
        } else {
          // Usar MediaRecorder API para web
          forms.messenger.functions.recordAudioWeb();
        }
      },
      recordAudioMobile: function() {
        const lang = app.data.config.languageIndex;
        
        // Opciones de captura: límite 1 archivo, duración máxima 60 segundos
        const options = { 
          limit: 1, 
          duration: 60 
        };
        
        // Iniciar grabación con app nativa
        navigator.device.capture.captureAudio(
          function(mediaFiles) {
            // Éxito - procesar archivo de audio
            if (mediaFiles && mediaFiles.length > 0) {
              const audioFile = mediaFiles[0];
              forms.messenger.functions.uploadAudioFile(audioFile);
            }
          },
          function(error) {
            // Error o cancelación
            console.error('[messenger] Error grabando audio:', error);
            
            // Si el usuario canceló, no mostrar error
            if (error.code !== CaptureError.CAPTURE_NO_MEDIA_FILES) {
              window.msgalert.showAlert({
                title: ['Error', 'Error'],
                text: ['Error al grabar audio', 'Error recording audio'],
                icon: true,
                doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                cancelButtonLabel: {visible: false, label: null}
              }, function() {}, function() {});
            }
          },
          options
        );
      },
      recordAudioWeb: function() {
        const lang = app.data.config.languageIndex;
        
        // Verificar soporte de MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Tu navegador no soporta grabación de audio', 'Your browser does not support audio recording'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
          return;
        }
        
        let mediaRecorder;
        let audioChunks = [];
        let startTime;
        
        // Solicitar permiso de micrófono
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(stream) {
            // Crear MediaRecorder
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = function(event) {
              audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = function() {
              // Detener stream
              stream.getTracks().forEach(track => track.stop());
              
              // Calcular duración
              const duration = Math.floor((Date.now() - startTime) / 1000);
              
              // Crear Blob de audio
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              const audioFile = new File([audioBlob], 'audio_' + Date.now() + '.webm', { type: 'audio/webm' });
              
              // Subir archivo
              forms.messenger.functions.uploadAudioFileWeb(audioFile, duration);
            };
            
            // Iniciar grabación
            startTime = Date.now();
            mediaRecorder.start();
            
            // Mostrar UI de grabación
            forms.messenger.functions.showRecordingUI(
              function() {
                // Callback para enviar
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              },
              function() {
                // Callback para cancelar
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                  // Detener stream sin subir
                  stream.getTracks().forEach(track => track.stop());
                  audioChunks = []; // Limpiar chunks
                  mediaRecorder.ondataavailable = null; // Anular evento
                  mediaRecorder.onstop = null; // Anular evento de subida
                }
              }
            );
            
            // Límite de tiempo: 60 segundos
            setTimeout(function() {
              if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 60000);
            
          })
          .catch(function(error) {
            console.error('[messenger] Error accediendo al micrófono:', error);
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: ['No se pudo acceder al micrófono', 'Could not access microphone'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          });
      },
      showRecordingUI: function(sendCallback, cancelCallback) {
        const lang = app.data.config.languageIndex;
        const container = document.getElementById('messenger-chat-container');
        
        if (!container) return;
        
        // Crear UI de grabación
        const recordingHTML = `
          <div class="recording-ui" id="recording-ui" style="
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            animation: pulse 1.5s ease-in-out infinite;
          ">
            <button onclick="document.getElementById('cancel-recording-btn').click()" style="
              background: white;
              color: #f44336;
              border: none;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 18px;
            ">
              <i class="icon-delete"></i>
            </button>
            <i class="icon-microphone" style="font-size: 20px;"></i>
            <span>${['Grabando...', 'Recording...'][lang]}</span>
            <button onclick="document.getElementById('send-recording-btn').click()" style="
              background: white;
              color: #f44336;
              border: none;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: bold;
              cursor: pointer;
            ">${['Enviar', 'Send'][lang]}</button>
          </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', recordingHTML);
        
        // Botón oculto para enviar
        const sendBtn = document.createElement('button');
        sendBtn.id = 'send-recording-btn';
        sendBtn.style.display = 'none';
        sendBtn.onclick = function() {
          const recordingUI = document.getElementById('recording-ui');
          if (recordingUI) recordingUI.remove();
          sendBtn.remove();
          const cancelBtn = document.getElementById('cancel-recording-btn');
          if (cancelBtn) cancelBtn.remove();
          sendCallback();
        };
        document.body.appendChild(sendBtn);
        
        // Botón oculto para cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-recording-btn';
        cancelBtn.style.display = 'none';
        cancelBtn.onclick = function() {
          const recordingUI = document.getElementById('recording-ui');
          if (recordingUI) recordingUI.remove();
          cancelBtn.remove();
          const sendBtnEl = document.getElementById('send-recording-btn');
          if (sendBtnEl) sendBtnEl.remove();
          cancelCallback();
        };
        document.body.appendChild(cancelBtn);
      },
      uploadAudioFileWeb: function(file, duration) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
            return;
          }
        }
        
        if (!sessionToken) return;
        
        // Deshabilitar botones
        const audioBtn = document.getElementById('messenger-audio-btn');
        const sendBtn = document.getElementById('messenger-send-btn');
        if (audioBtn) {
          audioBtn.disabled = true;
          audioBtn.style.opacity = '0.5';
        }
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.style.opacity = '0.5';
        }
        
        // Mostrar loading
        const uploadingTexts = ['Subiendo audio...', 'Uploading audio...'];
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          const loadingHtml = '<div class="chat-message-bubble uploading" id="upload-temp"><div class="chat-message-content"><i class="icon-cloud-sync"></i> ' + uploadingTexts[lang] + '</div></div>';
          container.insertAdjacentHTML('beforeend', loadingHtml);
          forms.messenger.functions.scrollToBottom();
        }
        
        // Crear FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversation_id', conversationId);
        formData.append('message_type', 'audio');
        formData.append('duration', duration);
        
        // Subir archivo
        fetch(app.data.config.apiUrl + 'messenger.php?action=upload-chat-file&session_token=' + sessionToken, {
          method: 'POST',
          body: formData
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          const tempUpload = document.getElementById('upload-temp');
          if (tempUpload) tempUpload.remove();
          
          if (result.status === 'success' && result.data && result.data.message) {
            if (container) {
              const bubble = forms.messenger.functions.createMessageBubble(result.data.message);
              container.insertAdjacentHTML('beforeend', bubble);
              forms.messenger.functions.scrollToBottom();
              forms.messenger.variables.last_message_id = result.data.message.id;
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: result.message || ['Error al subir audio', 'Error uploading audio'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          const tempUpload = document.getElementById('upload-temp');
          if (tempUpload) tempUpload.remove();
          
          console.error('[messenger] Error al subir audio:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error al subir audio', 'Error uploading audio'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        })
        .finally(function() {
          if (audioBtn) {
            audioBtn.disabled = false;
            audioBtn.style.opacity = '1';
          }
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
          }
        });
      },
      uploadAudioFile: function(mediaFile) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
            return;
          }
        }
        
        if (!sessionToken) return;
        
        // Deshabilitar botones mientras sube
        const audioBtn = document.getElementById('messenger-audio-btn');
        const sendBtn = document.getElementById('messenger-send-btn');
        if (audioBtn) {
          audioBtn.disabled = true;
          audioBtn.style.opacity = '0.5';
        }
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.style.opacity = '0.5';
        }
        
        // Mostrar mensaje de subida
        const uploadingTexts = ['Subiendo audio...', 'Uploading audio...'];
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          const loadingHtml = '<div class="chat-message-bubble uploading" id="upload-temp"><div class="chat-message-content"><i class="icon-cloud-sync"></i> ' + uploadingTexts[lang] + '</div></div>';
          container.insertAdjacentHTML('beforeend', loadingHtml);
          forms.messenger.functions.scrollToBottom();
        }
        
        // Leer el archivo y convertirlo a Blob
        mediaFile.file(
          function(file) {
            const reader = new FileReader();
            
            reader.onloadend = function() {
              // Crear Blob desde ArrayBuffer
              const blob = new Blob([this.result], { type: file.type || 'audio/mp4' });
              
              // Crear FormData
              const formData = new FormData();
              formData.append('file', blob, mediaFile.name || 'audio.m4a');
              formData.append('conversation_id', conversationId);
              formData.append('message_type', 'audio');
              formData.append('duration', Math.floor(mediaFile.duration || 0));
              
              // Subir archivo
              fetch(app.data.config.apiUrl + 'messenger.php?action=upload-chat-file&session_token=' + sessionToken, {
                method: 'POST',
                body: formData
              })
              .then(function(response) {
                return response.json();
              })
              .then(function(result) {
                // Remover loading temporal
                const tempUpload = document.getElementById('upload-temp');
                if (tempUpload) tempUpload.remove();
                
                if (result.status === 'success' && result.data && result.data.message) {
                  if (container) {
                    const bubble = forms.messenger.functions.createMessageBubble(result.data.message);
                    container.insertAdjacentHTML('beforeend', bubble);
                    forms.messenger.functions.scrollToBottom();
                    forms.messenger.variables.last_message_id = result.data.message.id;
                  }
                } else {
                  window.msgalert.showAlert({
                    title: ['Error', 'Error'],
                    text: result.message || ['Error al subir audio', 'Error uploading audio'],
                    icon: true,
                    doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                    cancelButtonLabel: {visible: false, label: null}
                  }, function() {}, function() {});
                }
              })
              .catch(function(error) {
                // Remover loading temporal
                const tempUpload = document.getElementById('upload-temp');
                if (tempUpload) tempUpload.remove();
                
                console.error('[messenger] Error al subir audio:', error);
                window.msgalert.showAlert({
                  title: ['Error', 'Error'],
                  text: ['Error al subir audio', 'Error uploading audio'],
                  icon: true,
                  doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                  cancelButtonLabel: {visible: false, label: null}
                }, function() {}, function() {});
              })
              .finally(function() {
                // Re-habilitar botones
                if (audioBtn) {
                  audioBtn.disabled = false;
                  audioBtn.style.opacity = '1';
                }
                if (sendBtn) {
                  sendBtn.disabled = false;
                  sendBtn.style.opacity = '1';
                }
              });
            };
            
            reader.onerror = function() {
              const tempUpload = document.getElementById('upload-temp');
              if (tempUpload) tempUpload.remove();
              
              window.msgalert.showAlert({
                title: ['Error', 'Error'],
                text: ['Error al leer archivo de audio', 'Error reading audio file'],
                icon: true,
                doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                cancelButtonLabel: {visible: false, label: null}
              }, function() {}, function() {});
              
              // Re-habilitar botones
              if (audioBtn) {
                audioBtn.disabled = false;
                audioBtn.style.opacity = '1';
              }
              if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
              }
            };
            
            // Leer el archivo como ArrayBuffer
            reader.readAsArrayBuffer(file);
          },
          function(error) {
            const tempUpload = document.getElementById('upload-temp');
            if (tempUpload) tempUpload.remove();
            
            console.error('[messenger] Error leyendo MediaFile:', error);
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: ['Error al acceder al archivo de audio', 'Error accessing audio file'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
            
            // Re-habilitar botones
            if (audioBtn) {
              audioBtn.disabled = false;
              audioBtn.style.opacity = '1';
            }
            if (sendBtn) {
              sendBtn.disabled = false;
              sendBtn.style.opacity = '1';
            }
          }
        );
      },
      uploadFile: function(file, type) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[messenger] Error parseando user_data:', e);
            return;
          }
        }
        
        if (!sessionToken) return;
        
        // Deshabilitar botones mientras sube
        const attachBtn = document.getElementById('messenger-attach-btn');
        const sendBtn = document.getElementById('messenger-send-btn');
        if (attachBtn) {
          attachBtn.disabled = true;
          attachBtn.style.opacity = '0.5';
        }
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.style.opacity = '0.5';
        }
        
        // Mostrar mensaje de subida
        const uploadingTexts = ['Subiendo archivo...', 'Uploading file...'];
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          const loadingHtml = '<div class="chat-message-bubble uploading" id="upload-temp"><div class="chat-message-content"><i class="icon-cloud-sync"></i> ' + uploadingTexts[lang] + '</div></div>';
          container.insertAdjacentHTML('beforeend', loadingHtml);
          forms.messenger.functions.scrollToBottom();
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversation_id', conversationId);
        formData.append('message_type', type);
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=upload-chat-file&session_token=' + sessionToken, {
          method: 'POST',
          body: formData
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          // Remover loading temporal
          const tempUpload = document.getElementById('upload-temp');
          if (tempUpload) tempUpload.remove();
          
          if (result.status === 'success' && result.data && result.data.message) {
            if (container) {
              const bubble = forms.messenger.functions.createMessageBubble(result.data.message);
              container.insertAdjacentHTML('beforeend', bubble);
              forms.messenger.functions.scrollToBottom();
              forms.messenger.variables.last_message_id = result.data.message.id;
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: result.message || ['Error al subir archivo', 'Error uploading file'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          // Remover loading temporal
          const tempUpload = document.getElementById('upload-temp');
          if (tempUpload) tempUpload.remove();
          
          console.error('[messenger] Error al subir archivo:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error al subir archivo', 'Error uploading file'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        })
        .finally(function() {
          // Re-habilitar botones
          if (attachBtn) {
            attachBtn.disabled = false;
            attachBtn.style.opacity = '1';
          }
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
          }
        });
      },
      scrollToBottom: function() {
        const container = document.getElementById('messenger-chat-container');
        if (container) {
          setTimeout(function() {
            container.scrollTop = container.scrollHeight;
          }, 100);
        }
      },
      markAsRead: function() {
        const userData = localStorage.getItem('user_data');
        const conversationId = forms.messenger.variables.conversation_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            return;
          }
        }
        
        if (!sessionToken) return;
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=mark-as-read&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_id: conversationId
          })
        })
        .catch(function(error) {
          console.error('[messenger] Error marking as read:', error);
        });
      },
      startPolling: function() {
// Detener polling previo
if (forms.messenger.variables.polling_interval) {
    clearInterval(forms.messenger.variables.polling_interval);
}

// Polling cada 3 segundos
forms.messenger.variables.polling_interval = setInterval(function() {
    if (forms.messenger.opened) {
        forms.messenger.functions.loadMessages(true);
    }
}, 60000);
},
      stopPolling: function() {
if (forms.messenger.variables.polling_interval) {
    clearInterval(forms.messenger.variables.polling_interval);
    forms.messenger.variables.polling_interval = null;
}
},
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'messenger-page0-frmMessenger',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#messenger-page0-frmMessenger',
            id: 'messenger-page0-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #fff;',
              'footer': 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 0,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#messenger-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'messenger-page0-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 0,
            function: function() { forms.messenger.hide(0);
},
          },
          {
            controlType: 'label',
            parent: '#messenger-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'messenger-page0-header-title',
            value: [
              'Conversaciones',
              'Conversations'
            ],
            css: null,
            class: 'header-title',
            pageNum: 0,
          }
        ],
        onLoad: function(){
          const lang = app.data.config.languageIndex;
          const userData = localStorage.getItem('user_data');
          let sessionToken = null;
          
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              sessionToken = parsed.session_token;
            } catch (e) {
              console.error('[messenger] Error parseando user_data:', e);
            }
          }
          
          if (!sessionToken) {
            console.error('[messenger] No hay session_token');
            return;
          }
          
          // Renderizar loading inmediatamente
          const loadingTexts = ['Cargando conversaciones...', 'Loading conversations...'];
          blankwrapper('#messenger-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + loadingTexts[lang] + '</div>');

          fetch(app.data.config.apiUrl + 'messenger.php?action=get-conversations&session_token=' + sessionToken, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(result) {
            if (result.status === 'success' && result.data && result.data.conversations) {
              forms.messenger.functions.renderConversations(result.data.conversations);
            } else {
              const emptyTexts = ['No hay conversaciones', 'No conversations'];
              blankwrapper('#messenger-page0-form-wrapper').content.html('<div class="lns-feed-empty"><i class="icon-chat"></i> ' + emptyTexts[lang] + '</div>');
            }
          })
          .catch(function(error) {
            console.error('[messenger] Error al cargar conversaciones:', error);
            const errorTexts = ['Error al cargar conversaciones', 'Error loading conversations'];
            blankwrapper('#messenger-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
          });
        }
      },
      {
        pageName: 'page1',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'messenger-page1-frmMessenger',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 1,
          },
          {
            controlType: 'structuredlayout',
            parent: '#messenger-page1-frmMessenger',
            id: 'messenger-page1-stl-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: rgb(0 0 0 / 10%) 0px 2px 8px; border-bottom: none; z-index: 6402;',
              'leftMenu': 'display: flex; flex-direction: column; width: 70px; padding: 10px 0; background-color: #f9f9f9; border-right: 1px solid #e0e0e0; overflow-y: auto;',
              'content': 'padding: 0; background-color: #f5f5f5; overflow-y: auto;',
              'rightMenu': null,
              'footer': 'position: relative; min-height: 56px; padding: 0px; background-color: #fff; box-shadow: rgb(0 0 0 / 10%) 0px -2px 8px; border-top: none; z-index: 6402;'
            },
            content: null,
            pageNum: 1,
            hasHeader: true,
            hasLeftMenu: true,
            hasRightMenu: false,
            hasFooter: true,
          },
          {
            controlType: 'blankbutton',
            parent: '#messenger-page1-stl-wrapper > .mangole-structured-layout-header',
            id: 'messenger-page1-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 1,
            function: function() { forms.messenger.functions.stopPolling();
              forms.messenger.hide(1);
},
          },
          {
            controlType: 'label',
            parent: '#messenger-page1-stl-wrapper > .mangole-structured-layout-header',
            id: 'messenger-page1-header-title',
            value: [
              '<span class="chat-user font-size16">Conversaciones</span><br /><span class="project-name font-size12 nowrap">-</span>',
              '<span class="chat-user font-size16">Conversations</span><br /><span class="project-name span1 font-size12 nowrap">-</span>'
            ],
            css: 'line-height: 15px;',
            class: 'header-title overflow-hidden',
            pageNum: 1,
          },
          {
            controlType: 'textbox',
            parent: '#messenger-page1-stl-wrapper > .mangole-structured-layout-header',
            id: 'messenger-page1-messenger-search-input',
            label: null,
            value: null,
            description: null,
            tooltip: null,
            placeholder: [
              'Buscar mensajes...',
              'Search messages...'
            ],
            inputType: 'search',
            sanitizeOnInput: false,
            sanitizeOnOutput: false,
            required: false,
            validateOnInput: false,
            disabled: false,
            readonly: false,
            maxLength: null,
            minLength: null,
            tabindex: null,
            css: {
              'parent': 'flex: 1; display: none;',
              'label': 'display: none;',
              'input': 'padding: 0px 10px; margin: 0; border: none; border-radius: 20px;'
            },
            class: null,
            onchange: null,
            onfocus: null,
            onblur: null,
            onclick: null,
            onpaste: null,
            oncut: null,
            oninput: null,
            onkeydown: function(_element, _key) {
              if (_key === 13) {  // Enter
                forms.messenger.functions.searchMessages(function() {
                  label('#messenger-page1-header-title').show();
                  textbox('#messenger-page1-messenger-search-input').hide();
                  textbox('#messenger-page1-messenger-search-input').value('');
                });
              }
            },
            onkeyup: null,
            onkeypress: null,
            onmouseover: null,
            onmouseout: null,
            pageNum: 1,
          },
          {
            controlType: 'blankbutton',
            parent: '#messenger-page1-stl-wrapper > .mangole-structured-layout-header',
            id: 'messenger-page1-btn-search',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-search',
            css: null,
            function: function(_e) { 
              label('#messenger-page1-header-title').hide();
              textbox('#messenger-page1-messenger-search-input').show();
              textbox('#messenger-page1-messenger-search-input').setfocus();
              if (textbox('#messenger-page1-messenger-search-input').value() != "") {
                forms.messenger.functions.searchMessages(function() {
                  label('#messenger-page1-header-title').show();
                  textbox('#messenger-page1-messenger-search-input').hide();
                  textbox('#messenger-page1-messenger-search-input').value('');
                });
              }
            },
            pageNum: 1,
          },
        ],
        onLoad: function() {
          const lang = app.data.config.languageIndex;
          const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
          const sessionToken = userData.session_token;
          const projectId = forms.messenger.variables.project_id;
          
          if (!sessionToken) {
            const errorTexts = ['No se encontró sesión activa', 'No active session found'];
            structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
            return;
          }
          
          if (!projectId) {
            const errorTexts = ['No se especificó proyecto', 'No project specified'];
            structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
            return;
          }
          
          // Renderizar loading inmediatamente
          const loadingTexts = ['Cargando mensajes...', 'Loading messages...'];
          structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + loadingTexts[lang] + '</div>');
          
          // Usar nuevo endpoint consolidado get-chat-data
          fetch(app.data.config.apiUrl + 'messenger.php?action=get-chat-data&session_token=' + sessionToken + '&project_id=' + projectId, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(result) {
            if (result.status === 'success' && result.data) {
              // Renderizar chat con sidebar usando nueva función
              forms.messenger.functions.renderChatWithSidebar(result.data);
              
              // Procesar mensajes pendientes en queue (si los hay)
              setTimeout(function() {
                forms.messenger.functions.processMessageQueue();
              }, 500);
              
              // Iniciar polling para nuevos mensajes
              forms.messenger.functions.startPolling();
            } else {
              const errorTexts = ['No se pudo abrir el chat', 'Could not open chat'];
              structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
            }
          })
          .catch(function(error) {
            console.error('[messenger] Error al obtener conversación:', error);
            const errorTexts = ['Error de conexión', 'Connection error'];
            structuredlayout('#messenger-page1-stl-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
          });
        }
      },
      {
        pageName: 'page2',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'messenger-page2-frmMessenger',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 2,
          },
          {
            controlType: 'blankwrapper',
            parent: '#messenger-page2-frmMessenger',
            id: 'messenger-page2-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #f5f5f5; overflow-y: auto;',
              'footer': 'position: relative; min-height: 56px; padding: 0px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 2,
            hasHeader: true,
            hasFooter: true,
          },
          {
            controlType: 'blankbutton',
            parent: '#messenger-page2-form-wrapper > .mangole-blank-wrapper-header',
            id: 'messenger-page2-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 2,
            function: function() { forms.messenger.hide(2);
},
          },
          {
            controlType: 'label',
            parent: '#messenger-page2-form-wrapper > .mangole-blank-wrapper-header',
            id: 'messenger-page2-header-title',
            value: [
              'Chat',
              'Chat'
            ],
            css: null,
            class: 'header-title',
            pageNum: 2,
          }
        ],
        onLoad: function() {
          
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