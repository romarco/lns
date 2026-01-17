/**
 * Field Config Manager - MOBILE VERSION
 * Sistema de configuración dinámica de campos (Offline-first)
 * ================================================
 * 
 * Versión para apps móviles con soporte offline.
 * 
 * DIFERENCIAS CON VERSIÓN WEB:
 * - Lee configuraciones de app.data.fieldConfigs (descargadas en app.js)
 * - No hace peticiones AJAX (funciona 100% offline)
 * - Caché en memoria + File API para persistencia
 * - Sincronización al hacer login/actualizar módulos
 * 
 * Estructura de datos esperada en app.data.fieldConfigs:
 * {
 *   users: {
 *     pages: [
 *       { // page 0
 *         'users-page0-txtusername': { 
 *           visibility: 'visible', 
 *           is_required: 1,
 *           control_type: 'textbox'
 *         },
 *         'users-page0-txtpassword': { 
 *           visibility: 'hidden', 
 *           is_required: 0,
 *           control_type: 'textbox'
 *         }
 *       },
 *       { // page 1
 *         'users-page1-txtemail': { 
 *           visibility: 'disabled', 
 *           is_required: 0,
 *           control_type: 'textbox'
 *         }
 *       }
 *     ]
 *   },
 *   invoices: {...}
 * }
 * 
 * NOTA: field_id debe coincidir con control.id del formulario
 * 
 * Estados de visibilidad:
 * - visible: Campo normal, editable, datos se envían
 * - disabled: Campo visible pero no editable
 * - hidden: Campo no se renderiza (completamente oculto)
 * 
 * Versión: 1.0.0-mobile
 * Plataforma: Cordova/PhoneGap
 * Fecha: 15 de diciembre de 2025
 */

