(function(){
  forms.login = {
    _slug: 'login',
    _shortIds: true,
    variables: {
      temp_email: null,
      temp_branches: null,
      recovery_email: null,
      recovery_code: null,
    },
    functions: {
      handleSimpleLogin: function() { //FLUJO SIMPLE: Autenticación directa con email + password
        var email = textbox('#login-page0-email').value().trim();
        var password = textbox('#login-page0-password').value().trim();
        
        if (!email || !password) {
          window.msgalert.showAlert({
            title: ['Campos Requeridos', 'Required Fields'],
            text: ['Por favor ingrese email y contraseña', 'Please enter email and password'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Validar formato de email
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          window.msgalert.showAlert({
            title: ['Email inválido', 'Invalid Email'],
            text: ['Por favor ingrese un email válido', 'Please enter a valid email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Preparar datos para envío
        var formData = new FormData();
        formData.append('action', 'login');
        formData.append('email', email);
        formData.append('password', password);
        
        // Llamar al API (mobile usa app.data.config.apiUrl)
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {

            // Llamar función global (definida en app.js para mobile)
            if (typeof window.handleLoginSuccess === 'function') {
              window.handleLoginSuccess(data.data);
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error de Autenticación', 'Authentication Error'],
              text: data.message || ['Credenciales inválidas', 'Invalid credentials'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        }).catch(function(error) {
          console.error('Error de login:', error);
          window.msgalert.showAlert({
            title: ['Error de Conexión', 'Connection Error'],
            text: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
            icon: true,
            doneButtonLabel: { visible: true, label: ['Aceptar', 'Accept'] },
            cancelButtonLabel: { visible: false, label: '' }
          }, function() {
            // Aceptar presionado
          });
        });
      },
      handleGetBranches: function() { //FLUJO MULTI-BRANCH PASO 1: Obtener sucursales del usuario
        var email = textbox('#login-page1-email').value().trim();
         
        if (!email) {
          window.msgalert.showAlert({
            title: ['Campo Requerido', 'Required Field'],
            text: ['Por favor ingrese su email', 'Please enter your email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Validar formato
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          window.msgalert.showAlert({
            title: ['Email Inválido', 'Invalid Email'],
            text: ['Por favor ingrese un email válido', 'Please enter a valid email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Guardar email temporal
        forms.login.variables.temp_email = email;
        
        var formData = new FormData();
        formData.append('action', 'get-branches');
        formData.append('email', email);
        
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {
            // Guardar sucursales y cambiar a página 2
            forms.login.variables.temp_branches = data.data.branches;
            forms.login.functions.renderBranchSelection(data.data.branches);
            button('#login-page1-next-button').hide();
            button('#login-page1-start-button').show();
            textbox('#login-page1-password').show();
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['Usuario no encontrado', 'User not found'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        }).catch(function(error) {
          console.error('Error obteniendo sucursales:', error);
          window.msgalert.showAlert({
            title: ['Error de Conexión', 'Connection Error'],
            text: ['No se pudo obtener las sucursales', 'Could not get branches'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      handleBranchLogin: function() { //FLUJO MULTI-BRANCH PASO 2: Autenticación con sucursal
        var branchId = selectbox('#login-page1-branches').value();
        var password = textbox('#login-page1-password').value().trim();
        
        if (!branchId || !password) {
          window.msgalert.showAlert({
            title: ['Campos requeridos', 'Required fields'],
            text: ['Por favor seleccione sucursal e ingrese contraseña', 'Please select a branch and enter a password'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        var formData = new FormData();
        formData.append('action', 'login-branch');
        formData.append('email', forms.login.variables.temp_email);
        formData.append('password', password);
        formData.append('branch_id', branchId);
        
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {
            // Llamar función global (definida en app.js para mobile)
            if (typeof window.handleLoginSuccess === 'function') {
              window.handleLoginSuccess(data.data);
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error de Autenticación', 'Authentication Error'],
              text: data.message || ['Credenciales inválidas', 'Invalid credentials'],
              icon: true,
              doneButtonLabel: { visible: true, label: ['Aceptar', 'Accept'] },
              cancelButtonLabel: { visible: false, label: ['Cancelar', 'Cancel'] }
            }, function() {
              // Aceptar presionado
            });
          }
        }).catch(function(error) {
          console.error('Error de login:', error);
          window.msgalert.showAlert({
            title: ['Error de Conexión', 'Connection Error'],
            text: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
            icon: true,
            doneButtonLabel: { visible: true, label: ['Aceptar', 'Accept'] },
            cancelButtonLabel: { visible: false, label: ['Cancelar', 'Cancel'] }
          }, function() {
            // Aceptar presionado
          });
        });
      },
      renderBranchSelection: function(branches) { //Renderizar lista de sucursales dinámicamente
        selectbox('#login-page1-branches').clear();
        selectbox('#login-page1-branches').value(branches.length > 0 ? branches : []);
        selectbox('#login-page1-branches').show();
      },
      handleRequestRecovery: function() {
        var email = textbox('#login-page2-email').value().trim();
        
        if (!email) {
          window.msgalert.showAlert({
            title: ['Campo Requerido', 'Required Field'],
            text: ['Por favor ingrese su email', 'Please enter your email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          window.msgalert.showAlert({
            title: ['Email inválido', 'Invalid email'],
            text: ['Por favor ingrese un email válido', 'Please enter a valid email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        forms.login.variables.recovery_email = email;
        
        var formData = new FormData();
        formData.append('action', 'request-recovery');
        formData.append('email', email);
        
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {
            // Mostrar campos de código y nueva contraseña
            textbox('#login-page2-email').readonly(true);
            textbox('#login-page2-code').show();
            textbox('#login-page2-new-password').show();
            textbox('#login-page2-confirm-password').show();
            button('#login-page2-request-btn').hide();
            button('#login-page2-reset-btn').show();
            
            window.msgalert.showAlert({
              title: ['Código enviado', 'Code sent'],
              text: ['Se ha enviado un código de 6 dígitos a su email', 'A 6-digit code has been sent to your email'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['No se pudo enviar el código', 'Could not send code'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        }).catch(function(error) {
          console.error('Error requesting recovery:', error);
          window.msgalert.showAlert({
            title: ['Error de conexión', 'Connection error'],
            text: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      handleResetPassword: function() {
        var code = textbox('#login-page2-code').value().trim();
        var newPassword = textbox('#login-page2-new-password').value().trim();
        var confirmPassword = textbox('#login-page2-confirm-password').value().trim();
        
        if (!code || !newPassword || !confirmPassword) {
          window.msgalert.showAlert({
            title: ['Campos requeridos', 'Required fields'],
            text: ['Por favor complete todos los campos', 'Please complete all fields'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (code.length !== 6) {
          window.msgalert.showAlert({
            title: ['Código inválido', 'Invalid code'],
            text: ['El código debe tener 6 dígitos', 'Code must be 6 digits'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (newPassword.length < 6) {
          window.msgalert.showAlert({
            title: ['Contraseña débil', 'Weak password'],
            text: ['La contraseña debe tener al menos 6 caracteres', 'Password must be at least 6 characters'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (newPassword !== confirmPassword) {
          window.msgalert.showAlert({
            title: ['Contraseñas no coinciden', 'Passwords do not match'],
            text: ['Las contraseñas no coinciden. Asegúrese de que ambas contraseñas sean iguales.', 'Passwords do not match. Please ensure both passwords are the same.'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        var formData = new FormData();
        formData.append('action', 'reset-password');
        formData.append('email', forms.login.variables.recovery_email);
        formData.append('code', code);
        formData.append('new_password', newPassword);
        
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {
            window.msgalert.showAlert({
              title: ['Contraseña cambiada', 'Password changed'],
              text: ['Su contraseña ha sido actualizada exitosamente', 'Your password has been updated successfully'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {
              // Cerrar página 2 y volver al login
              forms.login.hide(2);
            }, function() { });
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['Código inválido o expirado', 'Invalid or expired code'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        }).catch(function(error) {
          console.error('Error resetting password:', error);
          window.msgalert.showAlert({
            title: ['Error de Conexión', 'Connection Error'],
            text: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      handleCreateAccount: function() {
        var fullName = textbox('#login-page3-full-name').value().trim();
        var email = textbox('#login-page3-email').value().trim();
        var mobile = textbox('#login-page3-mobile').value().trim();
        var password = textbox('#login-page3-password').value().trim();
        var confirmPassword = textbox('#login-page3-confirm-password').value().trim();
        
        if (!fullName || !email || !password || !confirmPassword) {
          window.msgalert.showAlert({
            title: ['Campos requeridos', 'Required fields'],
            text: ['Por favor complete todos los campos obligatorios', 'Please complete all required fields'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          window.msgalert.showAlert({
            title: ['Email inválido', 'Invalid email'],
            text: ['Por favor ingrese un email válido', 'Please enter a valid email'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (password.length < 6) {
          window.msgalert.showAlert({
            title: ['Contraseña débil', 'Weak password'],
            text: ['La contraseña debe tener al menos 6 caracteres', 'Password must be at least 6 characters'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        if (password !== confirmPassword) {
          window.msgalert.showAlert({
            title: ['Contraseñas no coinciden', 'Passwords do not match'],
            text: ['Las contraseñas no coinciden. Asegúrese de que ambas contraseñas sean iguales.', 'Passwords do not match. Please ensure both passwords are the same.'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        var formData = new FormData();
        formData.append('action', 'register');
        formData.append('full_name', fullName);
        formData.append('email', email);
        formData.append('mobile', mobile);
        formData.append('password', password);
        
        fetch(app.data.config.apiUrl + 'auth.php', {
          method: 'POST',
          body: formData
        }).then(function(response) {
          return response.json();
        }).then(function(data) {
          if (data.status === 'success') {
            window.msgalert.showAlert({
              title: ['Cuenta creada', 'Account created'],
              text: data.requires_approval 
                ? ['Su cuenta ha sido creada exitosamente. Un administrador debe aprobar su cuenta antes de poder iniciar sesión.', 'Your account has been created successfully. An administrator must approve your account before you can sign in.']
                : ['Su cuenta ha sido creada exitosamente. Por favor inicie sesión.', 'Your account has been created successfully. Please sign in.'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {
              // Cerrar página 3 y volver al login
              forms.login.hide(3);
            }, function() { });
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: data.message || ['No se pudo crear la cuenta', 'Could not create account'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        }).catch(function(error) {
          console.error('Error creating account:', error);
          window.msgalert.showAlert({
            title: ['Error de conexión', 'Connection error'],
            text: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'login-page0-frm',
            content: null,
            css: 'z-index: 9998; background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page0-frm',
            id: 'login-page0-wrapper',
            css: {
              'parent': 'position: absolute; width: calc(100% - 50px); max-width: 440px; height: auto; max-height: calc( 100% - 30px); left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 48px 40px; background: #ffffff; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12); border-radius: 8px; border: 1px solid #e2e8f0;',
              'header': null,
              'content': null,
              'footer': null
            },
            content: null,
            pageNum: 0,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-logo-wrapper',
            css: {
              'parent': null,
              'header': null,
              'content': null,
              'footer': null
            },
            content: '<img src="img/logo.svg" alt="Logo" style="display: block; margin: 0 auto; max-width: 170px; height: auto;" />',
            pageNum: 0,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'label',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-title',
            value: [
              'Inicio de sesión',
              'Sign In'
            ],
            css: 'font-weight: 600; color: #1a202c; margin: 30px 0 32px 0; display: block; font-size: 20px; text-align: center;',
            pageNum: 0,
          },
          {
            controlType: 'textbox',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-email',
            label: [
              'Email',
              'Email'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: null,
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            onchange: null,
            onfocus: null,
            onblur: null,
            onclick: null,
            onpaste: null,
            oncut: null,
            oninput: null,
            onkeydown: null,
            onkeyup: null,
            onkeypress: null,
            onmouseover: null,
            onmouseout: null,
            pageNum: 0,
          },
          {
            controlType: 'textbox',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-password',
            label: [
              'Contraseña',
              'Password'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'margin-bottom: 24px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            onchange: null,
            onfocus: null,
            onblur: null,
            onclick: null,
            onpaste: null,
            oncut: null,
            oninput: null,
            onkeydown: null,
            onkeyup: null,
            onkeypress: null,
            onmouseover: null,
            onmouseout: null,
            pageNum: 0,
          },
          {
            controlType: 'button',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-start-button',
            label: [
              'Comenzar',
              'Start'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #2c5282; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 0,
            function: function() { 
              forms.login.functions.handleSimpleLogin();
            }
          },
          {
            controlType: 'label',
            parent: '#login-page0-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page0-links-container',
            value: [
              '',
              ''
            ],
            css: 'display: block; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;',
            pageNum: 0,
          },
          {
            controlType: 'button',
            parent: '#login-page0-links-container',
            id: 'login-page0-forgot-link',
            label: [
              '¿Olvidó su contraseña?',
              'Forgot password?'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #718096; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'login', page: 2 });
},
          },
          {
            controlType: 'button',
            parent: '#login-page0-links-container',
            id: 'login-page0-register-link',
            label: [
              'Crear cuenta',
              'Create account'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #48bb78; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'login', page: 3 });
},
          },
        ],
      },
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'login-page1-frm',
            content: null,
            css: 'z-index: 9998; background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);',
            pageNum: 1,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page1-frm',
            id: 'login-page1-wrapper',
            css: {
              'parent': 'position: absolute; width: calc(100% - 50px); max-width: 440px; height: auto; max-height: calc( 100% - 30px); left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 48px 40px; background: #ffffff; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12); border-radius: 8px; border: 1px solid #e2e8f0;',
              'header': null,
              'content': null,
              'footer': null
            },
            content: null,
            pageNum: 1,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-logo-wrapper',
            css: {
              'parent': null,
              'header': null,
              'content': null,
              'footer': null
            },
            content: '<img src="img/logo.svg" alt="Logo" style="display: block; margin: 0 auto; max-width: 170px; height: auto;" />',
            pageNum: 0,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'label',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-title',
            value: [
              'Inicio de sesión',
              'Sign In'
            ],
            css: 'font-weight: 600; color: #1a202c; margin: 30px 0 32px 0; display: block; font-size: 20px; text-align: center;',
            pageNum: 1,
          },
          {
            controlType: 'textbox',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-email',
            label: [
              'Email',
              'Email'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: null,
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            onchange: null,
            onfocus: null,
            onblur: null,
            onclick: null,
            onpaste: null,
            oncut: null,
            oninput: null,
            onkeydown: null,
            onkeyup: null,
            onkeypress: null,
            onmouseover: null,
            onmouseout: null,
            pageNum: 1,
          },
          {
            controlType: 'selectbox',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-branches',
            label: [
              'Sucursal',
              'Branch'
            ],
            value: {
              'default': null,
              'others': []
            },
            description: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            css: {
              'parent': 'display: none; margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            onchange: null,
            onclick: null,
            onfocus: null,
            onblur: null,
            pageNum: 1,
          },
          {
            controlType: 'textbox',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-password',
            label: [
              'Contraseña',
              'Password'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'display: none; margin-bottom: 24px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            onchange: null,
            onfocus: null,
            onblur: null,
            onclick: null,
            onpaste: null,
            oncut: null,
            oninput: null,
            onkeydown: null,
            onkeyup: null,
            onkeypress: null,
            onmouseover: null,
            onmouseout: null,
            pageNum: 1,
          },
          {
            controlType: 'button',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-next-button',
            label: [
              'Siguiente',
              'Next'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #2c5282; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            function: function() { 
              forms.login.functions.handleGetBranches();
            },
            pageNum: 1,
          },
          {
            controlType: 'button',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-start-button',
            label: [
              'Comenzar',
              'Start'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'display: none; width: 100%; margin-top: 12px; background: #2c5282; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            function: function() { 
              forms.login.functions.handleBranchLogin();
            },
            pageNum: 1,
          },
          {
            controlType: 'label',
            parent: '#login-page1-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page1-links-container',
            value: [
              '',
              ''
            ],
            css: 'display: block; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;',
            pageNum: 1,
          },
          {
            controlType: 'button',
            parent: '#login-page1-links-container',
            id: 'login-page1-forgot-link',
            label: [
              '¿Olvidó su contraseña?',
              'Forgot password?'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #718096; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 1,
            function: function() { app.openScreen({ screen: 'login', page: 2 });
},
          },
          {
            controlType: 'button',
            parent: '#login-page1-links-container',
            id: 'login-page1-register-link',
            label: [
              'Crear cuenta',
              'Create account'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #48bb78; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 1,
            function: function() { app.openScreen({ screen: 'login', page: 3 });
},
          }
        ],
      },
      {
        pageName: 'page2',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'login-page2-frm',
            content: null,
            css: 'z-index: 9998; background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);',
            pageNum: 2,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page2-frm',
            id: 'login-page2-wrapper',
            css: {
              'parent': 'position: absolute; width: calc(100% - 50px); max-width: 440px; height: auto; max-height: calc( 100% - 30px); left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 48px 40px; background: #ffffff; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12); border-radius: 8px; border: 1px solid #e2e8f0;',
              'header': null,
              'content': null,
              'footer': null
            },
            content: null,
            pageNum: 2,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'label',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-title',
            value: [
              'Recuperar contraseña',
              'Recover password'
            ],
            css: 'font-weight: 600; color: #1a202c; margin-bottom: 12px; display: block; font-size: 24px; text-align: center;',
            pageNum: 2,
          },
          {
            controlType: 'label',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-subtitle',
            value: [
              'Ingrese su email para recibir un código de verificación',
              'Enter your email to receive a verification code'
            ],
            css: 'font-weight: 400; color: #718096; margin-bottom: 28px; display: block; font-size: 14px; text-align: center; line-height: 1.5;',
            pageNum: 2,
          },
          {
            controlType: 'textbox',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-email',
            label: [
              'Email',
              'Email'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'email',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 2,
          },
          {
            controlType: 'textbox',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-code',
            label: [
              'Código de verificación',
              'Verification code'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'text',
            sanitizeOnInput: false,
            sanitizeOnOutput: false,
            required: false,
            validateOnInput: false,
            disabled: false,
            readonly: false,
            maxLength: 6,
            minLength: null,
            tabindex: null,
            css: {
              'parent': 'display: none; margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748; text-align: center; letter-spacing: 8px; font-weight: 600;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 2,
          },
          {
            controlType: 'textbox',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-new-password',
            label: [
              'Nueva contraseña',
              'New password'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'display: none; margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 2,
          },
          {
            controlType: 'textbox',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-confirm-password',
            label: [
              'Confirmar Contraseña',
              'Confirm Password'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'display: none; margin-bottom: 24px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 2,
          },
          {
            controlType: 'button',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-request-btn',
            label: [
              'Enviar código',
              'Send code'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #2c5282; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 2,
            function: function() { forms.login.functions.handleRequestRecovery();
},
          },
          {
            controlType: 'button',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-reset-btn',
            label: [
              'Cambiar contraseña',
              'Change password'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'display: none; width: 100%; margin-top: 12px; background: #2c5282; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 2,
            function: function() { forms.login.functions.handleResetPassword();
},
          },
          {
            controlType: 'button',
            parent: '#login-page2-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page2-back-btn',
            label: [
              'Volver al login',
              'Back to login'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: transparent; color: #4a5568; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 2,
            function: function() { forms.login.hide(2);
},
          },
        ],
      },
      {
        pageName: 'page3',
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'login-page3-frm',
            content: null,
            css: 'z-index: 9998; background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);',
            pageNum: 3,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page3-frm',
            id: 'login-page3-wrapper',
            css: {
              'parent': 'position: absolute; width: calc(100% - 50px); max-width: 440px; height: auto; max-height: calc( 100% - 30px); left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 48px 40px; background: #ffffff; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12); border-radius: 8px; border: 1px solid #e2e8f0;',
              'header': null,
              'content': null,
              'footer': null
            },
            content: null,
            pageNum: 3,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'label',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-title',
            value: [
              'Crear cuenta',
              'Create account'
            ],
            css: 'font-weight: 600; color: #1a202c; margin-bottom: 12px; display: block; font-size: 24px; text-align: center;',
            pageNum: 3,
          },
          {
            controlType: 'label',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-subtitle',
            value: [
              'Complete el formulario para registrarse',
              'Complete the form to register'
            ],
            css: 'font-weight: 400; color: #718096; margin-bottom: 28px; display: block; font-size: 14px; text-align: center; line-height: 1.5;',
            pageNum: 3,
          },
          {
            controlType: 'textbox',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-full-name',
            label: [
              'Nombre completo *',
              'Full name *'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'text',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 3,
          },
          {
            controlType: 'textbox',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-email',
            label: [
              'Email *',
              'Email *'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'email',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 3,
          },
          {
            controlType: 'textbox',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-mobile',
            label: [
              'Teléfono móvil',
              'Mobile phone'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'tel',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 3,
          },
          {
            controlType: 'textbox',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-password',
            label: [
              'Contraseña *',
              'Password *'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 3,
          },
          {
            controlType: 'textbox',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-confirm-password',
            label: [
              'Confirmar contraseña *',
              'Confirm password *'
            ],
            value: null,
            description: null,
            tooltip: null,
            placeholder: null,
            inputType: 'password',
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
              'parent': 'margin-bottom: 20px;',
              'input': 'padding: 12px 16px; font-size: 14px; border: 1px solid #cbd5e0; border-radius: 6px; transition: border-color 0.2s ease; background: #ffffff; color: #2d3748;',
              'label': 'font-weight: 500; color: #4a5568; display: block; font-size: 14px; margin-bottom: 8px;'
            },
            class: null,
            pageNum: 3,
          },
          {
            controlType: 'blankwrapper',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-terms-wrapper',
            css: {
              'parent': 'margin-bottom: 24px; font-weight: 400; color: #4a5568; font-size: 14px;',
              'header': null,
              'content': 'sd',
              'footer': null
            },
            content: null,
            pageNum: 3,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'button',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-create-btn',
            label: [
              'Crear cuenta',
              'Create account'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: #2c5282; color: #ffffff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 3,
            function: function() { forms.login.functions.handleCreateAccount();
},
          },
          {
            controlType: 'button',
            parent: '#login-page3-wrapper > .mangole-blank-wrapper-body',
            id: 'login-page3-back-btn',
            label: [
              'Volver al login',
              'Back to login'
            ],
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: null,
            css: 'width: 100%; margin-top: 12px; background: transparent; color: #4a5568; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;',
            pageNum: 3,
            function: function() { forms.login.hide(3);
},
          },
        ],
        onload: function(){
          const lang = app.data.config.languageIndex;
          const termsContent = [
            'Al crear cuenta, acepto los <a href="javascript:void(0);" onclick="app.openScreen({screen: \'settings\', page: 2}); return false;" style="color: #2c5282; text-decoration: underline;">términos y condiciones</a>',
            'By creating an account, I accept the <a href="javascript:void(0);" onclick="app.openScreen({screen: \'settings\', page: 2}); return false;" style="color: #2c5282; text-decoration: underline;">terms and conditions</a>'
            ];
          blankwrapper('#login-page3-terms-wrapper').content.html(termsContent[lang]);
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