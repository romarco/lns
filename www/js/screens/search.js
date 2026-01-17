/**
 * Screen: search
 * Creado: 2026-01-11 11:36:08
 */
(function(){
  forms.search = {
    _slug: 'search',
    _shortIds: true,
    opened: false,
    _currentPage: 0,
    params: {},
    variables: {
      current_row: null,
      id_search: null
    },
    functions: {
      init: function() {
        /* 
        Este formulario puede ser renderizado usando app.openScreen():
        
        app.openScreen({
          screen: 'search',
          page: 0,
          params: {
              id: 145,
              mode: 'edit'
          }
        });
        
        Los parámetros pasados en params:{} se pueden acceder con this.params:
        - this.params.id → 145
        - this.params.mode → 'edit'
        
        Ejemplo de uso:
        if (this.params.id) {
            console.log('ID recibido:', this.params.id);
            // Cargar datos con ID
        }
        */
      }
    },
    pages: [{
      controls: [
    {
        "controlType": "form",
        "parent": null,
        "id": "search-page0-frmSearch",
        "content": null,
        "css": "z-index: 9998; background-color: #fff;",
        "pageNum": 0
    },
    {
        "controlType": "blankwrapper",
        "parent": "#search-page0-frmSearch",
        "id": "search-page0-form-wrapper",
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
        "parent": "#search-page0-form-wrapper > .mangole-blank-wrapper-header",
        "id": "search-page0-btn-back",
        "label": null,
        "tooltip": null,
        "disabled": false,
        "tabindex": null,
        "class": "header-button icon-back",
        "css": null,
        function: function() { forms.search.hide(0);
},
        "pageNum": 0
    },
    {
        "controlType": "label",
        "parent": "#search-page0-form-wrapper > .mangole-blank-wrapper-header",
        "id": "search-page0-title",
        "value": ["Buscar", "Search"],
        "css": null,
        "class": "header-title",
        "pageNum": 0
    }
],
      onLoad: function(){
        // Inicialización del formulario
        // Sin JavaScript adicional
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