var fieldConfig = (function() {
  'use strict';
  
  /**
   * Cargar configuración (versión móvil)
   * Lee de app.data.fieldConfigs en lugar de hacer AJAX
   * 
   * @param {string} module - Código del módulo (ej: 'users')
   * @param {number} page - Número de página
   * @param {number} projectId - ID del proyecto (no usado en mobile, compat con web)
   * @param {function} callback - Callback(config) con las configuraciones
   * @param {function} errorCallback - Callback(error) en caso de error
   * @param {object} extraParams - Parámetros extra (customer, style) - no usados en mobile
   */
  function load(module, page, projectId, callback, errorCallback, extraParams) {
    // Validar parámetros
    if (!module || typeof page !== 'number') {
      console.error('fieldConfig.load (mobile): Parámetros inválidos', { module, page });
      if (typeof errorCallback === 'function') {
        errorCallback({ status: 'error', message: 'Parámetros inválidos' });
      }
      return;
    }

    // Verificar que app.data existe
    if (typeof app === 'undefined' || !app.data) {
      console.warn('fieldConfig: app.data no disponible, continuando sin configuraciones');
      if (typeof callback === 'function') {
        callback({});
      }
      return;
    }

    // Verificar que fieldConfigs existe
    if (!app.data.fieldConfigs) {
      console.warn('fieldConfig: No hay configuraciones descargadas (app.data.fieldConfigs vacío)');
      if (typeof callback === 'function') {
        callback({});
      }
      return;
    }

    // Obtener configuración del módulo
    var moduleConfigs = app.data.fieldConfigs[module];
    
    if (!moduleConfigs) {
      // Módulo no tiene configuraciones
      console.log('fieldConfig: Módulo "' + module + '" sin configuraciones específicas');
      if (typeof callback === 'function') {
        callback({});
      }
      return;
    }

    // Obtener configuración de la página
    var pageConfig = moduleConfigs.pages && moduleConfigs.pages[page] ? moduleConfigs.pages[page] : {};

    console.log('fieldConfig: Configuraciones cargadas para ' + module + ' página ' + page, pageConfig);

    // Retornar configuración
    if (typeof callback === 'function') {
      callback(pageConfig);
    }
  }

  /**
   * Aplicar configuraciones a un array de controles
   * (MISMA LÓGICA QUE LA VERSIÓN WEB)
   * 
   * @param {array} controls - Array de controles del formulario
   * @param {object} config - Objeto de configuraciones { field_id: {...} }
   * @return {array} - Array de controles modificados
   */
  function applyToControls(controls, config) {
    if (!Array.isArray(controls) || !config || typeof config !== 'object') {
      console.warn('fieldConfig.applyToControls: Parámetros inválidos');
      return controls;
    }
    
    if (Object.keys(config).length === 0) {
      // Sin configuraciones, retornar controles sin modificar
      return controls;
    }
    
    // Array para almacenar índices de controles a eliminar (hidden)
    var indicesToRemove = [];
    
    // Recorrer controles y aplicar configuraciones
    for (var i = 0; i < controls.length; i++) {
      var control = controls[i];
      var fieldId = control.id;
      
      if (!fieldId || !config[fieldId]) {
        // Control sin configuración específica
        continue;
      }
      
      var fieldConfig = config[fieldId];
      console.log('fieldConfig: Aplicando config a ' + fieldId, fieldConfig);
      
      // Aplicar visibility
      if (fieldConfig.visibility === 'hidden') {
        // Campo oculto: marcar índice para eliminación del array
        indicesToRemove.push(i);
      } else if (fieldConfig.visibility === 'disabled') {
        // Campo disabled: visible pero no editable
        control.disabled = true;
        control.readonly = false; // Usar disabled, no readonly
      } else if (fieldConfig.visibility === 'visible') {
        // Campo visible: asegurar que esté habilitado
        if (control.disabled === true) {
          control.disabled = false;
        }
      }
      
      // Aplicar is_required
      if (typeof fieldConfig.is_required !== 'undefined') {
        control.required = fieldConfig.is_required === 1 || fieldConfig.is_required === true;
      }
    }
    
    // Eliminar controles marcados como hidden (en orden inverso para no afectar índices)
    for (var i = indicesToRemove.length - 1; i >= 0; i--) {
      var indexToRemove = indicesToRemove[i];
      console.log('fieldConfig: Eliminando control hidden en índice ' + indexToRemove);
      controls.splice(indexToRemove, 1);
    }
    
    return controls;
  }

  /**
   * Verificar si un campo específico tiene configuración
   * 
   * @param {string} fieldId - ID del campo
   * @param {object} config - Objeto de configuraciones
   * @return {boolean} - true si tiene configuración
   */
  function hasConfig(fieldId, config) {
    return config && typeof config === 'object' && config[fieldId];
  }

  /**
   * Obtener configuración específica de un campo
   * 
   * @param {string} fieldId - ID del campo
   * @param {object} config - Objeto de configuraciones
   * @return {object|null} - Configuración del campo o null
   */
  function getFieldConfig(fieldId, config) {
    if (hasConfig(fieldId, config)) {
      return config[fieldId];
    }
    return null;
  }

  /**
   * Verificar si el sistema está disponible
   * 
   * @return {boolean} - true si app.data.fieldConfigs existe
   */
  function isAvailable() {
    return typeof app !== 'undefined' && 
           app.data && 
           app.data.fieldConfigs &&
           typeof app.data.fieldConfigs === 'object';
  }

  /**
   * Obtener estadísticas de configuraciones cargadas
   * 
   * @return {object} - { modulesCount, totalPagesCount, modulesNames[] }
   */
  function getStats() {
    if (!isAvailable()) {
      return { modulesCount: 0, totalPagesCount: 0, modulesNames: [] };
    }

    var configs = app.data.fieldConfigs;
    var modulesNames = Object.keys(configs);
    var totalPages = 0;

    modulesNames.forEach(function(moduleName) {
      if (configs[moduleName].pages && Array.isArray(configs[moduleName].pages)) {
        totalPages += configs[moduleName].pages.length;
      }
    });

    return {
      modulesCount: modulesNames.length,
      totalPagesCount: totalPages,
      modulesNames: modulesNames
    };
  }

  // API pública
  return {
    load: load,
    applyToControls: applyToControls,
    hasConfig: hasConfig,
    getFieldConfig: getFieldConfig,
    isAvailable: isAvailable,
    getStats: getStats
  };
  
})();

/**
 * INTEGRACIÓN CON APP.JS
 * ======================
 * 
 * En app.js, después de descargar módulos, descargar configuraciones:
 * 
 * function downloadFieldConfigs(callback) {
 *   app.request({
 *     url: app.data.config.apiUrl + '/sys/field-config-api.php',
 *     method: 'GET',
 *     data: { 
 *       action: 'get_all_mobile',
 *       project_id: app.data.config.projectId
 *     },
 *     success: function(response) {
 *       if (response.status === 'ok') {
 *         // Guardar en memoria
 *         app.data.fieldConfigs = response.configs;
 *         
 *         // Opcional: Guardar en File API para persistencia
 *         app.storage.save('fieldConfigs.json', JSON.stringify(response.configs), function() {
 *           console.log('Field configs guardadas localmente');
 *           callback();
 *         });
 *       } else {
 *         console.warn('No se pudieron descargar field configs:', response.message);
 *         callback();
 *       }
 *     },
 *     error: function(error) {
 *       console.error('Error descargando field configs:', error);
 *       callback();
 *     }
 *   });
 * }
 * 
 * CARGA AL INICIAR:
 * 
 * En app.initialize(), cargar configs desde File API:
 * 
 * app.storage.load('fieldConfigs.json', function(data) {
 *   if (data) {
 *     app.data.fieldConfigs = JSON.parse(data);
 *     console.log('Field configs cargadas desde storage');
 *   }
 * });
 */
