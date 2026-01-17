(function(){
  forms.users = {
    _slug: 'users',
    _shortIds: true,
    opened: false,
    _currentPage: 0,
    params: {},
    variables: {
      current_row: null,
      id_users: null,
    },
    functions: {
      init: function() {
        /* 
        Este formulario puede ser renderizado usando app.openScreen():
        
        app.openScreen({
          screen: 'users',
          page: 0,
          params: {
              id: 145,
              mode: 'edit'
          }
        });
        */
        
        // Cargar datos del usuario logueado
        this.loadUserProfile();
      },
      loadUserProfile: function() {
        const lang = app.data.config.languageIndex;
        
        // Mostrar loading inmediatamente
        blankwrapper('#users-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando perfil...', 'Loading profile...'][lang]+'</div>');
        
        const userData = localStorage.getItem('user_data');
        if (!userData) return;
        
        try {
          const user = JSON.parse(userData);
          const sessionToken = user.session_token;
          
          console.log('users.js loadUserProfile - sessionToken:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'no existe');
          
          // Si no hay session_token, solo mostrar datos de localStorage
          if (!sessionToken) {
            console.warn('No hay session_token, mostrando datos de localStorage');
            this.displayUserProfile(user);
            return;
          }
          
          // Obtener datos actualizados del usuario
          fetch(app.data.config.apiUrl + 'users.php?action=get-profile&session_token=' + sessionToken, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(data => {
            //console.log('Respuesta del servidor:', data);
            
            if (data.status === 'success' && data.data && data.data.user) {
              // Guardar en localStorage
              const updatedUserData = {
                ...user,
                ...data.data.user
              };
              localStorage.setItem('user_data', JSON.stringify(updatedUserData));
              
              // Mostrar perfil
              this.displayUserProfile(data.data.user);
            } else {
              //console.log('Usando datos de localStorage como fallback');
              this.displayUserProfile(user);
            }
          })
          .catch(error => {
            console.error('Error loading profile:', error);
            // Usar datos del localStorage como fallback
            this.displayUserProfile(user);
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      },
      displayUserProfile: function(user) {
        const lang = app.data.config.languageIndex;
        
        const avatarStyle = user.avatar 
          ? `background-image: url('${user.avatar}'); background-size: cover; background-position: center;` 
          : '';
        
        const html = `
          <div class="user-profile-card">
            <div class="user-profile-avatar-section">
              <div class="user-profile-avatar" style="${avatarStyle}">
                ${!user.avatar ? `<i class="icon-user"></i>` : ''}
                <button id="user-change-avatar-btn" class="user-avatar-badge-btn" style="display: none;" onclick="window.forms.users.functions.changeAvatar()">
                  <i class="icon-photo"></i>
                </button>
              </div>
            </div>
            
            <div class="user-profile-stats">
              <div class="user-stat">
                <div class="user-stat-value">${user.total_projects_completed || 0}</div>
                <div class="user-stat-label">${['Proyectos', 'Projects'][lang]}</div>
              </div>
              <div class="user-stat-divider"></div>
              <div class="user-stat">
                <div class="user-stat-value">${user.average_rating ? parseFloat(user.average_rating).toFixed(1) : '0.0'}</div>
                <div class="user-stat-label">${['Calificación', 'Rating'][lang]}</div>
              </div>
            </div>
            
            <div class="user-profile-form">
              <div class="user-form-group">
                <label>${['Nombre completo', 'Full name'][lang]}</label>
                <input type="text" id="user-full-name" value="${user.full_name || ''}" disabled>
              </div>
              
              <div class="user-form-group">
                <label>${['Correo electrónico', 'Email'][lang]}</label>
                <input type="email" id="user-email" value="${user.email || ''}" disabled>
              </div>
              
              <div class="user-form-group">
                <label>${['Contraseña', 'Password'][lang]}</label>
                <input type="password" id="user-password" value="" placeholder="${['Dejar vacío para no cambiar', 'Leave empty to keep current'][lang]}" disabled>
              </div>
              
              <div class="user-form-group">
                <label>${['Repetir contraseña', 'Repeat password'][lang]}</label>
                <input type="password" id="user-password-repeat" value="" placeholder="${['Repetir contraseña', 'Repeat password'][lang]}" disabled>
              </div>
              
              <div class="user-form-group">
                <label>${['Teléfono móvil', 'Mobile phone'][lang]}</label>
                <input type="tel" id="user-mobile" value="${user.mobile || ''}" disabled>
              </div>
              
              <div class="user-form-group">
                <label>${['Idioma', 'Language'][lang]}</label>
                <select id="user-language" disabled>
                  <option value="es" ${user.language === 'es' ? 'selected' : ''}>Español</option>
                  <option value="en" ${user.language === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
              
              <div class="user-form-group">
                <button id="user-logout-btn" class="user-logout-button" onclick="window.app.logout()">
                  <i class="icon-logout"></i> ${['Cerrar Sesión', 'Logout'][lang]}
                </button>
              </div>
            </div>
          </div>
        `;
        
        blankwrapper('#users-page0-form-wrapper').content.html(html);
      },
      toggleEdit: function() {
        const inputs = document.querySelectorAll('.user-profile-form input, .user-profile-form select');
        inputs.forEach(input => input.disabled = false);
        
        blankbutton('#users-page0-user-edit-btn').hide();
        blankbutton('#users-page0-user-save-btn').show();
        blankbutton('#users-page0-user-cancel-btn').show();
        document.getElementById('user-change-avatar-btn').style.display = 'flex';
      },
      cancelEdit: function() {
        this.loadUserProfile();
        
        const inputs = document.querySelectorAll('.user-profile-form input, .user-profile-form select');
        inputs.forEach(input => input.disabled = true);
        
        blankbutton('#users-page0-user-edit-btn').show();
        blankbutton('#users-page0-user-save-btn').hide();
        blankbutton('#users-page0-user-cancel-btn').hide();
        
        const avatarBtn = document.getElementById('user-change-avatar-btn');
        if (avatarBtn) avatarBtn.style.display = 'none';
      },
      changeAvatar: function() {
        const lang = app.data.config.languageIndex;
        
        // Crear input file temporal
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          // Validar que sea imagen
          if (!file.type.startsWith('image/')) {
            app.showMessage(['Por favor selecciona una imagen', 'Please select an image'][lang]);
            return;
          }
          
          // Validar tamaño (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: ['La imagen no puede ser mayor a 5MB', 'Image cannot be larger than 5MB'][lang],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
            return;
          }
          
          // Leer y mostrar preview
          const reader = new FileReader();
          reader.onload = (event) => {
            const avatarContainer = document.querySelector('.user-profile-avatar');
            const icon = avatarContainer.querySelector('i.icon-user');
            
            // Aplicar background-image
            avatarContainer.style.backgroundImage = `url('${event.target.result}')`;
            avatarContainer.style.backgroundSize = 'cover';
            avatarContainer.style.backgroundPosition = 'center';
            
            // Ocultar el ícono si existe
            if (icon) {
              icon.style.display = 'none';
            }
            
            // Guardar en variable temporal para enviar al servidor
            forms.users.variables.newAvatar = event.target.result;
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
      saveProfile: function() {
        const lang = app.data.config.languageIndex;
        const fullName = document.getElementById('user-full-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const passwordRepeat = document.getElementById('user-password-repeat').value;
        const mobile = document.getElementById('user-mobile').value.trim();
        const language = document.getElementById('user-language').value === 'es' ? 0 : 1;
        
        // Validaciones
        if (!fullName) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['El nombre completo es requerido', 'Full name is required'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (!email) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['El correo electrónico es requerido', 'Email is required'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (password && password !== passwordRepeat) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Las contraseñas no coinciden', 'Passwords do not match'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        const userData = localStorage.getItem('user_data');
        if (!userData) {
          console.error('No hay user_data en localStorage');
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error: sesión no encontrada', 'Error: session not found'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        const user = JSON.parse(userData);
        const sessionToken = user.session_token;
        
        console.log('saveProfile - userData completo:', user);
        console.log('saveProfile - sessionToken:', sessionToken);
        
        if (!sessionToken) {
          console.error('session_token no existe en user_data');
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error: sesión inválida', 'Error: invalid session'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        const updateData = {
          full_name: fullName,
          email: email,
          mobile: mobile,
          language: language
        };
        
        if (password) {
          updateData.password = password;
        }
        
        // Agregar avatar si cambió
        if (forms.users.variables.newAvatar) {
          updateData.avatar = forms.users.variables.newAvatar;
        }
        
        console.log('users.js saveProfile - sessionToken:', sessionToken ? sessionToken.substring(0, 20) + '...' : 'no existe');
        
        // Deshabilitar botón de guardar
        const saveBtn = document.querySelector('.user-profile-save-btn');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = ['Guardando...', 'Saving...'][lang];
        }
        
        fetch(app.data.config.apiUrl + 'users.php?action=update-profile&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
          console.log('Respuesta update:', data);
          
          if (data.status === 'success' && data.data && data.data.user) {
            window.msgalert.showAlert({
              title: ['Éxito', 'Success'],
              text: ['Perfil actualizado exitosamente', 'Profile updated successfully'][lang],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
            
            // Actualizar localStorage con los datos del servidor
            const updatedUser = {
              ...user,
              ...data.data.user
            };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            
            // Re-habilitar botón
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = ['Guardar', 'Save'][lang];
            }
            
            // Re-habilitar botón
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = ['Guardar', 'Save'][lang];
            }
            
            // Limpiar avatar temporal
            forms.users.variables.newAvatar = null;
            
            // Si cambió el idioma, actualizar la app
            if (parseInt(language) !== app.data.config.languageIndex) {
              app.data.config.languageIndex = parseInt(language);
              localStorage.setItem('app_language', language);
            }
            
            this.cancelEdit();
          } else {
            // Re-habilitar botón
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = ['Guardar', 'Save'][lang];
            }
            
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['Error al actualizar perfil', 'Error updating profile'][lang],
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
            saveBtn.textContent = ['Guardar', 'Save'][lang];
          }
          
          console.error('Error saving profile:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'][lang],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      }
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'users-page0-frmUsers',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#users-page0-frmUsers',
            id: 'users-page0-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'padding: 10px; background-color: #f1f1f1;',
              'footer': 'position: relative; height: 56px; padding: 0; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 0,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#users-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'users-page0-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 0,
            function: function() { forms.users.hide(0);
},
          },
          {
            controlType: 'label',
            parent: '#users-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'users-page0-title',
            value: [
              'Perfil de usuario',
              'User profile'
            ],
            css: null,
            class: 'header-title',
            pageNum: 0,
          },
          {
            controlType: 'blankbutton',
            parent: '#users-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'users-page0-user-edit-btn',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-edit',
            css: null,
            pageNum: 0,
            function: function() { window.forms.users.functions.toggleEdit();
},
          },
          {
            controlType: 'blankbutton',
            parent: '#users-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'users-page0-user-save-btn',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-save',
            css: 'display: none;',
            pageNum: 0,
            function: function() { window.forms.users.functions.saveProfile();
},
          },
          {
            controlType: 'blankbutton',
            parent: '#users-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'users-page0-user-cancel-btn',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-remove',
            css: 'display: none;',
            pageNum: 0,
            function: function() { window.forms.users.functions.cancelEdit();
},
          },
        ],
        onLoad: function(){
        forms.users.functions.init();
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