(function(){
  forms.projects = {
    _slug: 'projects',
    _shortIds: true,
    opened: false,
    _currentPage: 0,
    params: {},
    variables: {
      project_data: null
    },
    functions: {
      init: function() {

        // Validar que se recibió el ID del proyecto
        if (!forms.projects.params.id) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se proporcionó el ID del proyecto', 'Project ID not provided'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          forms.projects.hide();
          return;
        }

        // Guardar el project ID en variables para que esté disponible en todas las páginas
        forms.projects.variables.currentProjectId = forms.projects.params.id;

        // Cargar los datos del proyecto desde el API
        forms.projects.functions.loadProjectDetail(forms.projects.params.id);
      },
      loadProjectDetail: function(projectId) {
        // Obtener session_token del localStorage
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;

        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          forms.projects.hide();
          return;
        }

        // Mostrar loading
        blankwrapper('#projects-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i><br>'+['Cargando proyecto...', 'Loading project...'][app.data.config.languageIndex]+'</div>');

        // Hacer fetch al API (enviar session_token como query parameter igual que get-feed)
        fetch(app.data.config.apiUrl + 'projects.php?action=get-detail&project_id=' + projectId + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.status && data.data) {
            // Guardar los datos del proyecto en variable
            forms.projects.variables.project_data = data.data;
            
            // Formatear fecha de inicio del proyecto
            const startDate = new Date(data.data.project.start_date);
            const months = [
              ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
              ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            ];
            const day = startDate.getDate();
            const month = months[app.data.config.languageIndex][startDate.getMonth()];
            const dateText = ['Inicia el ' + day + ' de ' + month, 'Starts on ' + month + ' ' + day][app.data.config.languageIndex];
            
            // Actualizar el header con la fecha de inicio del proyecto
            label('#projects-page0-header-title > span.project-date').html(dateText);

            // Renderizar los detalles del proyecto
            forms.projects.functions.renderProjectDetail(data.data);
          } else {
            blankwrapper('#projects-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>' + [(data.message || 'Error al cargar el proyecto'), 'Error loading project'][app.data.config.languageIndex] + '</div>');
          }
        })
        .catch(error => {
          console.error('Error al cargar proyecto:', error);
          blankwrapper('#projects-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i><br>' + ['Error de conexión', 'Connection error'][app.data.config.languageIndex] + '</div>');
        });
      },
      renderProjectDetail: function(data) {
        const project = data.project;
        const tasks = data.tasks || [];
        const lang = app.data.config.languageIndex;

        // Obtener usuario actual y su rol en el proyecto (al inicio para usar en toda la función)
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const currentUserId = userData.user ? userData.user.id : null;
        const currentUserRole = userData.user ? userData.user.role : null;
        const userTech = data.technicians ? data.technicians.find(t => t.technician_id === currentUserId) : null;
        const isLead = userTech && userTech.role === 'lead';
        const isAdmin = currentUserRole === 'admin';
        // Cambiar de "!== null" a verificación booleana para manejar undefined correctamente
        const isAssignedToProject = isAdmin || !!userTech;

        // Crear contenedor principal
        const container = document.createElement('div');
        container.className = 'project-detail';

        // === SECCIÓN: INFORMACIÓN DEL PROYECTO ===
        const infoSection = document.createElement('div');
        infoSection.className = 'project-info';
        infoSection.innerHTML = `
          <div class="project-badges">
            <span class="project-badge project-badge-${project.priority}">${project.priority.toUpperCase()}</span>
            <span class="project-badge project-status-${project.status.replace('_', '-')}">${project.status.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div class="project-code">${project.project_code}</div>
          <h2 class="project-title">${project.title}</h2>
          <p class="project-description">${project.description || ''}</p>
          
          <div class="project-meta">
            <div class="project-meta-item">
              <i class="icon-users"></i>
              <span><strong>${lang === 0 ? 'Cliente' : 'Client'}:</strong> ${project.client_full_name}</span>
            </div>
            <div class="project-meta-item">
              <i class="icon-phone"></i>
              <span>${project.client_phone_full}</span>
            </div>
            <div class="project-meta-item">
              <i class="icon-location"></i>
              <span><strong>${lang === 0 ? 'Tienda' : 'Store'}:</strong> ${project.store_name || 'N/A'}</span>
            </div>
            ${project.store_address ? `
            <div class="project-meta-item">
              <i class="icon-navigation"></i>
              <span>${project.store_address}, ${project.store_city}</span>
              ${project.latitude && project.longitude ? `
                <a href="https://www.google.com/maps/dir/?api=1&destination=${project.latitude},${project.longitude}" 
                   target="_blank" 
                   class="lns-btn-navigate"
                   onclick="event.stopPropagation()">
                  <i class="icon-navigation"></i> ${lang === 0 ? 'Navegar' : 'Navigate'}
                </a>
              ` : ''}
            </div>
            ` : ''}
            <div class="project-meta-item">
              <i class="icon-tag"></i>
              <span><strong>${lang === 0 ? 'Precio del proyecto' : 'Project price'}:</strong> $${parseFloat(project.estimated_cost).toLocaleString('es-DO')}</span>
            </div>
          </div>
        `;
        container.appendChild(infoSection);

        // === SECCIÓN: TÉCNICOS ASIGNADOS ===
        const technicians = data.technicians || [];
        if (technicians.length > 0) {
          const techSection = document.createElement('div');
          techSection.className = 'project-technicians';
          
          const techHeader = document.createElement('h3');
          techHeader.className = 'project-section-title';
          techHeader.innerHTML = `<i class="icon-users"></i> ${lang === 0 ? 'Equipo Técnico' : 'Technical Team'}`;
          techSection.appendChild(techHeader);

          const techList = document.createElement('div');
          techList.className = 'project-technicians-list';

          technicians.forEach(tech => {
            const techItem = document.createElement('div');
            techItem.className = 'project-technician-item';
            
            const roleLabel = {
              'lead': lang === 0 ? 'Líder' : 'Lead',
              'technician': lang === 0 ? 'Técnico' : 'Technician',
              'assistant': lang === 0 ? 'Asistente' : 'Assistant'
            };

            const avatarStyle = tech.avatar ? `style="background-image: url('${tech.avatar}'); background-size: cover; background-position: center;"` : '';
            
            techItem.innerHTML = `
              <div class="project-tech-avatar ${tech.avatar ? '' : 'project-tech-avatar-placeholder'}" ${avatarStyle}>
                ${tech.avatar ? '' : tech.full_name.charAt(0).toUpperCase()}
              </div>
              <div class="project-tech-info">
                <div class="project-tech-name">${tech.full_name}</div>
                <div class="project-tech-role">${roleLabel[tech.role] || tech.role}</div>
                ${tech.average_rating ? `<div class="project-tech-rating"><i class="icon-star"></i> ${parseFloat(tech.average_rating).toFixed(1)}</div>` : ''}
              </div>
            `;
            
            techList.appendChild(techItem);
          });

          techSection.appendChild(techList);
          container.appendChild(techSection);
        }

        // === SECCIÓN: TAREAS ===
        const tasksSection = document.createElement('div');
        tasksSection.className = 'project-tasks';
        
        const tasksHeader = document.createElement('h3');
        tasksHeader.className = 'project-section-title';
        tasksHeader.innerHTML = `<i class="icon-list"></i> ${lang === 0 ? 'Tareas del Proyecto' : 'Project Tasks'}`;
        tasksSection.appendChild(tasksHeader);

        if (tasks.length === 0) {
          const emptyMsg = document.createElement('p');
          emptyMsg.className = 'project-tasks-empty';
          emptyMsg.textContent = lang === 0 ? 'No hay tareas asignadas' : 'No tasks assigned';
          tasksSection.appendChild(emptyMsg);
        } else {
          const tasksList = document.createElement('div');
          tasksList.className = 'project-tasks-list';

          tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'project-task-item' + (task.is_completed ? ' completed' : '');
            taskItem.setAttribute('data-task-id', task.id);
            taskItem.setAttribute('data-task-notes', task.completion_notes || '');
            taskItem.setAttribute('data-photos-count', task.photos_count || 0);
            
            // Determinar si el usuario puede modificar esta tarea
            // Admin puede todo, líder puede todo, o si tú completaste la tarea
            const canModify = isAssignedToProject && (!task.is_completed || isAdmin || isLead || (task.completed_by === currentUserId));
            const showDocumentButton = isAssignedToProject && (!task.is_completed || isAdmin || isLead || (task.completed_by === currentUserId));
            
            taskItem.innerHTML = `
              ${isAssignedToProject ? `
              <div class="project-task-checkbox">
                <input type="checkbox" 
                       id="task-${task.id}" 
                       data-task-id="${task.id}"
                       ${task.is_completed ? 'checked' : ''}
                       ${!canModify ? 'disabled' : ''}>
                <label for="task-${task.id}"></label>
              </div>
              ` : ''}
              <div class="project-task-content" style="${!isAssignedToProject ? 'margin-left: 0;' : ''}">
                <div class="project-task-title">${task.title}</div>
                ${task.description ? `<div class="project-task-description">${task.description}</div>` : ''}
                ${task.is_completed ? `
                  <div class="project-task-completed-info">
                    <i class="icon-check-circle"></i> ${lang === 0 ? 'Completada' : 'Completed'} ${task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}
                  </div>
                ` : ''}
                <div class="project-task-stats">
                  ${task.photos_count || 0} ${lang === 0 ? 'fotos' : 'photos'} - ${task.reviews_count || 0} ${lang === 0 ? 'reseñas' : 'reviews'}
                </div>
              </div>
              ${showDocumentButton ? `
              <button class="project-btn-document" data-task-id="${task.id}">
                <i class="icon-edit"></i>
              </button>
              ` : ''}
            `;

            tasksList.appendChild(taskItem);
          });

          tasksSection.appendChild(tasksList);
        }

        container.appendChild(tasksSection);

        // === BOTÓN: FIRMAR ORDEN (solo si está asignado al proyecto) ===
        if (isAssignedToProject) {
          const signButton = document.createElement('button');
          signButton.className = 'lns-btn-sign-project';
          signButton.innerHTML = `<i class="icon-edit"></i> ${lang === 0 ? 'Firmar orden de trabajo' : 'Sign work order'}`;
          signButton.onclick = function() {
            forms.projects.functions.openSignaturePage();
          };
          container.appendChild(signButton);
        }

        // === BOTÓN FLOTANTE: APLICAR AL PROYECTO (solo si NO está asignado) ===
        if (!isAssignedToProject) {
          const applyButton = document.createElement('button');
          applyButton.className = 'lns-btn-apply-float';
          applyButton.innerHTML = `<i class="icon-apply"></i>`;
          applyButton.title = lang === 0 ? 'Aplicar al proyecto' : 'Apply to project';
          applyButton.onclick = function() {
            forms.projects.functions.applyToProject(data.project.id);
          };
          container.appendChild(applyButton);
        }
        
        // === BOTÓN FLOTANTE: INICIAR/DETENER TRABAJO (solo si está asignado) ===
        if (isAssignedToProject) {
          const workButton = document.createElement('button');
          workButton.className = 'lns-btn-work-float';
          
          const isStarted = forms.projects.functions.isWorkStarted();
          
          if (isStarted) {
            // Botón de detener (circular con ícono)
            workButton.classList.add('active');
            workButton.innerHTML = '<i class="icon-chat-dblchk"></i>';
            workButton.title = lang === 0 ? 'Terminar trabajo' : 'Finish work';
            workButton.onclick = function() {
              forms.projects.functions.stopWork();
            };
          } else {
            // Botón de iniciar (rectangular con texto)
            workButton.innerHTML = lang === 0 ? 'Iniciar trabajo' : 'Start work';
            workButton.title = lang === 0 ? 'Iniciar trabajo' : 'Start work';
            workButton.onclick = function() {
              forms.projects.functions.startWork();
            };
          }
          
          container.appendChild(workButton);
        }

        // === PRESENSAR BOTÓN CHAT (solo si está asignado) ===
        if (isAssignedToProject) {
          blankbutton('#projects-page0-chat-button').show();
        }

        // Insertar en el content del blankwrapper
        blankwrapper('#projects-page0-form-wrapper').content.html('');
        blankwrapper('#projects-page0-form-wrapper').content.append(container);

        // Agregar event listeners para los checkboxes (solo si está asignado)
        if (isAssignedToProject && tasks.length > 0) {
          container.querySelectorAll('.project-task-checkbox input[type="checkbox"]:not([disabled])').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
              const taskId = this.getAttribute('data-task-id');
              forms.projects.functions.toggleTaskCompletion(taskId, this.checked);
            });
          });
        }

        // Agregar event listeners para los botones de documentar (solo si está asignado)
        if (isAssignedToProject) {
          container.querySelectorAll('.project-btn-document').forEach(button => {
            button.addEventListener('click', function() {
              const taskId = this.getAttribute('data-task-id');
              forms.projects.functions.showDocumentOptions(taskId);
            });
          });
        }
        
        // Setup scroll para ocultar/mostrar botón flotante
        if (isAssignedToProject) {
          forms.projects.functions.setupScrollBehavior();
        }
      },
      
      setupScrollBehavior: function() {
        const wrapper = window.blankwrapper('#projects-page0-form-wrapper').content.getElement();
        const workButton = document.querySelector('.lns-btn-work-float');
        
        if (!wrapper || !workButton) return;
        
        let lastScrollTop = 0;
        const scrollThreshold = 50;
        let isHidden = false;
        
        wrapper.addEventListener('scroll', function() {
          const scrollTop = wrapper.scrollTop;
          const scrollDiff = scrollTop - lastScrollTop;
          
          if (scrollDiff > 0 && scrollTop > scrollThreshold && !isHidden) {
            // Scroll hacia abajo - ocultar botón
            if (workButton.classList.contains('active')) {
              workButton.style.transform = 'translateX(0%) translateY(120%)';
            }else{
              workButton.style.transform = 'translateX(-50%) translateY(120%)';
            }
            workButton.style.opacity = '0';
            isHidden = true;
          } else if (scrollDiff < 0 && isHidden) {
            // Scroll hacia arriba - mostrar botón
            if (workButton.classList.contains('active')) {
              workButton.style.transform = 'translateX(0%) translateY(0)';
            }else{
              workButton.style.transform = 'translateX(-50%) translateY(0)';
            }
            workButton.style.opacity = '1';
            isHidden = false;
          }
          
          lastScrollTop = scrollTop;
        });
      },

      showDocumentOptions: function(taskId) {
        const lang = app.data.config.languageIndex;
        
        // Verificar si el trabajo ha sido iniciado
        if (!forms.projects.functions.isWorkStarted()) {
          window.msgalert.showAlert({
            title: ['Trabajo no iniciado', 'Work not started'],
            text: ['Debes iniciar el trabajo antes de poder documentar tareas', 'You must start work before documenting tasks'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        window.jlistpicker.showPicker({
          title: ['Documentar Trabajo', 'Document Work'],
          items: [
            { text: ['Ver/tomar fotos', 'View/take photos'], value: 'photo' },
            { text: ['Ver/escribir reseñas', 'View/write reviews'], value: 'review' }
          ],
          selectedValue: null,
          doneButtonLabel: ['Aceptar', 'Accept'],
          cancelButtonLabel: ['Cancelar', 'Cancel'],
          hideTitle:  true,
          hideRadioCircles: true,
          hideButtons: true
        }, function(selected) {
          if (selected.value === 'photo') {
            forms.projects.functions.takePhoto(taskId);
          } else if (selected.value === 'review') {
            forms.projects.functions.writeReview(taskId);
          }
        });
      },

      writeReview: function(taskId) {
        const lang = app.data.config.languageIndex;
        
        // Verificar si el trabajo ha sido iniciado
        if (!forms.projects.functions.isWorkStarted()) {
          window.msgalert.showAlert({
            title: ['Trabajo no iniciado', 'Work not started'],
            text: ['Debes iniciar el trabajo antes de poder dejar reseñas', 'You must start work before writing reviews'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        const projectId = forms.projects.variables.currentProjectId || forms.projects.params.id;
        
        if (!projectId) {
          console.error('[projects] No se encontró project ID para abrir tasknotes');
          return;
        }
        
        app.openScreen({ 
          screen: 'tasknotes',
          page: 0,
          params: {
            project: projectId,
            task: taskId
          }
        });
      },

      isWorkStarted: function() {
        const projectId = forms.projects.params.id;
        const workStatusKey = 'work_started_' + projectId;
        return localStorage.getItem(workStatusKey) === 'true';
      },

      startWork: function() {
        const lang = app.data.config.languageIndex;
        const projectId = forms.projects.params.id;
        
        // Confirmar inicio de trabajo
        window.msgalert.showAlert({
          title: ['Iniciar trabajo', 'Start work'],
          text: [
            'Se notificará al encargado del proyecto que el trabajo ha comenzado' + (app.data.config.tracking.enabled ? ' y se enviará tu ubicación' : '') + '. ¿Deseas continuar?',
            'The project manager will be notified that work has started' + (app.data.config.tracking.enabled ? ' and your location will be sent' : '') + '. Do you want to continue?'
          ],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Iniciar', 'Start']},
          cancelButtonLabel: {visible: true, label: ['Cancelar', 'Cancel']}
        }, function() {
          // Usuario confirmó - marcar trabajo como iniciado
          const workStatusKey = 'work_started_' + projectId;
          localStorage.setItem(workStatusKey, 'true');
          
          // Si tracking está habilitado, iniciar LocationService
          if (app.data.config.tracking.enabled && typeof LocationService !== 'undefined') {
            LocationService.startTracking(projectId);
          }
          
          // Enviar notificación al jefe del proyecto
          forms.projects.functions.notifyProjectManager('work_started');
          
          // Actualizar botón
          forms.projects.functions.updateWorkButton();
        }, function() { });
      },

      stopWork: function() {
        const lang = app.data.config.languageIndex;
        const projectId = forms.projects.params.id;
        
        // Confirmar detención de trabajo
        window.msgalert.showAlert({
          title: ['Detener trabajo', 'Stop work'],
          text: [
            'Se notificará al encargado del proyecto que el trabajo se ha detenido' + (app.data.config.tracking.enabled ? ' y dejará de enviarse tu ubicación' : '') + '. ¿Deseas continuar?',
            'The project manager will be notified that work has stopped' + (app.data.config.tracking.enabled ? ' and your location will stop being sent' : '') + '. Do you want to continue?'
          ],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Detener', 'Stop']},
          cancelButtonLabel: {visible: true, label: ['Cancelar', 'Cancel']}
        }, function() {
          // Usuario confirmó - marcar trabajo como detenido
          const workStatusKey = 'work_started_' + projectId;
          localStorage.removeItem(workStatusKey);
          
          // Si tracking está habilitado, detener LocationService
          if (app.data.config.tracking.enabled && typeof LocationService !== 'undefined') {
            LocationService.stopTracking();
          }
          
          // Enviar notificación al jefe del proyecto
          forms.projects.functions.notifyProjectManager('work_stopped');
          
          // Actualizar botón
          forms.projects.functions.updateWorkButton();
        }, function() { });
      },

      updateWorkButton: function() {
        const lang = app.data.config.languageIndex;
        const workButton = document.querySelector('.lns-btn-work-float');
        
        if (!workButton) return;
        
        const isStarted = forms.projects.functions.isWorkStarted();
        
        if (isStarted) {
          // Cambiar a botón de detener (circular con ícono)
          workButton.classList.add('active');
          workButton.innerHTML = '<i class="icon-chat-dblchk"></i>';
          workButton.title = ['Detener trabajo', 'Stop work'][lang];
          workButton.style.transform = 'translateX(0%) translateY(0)';
          workButton.onclick = function() {
            forms.projects.functions.stopWork();
          };
        } else {
          // Cambiar a botón de iniciar (rectangular con texto)
          workButton.classList.remove('active');
          workButton.innerHTML = ['Iniciar trabajo', 'Start work'][lang];
          workButton.title = ['Iniciar trabajo', 'Start work'][lang];
          workButton.style.transform = 'translateX(-50%) translateY(0)';
          workButton.onclick = function() {
            forms.projects.functions.startWork();
          };
        }
      },

      notifyProjectManager: function(eventType) {
        const projectData = forms.projects.variables.project_data;
        if (!projectData || !projectData.project) return;
        
        const project = projectData.project;
        const technicians = projectData.technicians || [];
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        const technicianName = userData.user ? userData.user.full_name : 'Técnico';
        const currentUserId = userData.user ? userData.user.id : null;
        
        if (!sessionToken) return;
        
        // Recopilar destinatarios: creador del proyecto y líder técnico
        const recipients = [];
        
        // 1. Creador del proyecto (created_by)
        if (project.created_by && project.created_by !== currentUserId) {
          recipients.push(project.created_by);
        }
        
        // 2. Líder técnico del proyecto
        const leadTech = technicians.find(t => t.role === 'lead');
        if (leadTech && leadTech.technician_id !== currentUserId && !recipients.includes(leadTech.technician_id)) {
          recipients.push(leadTech.technician_id);
        }
        
        if (recipients.length === 0) return;
        
        const lang = app.data.config.languageIndex;
        let title, message;
        
        if (eventType === 'work_started') {
          title = [
            '🟢 Trabajo iniciado',
            '🟢 Work started'
          ][lang];
          message = [
            technicianName + ' ha iniciado el trabajo en el proyecto "' + project.title + '"',
            technicianName + ' has started work on project "' + project.title + '"'
          ][lang];
        } else if (eventType === 'work_stopped') {
          title = [
            '🔴 Trabajo detenido',
            '🔴 Work stopped'
          ][lang];
          message = [
            technicianName + ' ha detenido el trabajo en el proyecto "' + project.title + '"',
            technicianName + ' has stopped work on project "' + project.title + '"'
          ][lang];
        } else {
          return;
        }
        
        // Enviar notificación a cada destinatario (creador y lead)
        recipients.forEach(function(recipientId) {
          const formData = new FormData();
          formData.append('user_id', recipientId);
          formData.append('notification_type', 'work_status');
          formData.append('title', title);
          formData.append('message', message);
          formData.append('action_url', 'projects?id=' + project.id);
          formData.append('icon', eventType === 'work_started' ? 'play' : 'stop');
          formData.append('send_push', 'true');
          formData.append('session_token', sessionToken);
          
          fetch(app.data.config.apiUrl + 'notifications.php?action=send-notification', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.status !== 'success') {
              console.error('Error al enviar notificación:', data.message);
            }
          })
          .catch(error => {
            console.error('Error al enviar notificación:', error);
          });
        });
      },

      toggleTaskCompletion: function(taskId, isCompleted) {

        // Obtener session_token y lang
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        const lang = app.data.config.languageIndex;

        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Verificar si el trabajo ha sido iniciado (solo para marcar como completada)
        if (isCompleted && !forms.projects.functions.isWorkStarted()) {
          window.msgalert.showAlert({
            title: ['Trabajo no iniciado', 'Work not started'],
            text: ['Debes iniciar el trabajo antes de poder marcar tareas como completadas', 'You must start work before marking tasks as completed'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          
          // Revertir checkbox
          const checkbox = document.querySelector(`input[data-task-id="${taskId}"]`);
          if (checkbox) {
            checkbox.checked = false;
          }
          return;
        }

        // Mostrar loading
        const checkbox = document.querySelector(`input[data-task-id="${taskId}"]`);
        if (checkbox) checkbox.disabled = true;

        // Llamar al API con el estado actual (para marcar o desmarcar)
        const action = isCompleted ? 'complete-task' : 'uncomplete-task';
        fetch(app.data.config.apiUrl + 'projects.php?action=' + action + '&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task_id: taskId
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            // Solo actualizar el estado visual del checkbox, sin recargar
            if (checkbox) {
              checkbox.checked = isCompleted;
              checkbox.disabled = false;
            }
            
            // Actualizar el conteo de tareas completadas si existe
            const progressText = document.querySelector('.project-section-title');
            if (progressText && data.data && data.data.progress) {
              const completed = data.data.progress.completed_tasks;
              const total = data.data.progress.total_tasks;
              const percentage = data.data.progress.progress_percentage;
              const labels = [
                `Tareas (${completed}/${total} - ${percentage}% completado)`,
                `Tasks (${completed}/${total} - ${percentage}% completed)`
              ];
              progressText.textContent = labels[lang];
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [data.message || 'Error al actualizar tarea', data.message || 'Error updating task'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
            
            // Revertir checkbox
            if (checkbox) {
              checkbox.checked = !isCompleted;
              checkbox.disabled = false;
            }
          }
        })
        .catch(error => {
          console.error('Error al actualizar tarea:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          
          // Revertir checkbox
          if (checkbox) {
            checkbox.checked = !isCompleted;
            checkbox.disabled = false;
          }
        });
      },

      takePhoto: function(taskId) {
        const projectId = forms.projects.variables.currentProjectId || forms.projects.params.id;
        
        if (!projectId) {
          console.error('[projects] No se encontró project ID para abrir photogallery');
          return;
        }
        
        app.openScreen({ 
          screen: 'photogallery',
          page: 0,
          params: {
            project: projectId,
            task: taskId
          }
        });
      },

      openChat: function() {
        // TODO: Abrir pantalla de chat
        console.log('Open chat');
        window.msgalert.showAlert({
          title: ['Función pendiente', 'Pending Feature'],
          text: ['Esta función se implementará próximamente', 'This feature will be implemented soon'],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
          cancelButtonLabel: {visible: false, label: null}
        }, function() { }, function() { });
      },

      applyToProject: function(projectId) {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;

        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }

        // Confirmar aplicación
        window.msgalert.showAlert({
          title: ['¿Aplicar al proyecto?', 'Apply to project?'],
          text: ['¿Deseas aplicar para trabajar en este proyecto? El supervisor deberá aprobar tu solicitud.', 'Do you want to apply to work on this project? The supervisor must approve your request.'],
          icon: true,
          doneButtonLabel: {visible: true, label: ['Aplicar', 'Apply']},
          cancelButtonLabel: {visible: true, label: ['Cancelar', 'Cancel']}
        }, function() {
          // Usuario confirmó - mostrar loading en botón
          const applyButton = document.getElementById('projects-page0-apply-button');
          if (applyButton) {
            applyButton.disabled = true;
            applyButton.style.opacity = '0.5';
          }
          
          // Enviar solicitud
          fetch(app.data.config.apiUrl + 'projects.php?action=apply-to-project&session_token=' + sessionToken, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              project_id: projectId
            })
          })
          .then(response => response.json())
          .then(data => {
            // Re-habilitar botón
            if (applyButton) {
              applyButton.disabled = false;
              applyButton.style.opacity = '1';
            }
            
            if (data.status === 'success') {
              window.msgalert.showAlert({
                title: ['Éxito', 'Success'],
                text: ['Solicitud enviada correctamente. Espera la aprobación del supervisor.', 'Application submitted successfully. Wait for supervisor approval.'],
                icon: true,
                doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                cancelButtonLabel: {visible: false, label: null}
              }, function() { }, function() { });
            } else {
              window.msgalert.showAlert({
                title: ['Error', 'Error'],
                text: [data.message || 'Error al enviar solicitud', data.message || 'Error sending application'],
                icon: true,
                doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                cancelButtonLabel: {visible: false, label: null}
              }, function() { }, function() { });
            }
          })
          .catch(error => {
            // Re-habilitar botón
            if (applyButton) {
              applyButton.disabled = false;
              applyButton.style.opacity = '1';
            }
            
            console.error('Error al aplicar al proyecto:', error);
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: ['Error de conexión', 'Connection error'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          });
        }, function() {
          // Usuario canceló
        });
      },
      openProjectChat: function() {
        const projectId = forms.projects.params.id;
        if (!projectId) {
          return;
        }
        forms.messenger.variables.project_id = projectId;
        // Abrir messenger (el onLoad se encargará del resto)
        app.openScreen({
          screen: 'messenger',
          page: 1,
          params: {
            project_id: projectId
          }
        });
      },
      
      openSignaturePage: function() {
        // Guardar project_id actual antes de cambiar de página
        forms.projects.variables.currentProjectId = forms.projects.params.id;
        
        app.openScreen({
          screen: 'projects',
          page: 1
        });
      },
      
      initSignaturePage: function() {
        const lang = app.data.config.languageIndex;
        const wrapper = blankwrapper('#projects-page1-form-wrapper').content;
        
        // Limpiar canvas previo si existe
        if (forms.projects.variables.signaturePad) {
          forms.projects.variables.signaturePad = null;
        }
        
        // Crear contenedor principal
        const container = document.createElement('div');
        container.className = 'signature-container';
        container.style.cssText = 'display: flex; flex-direction: row; height: 100%; padding: 5px;';
        
        // Instrucciones (rotadas verticalmente a la izquierda)
        const instructions = document.createElement('p');
        instructions.className = 'signature-instructions-rotated';
        instructions.textContent = [
          'Pide al cliente que firme en el recuadro con su dedo',
          'Ask the customer to sign in the box with their finger'
        ][lang];
        container.appendChild(instructions);
        
        // Contenedor canvas (ocupa todo el espacio central)
        const canvasWrapper = document.createElement('div');
        canvasWrapper.id = 'signature-canvas-wrapper';
        canvasWrapper.style.cssText = 'flex: 1; display: block; width: 100%; height: 100%; margin-right: 5px;';
        container.appendChild(canvasWrapper);
        
        // Botones de acción (verticales a la derecha, solo iconos)
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 10px; min-width: 50px;';
        
        // Botón limpiar (solo icono)
        const clearBtn = document.createElement('button');
        clearBtn.className = 'lns-btn-signature-action lns-btn-clear';
        clearBtn.innerHTML = `<i class="icon-delete"></i>`;
        clearBtn.onclick = function() {
          if (forms.projects.variables.signaturePad) {
            forms.projects.variables.signaturePad.clearArea();
          }
        };
        buttonsDiv.appendChild(clearBtn);
        
        // Botón guardar (solo icono)
        const saveBtn = document.createElement('button');
        saveBtn.className = 'lns-btn-signature-action lns-btn-save';
        saveBtn.innerHTML = `<i class="icon-check"></i>`;
        saveBtn.onclick = function() {
          forms.projects.functions.saveSignature();
        };
        buttonsDiv.appendChild(saveBtn);
        
        container.appendChild(buttonsDiv);
        
        // Insertar en wrapper
        wrapper.html('');
        wrapper.append(container);
        
        // Inicializar jspaint (canvas) - fullscreen horizontal
        setTimeout(function() {
          const canvasWidth = canvasWrapper.offsetWidth;
          const canvasHeight = canvasWrapper.offsetHeight;
          
          forms.projects.variables.signaturePad = new jspaint('#signature-canvas-wrapper', {
            lineWidth: 2,
            color: 'black',
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            canvasStyle: 'border: 1px solid #ddd; background: white; display: block; border-radius: 8px;',
            backgroundImage: false,
            enableTouch: true
          });
          
          // Cargar firma existente si ya está guardada
          forms.projects.functions.loadExistingSignature();
        }, 100);
      },
      
      loadExistingSignature: function() {
        const projectId = forms.projects.variables.currentProjectId || forms.projects.params.id;
        if (!projectId) return;
        
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        const url = app.data.config.apiUrl + 'projects.php?action=get-signature&project_id=' + projectId + '&session_token=' + sessionToken;
        
        fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success' && data.data && data.data.signature) {
            const signature = data.data.signature;
            const baseUrl = app.data.config.apiUrl.replace('sys/', '').replace('sys', '');
            const imagePath = baseUrl + signature.signature_image_path;
            
            setTimeout(function() {
              if (forms.projects.variables.signaturePad) {
                forms.projects.variables.signaturePad.drawImage(imagePath);
                forms.projects.variables.hasExistingSignature = true;
              }
            }, 200);
          }
        })
        .catch(error => {
          // Silenciar error si no hay firma
        });
      },
      
      saveSignature: function() {
        const lang = app.data.config.languageIndex;
        
        if (!forms.projects.variables.signaturePad) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Canvas no inicializado', 'Canvas not initialized'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Obtener imagen base64
        const signatureData = forms.projects.variables.signaturePad.getData();
        const projectId = forms.projects.variables.currentProjectId || forms.projects.params.id;
        
        // Validar que hay algo dibujado (base64 no vacío básicamente)
        if (!signatureData || signatureData.length < 100) {
          window.msgalert.showAlert({
            title: ['Firma vacía', 'Empty signature'],
            text: ['Por favor, capture la firma del cliente antes de guardar', 'Please capture the customer signature before saving'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Obtener session_token
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Mostrar loading (deshabilitar botones)
        document.querySelectorAll('.lns-btn-signature-action').forEach(btn => btn.disabled = true);
        
        // Enviar al servidor
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('signature_data', signatureData);
        formData.append('session_token', sessionToken);
        
        fetch(app.data.config.apiUrl + 'projects.php?action=save-signature', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          document.querySelectorAll('.lns-btn-signature-action').forEach(btn => btn.disabled = false);
          
          if (data.status === 'success') {
            window.msgalert.showAlert({
              title: ['Éxito', 'Success'],
              text: ['Firma guardada correctamente', 'Signature saved successfully'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {
              // Volver a page0
              forms.projects.hide(1);
            }, function() { });
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [data.message || 'Error al guardar firma', data.message || 'Error saving signature'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        })
        .catch(error => {
          console.error('Error al guardar firma:', error);
          document.querySelectorAll('.lns-btn-signature-action').forEach(btn => btn.disabled = false);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
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
            id: 'projects-page0-frmProjects',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },{
            controlType: 'blankwrapper',
            parent: '#projects-page0-frmProjects',
            id: 'projects-page0-form-wrapper',
            css: {
              parent: 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
              header: 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              content: 'background-color: #f1f1f1;',
              footer: 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 0,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#projects-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'projects-page0-back-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 0,
            function: function() { forms.projects.hide(0);
},
          },
          {
            controlType: 'label',
            parent: '#projects-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'projects-page0-header-title',
            value: [
              '<span class="font-size16">Vista del proyecto</span><br /><span class="project-date font-size12">-</span>',
              '<span class="font-size16">Project View</span><br /><span class="project-date font-size12">-</span>'
            ],
            css: 'line-height: 15px;',
            pageNum: 0,
            class: 'header-title',
          },
          {
            controlType: 'blankbutton',
            parent: '#projects-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'projects-page0-chat-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-chat',
            css: 'display: none;',
            function: function() { forms.projects.functions.openProjectChat(); },
            pageNum: 0,
          },
        ],
        onLoad: function(){
  forms.projects.functions.init();
}
      },
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'projects-page1-frmProjects',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 1,
          },{
            controlType: 'blankwrapper',
            parent: '#projects-page1-frmProjects',
            id: 'projects-page1-form-wrapper',
            css: {
              parent: 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
              header: 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #3f51b5; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              content: 'background-color: #fff;',
              footer: 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 1,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#projects-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'projects-page1-back-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 1,
            function: function() {
              forms.projects.hide(1);
            },
          },
          {
            controlType: 'label',
            parent: '#projects-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'projects-page1-header-title',
            value: [
              'Firma del cliente',
              'Customer Signature'
            ],
            css: 'line-height: 15px;',
            pageNum: 1,
            class: 'header-title',
          }
        ],
        onLoad: function(){
          forms.projects.functions.initSignaturePage();
        }
      }
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
    }
  };
})();