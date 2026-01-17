(function(){
  forms.index = {
    _slug: 'index',
    _shortIds: true,
    variables: {
      loadedModules: {},
      menuOpen: false,
      currentModule: null,
      currentFeedType: 'all',
      currentPage: 1,
      isLoadingMore: false,
      hasMoreProjects: true,
    },
    functions: {
      init: function() {
forms.index.functions.loadFeed('all', 1, false);

// Actualizar badge de chat
forms.index.functions.updateChatBadge();

// Actualizar badge de notificaciones
forms.index.functions.updateNotificationsBadge();

// Esperar a que los contenedores existan antes de setup scroll
var checkInterval = setInterval(function() {
    var wrapper = window.blankwrapper('#index-page0-indexBody').getElement();
    var header = document.querySelector('#index-page0-spl-header');
    var footer = document.querySelector('#index-page0-spl-footer');
    
    if (wrapper && header && footer) {
        clearInterval(checkInterval);
        forms.index.functions.setupInfiniteScroll();
        forms.index.functions.setupSwipe();
    }
}, 50);
},
      loadFeed: function(_type, _page, _append) {
var type = _type || 'all';
var page = _page || 1;
var append = _append || false;

// Actualizar variables
forms.index.variables.currentFeedType = type;
forms.index.variables.currentPage = page;
forms.index.variables.isLoadingMore = true;

var lang = app.data.config.languageIndex;
var userData = localStorage.getItem('user_data');
var sessionToken = null;
var isOnline = navigator.onLine;

if (userData) {
    try {
        var parsed = JSON.parse(userData);
        sessionToken = parsed.session_token;
    } catch (e) {
        console.error('[index] Error parseando user_data:', e);
    }
}

if (!sessionToken) {
    console.error('[index] No hay session_token para cargar feed');
    forms.index.variables.isLoadingMore = false;
    return;
}

// Intentar cargar desde cache si está offline
if (!isOnline) {
    var cacheKey = 'projects_feed_' + type + '_page_' + page;
    var cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
        try {
            var parsedCache = JSON.parse(cachedData);
            forms.index.functions.renderFeedCards(parsedCache.projects, append);
            forms.index.variables.hasMoreProjects = parsedCache.has_more;
            forms.index.variables.isLoadingMore = false;
            return;
        } catch (e) {
            console.error('[index] Error parseando cache:', e);
        }
    }
    
    // No hay cache y está offline
    if (!append) {
        window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + ['Sin conexión. No hay datos en caché.', 'Offline. No cached data.'][lang] + '</div>');
    }
    forms.index.variables.isLoadingMore = false;
    return;
}

// Mostrar loading solo si no es append
if (!append) {
    window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-loading"><i class="icon-cloud-sync"></i> ' + ['Cargando proyectos...', 'Loading projects...'][lang] + '</div>');
}

// Fetch del feed
fetch(app.data.config.apiUrl + 'projects.php?action=get-feed&type=' + type + '&page=' + page + '&session_token=' + sessionToken, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        if (result.status === 'success' && result.data && result.data.projects) {
            // Guardar en cache
            var cacheKey = 'projects_feed_' + type + '_page_' + page;
            localStorage.setItem(cacheKey, JSON.stringify(result.data));
            
            forms.index.functions.renderFeedCards(result.data.projects, append);
            forms.index.variables.hasMoreProjects = result.data.has_more;
        } else {
            if (!append) {
                window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + (result.message || 'Error al cargar proyectos') + '</div>');
            }
        }
        forms.index.variables.isLoadingMore = false;
    })
    .catch(function(error) {
        console.error('[index] Error cargando feed:', error);
        
        // Intentar cargar desde cache en caso de error
        var cacheKey = 'projects_feed_' + type + '_page_' + page;
        var cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData && !append) {
            try {
                var parsedCache = JSON.parse(cachedData);
                forms.index.functions.renderFeedCards(parsedCache.projects, append);
                forms.index.variables.hasMoreProjects = parsedCache.has_more;
            } catch (e) {
                window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + ['Error de conexión. No hay datos en caché.', 'Connection error. No cached data.'][lang] + '</div>');
            }
        } else if (!append) {
            window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-error"><i class="icon-warning"></i> ' + ['Error de conexión. Verifica tu internet.', 'Connection error. Check your internet.'][lang] + '</div>');
        }
        
        forms.index.variables.isLoadingMore = false;
    });
},
      setupInfiniteScroll: function() {
var wrapper = window.blankwrapper('#index-page0-indexBody').content.getElement();
var header = document.querySelector('#index-page0-spl-header');
var footer = document.querySelector('#index-page0-spl-footer');

if (!wrapper) {
    return;
}

var lastScrollTop = 0;
var scrollThreshold = 50;
var isHidden = false;

wrapper.addEventListener('scroll', function() {
    var scrollTop = wrapper.scrollTop;
    var scrollHeight = wrapper.scrollHeight;
    var clientHeight = wrapper.clientHeight;
    
    // Lógica de infinite scroll
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        if (!forms.index.variables.isLoadingMore && forms.index.variables.hasMoreProjects) {
            var nextPage = forms.index.variables.currentPage + 1;
            forms.index.functions.loadFeed(forms.index.variables.currentFeedType, nextPage, true);
        }
    }
    
    // Lógica de auto-hide header/footer
    if (header && footer) {
        var scrollDiff = scrollTop - lastScrollTop;
        
        if (scrollDiff > 0 && scrollTop > scrollThreshold && !isHidden) {
            // Scroll hacia abajo - ocultar
            header.style.transform = 'translateY(-100%)';
            footer.style.transform = 'translateY(100%)';
            isHidden = true;
        } else if (scrollDiff < 0 && isHidden) {
            // Scroll hacia arriba - mostrar
            header.style.transform = 'translateY(0)';
            footer.style.transform = 'translateY(0)';
            isHidden = false;
        }
        
        lastScrollTop = scrollTop;
    }
});
},
      setupSwipe: function() {
var wrapper = window.blankwrapper('#index-page0-indexBody').getElement();
if (!wrapper) return;

var touchStartX = 0;
var touchStartY = 0;
var touchEndX = 0;
var touchEndY = 0;
var minSwipeDistance = 100;

// Crear indicador visual de swipe (círculo con icono)
var swipeIndicator = document.createElement('div');
swipeIndicator.style.position = 'fixed';
swipeIndicator.style.top = '50%';
swipeIndicator.style.width = '60px';
swipeIndicator.style.height = '60px';
swipeIndicator.style.borderRadius = '50%';
swipeIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
swipeIndicator.style.display = 'flex';
swipeIndicator.style.justifyContent = 'center';
swipeIndicator.style.alignItems = 'center';
swipeIndicator.style.fontSize = '28px';
swipeIndicator.style.color = '#fff';
swipeIndicator.style.fontFamily = 'mangoleoutline1';
swipeIndicator.style.lineHeight = '1';
swipeIndicator.style.textAlign = 'center';
swipeIndicator.style.opacity = '0';
swipeIndicator.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
swipeIndicator.style.pointerEvents = 'none';
swipeIndicator.style.zIndex = '9999';
swipeIndicator.style.transform = 'translateY(-50%) translateX(0px)';



document.body.appendChild(swipeIndicator);

wrapper.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    swipeIndicator.style.opacity = '0';
}, false);

