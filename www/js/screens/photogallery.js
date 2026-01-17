(function(){
  forms.photogallery = {
    _slug: 'photogallery',
    _shortIds: true,
    opened: false,
    params: {},
    variables: {
      current_row: null,
      id_photogallery: null,
      project_id: null,
      task_id: null,
      onlineListenerAdded: false,
      current_photo: null,
      zoom_level: 1.0,
      pan_x: 0,
      pan_y: 0,
    },
    functions: {
      init: function() {
        const projectId = forms.photogallery.params.project;
        const taskId = forms.photogallery.params.task || null;
        
        if (!projectId) {
          console.error('[photogallery] No se recibió project ID');
          return;
        }
        
        // Guardar en variables
        forms.photogallery.variables.project_id = projectId;
        forms.photogallery.variables.task_id = taskId;
        
        // Cargar fotos del proyecto
        forms.photogallery.functions.loadPhotoFeed(projectId);
        
        // Configurar listener para sincronizar fotos pendientes cuando vuelva conexión
        forms.photogallery.functions.setupOnlineListener();
      },
      loadPhotoFeed: function(projectId) {
        const lang = app.data.config.languageIndex;
        const userData = localStorage.getItem('user_data');
        const isOnline = navigator.onLine;
        const taskId = forms.photogallery.variables.task_id;
        let sessionToken = null;
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            console.error('[photogallery] Error parseando user_data:', e);
          }
        }
        
        if (!sessionToken) {
          console.error('[photogallery] No hay session_token');
          return;
        }
        
        // Si está offline, intentar cargar desde cache
        if (!isOnline) {
          const cacheKey = 'photos_project_' + projectId + '_task_' + taskId;
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
            try {
              const parsedCache = JSON.parse(cachedData);
              forms.photogallery.functions.renderPhotoGallery(parsedCache.photos);
              return;
            } catch (e) {
              console.error('[photogallery] Error parseando cache:', e);
            }
          }
          
          // No hay cache y está offline
          const offlineTexts = ['Sin conexión. No hay fotos en caché.', 'Offline. No cached photos.'];
          blankwrapper('#photogallery-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + offlineTexts[lang] + '</div>');
          return;
        }
        
        const loadingTexts = ['Cargando fotos...', 'Loading photos...'];
        blankwrapper('#photogallery-page0-form-wrapper').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + loadingTexts[lang] + '</div>');
        
        // Fetch fotos con task_id
        fetch(app.data.config.apiUrl + 'projects.php?action=get-photos&project_id=' + projectId + '&task_id=' + taskId + '&session_token=' + sessionToken, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data && result.data.photos) {
            // Guardar en cache con task_id
            const cacheKey = 'photos_project_' + projectId + '_task_' + taskId;
            localStorage.setItem(cacheKey, JSON.stringify(result.data));
            
            forms.photogallery.functions.renderPhotoGallery(result.data.photos);
          } else {
            const emptyTexts = ['No hay fotos disponibles', 'No photos available'];
            blankwrapper('#photogallery-page0-form-wrapper').content.html('<div class="lns-feed-empty"><i class="icon-photo"></i><p>' + emptyTexts[lang] + '</p></div>');
          }
        })
        .catch(function(error) {
          console.error('[photogallery] Error cargando fotos:', error);
          
          // Intentar cargar desde cache en caso de error
          const cacheKey = 'photos_project_' + projectId;
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
            try {
              const parsedCache = JSON.parse(cachedData);
              forms.photogallery.functions.renderPhotoGallery(parsedCache.photos);
            } catch (e) {
              const errorTexts = ['Error al cargar fotos. No hay caché disponible.', 'Error loading photos. No cache available.'];
              blankwrapper('#photogallery-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
            }
          } else {
            const errorTexts = ['Error al cargar fotos', 'Error loading photos'];
            blankwrapper('#photogallery-page0-form-wrapper').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + errorTexts[lang] + '</div>');
          }
        });
      },
      renderPhotoGallery: function(photos) {
        const lang = app.data.config.languageIndex;
        
        blankwrapper('#photogallery-page0-form-wrapper').content.html('');
        
        if (!photos || photos.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'lns-feed-empty';
          emptyDiv.innerHTML = '<i class="icon-photo"></i><p>' + (lang === 0 ? 'No hay fotos' : 'No photos') + '</p>';
          blankwrapper('#photogallery-page0-form-wrapper').content.append(emptyDiv);
        } else {
          const gallery = document.createElement('div');
          gallery.className = 'lns-photo-gallery';
          gallery.id = 'photo-gallery-grid';
          
          photos.forEach(function(photo) {
            const photoCard = document.createElement('div');
            photoCard.className = 'lns-photo-card';
            photoCard.setAttribute('data-photo-id', photo.id);
            photoCard.setAttribute('data-description', photo.description || '');
            
            const img = document.createElement('img');
            img.src = app.data.config.apiUrl.replace('sys/', '') + photo.file_path;
            img.alt = photo.description || 'Project photo';
            img.onclick = function() {
              forms.photogallery.functions.viewPhoto(photo);
            };
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'lns-photo-info';
            
            const desc = document.createElement('p');
            desc.className = 'lns-photo-description';
            desc.textContent = photo.description || (lang === 0 ? 'Sin descripción' : 'No description');
            
            const editBtn = document.createElement('button');
            editBtn.className = 'lns-photo-edit-btn icon-edit';
            editBtn.onclick = function(e) {
              e.stopPropagation();
              var currentCard = this.closest('.lns-photo-card');
              var currentDesc = currentCard ? currentCard.getAttribute('data-description') : '';
              forms.photogallery.functions.editPhotoDescription(photo.id, currentDesc);
            };
            
            infoDiv.appendChild(desc);
            infoDiv.appendChild(editBtn);
            photoCard.appendChild(img);
            photoCard.appendChild(infoDiv);
            gallery.appendChild(photoCard);
          });
          
          blankwrapper('#photogallery-page0-form-wrapper').content.append(gallery);
        }
        
        // Agregar botón flotante SIEMPRE (incluso si no hay fotos)
        const addBtn = document.createElement('button');
        addBtn.className = 'lns-btn-add-photo-float icon-photo';
        addBtn.title = lang === 0 ? 'Tomar foto' : 'Take photo';
        addBtn.onclick = function() {
          forms.photogallery.functions.takePhoto();
        };
        blankwrapper('#photogallery-page0-form-wrapper').content.append(addBtn);
      },
      takePhoto: function() {
        const lang = app.data.config.languageIndex;
        const projectId = forms.photogallery.variables.project_id;
        const taskId = forms.photogallery.variables.task_id;
        
        // Verificar si Cordova está disponible
        if (!navigator.camera) {
          // Si no hay cámara, usar input file para seleccionar foto
          forms.photogallery.functions.selectPhotoFromDevice(projectId, taskId);
          return;
        }
        
        // Opciones de la cámara
        const cameraOptions = {
          quality: 80,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.CAMERA,
          encodingType: Camera.EncodingType.JPEG,
          mediaType: Camera.MediaType.PICTURE,
          correctOrientation: true,
          saveToPhotoAlbum: false
        };
        
        // Capturar foto
        navigator.camera.getPicture(
          function(imageUri) {
            forms.photogallery.functions.uploadPhoto(imageUri, projectId, taskId);
          },
          function(error) {
            console.error('Camera error:', error);
            if (error !== 'Camera cancelled.' && error !== 'no image selected') {
              window.msgalert.showAlert({
                title: ['Error', 'Error'],
                text: ['Error al capturar foto', 'Error capturing photo'],
                icon: true,
                doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                cancelButtonLabel: {visible: false, label: null}
              }, function() { }, function() { });
            }
          },
          cameraOptions
        );
      },
      selectPhotoFromDevice: function(projectId, taskId) {
        // Crear input file temporal
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png';
        
        input.onchange = function(e) {
          const file = e.target.files[0];
          if (file) {
            forms.photogallery.functions.uploadPhotoFromFile(file, projectId, taskId);
          }
        };
        
        input.click();
      },
      uploadPhotoFromFile: function(file, projectId, taskId) {
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
          }, function() { }, function() { });
          return;
        }
        
        // Validar tamaño (máximo 20MB)
        if (file.size > 20 * 1024 * 1024) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['La foto es demasiado grande. Máximo 20MB.', 'Photo is too large. Maximum 20MB.'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Validar tipo
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Formato no válido. Solo JPEG y PNG.', 'Invalid format. Only JPEG and PNG.'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Mostrar loading
        window.msgalert.showAlert({
          title: ['Subiendo foto...', 'Uploading photo...'],
          text: ['Por favor espera', 'Please wait'],
          icon: true,
          doneButtonLabel: {visible: false, label: null},
          cancelButtonLabel: {visible: false, label: null}
        }, function() { }, function() { });
        
        // Crear FormData
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('session_token', sessionToken);
        formData.append('project_id', projectId);
        if (taskId) {
          formData.append('task_id', taskId);
        }
        
        // Upload usando fetch
        fetch(app.data.config.apiUrl + 'projects.php?action=upload-photo', {
          method: 'POST',
          body: formData
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          window.msgalert.removeAlert();
          
          if (result.status === 'success') {
            // Agregar nueva foto al DOM sin recargar
            forms.photogallery.functions.addPhotoToGallery(result.data);
            
            window.msgalert.showAlert({
              title: ['Éxito', 'Success'],
              text: ['Foto subida correctamente', 'Photo uploaded successfully'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [result.message || 'Error al subir foto', result.message || 'Error uploading photo'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        })
        .catch(function(error) {
          window.msgalert.removeAlert();
          console.error('Upload error:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error al subir foto', 'Error uploading photo'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      uploadPhoto: function(imageUri, projectId, taskId) {
        const lang = app.data.config.languageIndex;
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        const isOnline = navigator.onLine;
        
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
        
        // Si está offline, guardar en cola de pendientes
        if (!isOnline) {
          forms.photogallery.functions.savePendingPhoto(imageUri, projectId, taskId);
          
          window.msgalert.showAlert({
            title: ['Sin conexión', 'Offline'],
            text: ['La foto se subirá cuando vuelva la conexión', 'Photo will be uploaded when connection is restored'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
          return;
        }
        
        // Mostrar loading
        window.msgalert.showAlert({
          title: ['Subiendo foto...', 'Uploading photo...'],
          text: ['Por favor espera', 'Please wait'],
          icon: true,
          doneButtonLabel: {visible: false, label: null},
          cancelButtonLabel: {visible: false, label: null}
        }, function() { }, function() { });
        
        // Upload usando fetch API
        const uploadUrl = app.data.config.apiUrl + 'projects.php?action=upload-photo';
        
        window.resolveLocalFileSystemURL(imageUri, function(fileEntry) {
          fileEntry.file(function(file) {
            const reader = new FileReader();
            reader.onloadend = function() {
              const blob = new Blob([this.result], {type: 'image/jpeg'});
              const formData = new FormData();
              formData.append('photo', blob, imageUri.substr(imageUri.lastIndexOf('/') + 1));
              formData.append('session_token', sessionToken);
              formData.append('project_id', projectId);
              if (taskId) formData.append('task_id', taskId);
              
              fetch(uploadUrl, {
                method: 'POST',
                body: formData
              })
              .then(response => response.json())
              .then(function(response) {
                if (response.status === 'success') {
                  // Agregar nueva foto al DOM sin recargar
                  forms.photogallery.functions.addPhotoToGallery(response.data);
                  
                  window.msgalert.showAlert({
                    title: ['Éxito', 'Success'],
                    text: ['Foto subida correctamente', 'Photo uploaded successfully'],
                    icon: true,
                    doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                    cancelButtonLabel: {visible: false, label: null}
                  }, function() { }, function() { });
                } else {
                  window.msgalert.showAlert({
                    title: ['Error', 'Error'],
                    text: [response.message || 'Error al subir foto', response.message || 'Error uploading photo'],
                    icon: true,
                    doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                    cancelButtonLabel: {visible: false, label: null}
                  }, function() { }, function() { });
                }
              })
              .catch(function(error) {
                console.error('Upload error:', error);
                window.msgalert.showAlert({
                  title: ['Error', 'Error'],
                  text: ['Error al subir foto', 'Error uploading photo'],
                  icon: true,
                  doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
                  cancelButtonLabel: {visible: false, label: null}
                }, function() { }, function() { });
              });
            };\n            reader.readAsArrayBuffer(file);\n          });\n        });
      },
      addPhotoToGallery: function(photoData) {
        const lang = app.data.config.languageIndex;
        const gallery = document.getElementById('photo-gallery-grid');
        
        if (!gallery) {
          // Si no hay galería, recargar completo
          forms.photogallery.functions.loadPhotoFeed(forms.photogallery.variables.project_id);
          return;
        }
        
        const photo = {
          id: photoData.photo_id,
          file_path: photoData.file_path,
          description: null,
          uploaded_at: photoData.uploaded_at
        };
        
        const photoCard = document.createElement('div');
        photoCard.className = 'lns-photo-card';
        photoCard.setAttribute('data-photo-id', photo.id);
        photoCard.setAttribute('data-description', '');
        
        const img = document.createElement('img');
        img.src = app.data.config.apiUrl.replace('sys/', '') + photo.file_path;
        img.alt = 'Project photo';
        img.onclick = function() {
          forms.photogallery.functions.viewPhoto(photo);
        };
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'lns-photo-info';
        
        const desc = document.createElement('p');
        desc.className = 'lns-photo-description';
        desc.textContent = lang === 0 ? 'Sin descripción' : 'No description';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'lns-photo-edit-btn icon-edit';
        editBtn.onclick = function(e) {
          e.stopPropagation();
          var currentCard = this.closest('.lns-photo-card');
          var currentDesc = currentCard ? currentCard.getAttribute('data-description') : '';
          forms.photogallery.functions.editPhotoDescription(photo.id, currentDesc);
        };
        
        infoDiv.appendChild(desc);
        infoDiv.appendChild(editBtn);
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        
        // Insertar al principio de la galería
        gallery.insertBefore(photoCard, gallery.firstChild);
      },
      editPhotoDescription: function(photoId, currentDescription) {
        const lang = app.data.config.languageIndex;
        
        window.msginput.show({
          title: lang === 0 ? 'Descripción de la foto' : 'Photo description',
          items: [
            {
              name: 'description',
              type: 'textarea',
              label: lang === 0 ? 'Escribe una descripción:' : 'Write a description:',
              value: currentDescription || ''
            }
          ],
          doneButtonLabel: ['Guardar', 'Save'],
          cancelButtonLabel: ['Cancelar', 'Cancel']
        }, function(item) {
          if (item.description && item.description.value) {
            forms.photogallery.functions.updatePhotoDescription(photoId, item.description.value);
          }
        });
      },
      updatePhotoDescription: function(photoId, description) {
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
          }, function() { }, function() { });
          return;
        }
        
        fetch(app.data.config.apiUrl + 'projects.php?action=update-photo-description&session_token=' + sessionToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            photo_id: photoId,
            description: description
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success') {
            // Actualizar en el DOM
            const photoCard = document.querySelector('[data-photo-id="' + photoId + '"]');
            if (photoCard) {
              // Actualizar el atributo data-description
              photoCard.setAttribute('data-description', description || '');
              
              // Actualizar el texto visible
              const descElement = photoCard.querySelector('.lns-photo-description');
              if (descElement) {
                descElement.textContent = description || (lang === 0 ? 'Sin descripción' : 'No description');
              }
            }
          } else {
            window.msgalert.showAlert({
              title: ['Error', 'Error'],
              text: [result.message || 'Error al actualizar', result.message || 'Error updating'],
              icon: true,
              doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
              cancelButtonLabel: {visible: false, label: null}
            }, function() { }, function() { });
          }
        })
        .catch(function(error) {
          console.error('Error updating description:', error);
          window.msgalert.showAlert({
            title: ['Error', 'Error'],
            text: ['Error de conexión', 'Connection error'],
            icon: true,
            doneButtonLabel: {visible: true, label: ['Aceptar', 'Accept']},
            cancelButtonLabel: {visible: false, label: null}
          }, function() { }, function() { });
        });
      },
      viewPhoto: function(photo) {
        // Guardar foto actual en variables
        forms.photogallery.variables.current_photo = photo;
        forms.photogallery.variables.zoom_level = 1.0;
        forms.photogallery.variables.pan_x = 0;
        forms.photogallery.variables.pan_y = 0;
        
        // Navegar a page1
        app.openScreen({ 
          screen: 'photogallery',
          page: 1
        });
      },
      zoomIn: function() {
        forms.photogallery.variables.zoom_level = Math.min(forms.photogallery.variables.zoom_level + 0.25, 4.0);
        forms.photogallery.functions.applyZoom();
      },
      zoomOut: function() {
        forms.photogallery.variables.zoom_level = Math.max(forms.photogallery.variables.zoom_level - 0.25, 1.0);
        if (forms.photogallery.variables.zoom_level === 1.0) {
          forms.photogallery.variables.pan_x = 0;
          forms.photogallery.variables.pan_y = 0;
        }
        forms.photogallery.functions.applyZoom();
      },
      applyZoom: function() {
        const img = document.getElementById('photogallery-page1-img');
        if (!img) return;
        
        const transform = 'scale(' + forms.photogallery.variables.zoom_level + ') translate(' + forms.photogallery.variables.pan_x + 'px, ' + forms.photogallery.variables.pan_y + 'px)';
        img.style.transform = transform;
      },
      toggleZoom: function() {
        if (forms.photogallery.variables.zoom_level > 1.0) {
          forms.photogallery.variables.zoom_level = 1.0;
          forms.photogallery.variables.pan_x = 0;
          forms.photogallery.variables.pan_y = 0;
        } else {
          forms.photogallery.variables.zoom_level = 2.5;
        }
        forms.photogallery.functions.applyZoom();
      },
      setupZoomPan: function() {
        const img = document.getElementById('photogallery-page1-img');
        if (!img) return;
        
        // Doble tap para zoom toggle
        var lastTap = 0;
        img.addEventListener('touchend', function(e) {
          var currentTime = new Date().getTime();
          var tapLength = currentTime - lastTap;
          if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            forms.photogallery.functions.toggleZoom();
          }
          lastTap = currentTime;
        });
        
        // Pan cuando está en zoom
        var startX = 0, startY = 0;
        var initialPanX = 0, initialPanY = 0;
        
        img.addEventListener('touchstart', function(e) {
          if (forms.photogallery.variables.zoom_level <= 1.0) return;
          
          var touch = e.touches[0];
          startX = touch.clientX;
          startY = touch.clientY;
          initialPanX = forms.photogallery.variables.pan_x;
          initialPanY = forms.photogallery.variables.pan_y;
        });
        
        img.addEventListener('touchmove', function(e) {
          if (forms.photogallery.variables.zoom_level <= 1.0) return;
          
          e.preventDefault();
          var touch = e.touches[0];
          var deltaX = touch.clientX - startX;
          var deltaY = touch.clientY - startY;
          
          forms.photogallery.variables.pan_x = initialPanX + deltaX / forms.photogallery.variables.zoom_level;
          forms.photogallery.variables.pan_y = initialPanY + deltaY / forms.photogallery.variables.zoom_level;
          
          forms.photogallery.functions.applyZoom();
        });
      },
      savePendingPhoto: function(imageUri, projectId, taskId) {
        // Obtener cola de pendientes
        let pendingPhotos = localStorage.getItem('pending_photos');
        pendingPhotos = pendingPhotos ? JSON.parse(pendingPhotos) : [];
        
        // Agregar nueva foto a la cola
        pendingPhotos.push({
          imageUri: imageUri,
          projectId: projectId,
          taskId: taskId,
          timestamp: Date.now()
        });
        
        // Guardar en localStorage
        localStorage.setItem('pending_photos', JSON.stringify(pendingPhotos));
        
        // Agregar indicador visual en la galería
        forms.photogallery.functions.addPendingPhotoIndicator(imageUri);
      },
      addPendingPhotoIndicator: function(imageUri) {
        const lang = app.data.config.languageIndex;
        const gallery = document.getElementById('photo-gallery-grid');
        
        if (!gallery) return;
        
        const photoCard = document.createElement('div');
        photoCard.className = 'lns-photo-card lns-photo-pending';
        photoCard.setAttribute('data-pending-uri', imageUri);
        
        const img = document.createElement('img');
        img.src = imageUri;
        img.alt = 'Pending photo';
        
        const overlay = document.createElement('div');
        overlay.className = 'lns-photo-pending-overlay';
        overlay.innerHTML = '<i class="icon-cloud-sync"></i><p>' + (lang === 0 ? 'Pendiente de subir' : 'Pending upload') + '</p>';
        
        photoCard.appendChild(img);
        photoCard.appendChild(overlay);
        
        // Insertar al principio
        gallery.insertBefore(photoCard, gallery.firstChild);
      },
      setupOnlineListener: function() {
        // Evitar agregar múltiples listeners
        if (forms.photogallery.variables.onlineListenerAdded) return;
        
        window.addEventListener('online', function() {
          console.log('[photogallery] Conexión restaurada, sincronizando fotos pendientes...');
          forms.photogallery.functions.syncPendingPhotos();
        });
        
        forms.photogallery.variables.onlineListenerAdded = true;
        
        // También intentar sincronizar al cargar si hay pendientes
        const pendingPhotos = localStorage.getItem('pending_photos');
        if (pendingPhotos && navigator.onLine) {
          forms.photogallery.functions.syncPendingPhotos();
        }
      },
      syncPendingPhotos: function() {
        const lang = app.data.config.languageIndex;
        let pendingPhotos = localStorage.getItem('pending_photos');
        
        if (!pendingPhotos) return;
        
        pendingPhotos = JSON.parse(pendingPhotos);
        
        if (pendingPhotos.length === 0) return;
        
        console.log('[photogallery] Sincronizando ' + pendingPhotos.length + ' fotos pendientes');
        
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const sessionToken = userData.session_token;
        
        if (!sessionToken) return;
        
        // Procesar cada foto pendiente
        pendingPhotos.forEach(function(pendingPhoto, index) {
          const uploadUrl = app.data.config.apiUrl + 'projects.php?action=upload-photo';
          
          window.resolveLocalFileSystemURL(pendingPhoto.imageUri, function(fileEntry) {
            fileEntry.file(function(file) {
              const reader = new FileReader();
              reader.onloadend = function() {
                const blob = new Blob([this.result], {type: 'image/jpeg'});
                const formData = new FormData();
                formData.append('photo', blob, pendingPhoto.imageUri.substr(pendingPhoto.imageUri.lastIndexOf('/') + 1));
                formData.append('session_token', sessionToken);
                formData.append('project_id', pendingPhoto.projectId);
                if (pendingPhoto.taskId) formData.append('task_id', pendingPhoto.taskId);
                
                fetch(uploadUrl, {
                  method: 'POST',
                  body: formData
                })
                .then(response => response.json())
                .then(function(response) {
                  if (response.status === 'success') {
                    console.log('[photogallery] Foto sincronizada exitosamente');
                    
                    // Remover de la cola
                    forms.photogallery.functions.removePendingPhoto(pendingPhoto.imageUri);
                    
                    // Remover indicador visual
                    const pendingCard = document.querySelector('[data-pending-uri="' + pendingPhoto.imageUri + '"]');
                    if (pendingCard) {
                      pendingCard.remove();
                    }
                    
                    // Agregar foto real a la galería
                    if (pendingPhoto.projectId === forms.photogallery.variables.project_id) {
                      forms.photogallery.functions.addPhotoToGallery(response.data);
                    }
                  }
                })
                .catch(function(error) {
                  console.error('[photogallery] Error al sincronizar foto:', error);
                });
              };
              reader.readAsArrayBuffer(file);
            });
          });
        });
      },
      removePendingPhoto: function(imageUri) {
        let pendingPhotos = localStorage.getItem('pending_photos');
        if (!pendingPhotos) return;
        
        pendingPhotos = JSON.parse(pendingPhotos);
        pendingPhotos = pendingPhotos.filter(function(p) {
          return p.imageUri !== imageUri;
        });
        
        localStorage.setItem('pending_photos', JSON.stringify(pendingPhotos));
      },
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'photogallery-page0-frmPhotoGallery',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'blankwrapper',
            parent: '#photogallery-page0-frmPhotoGallery',
            id: 'photogallery-page0-form-wrapper',
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
            parent: '#photogallery-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page0-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 0,
            function: function() { forms.photogallery.hide(0);
},
          },
          {
            controlType: 'label',
            parent: '#photogallery-page0-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page0-title',
            value: ['Galería de fotos', 'Photo gallery'],
            css: null,
            class: 'header-title',
            pageNum: 0,
          }
        ],
        onLoad: function(){
        forms.photogallery.functions.init();
      }
      },
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'photogallery-page1-frmPhotoGallery',
            content: null,
            css: 'z-index: 9998; background-color: #000;',
            pageNum: 1,
          },
          {
            controlType: 'blankwrapper',
            parent: '#photogallery-page1-frmPhotoGallery',
            id: 'photogallery-page1-form-wrapper',
            css: {
              'parent': 'position: relative; display: flex; width: 100%; height: 100%;',
              'header': 'position: relative; height: 56px; padding: 0px; align-items: center; background-color: #000; border-bottom: none; box-shadow: 0 1px 5px rgba(0,0,0,0.3); z-index: 6402;',
              'content': 'background-color: #000;',
              'footer': 'position: relative; height: 56px; background-color: #fff; box-shadow: 0 -1px 5px rgba(0,0,0,0.3); z-index: 6402;'
            },
            content: null,
            pageNum: 1,
            hasHeader: true,
            hasFooter: false,
          },
          {
            controlType: 'blankbutton',
            parent: '#photogallery-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page1-btn-back',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-back',
            css: null,
            pageNum: 1,
            function: function() { forms.photogallery.hide(1);
},
          },
          {
            controlType: 'label',
            parent: '#photogallery-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page1-title',
            value: 'Foto',
            css: null,
            class: 'header-title',
            pageNum: 1,
          },
          {
            controlType: 'blankbutton',
            parent: '#photogallery-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page1-btn-zoom-out',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-subtract-circle',
            css: null,
            function: function() { forms.photogallery.functions.zoomOut(); },
            pageNum: 1,
          },
          {
            controlType: 'blankbutton',
            parent: '#photogallery-page1-form-wrapper > .mangole-blank-wrapper-header',
            id: 'photogallery-page1-btn-zoom-in',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-add-circle',
            css: null,
            function: function() { forms.photogallery.functions.zoomIn(); },
            pageNum: 1,
          },
        ],
        onLoad: function(){
          const photo = forms.photogallery.variables.current_photo;
          if (!photo) return;
          
          const lang = app.data.config.languageIndex;
          
          // Crear contenedor para la imagen
          const container = document.createElement('div');
          container.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: #000;';
          
          const img = document.createElement('img');
          img.id = 'photogallery-page1-img';
          img.src = app.data.config.apiUrl.replace('sys/', '') + photo.file_path;
          img.alt = photo.description || ['Foto del proyecto', 'Project photo'][lang];
          img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.3s ease; cursor: pointer;';
          
          container.appendChild(img);
          blankwrapper('#photogallery-page1-form-wrapper').content.html('');
          blankwrapper('#photogallery-page1-form-wrapper').content.append(container);
          
          // Setup zoom y pan
          forms.photogallery.functions.setupZoomPan();
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