(function(){
  forms.tasknotes = {
    _slug: 'tasknotes',
    _shortIds: true,
    opened: false,
    params: {},
    variables: {
      current_row: null,
      id_tasknotes: null,
      project_id: null,
      task_id: null,
    },
    functions: {
      init: function() {
        const projectId = forms.tasknotes.params.project;
        const taskId = forms.tasknotes.params.task;
        
        if (!projectId || !taskId) {
          console.error('[tasknotes] No se recibieron project ID o task ID');
          return;
        }
        
        // Guardar en variables
        forms.tasknotes.variables.project_id = projectId;
        forms.tasknotes.variables.task_id = taskId;
        
        // Cargar reseñas de la tarea
        forms.tasknotes.functions.loadReviewsFeed(projectId, taskId);
      },
      loadReviewsFeed: function(projectId, taskId) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[tasknotes] Error parseando user_data:', e);
          }
        }
        
        if (!sessionToken) {
          console.error('[tasknotes] No hay session_token');
          return;
        }
        
        const loadingTexts = ['Cargando reseñas...', 'Loading reviews...'];
        blankwrapper('#tasknotes-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + loadingTexts[lang] + '</div>');
        
        // Fetch reseñas
        fetch(app.data.config.apiUrl + 'projects.php?action=get-task-reviews&project_id=' + projectId + '&task_id=' + taskId + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.reviews) {
            forms.tasknotes.functions.renderReviewsFeed(result.data.reviews, result.data.task_title);
          } else {
            const emptyTexts = ['No hay reseñas disponibles', 'No reviews available'];
            blankwrapper('#tasknotes-page0-form-wrapper').content.html('<div class="lns-feed-empty"><i class="icon-file"></i><p>' + emptyTexts[lang] + '</p></div>');
            forms.tasknotes.functions.addFloatingButton();
          }
        })
        .catch(function(error) {
          console.error('[tasknotes] Error al cargar reseñas:', error);
          const errorTexts = ['Error al cargar reseñas', 'Error loading reviews'];
          blankwrapper('#tasknotes-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
          forms.tasknotes.functions.addFloatingButton();
        });
      },
      renderReviewsFeed: function(reviews, taskTitle) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const currentUserId = userData.user ? userData.user.id : null;
        
        blankwrapper('#tasknotes-page0-form-wrapper').content.html('');
        
        // Agregar título de la tarea
        if (taskTitle) {
          const taskHeader = document.createElement('div');
          taskHeader.className = 'lns-task-header';
          taskHeader.innerHTML = '<h2>' + taskTitle + '</h2>';
          blankwrapper('#tasknotes-page0-form-wrapper').content.append(taskHeader);
        }
        
        if (!reviews || reviews.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'lns-feed-empty';
          emptyDiv.innerHTML = '<i class="icon-file"></i><p>' + (lang === 0 ? 'No hay reseñas' : 'No reviews') + '</p>';
          blankwrapper('#tasknotes-page0-form-wrapper').content.append(emptyDiv);
        } else {
          const reviewsList = document.createElement('div');
          reviewsList.className = 'lns-reviews-list';
          reviewsList.id = 'reviews-list-feed';
          
          reviews.forEach(function(review) {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'lns-review-card';
            reviewCard.setAttribute('data-review-id', review.id);
            
            const header = document.createElement('div');
            header.className = 'lns-review-header';
            
            const authorInfo = document.createElement('div');
            authorInfo.className = 'lns-review-author';
            authorInfo.innerHTML = '<strong>' + review.author_name + '</strong><span class="lns-review-date">' + forms.tasknotes.functions.formatDate(review.created_at) + '</span>';
            
            header.appendChild(authorInfo);
            
            // Verificar si puede editar (propio usuario y dentro de 5 minutos)
            const createdTime = new Date(review.created_at).getTime();
            const currentTime = new Date().getTime();
            const minutesElapsed = (currentTime - createdTime) / 1000 / 60;
            const canEdit = parseInt(review.author_id) === parseInt(currentUserId) && minutesElapsed <= 5;

            
            if (canEdit) {
              const actionsDiv = document.createElement('div');
              actionsDiv.className = 'lns-review-actions';
              
              const editBtn = document.createElement('button');
              editBtn.className = 'lns-review-btn icon-edit';
              editBtn.onclick = function() {
                forms.tasknotes.functions.editReview(review.id, review.note);
              };
              
              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'lns-review-btn icon-delete';
              deleteBtn.onclick = function() {
                forms.tasknotes.functions.deleteReview(review.id);
              };
              
              actionsDiv.appendChild(editBtn);
              actionsDiv.appendChild(deleteBtn);
              header.appendChild(actionsDiv);
            }
            
            const content = document.createElement('div');
            content.className = 'lns-review-content';
            content.textContent = review.note;
            
            reviewCard.appendChild(header);
            reviewCard.appendChild(content);
            reviewsList.appendChild(reviewCard);
          });
          
          blankwrapper('#tasknotes-page0-form-wrapper').content.append(reviewsList);
        }
        
        // Agregar botón flotante SIEMPRE
        forms.tasknotes.functions.addFloatingButton();
      },
      addFloatingButton: function() {
        const lang = app.data.config.languageIndex;
        const addBtn = document.createElement('button');
        addBtn.className = 'lns-btn-add-review-float icon-edit';
        addBtn.title = lang === 0 ? 'Agregar reseña' : 'Add review';
        addBtn.onclick = function() {
          forms.tasknotes.functions.addReview();
        };
        blankwrapper('#tasknotes-page0-form-wrapper').content.append(addBtn);
      },
      addReview: function() {
        const lang = app.data.config.languageIndex;
        
        window.msginput.show({
          title: lang === 0 ? 'Nueva reseña' : 'New review',
          items: [
            {
              name: 'review',
              type: 'textarea',
              label: lang === 0 ? 'Escribe tu reseña:' : 'Write your review:',
              value: ''
            }
          ],
          doneButtonLabel: ['Guardar', 'Save'],
          cancelButtonLabel: ['Cancelar', 'Cancel']
        }, function(item) {
          if (item.review && item.review.value && item.review.value.trim() !== '') {
            forms.tasknotes.functions.saveReview(item.review.value);
          }
        });
      },
      editReview: function(reviewId, currentNote) {
        const lang = app.data.config.languageIndex;
        
        window.msginput.show({
          title: lang === 0 ? 'Editar reseña' : 'Edit review',
          items: [
            {
              name: 'review',
              type: 'textarea',
              label: lang === 0 ? 'Escribe tu reseña:' : 'Write your review:',
              value: currentNote || ''
            }
          ],
          doneButtonLabel: ['Guardar', 'Save'],
          cancelButtonLabel: ['Cancelar', 'Cancel']
        }, function(item) {
          if (item.review && item.review.value !== null) {
            forms.tasknotes.functions.updateReview(reviewId, item.review.value);
          }
        });
      },
      deleteReview: function(reviewId) {
        const lang = app.data.config.languageIndex;
        
        window.msgalert.showAlert({
          title: lang === 0 ? '¿Eliminar reseña?' : 'Delete review?',
          text: lang === 0 ? 'Esta acción no se puede deshacer' : 'This action cannot be undone',
          icon: true,
          doneButtonLabel: {visible: true, label: ['Eliminar', 'Delete']},
          cancelButtonLabel: {visible: true, label: ['Cancelar', 'Cancel']}
        }, function() {
          forms.tasknotes.functions.confirmDeleteReview(reviewId);
        }, function() {});
      },
      confirmDeleteReview: function(reviewId) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
          return;
        }
        
        // Deshabilitar botones mientras borra
        const reviewCard = document.querySelector('[data-review-id="' + reviewId + '"]');
        const deleteBtn = reviewCard ? reviewCard.querySelector('.lns-review-delete-btn') : null;
        const editBtn = reviewCard ? reviewCard.querySelector('.lns-review-edit-btn') : null;
        if (deleteBtn) {
          deleteBtn.disabled = true;
          deleteBtn.style.opacity = '0.5';
        }
        if (editBtn) {
          editBtn.disabled = true;
          editBtn.style.opacity = '0.5';
        }
        
        fetch(app.data.config.apiUrl + 'projects.php?action=delete-task-review&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            review_id: reviewId
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success') {
            // Remover del DOM
            const reviewCard = document.querySelector('[data-review-id="' + reviewId + '"]');
            if (reviewCard) {
              reviewCard.remove();
            }
            
            // Verificar si quedan reseñas
            const reviewsList = document.getElementById('reviews-list-feed');
            if (reviewsList && reviewsList.children.length === 0) {
              forms.tasknotes.functions.loadReviewsFeed(
                forms.tasknotes.variables.project_id,
                forms.tasknotes.variables.task_id
              );
            }
          } else {
            // Re-habilitar botones si falla
            if (deleteBtn) {
              deleteBtn.disabled = false;
              deleteBtn.style.opacity = '1';
            }
            if (editBtn) {
              editBtn.disabled = false;
              editBtn.style.opacity = '1';
            }
            
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [result.message || 'Error al eliminar reseña', result.message || 'Error deleting review'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          // Re-habilitar botones si hay error
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
          }
          if (editBtn) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
          }
          
          console.error('Error deleting review:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        });
      },
      saveReview: function(note) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
          return;
        }
        
        const projectId = forms.tasknotes.variables.project_id;
        const taskId = forms.tasknotes.variables.task_id;
        
        // Mostrar loading
        const loadingTexts = ['Guardando...', 'Saving...'];
        blankwrapper('#tasknotes-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + loadingTexts[lang] + '</div>');
        
        fetch(app.data.config.apiUrl + 'projects.php?action=add-task-review&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_id: projectId,
            task_id: taskId,
            note: note
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success') {
            // Recargar feed
            forms.tasknotes.functions.loadReviewsFeed(projectId, taskId);
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [result.message || 'Error al guardar reseña', result.message || 'Error saving review'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          console.error('Error saving review:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        });
      },
      updateReview: function(reviewId, note) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['No se encontró sesión activa', 'No active session found'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
          return;
        }
        
        // Deshabilitar botones mientras actualiza
        const reviewCard = document.querySelector('[data-review-id="' + reviewId + '"]');
        const deleteBtn = reviewCard ? reviewCard.querySelector('.lns-review-delete-btn') : null;
        const editBtn = reviewCard ? reviewCard.querySelector('.lns-review-edit-btn') : null;
        if (deleteBtn) {
          deleteBtn.disabled = true;
          deleteBtn.style.opacity = '0.5';
        }
        if (editBtn) {
          editBtn.disabled = true;
          editBtn.style.opacity = '0.5';
        }
        
        fetch(app.data.config.apiUrl + 'projects.php?action=edit-task-review&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            review_id: reviewId,
            note: note
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          // Re-habilitar botones
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
          }
          if (editBtn) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
          }
          
          if (result.status === 'success') {
            // Actualizar DOM
            if (reviewCard) {
              const contentDiv = reviewCard.querySelector('.lns-review-content');
              if (contentDiv) {
                contentDiv.textContent = note;
              }
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [result.message || 'Error al actualizar reseña', result.message || 'Error updating review'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() {}, function() {});
          }
        })
        .catch(function(error) {
          // Re-habilitar botones
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
          }
          if (editBtn) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
          }
          
          console.error('Error updating review:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() {}, function() {});
        });
      },
      formatDate: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        const lang = app.data.config.languageIndex;
        
        if (minutes < 1) {
          return lang === 0 ? 'Justo ahora' : 'Just now';
        } else if (minutes < 60) {
          return lang === 0 ? 'Hace ' + minutes + ' min' : minutes + ' min ago';
        } else if (hours < 24) {
          return lang === 0 ? 'Hace ' + hours + ' h' : hours + ' h ago';
        } else if (days < 7) {
          return lang === 0 ? 'Hace ' + days + ' d' : days + ' d ago';
        } else {
          return date.toLocaleDateString();
        }
      },
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'tasknotes-page0-frmTaskNotes',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#tasknotes-page0-frmTaskNotes',
            id: 'tasknotes-page0-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%; z-index: 1000;',
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
            parent: '#tasknotes-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'tasknotes-page0-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            function: function() {
              forms.tasknotes.hide(0);
            },
            pageNum: 0,
          },
          {
            controlType: 'label',
            parent: '#tasknotes-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'tasknotes-page0-title',
            value: ['Reseñas', 'Reviews'],
            css: null,
            class: 'header-title',
            pageNum: 0,
          }
        ],
        onLoad: function(){
        forms.tasknotes.functions.init();
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
    }
  };
})();