wrapper.addEventListener('touchmove', function(e) {
    var currentX = e.changedTouches[0].screenX;
    var currentY = e.changedTouches[0].screenY;
    var diffX = currentX - touchStartX;
    var diffY = currentY - touchStartY;
    
    // Solo mostrar si es más horizontal que vertical y alcanzó el threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) >= minSwipeDistance) {
        if (diffX > 0) {
            // Swipe derecha - flecha izquierda
            swipeIndicator.className = 'icon-back';
            swipeIndicator.style.left = '20px';
            swipeIndicator.style.right = 'auto';
            swipeIndicator.style.transform = 'translateY(-50%) translateX(0)';
        } else {
            // Swipe izquierda - flecha derecha
            swipeIndicator.className = 'icon-forward';
            swipeIndicator.style.right = '20px';
            swipeIndicator.style.left = 'auto';
            swipeIndicator.style.transform = 'translateY(-50%) translateX(0)';
        }
        
        swipeIndicator.style.opacity = '0.8';
    } else {
        swipeIndicator.style.opacity = '0';
    }
}, false);

wrapper.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    // Ocultar indicador
    swipeIndicator.style.opacity = '0';
    
    var diffX = touchEndX - touchStartX;
    var diffY = touchEndY - touchStartY;
    
    // Verificar que sea un swipe horizontal (más horizontal que vertical)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
        var tabs = document.querySelectorAll('#index-page0-header-tabmenu .mangole-tabmenu-tab');
        var activeIndex = -1;
        
        // Encontrar tab activo actual
        tabs.forEach(function(tab, index) {
            if (tab.classList.contains('active')) {
                activeIndex = index;
            }
        });
        
        var newIndex = activeIndex;
        
        if (diffX > 0) {
            // Swipe derecha - tab anterior
            newIndex = activeIndex > 0 ? activeIndex - 1 : activeIndex;
        } else {
            // Swipe izquierda - siguiente tab
            newIndex = activeIndex < tabs.length - 1 ? activeIndex + 1 : activeIndex;
        }
        
        // Si cambió el índice, activar nuevo tab
        if (newIndex !== activeIndex && tabs[newIndex]) {
            tabs[newIndex].click();
        }
    }
}, false);
},
      renderFeedCards: function(projects, append) {
append = append || false;
var lang = app.data.config.languageIndex;

if (!projects || projects.length === 0) {
    if (!append) {
        window.blankwrapper('#index-page0-indexBody').content.html('<div class="lns-feed-empty"><i class="icon-check-circle"></i><p>No hay proyectos disponibles</p></div>');
    }
    return;
}

var cardsWrapper;

if (append) {
    cardsWrapper = document.querySelector('.lns-feed-cards-wrapper');
    if (!cardsWrapper) {
        cardsWrapper = document.createElement('div');
        cardsWrapper.className = 'lns-feed-cards-wrapper';
        window.blankwrapper('#index-page0-indexBody').content.append(cardsWrapper);
    }
} else {
    window.blankwrapper('#index-page0-indexBody').content.html('');
    cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'lns-feed-cards-wrapper';
    window.blankwrapper('#index-page0-indexBody').content.append(cardsWrapper);
}

projects.forEach(function(project) {
    var card = forms.index.functions.createProjectCardV2(project);
    cardsWrapper.appendChild(card);
});
},
      createProjectCard: function(project) {
var lang = app.data.config.languageIndex;
var card = document.createElement('div');
card.className = 'lns-feed-card';
card.setAttribute('data-project-id', project.id);

var priorityColors = {
    'urgent': 'lns-badge-urgent',
    'high': 'lns-badge-high',
    'medium': 'lns-badge-medium',
    'low': 'lns-badge-low'
};
var priorityLabels = {
    'urgent': ['URGENTE', 'URGENT'][lang],
    'high': ['Alta', 'High'][lang],
    'medium': ['Media', 'Medium'][lang],
    'low': ['Baja', 'Low'][lang]
};

var statusColors = {
    'published': 'lns-status-published',
    'assigned': 'lns-status-assigned',
    'in_progress': 'lns-status-in-progress',
    'completed': 'lns-status-completed',
    'cancelled': 'lns-status-cancelled',
    'on_hold': 'lns-status-on-hold'
};
var statusLabels = {
    'published': ['Publicado', 'Published'][lang],
    'assigned': ['Asignado', 'Assigned'][lang],
    'in_progress': ['En Progreso', 'In Progress'][lang],
    'completed': ['Completado', 'Completed'][lang],
    'cancelled': ['Cancelado', 'Cancelled'][lang],
    'on_hold': ['En Espera', 'On Hold'][lang]
};

var cardHeader = '<div class="lns-card-header">';
cardHeader += '<span class="lns-badge ' + (priorityColors[project.priority] || 'lns-badge-medium') + '">' + (priorityLabels[project.priority] || project.priority) + '</span>';
cardHeader += '<span class="lns-badge ' + (statusColors[project.status] || 'lns-status-published') + '">' + (statusLabels[project.status] || project.status) + '</span>';
cardHeader += '</div>';

var cardTitle = '<div class="lns-card-title">';
cardTitle += '<h3>' + project.title + '</h3>';
cardTitle += '<span class="lns-card-code">' + project.project_code + '</span>';
cardTitle += '</div>';

var cardClient = '<div class="lns-card-client">';
cardClient += '<div class="lns-card-client-row"><i class="icon-tag"></i> <strong>' + project.client_name + '</strong></div>';
if (project.store_name) {
    cardClient += '<div class="lns-card-client-row"><i class="icon-tag"></i> ' + project.store_name + ' - ' + project.store_city + '</div>';
} else {
    cardClient += '<div class="lns-card-client-row"><i class="icon-tag"></i> ' + project.city + '</div>';
}
cardClient += '</div>';

var cardCost = '<div class="lns-card-cost">';
cardCost += '<i class="icon-tag"></i> <strong>RD$ ' + project.estimated_cost.toLocaleString('es-DO', {
    minimumFractionDigits: 2
}) + '</strong>';
cardCost += '</div>';

var cardTechnicians = '';
if (project.technicians && project.technicians.length > 0) {
    cardTechnicians = '<div class="lns-card-technicians">';
    cardTechnicians += '<div class="lns-card-section-title"><i class="icon-users"></i> ' + ['Equipo Asignado', 'Assigned Team'][lang] + '</div>';
    cardTechnicians += '<div class="lns-technicians-list">';

    project.technicians.forEach(function(tech) {
        var roleLabel = tech.role === 'lead' ? ['Líder', 'Lead'][lang] : (tech.role === 'assistant' ? ['Asistente', 'Assistant'][lang] : ['Técnico', 'Technician'][lang]);
        cardTechnicians += '<div class="lns-technician-item">';
        if (tech.avatar) {
            cardTechnicians += '<div class="lns-tech-avatar" style="background-image: url(\'' + tech.avatar + '\'); background-size: cover; background-position: center;"></div>';
        } else {
            cardTechnicians += '<div class="lns-tech-avatar lns-tech-avatar-placeholder"><i class="icon-users"></i></div>';
        }
        cardTechnicians += '<div class="lns-tech-info">';
        cardTechnicians += '<div class="lns-tech-name">' + tech.full_name + ' <span class="lns-tech-role">(' + roleLabel + ')</span></div>';
        if (tech.average_rating) {
            cardTechnicians += '<div class="lns-tech-rating"><i class="icon-star"></i> ' + tech.average_rating + '</div>';
        }
        cardTechnicians += '</div></div>';
    });

    cardTechnicians += '</div></div>';
} else if (project.total_technicians > 0) {
    cardTechnicians = '<div class="lns-card-technicians"><i class="icon-users"></i> ' + project.total_technicians + ' ' + ['técnico(s) asignado(s)', 'assigned technician(s)'][lang] + '</div>';
}

var cardProgress = '';
if (project.progress_percentage > 0) {
    cardProgress = '<div class="lns-card-progress">';
    cardProgress += '<div class="lns-progress-label">' + ['Progreso', 'Progress'][lang] + ': ' + project.progress_percentage + '%</div>';
    cardProgress += '<div class="lns-progress-bar"><div class="lns-progress-fill" style="width: ' + project.progress_percentage + '%"></div></div>';
    cardProgress += '</div>';
}

var cardTasks = '';
if (project.total_tasks > 0) {
    cardTasks = '<div class="lns-card-tasks">';
    cardTasks += '<i class="icon-check-circle"></i> ' + project.completed_tasks + ' / ' + project.total_tasks + ' ' + ['tareas completadas', 'tasks completed'][lang];
    cardTasks += '</div>';
}

var cardFooter = '<div class="lns-card-footer">';
cardFooter += '<button class="lns-btn-view-detail" onclick="window.forms.index.functions.viewProjectDetail(' + project.id + ')">' + ['Ver Detalle', 'View Details'][lang] + ' <i class="icon-arrow-right"></i></button>';
cardFooter += '</div>';

card.innerHTML = cardHeader + cardTitle + cardClient + cardCost + cardTechnicians + cardProgress + cardTasks + cardFooter;

return card;
},
      createProjectCardV2: function(project) {
var lang = app.data.config.languageIndex;
var card = document.createElement('div');
card.className = 'lns-feed-card-v2';
card.setAttribute('data-project-id', project.id);
card.style.cursor = 'pointer';

// Hacer toda la tarjeta clickeable
card.onclick = function() {
    window.forms.index.functions.viewProjectDetail(project.id);
};

var priorityColors = {
    'urgent': 'lns-badge-urgent',
    'high': 'lns-badge-high',
    'medium': 'lns-badge-medium',
    'low': 'lns-badge-low'
};
var priorityLabels = {
    'urgent': ['URGENTE', 'URGENT'][lang],
    'high': ['Alta', 'High'][lang],
    'medium': ['Media', 'Medium'][lang],
    'low': ['Baja', 'Low'][lang]
};

var statusColors = {
    'published': 'lns-status-published',
    'assigned': 'lns-status-assigned',
    'in_progress': 'lns-status-in-progress',
    'completed': 'lns-status-completed',
    'cancelled': 'lns-status-cancelled',
    'on_hold': 'lns-status-on-hold'
};
var statusLabels = {
    'published': ['Publicado', 'Published'][lang],
    'assigned': ['Asignado', 'Assigned'][lang],
    'in_progress': ['En Progreso', 'In Progress'][lang],
    'completed': ['Completado', 'Completed'][lang],
    'cancelled': ['Cancelado', 'Cancelled'][lang],
    'on_hold': ['En Espera', 'On Hold'][lang]
};

// Header con badges
var cardHeader = '<div class="lns-card-header-v2">';
cardHeader += '<span class="lns-badge ' + (priorityColors[project.priority] || 'lns-badge-medium') + '">' + (priorityLabels[project.priority] || project.priority) + '</span>';
cardHeader += '<span class="lns-badge ' + (statusColors[project.status] || 'lns-status-published') + '">' + (statusLabels[project.status] || project.status) + '</span>';
cardHeader += '</div>';

// Cuerpo con nombre proyecto, descripción, dirección
var cardBody = '<div class="lns-card-body-v2">';
cardBody += '<h3 class="lns-card-title-v2">' + project.title + '</h3>';
cardBody += '<p class="lns-card-description-v2">' + (project.description || project.work_description || ['Sin descripción', 'No description'][lang]) + '</p>';

var address = '';
if (project.store_name) {
    address = project.store_name + ' - ' + project.store_city;
} else {
    address = project.city || project.address || '';
}
cardBody += '<div class="lns-card-address-v2"><i class="icon-location"></i> ' + address + '</div>';
cardBody += '</div>';

// Footer con técnicos solapados (izquierda) y precio (derecha)
var cardFooter = '<div class="lns-card-footer-v2">';

// Círculos solapados de técnicos
cardFooter += '<div class="lns-card-technicians-v2">';
if (project.technicians && project.technicians.length > 0) {
    project.technicians.forEach(function(tech, index) {
        if (tech.avatar) {
            cardFooter += '<div class="lns-tech-avatar-v2" style="background-image: url(\'' + tech.avatar + '\'); background-size: cover; background-position: center;" title="' + tech.full_name + '"></div>';
        } else {
            cardFooter += '<div class="lns-tech-avatar-v2 lns-tech-avatar-placeholder-v2" title="' + tech.full_name + '"><i class="icon-user"></i></div>';
        }
    });
} else if (project.total_technicians > 0) {
    cardFooter += '<div class="lns-tech-avatar-v2 lns-tech-avatar-placeholder-v2"><i class="icon-users"></i></div>';
}
cardFooter += '</div>';

// Precio a la derecha
cardFooter += '<div class="lns-card-price-v2">';
cardFooter += '$ ' + project.estimated_cost.toLocaleString('es-DO', {
    minimumFractionDigits: 2
});
cardFooter += '</div>';

cardFooter += '</div>';

card.innerHTML = cardHeader + cardBody + cardFooter;

return card;
},
      viewProjectDetail: function(projectId) {
app.openScreen({
    screen: 'projects',
    page: 0,
    params: {
      id: projectId
    }
});
},
      updateChatBadge: function() {
        var userData = localStorage.getItem('user_data');
        var sessionToken = null;
        
        if (userData) {
          try {
            var parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            return;
          }
        }
        
        if (!sessionToken) return;
        
        fetch(app.data.config.apiUrl + 'messenger.php?action=get-unread-count&session_token=' + sessionToken, {
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
            var count = result.data.unread_count;
            var chatBtn = document.getElementById('index-page0-footer-chat-button');
            
            if (chatBtn) {
              // Remover badge anterior si existe
              var oldBadge = chatBtn.querySelector('.lns-chat-badge');
              if (oldBadge) {
                oldBadge.remove();
              }
              
              // Agregar badge si hay mensajes sin leer
              if (count > 0) {
                var badge = document.createElement('span');
                badge.className = 'lns-chat-badge';
                badge.style.position = 'absolute';
                badge.style.top = '8px';
                badge.style.right = '8px';
                badge.textContent = count > 99 ? '99+' : count;
                chatBtn.style.position = 'relative';
                chatBtn.appendChild(badge);
              }
            }
          }
        })
        .catch(function(error) {
          console.error('[index] Error al obtener contador de chat:', error);
        });
      },
      updateNotificationsBadge: function() {
        var userData = localStorage.getItem('user_data');
        var sessionToken = null;
        
        if (userData) {
          try {
            var parsed = JSON.parse(userData);
            sessionToken = parsed.session_token;
          } catch (e) {
            return;
          }
        }
        
        if (!sessionToken) return;
        
        fetch(app.data.config.apiUrl + 'notifications.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get-unread-count',
            session_token: sessionToken
          })
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.status === 'success' && result.data) {
            var count = result.data.count || 0;
            var badge = document.getElementById('notification-badge');
            
            if (badge) {
              if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
              } else {
                badge.style.display = 'none';
              }
            }
          }
        })
        .catch(function(error) {
          console.error('[index] Error al obtener contador de notificaciones:', error);
        });
      },
    },
    pages: [
      {
        controls: [
          {
            controlType: 'form',
            parent: null,
            id: 'index-page0-frmIndex',
            content: null,
            css: 'z-index: 9998; background-color: #fff;',
            pageNum: 0,
          },
          {
            controlType: 'splitcontainer',
            parent: '#index-page0-frmIndex',
            id: 'index-page0-spl-header',
            css: 'position: fixed; width: 100%; height: 120px; top: 0; left: 0; background-color: #fff; transform: translateY(0); transition: transform .3s ease;',
            rows: [
              {
                'class': null,
                'css': 'height: 60px;',
                'cell': [
                  {
                    'class': null,
                    'css': 'height: 60px; flex-direction: unset;',
                    'content': ''
                  }
                ]
              },
              {
                'class': null,
                'css': 'height: 60px;',
                'cell': [
                  {
                    'class': null,
                    'css': 'height: 60px;',
                    'content': ''
                  }
                ]
              }
            ],
            pageNum: 0,
          },
          {
            controlType: 'label',
            parent: '#index-page0-spl-header > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell0',
            id: 'index-page0-header-title',
            value: '<span style="font-size: 20px;">Lawrance</span><br /><span style="font-size: 12px;">Network Services</span>',
            css: 'flex: 1; align-items: center; padding: 14px 0 10px 10px; font-weight: 500; line-height: 12px;',
            pageNum: 0,
          },
          {
            controlType: 'blankbutton',
            parent: '#index-page0-spl-header > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell0',
            id: 'index-page0-header-notifications-button',
            label: '<span id="notification-badge" class="notification-badge" style="display: none;"></span>',
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'header-button icon-bell txt-color-000',
            css: 'position: relative;',
            pageNum: 0,
            function: function() { // Obtener session_token desde localStorage
              var sessionToken = null;
              try {
                var userData = localStorage.getItem('user_data');
                if (userData) {
                  var parsed = JSON.parse(userData);
                  sessionToken = parsed.session_token;
                }
              } catch (e) {
                console.error('Error parseando user_data:', e);
              }
              
              app.openScreen({ 
                screen: 'notifications',
                page: 0,
                params: {
                  sessionToken: sessionToken,
                  apiUrl: app.data.config.apiUrl + 'notifications.php'
                }
              });
},
          },
          {
            controlType: 'tabmenu',
            parent: '#index-page0-spl-header > .mangole-split-container-row.row1 > .mangole-split-container-cell.cell0',
            id: 'index-page0-header-tabmenu',
            tabs: [
              {
                'label': [
                  'Publicados',
                  'Published'
                ],
                'css': 'flex: 1; height: 36px; margin-right: 0px; padding: 7px 0 0; text-align: center; border: none; background: none; border-radius: 20px;',
                'class': 'active',
                'tooltip': null,
                'tabindex': null,
                'disabled': false
              },
              {
                'label': [
                  'En progreso',
                  'In Progress'
                ],
                'css': 'flex: 1; height: 36px; margin-right: 0px; padding: 7px 0 0; text-align: center; border: none; background: none; border-radius: 20px;',
                'class': null,
                'tooltip': null,
                'tabindex': null,
                'disabled': false
              },
              {
                'label': [
                  'Completados',
                  'Completed'
                ],
                'css': 'flex: 1; height: 36px; margin-right: 0px; padding: 7px 0 0; text-align: center; border: none; background: none; border-radius: 20px;',
                'class': null,
                'tooltip': null,
                'tabindex': null,
                'disabled': false
              }
            ],
            css: {
              'parent': 'flex: none; align-self: auto; width: 100%; height: 60px; background-color: #f1f1f1; box-shadow: inset 0 2px 8px rgb(0 0 0 / 10%);',
              'tabs': 'height: 60px; padding: 12px 10px;'
            },
            class: null,
            pageNum: 0,
            function: function(index) { if (index == 1){
  forms.index.functions.loadFeed('own_in_progress', 1, false);
}else if (index == 2){
  forms.index.functions.loadFeed('own_completed', 1, false);
}else{
  forms.index.functions.loadFeed('all', 1, false);
}
},
          },
          {
            controlType: 'blankwrapper',
            parent: '#index-page0-frmIndex',
            id: 'index-page0-indexBody',
            css: {
              'parent': null,
              'header': null,
              'content': 'padding-top: 120px; padding-bottom: 60px; background-color: #f1f1f1;',
              'footer': null
            },
            content: null,
            pageNum: 0,
            hasHeader: false,
            hasFooter: false,
          },
          {
            controlType: 'splitcontainer',
            parent: '#index-page0-frmIndex',
            id: 'index-page0-spl-footer',
            css: 'position: fixed; width: 100%; height: 60px; left: 0px; bottom: 0px; background: #fff; box-shadow: 0 -2px 8px rgb(0 0 0 / 10%); transform: translateY(0); transition: transform .3s ease;',
            rows: [
              {
                'class': null,
                'css': null,
                'cell': [
                  {
                    'class': null,
                    'css': 'flex-direction: unset;',
                    'content': null
                  },
                  {
                    'class': null,
                    'css': 'flex-direction: unset;',
                    'content': ''
                  },
                  {
                    'class': null,
                    'css': 'flex-direction: unset;',
                    'content': ''
                  },
                  {
                    'class': null,
                    'css': 'flex-direction: unset;',
                    'content': ''
                  }
                ]
              }
            ],
            pageNum: 0,
          },
          {
            controlType: 'blankbutton',
            parent: '#index-page0-spl-footer > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell0',
            id: 'index-page0-footer-config-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'footer-button icon-config txt-color-000',
            css: null,
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'settings' });
},
          },
          {
            controlType: 'blankbutton',
            parent: '#index-page0-spl-footer > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell1',
            id: 'index-page0-footer-user-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'footer-button icon-user txt-color-000',
            css: null,
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'users' });
},
          },
          {
            controlType: 'blankbutton',
            parent: '#index-page0-spl-footer > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell2',
            id: 'index-page0-footer-search-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'footer-button icon-search txt-color-000',
            css: null,
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'search' });
},
          },
          {
            controlType: 'blankbutton',
            parent: '#index-page0-spl-footer > .mangole-split-container-row.row0 > .mangole-split-container-cell.cell3',
            id: 'index-page0-footer-chat-button',
            label: null,
            tooltip: null,
            disabled: false,
            tabindex: null,
            class: 'footer-button icon-chat txt-color-000',
            css: null,
            pageNum: 0,
            function: function() { app.openScreen({ screen: 'messenger' });
},
          },
        ],
        onLoad: function(){
  forms.index.functions.init();
}
      },
    ],
  };
})();