//Versión 1.0.19
/*
16/10/2025 - Sistema de sanitización y validación de datos para controles
             Agregado DataSanitizer con soporte para: phone, email, text, number, currency, json, url, html, alphanumeric, integer, decimal
             Nuevas funciones en ns.textbox(): valueRaw(), validate(), getErrors(), sanitize(), getInputType()
             Soporte para sanitizeOnInput y sanitizeOnOutput en configuración de controles
21/02/2019 - Arreglado bug readonly y disabled en los campos de textos y selectbox
21/02/2019 - blankwrapper contenido html multilenguaje
24/02/2019 - orderedlist, los items podrán tener un id y clase
09/03/2019 - Se agregó en el datagrid el atributo selected a los selects de las celdas de tipo select.
23/04/2019 - Impresión con bordes
2/06/2019 - A los textbox se agregó propiedad inputType para indicar el tipo de input que es (email, numeric, date, etc)
7/06/2019 - Se cambió el console.error por console.log para advertir que no se puede ejecutar un procedimiento de un objeto que no existe
9/09/2019 - Color de bordes en impresión papelería
29/09/2019 - Se agregó la función de carrito de compras 'incart'
21/10/2019 - Se agregó función getData a los selectbox para extraer el dataset de las opciones
24/01/2020 - se agregó arregló value() para los buttons con innertext
9/05/2020 - se corrigió un bug en msgalert que achicaba el cuadro más de la cuenta si la pantalla no era suficientemente alta (por ejemplo, con teclados en pantalla)
3/06/2020 - Se cambió tinymce por quilljs
3/06/2020 - Se agregó la funcion datagrid.currentCell.css para dar estilos a la celda que se hace clic
16/09/2021 - Se agregó un módulo a quills (el editor) para que permita subir archivos de imágenes en vez de agregar al documento el código base64 de dicha imagen
23/02/2022 - blankwrapper se agregó la función append
11/05/2022 - datagrid se agregó posibilidad de colocar estilos css a las celdas
12/06/2023 - los tags <%= %> en la impresión

en mangole 3, se ha mejorado el jspaint. No lo he implementado aqui porque tengo que revisar el jspaint que se usa en el medicaline

*/



var quill = [];
function quill_selectLocalImage(editor){
  const input = document.createElement('input'); input.setAttribute('type', 'file'); input.click();
  input.onchange = () => {
    const file = input.files[0];
    if (/^image\//.test(file.type)){ quill_saveToServer(file,editor); }else{ console.warn('You could only upload images.'); }
  };
}
function quill_saveToServer(file,editor){
  const fd = new FormData(); fd.append('images[]', file);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'sys/other/'+app.data.customer+'/upload.php?key=upload', true);
  xhr.onload = () => {
    if (xhr.status === 200){
      var data = JSON.parse(xhr.responseText),
      url = '//' + window.location.host + '/maveren/' + data.url + '/' + data.name;
      quill_insertToEditor(url, editor);
    }
  };
  xhr.send(fd);
}
function quill_insertToEditor(url, editor) { const range = quill[editor].instance.getSelection(); quill[editor].instance.insertEmbed(range.index, 'image', url); }



/**
 * DataSanitizer - Sistema de sanitización de datos para controles
 * Versión: 1.0.0
 * Fecha: 16 de octubre de 2025
 * 
 * Sistema centralizado de sanitización y validación de datos de entrada
 * para todos los controles del framework Mangole NS
 */
var DataSanitizer = {
  /**
   * Sanitiza un valor según su tipo
   * @param {*} value - Valor a sanitizar
   * @param {string} type - Tipo de sanitización (phone, email, text, etc.)
   * @returns {*} Valor sanitizado
   */
  sanitize: function(value, type, options) {
    if (value === null || value === undefined) {
      return '';
    }
    
    switch(type) {
      case 'phone':
        return this.normalizePhone(value);
      case 'email':
        return this.normalizeEmail(value);
      case 'text':
        return this.normalizeText(value);
      case 'search':
        return this.normalizeText(value);
      case 'number':
        return this.normalizeNumber(value);
      case 'currency':
        return this.normalizeCurrency(value);
      case 'json':
        return this.normalizeJSON(value);
      case 'url':
        return this.normalizeURL(value);
      case 'html':
        return this.normalizeHTML(value);
      case 'alphanumeric':
        return this.normalizeAlphanumeric(value);
      case 'integer':
        return this.normalizeInteger(value);
      case 'decimal':
        return this.normalizeDecimal(value);
      case 'date':
        return this.normalizeDate(value, options);
      default:
        return this.normalizeText(value);
    }
  },
  
  /**
   * Valida un valor según su tipo
   * @param {*} value - Valor a validar
   * @param {string} type - Tipo de validación
   * @returns {object} Objeto con {isValid: boolean, errors: array}
   */
  validate: function(value, type, options) {
    options = options || {};
    var errors = [];
    var isValid = true;
    
    // Validar si es requerido
    if (options.required && (!value || value.toString().trim() === '')) {
      errors.push('Este campo es requerido');
      return { isValid: false, errors: errors };
    }
    
    // Si no es requerido y está vacío, es válido
    if (!value || value.toString().trim() === '') {
      return { isValid: true, errors: [] };
    }
    
    switch(type) {
      case 'phone':
        if (!this.isValidPhone(value)) {
          errors.push('El teléfono debe contener solo dígitos');
          isValid = false;
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push('El formato del correo electrónico no es válido');
          isValid = false;
        }
        break;
      case 'number':
      case 'integer':
        if (!this.isValidNumber(value)) {
          errors.push('Debe ser un número válido');
          isValid = false;
        }
        break;
      case 'decimal':
      case 'currency':
        if (!this.isValidDecimal(value)) {
          errors.push('Debe ser un número decimal válido');
          isValid = false;
        }
        break;
      case 'json':
        if (!this.isValidJSON(value)) {
          errors.push('El formato JSON no es válido');
          isValid = false;
        }
        break;
      case 'url':
        if (!this.isValidURL(value)) {
          errors.push('La URL no es válida');
          isValid = false;
        }
        break;
      case 'alphanumeric':
        if (!this.isValidAlphanumeric(value)) {
          errors.push('Solo se permiten letras y números');
          isValid = false;
        }
        break;
    }
    
    // Validar longitud mínima
    if (options.minLength && value.toString().length < options.minLength) {
      errors.push('La longitud mínima es de ' + options.minLength + ' caracteres');
      isValid = false;
    }
    
    // Validar longitud máxima
    if (options.maxLength && value.toString().length > options.maxLength) {
      errors.push('La longitud máxima es de ' + options.maxLength + ' caracteres');
      isValid = false;
    }
    
    return { isValid: isValid, errors: errors };
  },
  
  // ========== NORMALIZADORES ==========
  normalizePhone: function(value) { //Normaliza un número de teléfono (solo dígitos)
    return value.toString().replace(/[^\d]/g, '');
  },
  normalizeEmail: function(value) { //Normaliza un email (trim + lowercase)
    return value.toString().trim().toLowerCase();
  },
  normalizeText: function(value) { //Normaliza texto (trim + escape HTML básico)
    return value.toString().trim();
  },
  normalizeNumber: function(value) { //Normaliza un número entero
    var num = parseFloat(value);
    return isNaN(num) ? '' : num.toString();
  },
  normalizeInteger: function(value) { //Normaliza un número entero (sin decimales)
    var num = parseInt(value);
    return isNaN(num) ? '' : num.toString();
  },
  normalizeDecimal: function(value) { //Normaliza un número decimal
    var num = parseFloat(value);
    return isNaN(num) ? '' : num.toString();
  },
  normalizeCurrency: function(value) { //Normaliza un valor monetario
    // Remover símbolos de moneda y comas, dejar solo números y punto decimal
    var cleaned = value.toString().replace(/[^0-9.]/g, '');
    var num = parseFloat(cleaned);
    return isNaN(num) ? '' : num.toFixed(2);
  },
  normalizeJSON: function(value) { //Normaliza JSON (valida y retorna string)
    try {
      var parsed = JSON.parse(value);
      return JSON.stringify(parsed);
    } catch(e) {
      return value.toString().trim();
    }
  },
  normalizeURL: function(value) { //Normaliza una URL (trim + validación básica)
    var url = value.toString().trim();
    // Agregar http:// si no tiene protocolo
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    return url;
  },
  normalizeHTML: function(value) { //Normaliza HTML (trim, no escapa para permitir tags)
    return value.toString().trim();
  },
  normalizeAlphanumeric: function(value) { //Normaliza alfanumérico (solo letras y números)
    return value.toString().replace(/[^a-zA-Z0-9]/g, '');
  },
  normalizeDate: function(value, options) { //Normaliza fecha a formato MySQL (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS) independientemente del formato visual del datepicker
    if (!value || value.toString().trim() === '') {
      return '';
    }
    
    var dateObj = null;
    var valueStr = value.toString().trim();
    var inputFormat = (options && options.dateFormat) ? options.dateFormat : '%Y-%m-%d'; //dateFormat indica el formato VISUAL del campo (cómo está escrito)
    
    // PARSEAR según el formato visual especificado en dateFormat
    if (inputFormat.indexOf('%d') === 0 && inputFormat.indexOf('/') > -1) {
      // Formato: %d/%m/%Y o %d/%m/%y (dd/mm/yyyy o dd/mm/yy)
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(valueStr)) {
        var parts = valueStr.split('/');
        var year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        dateObj = new Date(year, parts[1] - 1, parts[0]);
      }
    } else if (inputFormat.indexOf('%Y') === 0 && inputFormat.indexOf('/') > -1) {
      // Formato: %Y/%m/%d (yyyy/mm/dd)
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(valueStr)) {
        var parts = valueStr.split('/');
        dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    } else if (inputFormat.indexOf('%Y') === 0 && inputFormat.indexOf('-') > -1) {
      // Formato: %Y-%m-%d (yyyy-mm-dd) - El más común en MySQL
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(valueStr)) {
        dateObj = new Date(valueStr);
      }
    } else if (inputFormat.indexOf('%d') === 0 && inputFormat.indexOf('-') > -1) {
      // Formato: %d-%m-%Y (dd-mm-yyyy)
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(valueStr)) {
        var parts = valueStr.split('-');
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else {
      // Fallback: Intentar parseo automático de formatos comunes
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valueStr)) {
        var parts = valueStr.split('/');
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]); //dd/mm/yyyy
      } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(valueStr)) {
        dateObj = new Date(valueStr); //yyyy-mm-dd
      } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(valueStr)) {
        var parts = valueStr.split('-');
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]); //dd-mm-yyyy
      } else {
        dateObj = new Date(valueStr); //Parseo genérico
      }
    }
    
    // Verificar si la fecha es válida
    if (!dateObj || isNaN(dateObj.getTime())) {
      return valueStr; //Retornar original si no se pudo parsear
    }
    
    // SIEMPRE convertir a formato MySQL (independiente del dateFormat visual)
    var year = dateObj.getFullYear();
    var month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    var day = ('0' + dateObj.getDate()).slice(-2);
    var hours = ('0' + dateObj.getHours()).slice(-2);
    var minutes = ('0' + dateObj.getMinutes()).slice(-2);
    var seconds = ('0' + dateObj.getSeconds()).slice(-2);
    
    // Si el formato original incluía hora (%H, %i, %s), retornar con hora
    if (inputFormat.indexOf('%H') > -1 || inputFormat.indexOf('%i') > -1 || inputFormat.indexOf('%s') > -1) {
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds; //YYYY-MM-DD HH:MM:SS
    }
    
    return year + '-' + month + '-' + day; //YYYY-MM-DD (solo fecha)
  },
  
  // ========== VALIDADORES ==========
  isValidPhone: function(value) { //Valida que sea un teléfono (solo dígitos)
    return /^\d+$/.test(value.toString());
  },
  isValidEmail: function(value) { //Valida formato de email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.toString());
  },
  isValidNumber: function(value) { //Valida que sea un número
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
  isValidDecimal: function(value) { //Valida que sea un número decimal
    return /^-?\d+(\.\d+)?$/.test(value.toString());
  },
  isValidJSON: function(value) { //Valida formato JSON
    try {
      JSON.parse(value);
      return true;
    } catch(e) {
      return false;
    }
  },
  isValidURL: function(value) { //Valida formato de URL
    try {
      var url = new URL(value.toString());
      return true;
    } catch(e) {
      // Intenta con http:// si no tiene protocolo
      try {
        var url = new URL('http://' + value.toString());
        return true;
      } catch(e2) {
        return false;
      }
    }
  },
  isValidAlphanumeric: function(value) { //Valida que sea alfanumérico
    return /^[a-zA-Z0-9]+$/.test(value.toString());
  },
  escapeHTML: function(value) { //Escapa caracteres HTML para prevenir XSS
    var div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },
  unescapeHTML: function(value) { //Desescapa caracteres HTML
    var div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent || div.innerText || '';
  }
};



var incart = function(_cartid){ //Versión 1.0.1
  return {
    paymentMethod: 0,
    globalShipping: 0,
    comissions: 0,
    otherCharges: 0,
    catalog: function(_callback){
      var _catalog = {},
      _items = [];
      if (window.localStorage[_cartid]){
        var cart = JSON.parse(window.localStorage[_cartid]);
        for (_id in cart){
          _items.push(cart[_id]);
        }
      }
      _catalog = {
        list: _items,
        quantity: this.totalize().quantity,
        total: this.totalize().total
      };
      if (typeof _callback === "function"){
        _callback(_catalog);
      }else{
        return _catalog;
      }
    },
    totalize: function(_callback){
      var _quantity = 0,
      _total = 0,
      _itbis = 0;
      if (window.localStorage[_cartid]){
        var cart = JSON.parse(window.localStorage[_cartid]);
        for (_id in cart){
          if (this.isNumeric(cart[_id].quantity)){
            _quantity += parseFloat(cart[_id].quantity);
          }
          if (this.isNumeric(cart[_id].data.price)){
            _total += parseFloat(cart[_id].quantity) * parseFloat(cart[_id].data.price);
          }
          if (this.isNumeric(cart[_id].data.itbis)){
            _itbis += parseFloat(cart[_id].quantity) * parseFloat(cart[_id].data.itbis);
          }
        }
      }
      if (typeof _callback === "function"){
        _callback({quantity: _quantity, total: _total, itbis: _itbis});
      }else{
        return {quantity: _quantity, total: _total, itbis: _itbis};
      }
    },
    add: function(_id, _quantity, _data, _callback){
      if (_id == false || _quantity == false){
        console.error('incart: missing id and quantity values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined" && this.isNumeric(_quantity)){
          if (typeof _data.duplicate !== "undefined" && _data.duplicate == true){
            _idcart = _id + '' + parseInt(new Date().getTime() / 1000);
            _data.id = _id;
            cart[_idcart] = { id: _id, quantity: _quantity, data: _data };
          }else{
            cart[_id].quantity += parseFloat(_quantity);
            cart[_id].data.quantity += parseFloat(_quantity);
          }
        }else{
          cart[_id] = { id: _id, quantity: _quantity, data: _data };
        }
      }else{
        cart[_id] = { id: _id, quantity: _quantity, data: _data };
      }
      window.localStorage[_cartid] = JSON.stringify(cart);
      if (typeof _callback === "function"){
        _callback(_id);
      }
    },
    update: function(_id, _quantity, _callback){
      if (_id == false || _quantity == false){
        console.error('incart: missing id and quantity values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined" && this.isNumeric(_quantity)){
          cart[_id].quantity = parseFloat(_quantity);
          if (typeof cart[_id].data.quantity !== "undefined"){
            cart[_id].data.quantity = parseFloat(_quantity);
          }
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    updateData: function(_id, _data, _callback){
      if (_id == false || _data == false){
        console.error('incart: missing id and data values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined" && typeof _data === "object"){
          if (typeof _data.quantity !== "undefined"){
            cart[_id].quantity = parseFloat(_data.quantity);
          }
          if (typeof cart[_id].data !== "undefined"){
            cart[_id].data = _data;
          }
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    addQuantity: function(_id, _quantity, _callback){
      if (_id == false || _quantity == false){
        console.error('incart: missing id and quantity values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined" && this.isNumeric(_quantity)){
          cart[_id].quantity += _quantity;
          cart[_id].data.quantity += _quantity;
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    subQuantity: function(_id, _quantity, _callback){
      if (_id == false || _quantity == false){
        console.error('incart: missing id and quantity values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined" && this.isNumeric(_quantity)){
          cart[_id].quantity -= _quantity;
          cart[_id].data.quantity -= _quantity;
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    incOne: function(_id, _callback){
      if (_id == false){
        console.error('incart: missing id values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined"){
          cart[_id].quantity++;
          cart[_id].data.quantity++;
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    decOne: function(_id, _callback){
      if (_id == false){
        console.error('incart: missing id values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined"){
          cart[_id].quantity--;
          cart[_id].data.quantity--;
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
        if (typeof _callback === "function"){
          _callback();
        }
      }
    },
    remove: function(_id, _callback){
      if (_id == false){
        console.error('incart: missing id values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof cart[_id] !== "undefined"){
          delete(cart[_id]);
          window.localStorage[_cartid] = JSON.stringify(cart);
        }
      }
      if (typeof _callback === "function"){
        _callback();
      }
    },
    isNumeric: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },
    getQuantity: function(_id, _callback){
      if (_id == false){
        console.error('incart: missing id values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof _callback === "function" && typeof cart[_id] !== "undefined"){
          _callback(cart[_id].data.quantity);
        }else{
          if (typeof cart[_id] !== "undefined"){
            return cart[_id].data.quantity;
          }else{
            return 0;
          }
        }
      }else{
        return 0;
      }
    },
    getPrice: function(_id, _callback){
      if (_id == false){
        console.error('incart: missing id values...');
        return false;
      }
      var cart = {};
      if (window.localStorage[_cartid]){
        cart = JSON.parse(window.localStorage[_cartid]);
        if (typeof _callback === "function" && typeof cart[_id] !== "undefined"){
          _callback(cart[_id].data.price);
        }else{
          if (typeof cart[_id] !== "undefined"){
            return cart[_id].data.price;
          }else{
            return 0;
          }
        }
      }else{
        return 0;
      }
    },
    flyToElement: function(flyer, flyingTo){
      var $func = $(this);
      var divider = 3;
      var flyerClone = $(flyer).clone();
      //$(flyerClone).css({position: 'absolute', maxWidth: $(flyingTo).outerHeight() + "px", maxHeight: $(flyingTo).outerHeight() + "px", top: $(flyer).offset().top + "px", left: $(flyer).offset().left + "px", opacity: 1, 'z-index': 1000});
      $(flyerClone).css({position: 'absolute', top: $(flyer).offset().top + "px", left: $(flyer).offset().left + "px", opacity: 1, 'z-index': 1000});
      $('body').append($(flyerClone));
      var gotoX = $(flyingTo).offset().left + ($(flyingTo).width() / 2) - ($(flyer).width()/divider)/2;
      var gotoY = $(flyingTo).offset().top + ($(flyingTo).height() / 2) - ($(flyer).height()/divider)/2;
       
      $(flyerClone).velocity({
        opacity: 0,
        left: gotoX,
        top: gotoY,
        width: $(flyer).width()/divider,
        height: $(flyer).height()/divider
      }, 700, function(){
        $(flyerClone).remove();
      });
      /*
      $(flyerClone).animate({
        opacity: 0,
        left: gotoX,
        top: gotoY,
        width: $(flyer).width()/divider,
        height: $(flyer).height()/divider
      }, 700, function(){
        $(flyingTo).animate({
          opacity: 0.5
        }, 'fast', function(){
          $(flyingTo).animate({
            opacity: 1
          }, 'fast', function(){
            $(flyerClone).fadeOut('fast', function(){
              $(flyerClone).remove();
            });
          });
        });
      });
      */
    }
  }
};

var directPrint = {
  xhr: null,
  print: function(_data, callback){
    var _printserver = 'sys/other/print_windows_usb.php';
    if (localStorage.mangole3_printersettings){
      var printerData = JSON.parse(localStorage.mangole3_printersettings);
      if (printerData.printserver == 2){
        _printserver = app.data.printServer;
      }
    }
    /*if (this.xhr != null){ 
      this.xhr.abort();
      this.xhr = null;
    }*/
    
    //this.xhr = 
    $.ajax({
      type: 'POST',
      url: _printserver,
      data: _data,
      dataType: 'json',
      cache: false,
      timeout: 20000
    }).fail(function(){
      msgalert.showAlert({
      title: 'Atención!', 
      text: 'Ha ocurrido un error inesperado...',
      doneButtonLabel: { visible: true, label: 'Aceptar' }, cancelButtonLabel: { visible: false, label: null } }, function(){ }, function(){ });
    }).done(function(response){
      if (response.status == "login"){
        msgalert.showAlert({
        title: 'Sesión inactiva!', 
        text: 'Su sesión ha caducado por inactividad. El sistema intentará recuperar la sesión para que continúe trabajando con normalidad.',
        doneButtonLabel: { visible: true, label: 'Aceptar' }, cancelButtonLabel: { visible: false, label: null } }, function(){ forms.home.functions.loginscreen(); }, function(){ });
      }else if (response.status == "error"){
        msgalert.showAlert({
        title: 'Atención!', 
        text: 'Ha ocurrido un error inesperado...',
        doneButtonLabel: { visible: true, label: 'Aceptar' }, cancelButtonLabel: { visible: false, label: null } }, function(){ }, function(){ });
      }else if (response.status == "ok"){

      }
    }).always(function(){
    });//End $.ajax

    if (typeof callback === "function"){
      callback();
    }
  }
};

var printReport = {
  print: function(_data, callback){

    //Eliminar el frame del reporte, si este existe, para crear uno nuevo
    var printframe = document.getElementById("printReportFrame");
    if (printframe){
      printframe.parentNode.removeChild(printframe);
    }

    var html = document.createElement("IFRAME");
    html.setAttribute("id", "printReportFrame");
    html.setAttribute("style", "position:absolute; width: 100%; height: "+window['printReportData'][_data.report].settings.page.height+"; left: -9999px; background-color: #fff; z-index:900000; border: none;");

    document.body.appendChild(html);
    var obj = window['printReportData'][_data.report];
    printReport.loadObjectToReport(-1, obj, _data.report, function(data){
      printframe = document.getElementById("printReportFrame");
      printframe.onload = function(){
        setTimeout(function(){ //Este delay de 1seg es para darle tiempo a las imágenes a cargar, antes que se rederice la página a imprimir
          var tempFrameWindow = printframe.contentWindow ? printframe.contentWindow : printframe.contentDocument.defaultView;
          tempFrameWindow.focus();
          tempFrameWindow.print();
        }, 2000);
      };
      var doc = printframe.contentWindow.document,
      headerDivHeight = (window['printReportData'][_data.report].settings.header.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.header.height,
      footerDivHeight = (window['printReportData'][_data.report].settings.footer.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.footer.height,
      //bodyDivHeight = 'calc(100% - '+headerDivHeight+' + '+footerDivHeight+')';//(window['printReportData'][_data.report].settings.body.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.body.height,
      bodyDivHeight = (typeof window['printReportData'][_data.report].settings.body.height === "undefined") ? 'auto' : window['printReportData'][_data.report].settings.body.height;

      doc.open();
      var html = '<!DOCTYPE html> \
      <html lang="en"> \
        <head> \
          <meta charset="utf-8"> \
          <meta name="viewport" content="target-densitydpi=device-dpi, width=device-width, initial-scale=1.0, maximum-scale=1"> \
          <title>&nbsp;</title> \
          <style type="text/css" media="print"> \
            @page { size: '+window['printReportData'][_data.report].settings.page.width+' '+window['printReportData'][_data.report].settings.page.height+' landscape; margin: 0mm; } \
            @media print { \
              img { display: inline; } \
              * {-webkit-print-color-adjust:exact;} \
              .pagebreak { page-break-before: always; } \
            }\
          </style> \
          <link href="https://fonts.googleapis.com/css?family=Parisienne" rel="stylesheet"> \
          <style type="text/css"> \
            * { \
              margin: 0; \
              padding: 0; \
              font-family: \'OpenSansLight\', sans-serif; \
              font-size:13px; \
              -webkit-box-sizing: border-box; \
              -moz-box-sizing: border-box; \
              box-sizing: border-box; \
            } \
            @font-face { \
              font-family: "icons"; \
              src:url("fonts/others/medicaline.eot"); \
              src:url("fonts/others/medicaline.eot?#iefix") format("embedded-opentype"), \
                url("fonts/others/medicaline.ttf") format("truetype"), \
                url("fonts/others/medicaline.svg#untitled-font-1") format("svg"), \
                url("fonts/others/medicaline.woff") format("woff"); \
              font-weight: normal; \
              font-style: normal; \
            } \
            [data-icon]:before { \
              font-family: "icons" !important; \
              content: attr(data-icon); \
              font-style: normal !important; \
              font-weight: normal !important; \
              font-variant: normal !important; \
              text-transform: none !important; \
              speak: none; \
              line-height: 1; \
              -webkit-font-smoothing: antialiased; \
              -moz-osx-font-smoothing: grayscale; \
            } \
            [class^="icon-"]:before, \
            [class*=" icon-"]:before { \
              font-family: "icons" !important; \
              font-style: normal !important; \
              font-weight: normal !important; \
              font-variant: normal !important; \
              text-transform: none !important; \
              speak: none; \
              line-height: 1; \
              -webkit-font-smoothing: antialiased; \
              -moz-osx-font-smoothing: grayscale; \
            } \
            strong,b { font-weight: bold; } \
            html,body { position: relative; width: 100%; height: 100%; background-color: #fff; border: solid 1px #fff; padding: 0px; margin: 0px; } \
            .recipe-product > strong, \
            .recipe-product > b, \
            .ql-editor > strong, \
            .ql-editor > b  { font-weight: bold; font-size: 15px; }';

            html += '#printReport-document-wrapper { \
              position: relative; ';
              if (typeof window['printReportData'][_data.report].settings.page.border !== "undefined" && window['printReportData'][_data.report].settings.page.border == true || window['printReportData'][_data.report].settings.page.border == "true"){
                html += 'width: calc('+window['printReportData'][_data.report].settings.page.width+' - ('+window['printReportData'][_data.report].settings.page.margin.left+' + '+window['printReportData'][_data.report].settings.page.margin.right+')); \
                height: calc('+window['printReportData'][_data.report].settings.page.height+' - ('+window['printReportData'][_data.report].settings.page.margin.top+' + '+window['printReportData'][_data.report].settings.page.margin.bottom+')); \
                margin-top: '+window['printReportData'][_data.report].settings.page.margin.top+'; \
                margin-right: '+window['printReportData'][_data.report].settings.page.margin.right+'; \
                margin-bottom: '+window['printReportData'][_data.report].settings.page.margin.bottom+'; \
                margin-left: '+window['printReportData'][_data.report].settings.page.margin.left+';';
              }else{
                html += 'width: '+window['printReportData'][_data.report].settings.page.width+'; \
                height: '+window['printReportData'][_data.report].settings.page.height+'; \
                padding-top: '+window['printReportData'][_data.report].settings.page.margin.top+'; \
                padding-right: '+window['printReportData'][_data.report].settings.page.margin.right+'; \
                padding-bottom: '+window['printReportData'][_data.report].settings.page.margin.bottom+'; \
                padding-left: '+window['printReportData'][_data.report].settings.page.margin.left+';';
              }
              html += 'float: '+((typeof window['printReportData'][_data.report].settings.page.alignment === "undefined") ? "none" : window['printReportData'][_data.report].settings.page.alignment)+'; \
              '+((typeof window['printReportData'][_data.report].settings.page.alignment === "undefined" || window['printReportData'][_data.report].settings.page.alignment == "none") ? 'margin: 0 auto;' : '')+' \
              overflow: hidden;';
            html += '} ';
            html += '#printReport-document-footer { \
              padding-top: '+window['printReportData'][_data.report].settings.page.margin.top+'; \
              padding-right: '+window['printReportData'][_data.report].settings.page.margin.right+'; \
              padding-bottom: '+window['printReportData'][_data.report].settings.page.margin.bottom+'; \
              padding-left: '+window['printReportData'][_data.report].settings.page.margin.left+'; \
            }';
            
            if (typeof window['printReportData'][_data.report].settings.page.border !== "undefined" && window['printReportData'][_data.report].settings.page.border == true || window['printReportData'][_data.report].settings.page.border == "true"){
              html += '#printReport-document-wrapper { \
                border-radius: 10px; \
                border: 2px '+window['printReportData'][_data.report].settings.page.bordercolor+' solid; \
              } \
              #lblHeader { \
                padding: 10px; \
                border-bottom: 2px '+window['printReportData'][_data.report].settings.page.bordercolor+' solid; \
              } \
              #lblReportDate { \
                padding-right: 10px; \
                padding-top: 10px; \
              } \
              #printReport-document-body { \
               padding: 10px; \
              }';
            }

        if (typeof _data.data.report_header !== "undefined"){
          _report_header = _data.data.report_header;/*
          .replace(new RegExp('<%=doctor_name%>', 'g'), app.data.doctorname)
          .replace(new RegExp('<%=patient_name%>', 'g'), forms.records.variables.last_patient_name)
          .replace(new RegExp('<%=patient_gender%>', 'g'), ((parseInt(forms.records.variables.last_patient_gender) == 1) ? 'Masc' : 'Fem') )
          .replace(new RegExp('<%=patient_idcard%>', 'g'), forms.records.variables.last_patient_idcard)
          .replace(new RegExp('<%=patient_age%>', 'g'), forms.records.variables.last_patient_age)
          .replace(new RegExp('<%=full_date%>', 'g'), app.data.date.day + '/' + app.data.date.month + '/' + app.data.date.year)
          .replace(new RegExp('<%=document_date%>', 'g'), forms.records.variables.last_document_date)
          .replace(new RegExp('<%=document_title%>', 'g'), forms.records.variables.last_document_title)
          .replace(new RegExp('<%=day%>', 'g'), app.data.date.day)
          .replace(new RegExp('<%=month%>', 'g'), app.data.date.month)
          .replace(new RegExp('<%=year%>', 'g'), app.data.date.year)
          .replace(new RegExp('<%=long_month%>', 'g'), app.data.date.longmonth);*/
        }else{
          _report_header = _data.data.report_header;
        }
        

        if (typeof _data.data.report_footer !== "undefined"){
          _report_footer = _data.data.report_footer = _data.data.report_footer;/*
          .replace(new RegExp('<%=doctor_name%>', 'g'), app.data.doctorname)
          .replace(new RegExp('<%=patient_name%>', 'g'), forms.records.variables.last_patient_name)
          .replace(new RegExp('<%=patient_gender%>', 'g'), ((parseInt(forms.records.variables.last_patient_gender) == 1) ? 'Masc' : 'Fem') )
          .replace(new RegExp('<%=patient_idcard%>', 'g'), forms.records.variables.last_patient_idcard)
          .replace(new RegExp('<%=patient_age%>', 'g'), forms.records.variables.last_patient_age)
          .replace(new RegExp('<%=full_date%>', 'g'), app.data.date.day + '/' + app.data.date.month + '/' + app.data.date.year)
          .replace(new RegExp('<%=document_date%>', 'g'), forms.records.variables.last_document_date)
          .replace(new RegExp('<%=document_title%>', 'g'), forms.records.variables.last_document_title)
          .replace(new RegExp('<%=day%>', 'g'), app.data.date.day)
          .replace(new RegExp('<%=month%>', 'g'), app.data.date.month)
          .replace(new RegExp('<%=year%>', 'g'), app.data.date.year)
          .replace(new RegExp('<%=long_month%>', 'g'), app.data.date.longmonth);*/
        }else{
          _report_footer = _data.data.report_footer;
        }

        /*_report_body = _data.data.report_body
        .replace(new RegExp('<%=doctor_name%>', 'g'), app.data.doctorname)
        .replace(new RegExp('<%=patient_name%>', 'g'), forms.records.variables.last_patient_name)
        .replace(new RegExp('<%=patient_gender%>', 'g'), ((parseInt(forms.records.variables.last_patient_gender) == 1) ? 'Masc' : 'Fem') )
        .replace(new RegExp('<%=patient_idcard%>', 'g'), forms.records.variables.last_patient_idcard)
        .replace(new RegExp('<%=patient_age%>', 'g'), forms.records.variables.last_patient_age)
        .replace(new RegExp('<%=full_date%>', 'g'), app.data.date.day + '/' + app.data.date.month + '/' + app.data.date.year)
        .replace(new RegExp('<%=document_date%>', 'g'), forms.records.variables.last_document_date)
        .replace(new RegExp('<%=document_title%>', 'g'), forms.records.variables.last_document_title)
        .replace(new RegExp('<%=day%>', 'g'), app.data.date.day)
        .replace(new RegExp('<%=month%>', 'g'), app.data.date.month)
        .replace(new RegExp('<%=year%>', 'g'), app.data.date.year)
        .replace(new RegExp('<%=long_month%>', 'g'), app.data.date.longmonth);*/

        html += '  </style> \
        </head> \
        <body>';
          html += '<div id="printReport-document-wrapper"> \
            '+((typeof app.data.watermark !== "undefined" && app.data.watermark != 0 && app.data.watermark != "") ? '<div style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; text-align: center;"><img src="'+app.data.watermark+'" style="max-width: 100%; position: absolute; top: 50%; margin-top: -50%; left: 0;"></div>' : '')+' \
            <div id="printReport-document-header" style="'+((typeof window['printReportData'][_data.report].settings.page.header !== "undefined" && window['printReportData'][_data.report].settings.page.header == false) ? 'display: none;' : '')+' position: '+((typeof window['printReportData'][_data.report].settings.header.position === "undefined") ? "relative" : window['printReportData'][_data.report].settings.header.position)+'; width:100%; height: '+window['printReportData'][_data.report].settings.header.height+'; '+((typeof window['printReportData'][_data.report].settings.header.float === "undefined") ? "float: none;" : "float: " + window['printReportData'][_data.report].settings.header.float)+'; top:0; left:0;">'+_report_header+'</div> \
            <div id="printReport-document-body" style="position: '+((typeof window['printReportData'][_data.report].settings.body.position === "undefined") ? "relative" : window['printReportData'][_data.report].settings.body.position)+'; width:100%; height: '+ bodyDivHeight +'; '+((typeof window['printReportData'][_data.report].settings.body.float === "undefined") ? "float: none;" : "float: " + window['printReportData'][_data.report].settings.body.float)+'; top:0; left:0;">'+data.body+'</div> \
            <div id="printReport-document-footer" style="'+((typeof window['printReportData'][_data.report].settings.page.footer !== "undefined" && window['printReportData'][_data.report].settings.page.footer == false) ? 'display: none;' : '')+' position: absolute; width:100%; height: '+window['printReportData'][_data.report].settings.footer.height+'; '+((typeof window['printReportData'][_data.report].settings.footer.float === "undefined") ? "float: none;" : "float: " + window['printReportData'][_data.report].settings.footer.float)+'; bottom:0; left:0;">'+_report_footer+'</div> \
            <div class="pagebreak"> </div> \
          </div>';
        html += '  </body> \
      </html>';
      doc.write(html);
      doc.close();

      if (typeof callback === "function"){
        callback();
      }

    }, undefined, _data.data);
  },
  getHTML: function(_data, callback){
    var obj = window['printReportData'][_data.report];
    printReport.loadObjectToReport(-1, obj, _data.report, function(data){

      var headerDivHeight = (window['printReportData'][_data.report].settings.header.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.header.height,
      bodyDivHeight = (window['printReportData'][_data.report].settings.body.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.body.height,
      footerDivHeight = (window['printReportData'][_data.report].settings.footer.height == "auto") ? '0mm' : window['printReportData'][_data.report].settings.footer.height;

      var html = '<div class="wrapper" style="width: '+window['printReportData'][_data.report].settings.page.width+'; height: '+window['printReportData'][_data.report].settings.page.height+'; float: left; background-color: #fff; border: solid 1px #fff; padding: '+window['printReportData'][_data.report].settings.page.margin.top+' '+window['printReportData'][_data.report].settings.page.margin.right+' '+window['printReportData'][_data.report].settings.page.margin.bottom+' '+window['printReportData'][_data.report].settings.page.margin.left+'; margin: 0px;"> \
        <div id="printReport-document-wrapper" style="position:relative; width:100%; height:100%; float: left; overflow: hidden;"> \
          <div id="printReport-document-header" style="position: relative; width:100%; height: '+window['printReportData'][_data.report].settings.header.height+'; float: left; top:0; left:0;">'+data.header+'</div> \
          <div id="printReport-document-body" style="position: relative; width:100%; height: '+((window['printReportData'][_data.report].settings.body.height != "auto") ? bodyDivHeight : 'calc(100% - '+headerDivHeight+' + '+footerDivHeight+')')+'; float: left; top:0; left:0;">'+data.body+'</div> \
          <div id="printReport-document-footer" style="position: absolute; width:100%; height: '+window['printReportData'][_data.report].settings.footer.height+'; float: left; bottom:0; left:0;">'+data.footer+'</div> \
        </div> \
      </div>';

      if (typeof callback === "function"){
        callback(html);
        return false;
      }
      return html;
    }, undefined, _data.data);
  },
  loadObjectToReport: function(i, obj, params, callback, data, source){
    var x = i + 1,
    objcontrols = obj.objects.length,
    cty,
    params = {},
    data = (typeof data === "undefined") ? {header: "", body: "", footer: ""} : data;
    source = (typeof source === "undefined") ? {} : source;
    if (x == objcontrols){
      if (callback && typeof(callback) === "function"){
        callback(data);
      }
      return false;
    }
    cty = obj.objects[x].objectType;
    var parameters = obj.objects[x];
    if (typeof cty !== "undefined" && cty == "span"){
      parameters.id = (typeof parameters.id === "undefined") ? '' : parameters.id;
      parameters.value = (typeof parameters.value === "undefined" || parameters.value == null) ? "" : parameters.value;
      if (document.getElementById(parameters.id)){
        console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
      }
      var html = document.createElement("SPAN");
      html.setAttribute("id", parameters.id);
      html.setAttribute("data-control", "span");
      html.setAttribute("style", "display: inline-block; " + ((typeof parameters.css === "undefined" || parameters.css == null) ? "" : parameters.css));
      html.innerHTML = parameters.value;

      if (typeof parameters.dataSource !== "undefined" && parameters.dataSource != null){
        html.innerHTML = (typeof source[parameters.dataSource] !== "undefined" && source[parameters.dataSource] != null) ? source[parameters.dataSource] : (typeof parameters.value === "undefined" || parameters.value == null) ? "" : parameters.value;
      }

      var parent = (typeof parameters.parent === "undefined" || parameters.parent == null) ? "header" : parameters.parent;

      data[parent] += html.outerHTML;
      printReport.loadObjectToReport(x, obj, params, callback, data, source);
    }else if (typeof cty !== "undefined" && cty == "datatable"){
      parameters.id = (typeof parameters.id === "undefined") ? '' : parameters.id;
      
      if (document.getElementById(parameters.id)){
        console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
      }
      var html = document.createElement("div");
      html.setAttribute("id", parameters.id);
      html.setAttribute("data-control", "datatable");
      html.setAttribute("style", "width: 100%; float: left; " + ((typeof parameters.css === "undefined" || parameters.css == null) ? "" : parameters.css));

      if (typeof parameters.row !== "undefined" && parameters.row != null && parameters.row.length > 0){
        for (var l = 0; l < parameters.row.length; l++){
          var row = document.createElement("div");
          row.setAttribute("style", "width: 100%; float: left;");
          html.appendChild(row);
          for (var b = 0; b < parameters.row[l].cell.length; b++){
            var cell = document.createElement("div");
            cell.setAttribute("style", "width: 100%; float: left; " + ((typeof parameters.row[l].cell[b].css === "undefined" || parameters.row[l].cell[b].css == null) ? "" : parameters.row[l].cell[b].css));
            
            cell.innerHTML = (typeof source[parameters.row[l].cell[b].dataSource] !== "undefined" && source[parameters.row[l].cell[b].dataSource] != null) ? source[parameters.row[l].cell[b].dataSource] : ((typeof parameters.row[l].cell[b].value === "undefined" || parameters.row[l].cell[b].value == null) ? "" : parameters.row[l].cell[b].value);
            
            row.appendChild(cell);
          }
        }
      }else{
        if (typeof source[parameters.globalDataSource] !== "undefined"){
          for (var l = 0; l < source[parameters.globalDataSource].length; l++){
            var row = document.createElement("div");
            row.setAttribute("style", "width: 100%; float: left;");
            html.appendChild(row);
            for (var b = 0; b < source[parameters.globalDataSource][l].cell.length; b++){
              var cell = document.createElement("div");
              cell.setAttribute("style", "width: 100%; float: left; " + ((typeof source[parameters.globalDataSource][l].cell[b].css === "undefined" || source[parameters.globalDataSource][l].cell[b].css == null) ? "" : source[parameters.globalDataSource][l].cell[b].css));
              
              cell.innerHTML = (typeof source[parameters.globalDataSource][l].cell[b].dataSource !== "undefined" && source[parameters.globalDataSource][l].cell[b].dataSource != null) ? source[parameters.globalDataSource][l].cell[b].dataSource : ((typeof source[parameters.globalDataSource][l].cell[b].value === "undefined" || source[parameters.globalDataSource][l].cell[b].value == null) ? "" : source[parameters.globalDataSource][l].cell[b].value);
              
              row.appendChild(cell);
            }
          }
        }
        
      }

      var parent = (typeof parameters.parent === "undefined" || parameters.parent == null) ? "header" : parameters.parent;

      data[parent] += html.outerHTML;
      printReport.loadObjectToReport(x, obj, params, callback, data, source);
    }else if (typeof cty !== "undefined" && cty == "image"){
      parameters.id = (typeof parameters.id === "undefined") ? '' : parameters.id;
      if (document.getElementById(parameters.id)){
        console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
      }
      var html = document.createElement("SPAN");
      html.setAttribute("id", parameters.id);
      html.setAttribute("data-control", "image");
      html.setAttribute("style", "display: inline-block; " + ((typeof parameters.css === "undefined" || parameters.css == null) ? "" : parameters.css));
      
      var img = document.createElement("IMG");
      img.setAttribute("src", ((typeof parameters.url === "undefined" || parameters.url == null) ? "" : parameters.url));
      img.setAttribute("style", "max-width:100%; max-height: 100%;");

      html.appendChild(img);

      var parent = (typeof parameters.parent === "undefined" || parameters.parent == null) ? "header" : parameters.parent;

      data[parent] += html.outerHTML;
      printReport.loadObjectToReport(x, obj, params, callback, data, source);
    }else if (typeof cty !== "undefined" && cty == "barcode"){
      parameters.id = (typeof parameters.id === "undefined") ? '' : parameters.id;
      parameters.value = (typeof parameters.value === "undefined" || parameters.value == null) ? "" : parameters.value;
      parameters.codeType = (typeof parameters.codeType === "undefined" || parameters.codeType == null) ? "codabar" : parameters.codeType;
      parameters.settings = (typeof parameters.settings === "undefined" || parameters.settings == null) ? {} : parameters.settings;
      if (document.getElementById(parameters.id)){
        console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
      }
      var html = document.createElement("DIV");
      html.setAttribute("data-control", "barcode");
      html.setAttribute("style", "display: inline-block; text-align: center; " + ((typeof parameters.css === "undefined" || parameters.css == null) ? "" : parameters.css));

      var span = document.createElement("SPAN");
      span.setAttribute("id", parameters.id);
      span.setAttribute("style", "display: inline-block;");

      html.appendChild(span);
      
      var codevalue = "";
      if (typeof parameters.dataSource !== "undefined" && parameters.dataSource != null){
        codevalue = (typeof source[parameters.dataSource] !== "undefined" && source[parameters.dataSource] != null) ? source[parameters.dataSource] : (typeof parameters.value === "undefined" || parameters.value == null) ? "" : parameters.value;
      }else{
        codevalue = parameters.value;
      }

      var parent = (typeof parameters.parent === "undefined" || parameters.parent == null) ? "header" : parameters.parent;

      if (codevalue != ""){
        try {
          span.innerHTML = barcodes().render(codevalue, parameters.codeType, parameters.settings);
        }catch(e){
          console.error(e.message);
        }

        data[parent] += html.outerHTML;
      }

      printReport.loadObjectToReport(x, obj, params, callback, data, source);
    }else{
      if (callback && typeof(callback) === "function"){
        printReport.loadObjectToReport(x, obj, params, callback, data, source);
      }
    }
  }
};






function merge(target, source) {
  /* Merges two (or more) objects, giving the last one precedence */
  if ( typeof target !== 'object' ) {
    target = {};
  }
  for (var property in source) {
    if ( source.hasOwnProperty(property) ) {
      var sourceProperty = source[ property ];
      if ( typeof sourceProperty === 'object' ) {
        target[ property ] = util.merge( target[ property ], sourceProperty );
        continue;
      }
      target[ property ] = sourceProperty;
    }
  }
  for (var a = 2, l = arguments.length; a < l; a++) {
    merge(target, arguments[a]);
  }
  return target;
}
 





function rSQL(_config){
  return (function(_config){
    var sentence = {},
    config = (typeof _config === "undefined") ? {} : _config;
    this.insert = function(_data){
      return (function(_data){
        sentence.data = _data;
        this.into = function(_table){
          sentence.table = _table;
          return (function(_table, _data){
            this.foreignKey = function(_foreignKey){
              sentence.foreigndata = _foreignKey;
              return (function(_foreignKey){
                rSQL(config).ajax(sentence);
              }(_foreignKey));
            };
            //rSQL(config).ajax(sentence);
            return {
              foreignKey: this.foreignKey
            } 
          }(_table, _data));
        };
        return {
          into: this.into
        } 
      }(_data));
    };
    this.update = function(_table){
      return (function(_table){
        sentence.table = _table;
        this.set = function(_data){
          sentence.data = _data;
          return (function(_table, _data){
            this.where = function(_conditions){
              return (function(_conditions){
                sentence.conditions = _conditions;
                rSQL(config).ajax(sentence);
              }(_conditions));
            };
            return {
              where: this.where
            }
          }(_table, _data));      
        };
        return {
          set: this.set
        } 
      }(_table));
    };
    this.select = function(_data){
      return (function(_data){
        sentence.data = _data;
        this.from = function(_table){
          return (function(_table){
            sentence.table = _table;
            this.unionall = function(_unionall){
              return (function(_unionall){
                sentence.unionall = _unionall;
                this.where = function(_conditions){
                  return (function(_conditions){
                    sentence.conditions = _conditions;
                    rSQL(config).ajax(sentence);
                  }(_conditions));
                };
                this.on = function(_conditions){
                  return (function(_conditions){
                    sentence.conditions = _conditions;
                    rSQL(config).ajax(sentence);
                  }(_conditions));
                };
                return {
                  on: this.on,
                  where: this.where
                }
              }(_unionall));
            };
            this.where = function(_conditions){
              return (function(_conditions){
                sentence.conditions = _conditions;
                this.order = function(_order){
                  return (function(_order){
                    sentence.order = _order;
                    rSQL(config).ajax(sentence);
                  }(_order));
                };
                this.andexists = function(_andexists){
                  return (function(_andexists){
                    sentence.andexists = _andexists;
                    rSQL(config).ajax(sentence);
                  }(_andexists));
                };
                return {
                  order: this.order,
                  andexists: this.andexists
                }
              }(_conditions));
            };
            this.on = function(_conditions){
              return (function(_conditions){
                sentence.conditions = _conditions;
                rSQL(config).ajax(sentence);
              }(_conditions));
            };

            return {
              on: this.on,
              where: this.where,
              unionall: this.unionall,
              order: this.order
            }
          }(_table));
        };
        return {
          from: this.from
        }
      }(_data));
    };
    this.delete = {
      from: function(_table){
        sentence.table = _table;
        return (function(_table){
          this.where = function(_conditions){
            return (function(_conditions){
              sentence.conditions = _conditions;
              rSQL(config).ajax(sentence);
            }(_conditions));
          };
          return {
            where: this.where
          }
        }(_table));     
      }
    };
    this.ajax = function(ajaxsentence){
      var params = {
        type: (typeof config.type === "undefined") ? 'GET' : config.type,
        url: (typeof config.url === "undefined") ? '' : config.url,
        async: (typeof config.async === "undefined") ? true : config.async,
        contentType: (typeof config.contentType === "undefined") ? 'application/x-www-form-urlencoded' : config.contentType,
        data: (config.contentType == "application/json;charset=UTF-8") ? JSON.stringify(ajaxsentence) : (function(){
          var string = "",
          fields_sep = "";
          for (var key in ajaxsentence){
            string += fields_sep + key + "=" + ajaxsentence[key];
            fields_sep = "&";
          }
          return string;
        })(),
        showLoading: (typeof config.showLoading === "undefined") ? false : config.showLoading,
        timeout: (typeof config.timeout === "undefined") ? 0 : config.timeout,
        error: (function(){ return config.error })(),
        success: (function(){ return config.success })(),
        nonavigate: (typeof config.nonavigate === "undefined") ? false : config.nonavigate
      };

      if (params.nonavigate == true){
        if (typeof params.success === "function"){
          params.success('{ "status": "ok", "message": "", "action": "nothing", "data": [] }');
          return false;
        }
      }

      var xmlHttpRequest = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
      xmlHttpRequest.open(params.type, params.url, params.async);
      var requestTimer = setTimeout(function(){
        clearTimeout(requestTimer);

        xmlHttpRequest.abort();
        if (typeof params.error === "function"){
          params.error(xmlHttpRequest, {code: 'REQUEST_TIMED_OUT', message: 'Request timed out'});
        }
      }, params.timeout);

      xmlHttpRequest.onreadystatechange = function(){
        if (xmlHttpRequest.readyState != 4){
          return false;
        }
        clearTimeout(requestTimer);
        if (xmlHttpRequest.status != 200 && xmlHttpRequest.status != 304){
          var status_error = {};
          status_error.code = xmlHttpRequest.status;
          //statusText
          switch (xmlHttpRequest.status){
            case 404: 
              status_error.message = 'File not found';
              break;
            case 500:
              status_error.message = 'Server error';
              break;
            case 0:
              status_error.message = 'Request aborted';
              break;
            default:
              status_error.message = 'Unknown error ' + xmlHttpRequest.status;
          }
          if (typeof params.error === "function"){
            params.error(xmlHttpRequest, status_error);
          }
        }else{
          if (typeof params.success === "function"){
            params.success(xmlHttpRequest.responseText, xmlHttpRequest.status);
          }
        }
        //Hide loading screen
        if (params.showLoading == true){
          var loading = $('#loading-screen');
          /*loading.one('webkitTransitionEnd transitionend', function(e){
              loading.off('webkitTransitionEnd transitionend');
              $('#loading-screen').remove();
          });*/
          var loadingFadeTimer = setTimeout(function(){
            clearTimeout(loadingFadeTimer);
            loading.remove();
          }, 300);
          loading.removeClass('visible');
        }
      },
      xmlHttpRequest.onerror = function(){
        var status_error = {};
        status_error.code = xmlHttpRequest.status;
        switch (xmlHttpRequest.status){
          case 404: 
            status_error.message = 'File not found';
            break;
          case 500:
            status_error.message = 'Server error';
            break;
          case 0:
            status_error.message = 'Request aborted';
            break;
          default:
            status_error.message = 'Unknown error ' + xmlHttpRequest.status;
        }
        if (typeof params.error === "function"){
          params.error(xmlHttpRequest, status_error);
        }
        //Hide loading screen
        if (params.showLoading == true){
          /*loading.one('webkitTransitionEnd transitionend', function(e){
              loading.off('webkitTransitionEnd transitionend');
              $('#loading-screen').remove();
          });*/
          var loadingFadeTimer = setTimeout(function(){
            clearTimeout(loadingFadeTimer);
            loading.remove();
          }, 300);
          loading.removeClass('visible');
        }
      }
      //Show loading screen
      if (params.showLoading == true){
        if ($('#loading-screen').length > 0){
            $('#loading-screen').remove();
        }
        var html = '<span id="loading-screen"> \
          <div class="loading-screen-message"><!--<span class="circular"></span>-->Cargando...</div> \
        </span>';
        $('body').append(html);
        $('#loading-screen').addClass('visible');
      }
      // Sending FormData automatically sets the Content-Type header to multipart/form-data
      xmlHttpRequest.setRequestHeader("Content-type", params.contentType);
      xmlHttpRequest.send(params.data);
    }
    return {
      insert: this.insert,
      select: this.select,
      update: this.update,
      delete: this.delete,
      sentence: this.sentence,
      config: this.config,
      ajax: this.ajax
    }
  }(_config));
} 

serialize = function(obj, prefix) {
  var str = [], p;
  for (p in obj){
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push((v !== null && typeof v === "object") ? serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
};

function rAjax(dat){
  const params = {
    type: dat.type || 'GET',
    url: dat.url || '',
    async: dat.async !== undefined ? dat.async : true,
    contentType: dat.contentType || 'application/x-www-form-urlencoded',
    data: (dat.contentType === "application/json;charset=UTF-8") ? JSON.stringify(dat.data) : serialize(dat.data),
    timeout: dat.timeout || 20000,
    showLoading: dat.showLoading || false,
    error: typeof dat.error === "function" ? dat.error : null,
    success: typeof dat.success === "function" ? dat.success : null,
    abort: typeof dat.abort === "function" ? dat.abort : null,
    complete: typeof dat.complete === "function" ? dat.complete : null
  };
  const xhr = new XMLHttpRequest();
  let requestTimer = null;
  const hideLoadingScreen = function(){
    const loadingEl = document.getElementById('loading-screen');
    if (loadingEl){
      loadingEl.classList.remove('visible');
      loadingEl.addEventListener('transitionend', function handler(){
        loadingEl.removeEventListener('transitionend', handler);
        if (loadingEl.parentNode){
          loadingEl.parentNode.removeChild(loadingEl);
        }
      });
    }
  };
  const showLoadingScreen = function(){
    let loadingEl = document.getElementById('loading-screen');
    if (loadingEl){
      loadingEl.parentNode.removeChild(loadingEl);
    }
    loadingEl = document.createElement('span');
    loadingEl.id = 'loading-screen';
    loadingEl.innerHTML = '<div class="loading-screen-message">Cargando...</div>';
    document.body.appendChild(loadingEl);
    setTimeout(function(){
      loadingEl.classList.add('visible');
    }, 10);
  };
  const parseResponse = function(responseText){
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  };
  const handleComplete = function(){
    if (params.showLoading){
      hideLoadingScreen();
    }
    if (params.complete){
      params.complete(xhr);
    }
  };
  xhr.open(params.type, params.url, params.async);
  xhr.setRequestHeader("Content-type", params.contentType);
  requestTimer = setTimeout(function(){
    xhr.abort();
    const error = {code: 'REQUEST_TIMED_OUT', message: 'Request timed out', response: null};
    if (params.error){
      params.error(xhr, error);
    }
    handleComplete();
  }, params.timeout);
  xhr.onreadystatechange = function(){
    if (xhr.readyState !== 4){
      return;
    }
    clearTimeout(requestTimer);
    if (xhr.status !== 200 && xhr.status !== 304){
      const error = {
        code: xhr.status,
        message: xhr.status === 404 ? 'File not found' : 
                 xhr.status === 500 ? 'Server error' : 
                 xhr.status === 0 ? 'Request aborted' : 
                 'Unknown error ' + xhr.status,
        response: parseResponse(xhr.responseText)
      };
      if (xhr.status === 0){
        if (params.abort){
          params.abort(xhr, error);
        }
      }else{
        if (params.error){
          params.error(xhr, error);
        }
      }
      handleComplete();
    }else{
      if (params.success){
        params.success(parseResponse(xhr.responseText), xhr.status);
      }
      handleComplete();
    }
  };
  xhr.onerror = function(){
    clearTimeout(requestTimer);
    const error = {
      code: xhr.status,
      message: xhr.status === 404 ? 'File not found' : 
               xhr.status === 500 ? 'Server error' : 
               xhr.status === 0 ? 'Request aborted' : 
               'Unknown error ' + xhr.status,
      response: parseResponse(xhr.responseText)
    };
    if (params.error){
      params.error(xhr, error);
    }
    handleComplete();
  };
  if (params.showLoading){
    showLoadingScreen();
  }
  xhr.send(params.data);
}



function jsUfile(data){
  var _this = this;
  this.filePicked = null;
  var options = {},
  xmlHttpRequest = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"),
  init = function(parameters){
 
    options = {
      input: (typeof parameters.input === "undefined") ? null : parameters.input, //Input file chooser selector
      defaultDirectory: (typeof parameters.defaultDirectory === "undefined") ? null : parameters.defaultDirectory, //Especific directory to explore images
      uploadScript: (typeof parameters.uploadScript === "undefined") ? null : parameters.uploadScript, //
      preview: (typeof parameters.preview === "undefined") ? false : parameters.preview, //If you want to read the image file as data URL
      crop: (typeof parameters.crop === "undefined") ? false : parameters.crop, 
      dimensions: (typeof parameters.dimensions === "undefined") ? '' : parameters.dimensions, 
      pickedCallback: (function(){ return parameters.pickedCallback })(), //Finish reading file callback
      uploadedCallback: (function(){ return parameters.uploadedCallback })(), //Finish uploading file callback
      error: (function(){ return parameters.error })(), //On error callback
    };
 
    var file_input = document.querySelector(options.input);
 
    if (file_input === null){
      options.error('NOT_INPUT_FILE_FOUND');
      return false;
    }

    file_input.setAttribute('data-abort','false');
    file_input.addEventListener('click', function(event){
      if (this.getAttribute("data-abort") == true){
        _this.stopUpload();
        this.setAttribute('data-abort','false');
      }
    }, false);
    file_input.addEventListener('change', function(event){
      event.stopPropagation();
      _this.picked(this.files[0]);
      this.getAttribute('data-abort','true');
    }, false);   
  };
 
  this.picked = function(file){
    if (!file.type.match(/image.*/)){
      if (typeof options.error === "function"){
        options.error('NOT_IMAGE_FILE');
      }
      return false;
    }
 
    this.filePicked = file;
 
    if (options.preview == true){
      this.readImage(file);
    }else{
      if (typeof options.pickedCallback === "function"){
        options.pickedCallback({type: null, source: null});
      }
    }
  };
 
  this.upload = function(){
    if (options.uploadScript == null){
      if (typeof options.error === "function"){
        options.error('NOT_UPLOAD_SCRIPT_FOUND');
      }
      return false;
    }
    var file = this.filePicked;
    if (options.nativefilepicker == false){
      //Cargar archivo al servidor usando fetch API
      window.resolveLocalFileSystemURL(data.image, function(fileEntry) {
        fileEntry.file(function(fileObj) {
          var reader = new FileReader();
          reader.onloadend = function() {
            var blob = new Blob([this.result], {type: fileObj.type});
            var formData = new FormData();
            formData.append("images[]", blob, file.name);
            
            fetch(encodeURI(options.uploadScript), {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(function(response){
              if (response.status == "ok"){
                if (typeof options.uploadedCallback === "function"){
                  options.uploadedCallback(response);
                }
              }else if (response.status == "error"){
                if (typeof options.error === "function"){
                  options.error(response.message);
                }
              }
            })
            .catch(function(error){
              if (typeof options.error === "function"){
                options.error('UPLOAD_ERROR');
              }
            });
          };
          reader.readAsArrayBuffer(fileObj);
        });
      });
    }else{

    var querystring = 'dimensions='+options.dimensions + 
    '&crop='+options.crop;

      var formdata = new FormData();
      formdata.append('images[]', file);
      var xmlHttpRequest = new XMLHttpRequest();
      xmlHttpRequest.open("POST", options.uploadScript + '&' + querystring, true);
      xmlHttpRequest.onreadystatechange = function(){
        if (xmlHttpRequest.readyState == 4){
          var response = JSON.parse(xmlHttpRequest.responseText);
          if (response.status == "ok"){
            if (typeof options.uploadedCallback === "function"){
              options.uploadedCallback(response);
            }
          }else if (response.status == "error"){
            if (typeof options.error === "function"){
              options.error(response.message);
            }
          }
        }
      }
      // Sending FormData automatically sets the Content-Type header to multipart/form-data
      xmlHttpRequest.send(formdata);
    }
  };
 
  this.readImage = function(file){
    try {
      if (options.defaultDirectory != null){
        if (typeof options.pickedCallback === "function"){
          options.pickedCallback({type: 'path', source: file});
        }
      }else{
        var reader = new FileReader();
        reader.onloadend = function(e){
          if (typeof options.pickedCallback === "function"){
            options.pickedCallback({type: 'file', source: event.target.result});
          }
        };
        reader.readAsDataURL(file);
      }
    }catch(e){
      if (typeof options.error === "function"){
        options.error(e.message);
      }
    }
  };
 
  this.stopUpload = function(){
    xmlHttpRequest.abort();
    if (typeof options.error === "function"){
      options.error('UPLOAD_ABORTED');
    }
  };
 
  init(data);
};






var uploadFile = {
  njx:function(xmlhttp){
    try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }catch(e){
      try {
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
      }catch(E){
        xmlhttp = false;
      }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined'){
      xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
  },
  init:function(string){
    uploadFile.options.push(string);
    uploadFile.currentWrapper = uploadFile.options.length-1;

    $('#' + string.wrapper)
    .attr("data-currentwrapper", uploadFile.currentWrapper)
    .append('<div class="inputbutton wolmargin"> \
      <label> \
        <span class="buttonlabel">'+((string.buttonText instanceof Array) ? string.buttonText[ns.languageIndex] : string.buttonText)+'</span> \
        <input type="file" multiple name="'+string.inputName+'" data-excludeifblank="false" data-linked="false" data-required="exclude" data-numeric="false" style="position:absolute; left:-9999px;"> \
      </label> \
    </div> \
    <ul class="imageList"></ul>').find('.inputbutton label input').change(function(){
      var length = this.files.length;
      for (i = 0; i < length; i++){
        uploadFile.files.push(this.files[i]);
      }
      uploadFile.currentWrapper = $(this).parent().parent().parent().data("currentwrapper");

      $(".multiplesImagesUpload .inputbutton label input").attr("disabled","true");
      $(".multiplesImagesUpload .inputbutton label .buttonlabel").html('En espera...');
      $(this).parent().find('span.buttonlabel').html('Cargando...');
      
      uploadFile.readImages(0);
    });
    if (uploadFile.options[uploadFile.currentWrapper].showRemoteImages == true){
      uploadFile.showRemoteImages(string.wrapper);
    }
  },
  readImages: function(i){
    var reader, file;
    if (i < uploadFile.files.length){
      reader = new FileReader(),
      file = uploadFile.files[i];
      if(!file.type.match(/image.*/)){
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'Error, solo se permiten archivos de imágenes...',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });

        //Reestablecer botón de cargar e input file
        $(".multiplesImagesUpload .inputbutton label input").removeAttr("disabled");
        $(".multiplesImagesUpload .inputbutton label .buttonlabel").html(((uploadFile.options[uploadFile.currentWrapper].buttonText instanceof Array) ? uploadFile.options[uploadFile.currentWrapper].buttonText[ns.languageIndex] : uploadFile.options[uploadFile.currentWrapper].buttonText));
        
        //Eliminar el archivo del array de archivos (no no ser una imagen)
        var index = uploadFile.files.indexOf(file);
        if (index > -1) {
          uploadFile.files.splice(index, 1);
        }

        return;
      }
      reader.onloadend = function(e){
        $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " .imageList").append('<li class="image" data-status="queue" data-localfilename="'+file.name+'"> \
          <img src="'+event.target.result+'" /> \
          <span class="filename">'+file.name+'</span> \
          <div class="feet"> \
            <input type="text" name="feet" maxlength="70" placeholder="Escriba una descripción..." data-required="exclude" data-excludeifblank="false" data-linked="false" data-label="" data-numeric="false"> \
          </div> \
          <a href="javascript:void(0);" target="_blank" class="preview" data-icon="s"></a> \
          <div class="cancel">×</div> \
          <div class="progress"> \
            <div class="blue"></div> \
          </div> \
        </li>').sortable({
          placeholder: "ui-state-highlight",
          cancel: '.feet'
        }).disableSelection().find(".cancel").click(function(){
          var index = uploadFile.files.indexOf($(this).parent().data("localfilename")),
          _this_item = $(this);

          msgalert.showAlert({
            title: 'Confirmation!', 
            text: 'Are you sure you want to delete this item?',
            doneButtonLabel: {
              visible: true,
              label: 'OK'
            },
            cancelButtonLabel: {
              visible: true,
              label: 'Cancel'
            }
          }, function(){
            //Callback botón Done
            if (index > -1) {
              uploadFile.files.splice(index, 1);
            }
            if (_this_item.parent().data("status") == "uploading"){
              uploadFile.xhrObj.abort();
            }
            _this_item.parent().remove();

            if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
              if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('li').length){
                $("div.multiplesImagesUpload > div.inputbutton").show();
              }else{
                $("div.multiplesImagesUpload > div.inputbutton").hide();
              }
            }
            
          }, function(){
            //Callback botón Cancel
            return false;
          });
          
        });
        i++;
        uploadFile.readImages(i);
        //
      };
      reader.onabort = function(e){
        uploadFile.console('Lectura de archivo cancelada...');
      };
      reader.readAsDataURL(file);
    }else{
      uploadFile.upload();
    }
    
  },
  upload:function(_i){
    var formdata = new FormData(),
    file;
    uploadFile.xhrObj = uploadFile.njx();

    /*{
      'wrapper'           : multiplesImagesUploadID,
      'uploadScript'      : 'sys/local/upload.php?key=upload',
      'showRemoteImages'  : showRemoteImages,
      'remoteImagesScript': 'sys/local/upload.php?key=show',
      'images'            : images,
      'inputName'         : eval('forms.'+object+'[0].modules['+module+'].fields['+i+'].name'),
      'imagesDimensions'  : dimensions,
      'maxImages'         : eval('forms.'+object+'[0].modules['+module+'].fields['+i+'].maxImages'),
      'uploadFolder'      : encodeURIComponent(eval('forms.'+object+'[0].modules['+module+'].fields['+i+'].folder'))
    }*/

    var querystring = ((typeof _i !== "undefined") ? 'i='+_i+'&' : '') + 'dimensions='+uploadFile.options[uploadFile.currentWrapper].imagesWidth + 
    //'&uploadFolder='+uploadFile.options[uploadFile.currentWrapper].uploadFolder +
    '&crop='+uploadFile.options[uploadFile.currentWrapper].crop;

    if (uploadFile.files.length == 0){
      return;
    }

    file = uploadFile.files[0];
    formdata.append('images[]', file);

    uploadFile.xhrObj.open("POST", uploadFile.options[uploadFile.currentWrapper].uploadScript + '&' + querystring, true);

    uploadFile.xhrObj.upload.addEventListener('progress', function(e) {
      
      if (e.lengthComputable) {
        var percent = Math.round((e.loaded / e.total) * 100);
        $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress div.blue").css("width", percent + "%");

        //console.log(percent);
      }
    }, false);

    uploadFile.xhrObj.upload.addEventListener('abort', function(e) {
      uploadFile.console('Carga de archivo cancelada...');
      uploadFile.uploading = false;
      uploadFile.xhrObj = null;
      $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "aborted");
      //uploadFile.upload();
    }, false);

    uploadFile.xhrObj.addEventListener('loadstart', function(e) {
      uploadFile.uploading = true;
    });
    uploadFile.xhrObj.addEventListener('load', function(e) {
      //$("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").parent().parent().find('.inputbutton label input').removeAttr("disabled");
      //$("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").parent().parent().find('.inputbutton label span.buttonlabel').html('Cargar imágenes');
      $(".multiplesImagesUpload .inputbutton label input").removeAttr("disabled");
      $(".multiplesImagesUpload .inputbutton label .buttonlabel").html(((uploadFile.options[uploadFile.currentWrapper].buttonText instanceof Array) ? uploadFile.options[uploadFile.currentWrapper].buttonText[ns.languageIndex] : uploadFile.options[uploadFile.currentWrapper].buttonText));

      var index = uploadFile.files.indexOf(file);
      if (index > -1) {
        uploadFile.files.splice(index, 1);
      }

      if (this.readyState == 4) {
        uploadFile.uploading = false;
        try {
          uploadFile.variableJSONResponse = JSON.parse(uploadFile.xhrObj.responseText);
        }catch(e){
          msgalert.showAlert({
            title: 'Atención!', 
            text: uploadFile.error[0],
            doneButtonLabel: {
              visible: true,
              label: 'Aceptar'
            },
            cancelButtonLabel: {
              visible: false,
              label: null
            }
          }, function(){
            //Callback botón Done
          }, function(){
            //Callback botón Cancel
          });
          uploadFile.console('Error con la llamada a "'+ uploadFile.options[uploadFile.currentWrapper].uploadScript +'". La respuesta no corresponde a un JSON');
          return;
        }
        
        $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress").css("display","none");
        
        if (this.status == 200) {
          //alert(uploadFile.files.length);
          if (uploadFile.files.length > 0){
            //uploadFile.FileCounter++;
            uploadFile.upload(uploadFile.files.length);
          }else {
            //uploadFile.FileCounter = 0;
            uploadFile.files.length = 0;
          }
          if (uploadFile.variableJSONResponse.status == "ok"){
            $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-serverfilename", uploadFile.variableJSONResponse.name);
            $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "uploaded");

            $("#" + uploadFile.options[uploadFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] a.preview").attr("href", ((typeof app.data.root !== "undefined") ? app.data.root : "") + "tmp/img/tmp" + app.data.user + "/" + uploadFile.variableJSONResponse.name);

            if (uploadFile.variableJSONResponse.action != "nothing"){
              eval(uploadFile.variableJSONResponse.action);
            }

            if (typeof uploadFile.options[uploadFile.currentWrapper].onuploaded === "function"){
              uploadFile.options[uploadFile.currentWrapper].onuploaded();
            }

            return;
          }else if (uploadFile.variableJSONResponse.status == "empty"){

            if (uploadFile.variableJSONResponse.action != "nothing"){
              eval(uploadFile.variableJSONResponse.action);
            }
            return;
          }else if (uploadFile.variableJSONResponse.status == "error"){
            msgalert.showAlert({
              title: 'Atención!', 
              text: uploadFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
            uploadFile.console(uploadFile.variableJSONResponse.message);
            if (uploadFile.variableJSONResponse.action != "nothing"){
              eval(uploadFile.variableJSONResponse.action);
            }
            return;
          }else {
            msgalert.showAlert({
              title: 'Atención!', 
              text: uploadFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
            return;
          }
        }
      }
    });
    uploadFile.xhrObj.send(formdata); 
  },
  getUploadedImages: function(_id){
    var imagesarray = [];
    //var imagesstring = "[";
    $(_id).find("ul.imageList li").each(function(){
      if ($(this).data("status") == "queue" || $(this).data("status") == "uploading"){
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'El archivo "'+ $(this).data("localfilename") +'" aún no ha terminado de cargar. Por favor, espere unos instantes...',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });
        return false;
      }
      imagesarray.push({file: $(this).data("serverfilename"), comment: $(this).find(".feet input").val().replace(new RegExp('"', 'g'), '\\\"')});
    });
    if (imagesarray.length == 0){
      if (typeof uploadFile.options[uploadFile.currentWrapper].defaultImages !== "undefined" && uploadFile.options[uploadFile.currentWrapper].defaultImages != ""){
        imagesarray = uploadFile.options[uploadFile.currentWrapper].defaultImages;
      }
    }
    if (imagesarray.length == 0){
      return "[]";
    }else{
      return JSON.stringify(imagesarray);
    }
  },
  showRemoteImages:function(images, wrapper, _callback){
    //console.log(images.length);
    var html = "";
    for (x = 0; x < images.length; x++){
      var scrimg = '../' + app.data.imagesFolder + images[x]["file"];

      html += '<li class="image" data-status="uploaded" data-serverfilename="'+images[x]["file"]+'" data-localfilename="'+images[x]["file"]+'"> \
        <img src="'+scrimg+'" /> \
        <span>'+images[x]["file"]+'</span> \
        <div class="feet"> \
          <input type="text" name="feet" maxlength="70" value="'+images[x]["comment"].replace(new RegExp('"', 'g'), '&quot;')+'" placeholder="Escriba una descripción..." data-required="exclude" data-excludeifblank="false" data-linked="false" data-label="" data-numeric="false"> \
        </div> \
        <a href="'+scrimg+'" target="_blank" class="preview" data-icon="s"></a> \
        <div class="cancel">×</div> \
      </li>';
    }
    $(wrapper).find("ul.imageList").html(html).sortable({
      placeholder: "ui-state-highlight",
      cancel: '.feet'
    }).disableSelection().find(".cancel").click(function(){
      var _this_item = $(this);

      msgalert.showAlert({
        title: 'Confirmation!', 
        text: 'Are you sure you want to delete this item?',
        doneButtonLabel: {
          visible: true,
          label: 'OK'
        },
        cancelButtonLabel: {
          visible: true,
          label: 'Cancel'
        }
      }, function(){
        //Callback botón Done
        _this_item.parent().remove();

        if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
          if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('li').length){
            $("div.multiplesImagesUpload > div.inputbutton").show();
          }else{
            $("div.multiplesImagesUpload > div.inputbutton").hide();
          }
        }
      }, function(){
        //Callback botón Cancel
        return false;
      });
      
    });
    if (typeof _callback === "function"){
      _callback();
    }
    
    /*uploadFile.xhrObj = uploadFile.njx(uploadFile.xhrObj);
    uploadFile.xhrObj.open("POST", uploadFile.options[uploadFile.currentWrapper].savedImagesScript + '&wrapper=' + wrapper, false);
    uploadFile.xhrObj.addEventListener('load', function(e) {
      if (this.readyState == 4) {
        uploadFile.uploading = false;
        try {
          uploadFile.variableJSONResponse = JSON.parse(uploadFile.xhrObj.responseText);
        }catch(e){
          maviras.msgbox(uploadFile.error[0]);
          uploadFile.console('Error con la llamada a "'+ uploadFile.options[uploadFile.currentWrapper].savedImagesScript +'". La respuesta no corresponde a un JSON');
          return;
        }
        if (this.status == 200) {
          if (uploadFile.variableJSONResponse.response[0].status == "ok"){

            if (uploadFile.variableJSONResponse.response[0].images != ""){
              
              var images = uploadFile.variableJSONResponse.response[0].images;
              for (x = 0; x < images.length; x++){
                if (images[x]["file"] != ""){
                  $("#" + uploadFile.variableJSONResponse.response[0].wrapper + " .imageList").append('<li class="image" data-status="uploaded" data-serverfilename="'+images[x]["file"]+'" data-localfilename="'+images[x]["file"]+'"> \
                    <img src="../uploads/img/'+images[x]["file"]+'" /> \
                    <span>'+images[x]["file"]+'</span> \
                    <div class="feet"> \
                      <input type="text" name="feet" maxlength="70" value="'+utf8_decode(images[x]["comment"])+'" placeholder="Escriba una descripción..." data-required="exclude" data-excludeifblank="false" data-linked="false" data-label="" data-numeric="false"> \
                    </div> \
                    <div class="cancel" data-icon="L"></div> \
                  </li>').sortable({
                    placeholder: "ui-state-highlight",
                    cancel: '.feet'
                  }).disableSelection().find(".cancel").click(function(){
                    $(this).parent().remove();
                  });
                }
              }
            }
            if (uploadFile.variableJSONResponse.response[0].action != "nothing"){
              eval(uploadFile.variableJSONResponse.response[0].action);
            }
            return;
          }else if (uploadFile.variableJSONResponse.response[0].status == "empty"){

            if (uploadFile.variableJSONResponse.response[0].action != "nothing"){
              eval(uploadFile.variableJSONResponse.response[0].action);
            }
            return;
          }else if (uploadFile.variableJSONResponse.response[0].status == "error"){
            maviras.msgbox(uploadFile.error[0]);
            uploadFile.console(uploadFile.variableJSONResponse.response[0].message);
            if (uploadFile.variableJSONResponse.response[0].action != "nothing"){
              eval(uploadFile.variableJSONResponse.response[0].action);
            }
            return;
          }else {
            maviras.msgbox(uploadFile.error[0]);
            return;
          }
        }
      }
    });
    uploadFile.xhrObj.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    uploadFile.xhrObj.send('imagenes='+uploadFile.options[uploadFile.currentWrapper].images); */
  },
  console:function(msg){
    if (typeof console != "undefined") {
      console.error(msg);
    } 
  },
  xhrObj: null,
  uploading: false,
  currentWrapper: 0,
  inputsWrapper: null,
  files: [],
  FileCounter: 0,
  variableJSONResponse: {},
  options: [],
  error:[
    'Error inesperado. Por favor, intente nuevamente...'
  ]
  
};










var upAudioFile = {
  njx:function(xmlhttp){
    try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }catch(e){
      try {
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
      }catch(E){
        xmlhttp = false;
      }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined'){
      xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
  },
  init:function(string){
    upAudioFile.options.push(string);
    upAudioFile.currentWrapper = upAudioFile.options.length-1;

    $('#' + string.wrapper)
    .attr("data-currentwrapper", upAudioFile.currentWrapper)
    .append('<div class="inputbutton wolmargin"> \
      <label> \
        <span class="buttonlabel">Cargar archivos</span> \
        <input type="file" name="'+string.inputName+'" data-filesquantity="0" data-maxfiles="'+string.maxFiles+'" data-excludeifblank="false" data-linked="false" data-required="exclude" data-numeric="false" style="position:absolute; left:-9999px;"> \
      </label> \
    </div> \
    <ul class="imageList"></ul>').find('.inputbutton label input').change(function(){
      var length = this.files.length,
      maxfiles = parseInt(this.getAttribute("data-maxfiles"));

      length = (length > maxfiles) ? maxfiles : length;

      for (i = 0; i < length; i++){
        upAudioFile.files.push(this.files[i]);
      }
      upAudioFile.currentWrapper = $(this).parent().parent().parent().data("currentwrapper");


      if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
        if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('audio').length){
          $("div.multiplesImagesUpload > div.inputbutton").show();
        }else{
          $("div.multiplesImagesUpload > div.inputbutton").hide();
        }
      }

      $(".multiplesImagesUpload .inputbutton label input").attr("disabled","true");
      $(".multiplesImagesUpload .inputbutton label .buttonlabel").html('En espera...');
      $(this).parent().find('span.buttonlabel').html('Cargando...');
      
      upAudioFile.readFiles();
      //upAudioFile.upload();
    });

    if (upAudioFile.options[upAudioFile.currentWrapper].showRemoteFiles == true){
      upAudioFile.showRemoteFiles(string.wrapper);
    }
  },
  readFiles: function(){
    var reader, file;
    
    for (i = 0; i < upAudioFile.files.length; i++){
      reader = new FileReader();
      file = upAudioFile.files[i];
      if (!file.type.match(/audio.*/)) {
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'Error, solo se permiten archivos de audio...',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });

        //Reestablecer botón de cargar e input file
        $(".multiplesImagesUpload .inputbutton label input").removeAttr("disabled");
        $(".multiplesImagesUpload .inputbutton label .buttonlabel").html('Cargar imágenes');
        
        //Eliminar el archivo del array de archivos (no no ser una imagen)
        var index = upAudioFile.files.indexOf(file);
        if (index > -1) {
          upAudioFile.files.splice(index, 1);
        }

        return;
      }
      reader.onload = function(d) {
        var _date = new Date(),
        li_file_id = 'upAudioFile' + _date.getTime();

        $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " .imageList").append('<li class="image" data-status="queue" data-localfilename="'+file.name+'"> \
          <audio id="'+li_file_id+'" controls="controls"> \
            <source type="'+file.type+'" /> \
          </audio> \
          <div class="feet"> \
            <input type="text" name="feet" placeholder="Escriba el título de la canción / música..."> \
            <select name="genre"> \
              <option value="0">Seleccione el género</option> \
            </select> \
          </div> \
          <div class="cancel">×</div> \
          <div class="progress"> \
            <div class="blue"></div> \
          </div> \
        </li>').sortable({
          placeholder: "ui-state-highlight",
          cancel: '.feet'
        }).disableSelection().find(".cancel").click(function(){
          var index = uploadFile.files.indexOf($(this).parent().data("localfilename")),
          _this_item = $(this);

          msgalert.showAlert({
            title: 'Confirmation!', 
            text: 'Are you sure you want to delete this item?',
            doneButtonLabel: {
              visible: true,
              label: 'OK'
            },
            cancelButtonLabel: {
              visible: true,
              label: 'Cancel'
            }
          }, function(){
            //Callback botón Done
            if (index > -1) {
              upAudioFile.files.splice(index, 1);
            }
            if (_this_item.parent().data("status") == "uploading"){
              upAudioFile.xhrObj.abort();
            }
            _this_item.parent().remove();
            if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
              if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('audio').length){
                $("div.multiplesImagesUpload > div.inputbutton").show();
              }else{
                $("div.multiplesImagesUpload > div.inputbutton").hide();
              }
            }
          }, function(){
            //Callback botón Cancel
            return false;
          });

        });

        var wQuick = setInterval(function(){
          if (document.getElementById(li_file_id)){
            clearInterval(wQuick);
            document.getElementById(li_file_id).onloadedmetadata = function() {
              this.setAttribute('data-time', this.duration);
            };

            selectbox('ul.imageList > li > div.feet > select:last-child').value(eval(upAudioFile.options[upAudioFile.currentWrapper].genresArray));

          }
        }, 10);


        upAudioFile.upload();

      };
      reader.onabort = function(e){
        upAudioFile.console('Lectura de archivo cancelada...');
      };
      reader.readAsDataURL(file);
    }
  },
  upload:function(){
    var formdata = new FormData(),
    file;
    upAudioFile.xhrObj = upAudioFile.njx(upAudioFile.xhrObj);

    var querystring = 'uploadFolder='+upAudioFile.options[upAudioFile.currentWrapper].uploadFolder;

    if (upAudioFile.files.length == 0){
      return;
    }

    file = upAudioFile.files[0];
    formdata.append('files[]', file);

    upAudioFile.xhrObj.open("POST", upAudioFile.options[upAudioFile.currentWrapper].uploadScript + '&' + querystring, true);

    upAudioFile.xhrObj.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var percent = Math.round((e.loaded / e.total) * 100);
        $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress div.blue").css("width", percent + "%");
      }
    }, false);

    upAudioFile.xhrObj.upload.addEventListener('abort', function(e) {
      upAudioFile.console('Carga de archivo cancelada...');
      upAudioFile.uploading = false;
      upAudioFile.xhrObj = null;
      $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "aborted");
      //upAudioFile.upload();
    }, false);

    upAudioFile.xhrObj.addEventListener('loadstart', function(e) {
      upAudioFile.uploading = true;
    });
    upAudioFile.xhrObj.addEventListener('load', function(e) {
      //$("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").parent().parent().find('.inputbutton label input').removeAttr("disabled");
      //$("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").parent().parent().find('.inputbutton label span.buttonlabel').html('Cargar imágenes');
      




      var index = upAudioFile.files.indexOf(file);
      if (index > -1) {
        upAudioFile.files.splice(index, 1);
      }

      if (this.readyState == 4) {
        upAudioFile.uploading = false;
        try {
          upAudioFile.variableJSONResponse = JSON.parse(upAudioFile.xhrObj.responseText);
        }catch(e){
          msgalert.showAlert({
            title: 'Atención!', 
            text: upAudioFile.error[0],
            doneButtonLabel: {
              visible: true,
              label: 'Aceptar'
            },
            cancelButtonLabel: {
              visible: false,
              label: null
            }
          }, function(){
            //Callback botón Done
          }, function(){
            //Callback botón Cancel
          });
          upAudioFile.console('Error con la llamada a "'+ upAudioFile.options[upAudioFile.currentWrapper].uploadScript +'". La respuesta no corresponde a un JSON');
          return;
        }
        
        $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress").css("display","none");
        
        if (this.status == 200) {
          //alert(upAudioFile.files.length);
          if (upAudioFile.files.length > 0){
            //upAudioFile.FileCounter++;
            upAudioFile.upload();
          }else {
            //upAudioFile.FileCounter = 0;
            upAudioFile.files.length = 0;
          }
          if (upAudioFile.variableJSONResponse.status == "ok"){



            var audio_element = $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").find('audio');

            audio_element.on('loadedmetadata', function(){
              $(".multiplesImagesUpload .inputbutton label input").removeAttr("disabled");
              $(".multiplesImagesUpload .inputbutton label .buttonlabel").html('Cargar archivos');
              $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "uploaded");
            });

            audio_element.find('source').attr("src", "tmp/music/tmp" + app.data.user + "/" + upAudioFile.variableJSONResponse.name);
            audio_element.load();

            $("#" + upAudioFile.options[upAudioFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-serverfilename", upAudioFile.variableJSONResponse.name);
            



            if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
              if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('audio').length){
                $("div.multiplesImagesUpload > div.inputbutton").show();
              }else{
                $("div.multiplesImagesUpload > div.inputbutton").hide();
              }
            }




            return;
          }else if (upAudioFile.variableJSONResponse.status == "error"){
            msgalert.showAlert({
              title: 'Atención!', 
              text: upAudioFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
          }else {
            msgalert.showAlert({
              title: 'Atención!', 
              text: upAudioFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
            return;
          }
        }
      }
    });
    upAudioFile.xhrObj.send(formdata); 
  },
  getUploadedFiles: function(_id){
    var imagesarray = [];
    //var imagesstring = "[";
    $(_id).find("ul.imageList li").each(function(){
      if ($(this).data("status") == "queue" || $(this).data("status") == "uploading"){
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'El archivo "'+ $(this).data("localfilename") +'" aún no ha terminado de cargar. Por favor, espere unos instantes...',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });
        return false;
      }



      //Formatear el tiempo de la canción
      var t = new Date(1970,0,1),
      secs = $(this).find('audio').data("time");
      t.setSeconds(secs);
      var time = t.toTimeString().substr(0,8);
      if (secs > 86399){
        time = Math.floor((t - Date.parse("1/1/70")) / 3600000) + time.substr(2);
      }

      //Formatea el tiempo actual de la canción
      var t2 = new Date(1970,0,1),
      secs2 = $(this).find("audio").get(0).currentTime;
      t2.setSeconds(secs2);
      var current_time = t2.toTimeString().substr(0,8);
      if (secs2 > 86399){
        current_time = Math.floor((t - Date.parse("1/1/70")) / 3600000) + current_time.substr(2);
      }


      imagesarray.push({ name: $(this).find(".feet input").val().replace(new RegExp('"', 'g'), '\\\"'), duration: time, start_time: current_time, music: [{ url: $(this).data("serverfilename"), type: "mp3" }], genre: $(this).find('.feet select[name="genre"]').val() });
    });
    return imagesarray;
  },
  showRemoteFiles:function(_data, wrapper){
    var _date = new Date(),
    li_file_id = 'upAudioFile' + _date.getTime();

    var html = '<li class="image" id="'+li_file_id+'" data-status="uploaded" data-serverfilename="'+_data.file.url+'" data-localfilename="'+_data.file.url+'"> \
      <audio controls="controls" data-time="'+_data.time+'"> \
        <source type="audio/'+_data.file.type+'" /> \
      </audio> \
      <div class="feet"> \
        <input type="text" name="feet" value="'+_data.name.replace(new RegExp('"', 'g'), '&quot;')+'" placeholder="Escriba el título del audio..."> \
      </div> \
      <div class="cancel">×</div> \
    </li>';

    $(wrapper).find("ul.imageList").append(html).sortable({
      placeholder: "ui-state-highlight",
      cancel: '.feet'
    }).disableSelection().find(".cancel").click(function(){
      var _this_item = $(this);

      msgalert.showAlert({
        title: 'Confirmation!', 
        text: 'Are you sure you want to delete this item?',
        doneButtonLabel: {
          visible: true,
          label: 'OK'
        },
        cancelButtonLabel: {
          visible: true,
          label: 'Cancel'
        }
      }, function(){
        _this_item.parent().remove();
        if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
          if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('audio').length){
            $("div.multiplesImagesUpload > div.inputbutton").show();
          }else{
            $("div.multiplesImagesUpload > div.inputbutton").hide();
          }
        }
      }, function(){
        //Callback botón Cancel
        return false;
      });
    }).parent().find("audio").get(0).currentTime = _data.start_time;


    var wQuick = setInterval(function(){
      if (document.getElementById(li_file_id)){
        clearInterval(wQuick);
        /*document.getElementById(li_file_id).onloadedmetadata = function() {
          this.setAttribute('data-time', this.duration);
        };*/
        $("#" + li_file_id).find('audio > source').attr("src", "../uploads/music/"+_data.file.url);
        //$("#" + li_file_id).find('audio > source').attr("src", "http://data.tuvellonera.com/data/music/"+_data.file.url);
        $("#" + li_file_id).find('audio').load();

        if (typeof $("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
          if (parseInt($("div.multiplesImagesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesImagesUpload > ul').find('audio').length){
            $("div.multiplesImagesUpload > div.inputbutton").show();
          }else{
            $("div.multiplesImagesUpload > div.inputbutton").hide();
          }
        }
      }
    }, 10);

    

  },
  console:function(msg){
    if (typeof console != "undefined") {
      console.error(msg);
    } 
  },
  xhrObj: null,
  uploading: false,
  currentWrapper: 0,
  inputsWrapper: null,
  files: [],
  FileCounter: 0,
  variableJSONResponse: {},
  options: [],
  error:[
    'Error inesperado. Por favor, intente nuevamente...'
  ]
  
};


var upFile = {
  njx:function(xmlhttp){
    try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }catch(e){
      try {
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
      }catch(E){
        xmlhttp = false;
      }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined'){
      xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
  },
  init:function(string){
    upFile.options.push(string);
    upFile.currentWrapper = upFile.options.length-1;

    $('#' + string.wrapper)
    .attr("data-currentwrapper", upFile.currentWrapper)
    .append('<div class="inputbutton wolmargin"> \
      <label> \
        <span class="buttonlabel">Cargar archivos</span> \
        <input type="file" name="'+string.inputName+'" data-filesquantity="0" data-maxfiles="'+string.maxFiles+'" data-excludeifblank="false" data-linked="false" data-required="exclude" data-numeric="false" style="position:absolute; left:-9999px;"> \
      </label> \
    </div> \
    <ul class="imageList"></ul>').find('.inputbutton label input').change(function(){
      var length = this.files.length,
      maxfiles = parseInt(this.getAttribute("data-maxfiles"));

      length = (length > maxfiles) ? maxfiles : length;

      for (i = 0; i < length; i++){
        upFile.files.push(this.files[i]);
      }
      upFile.currentWrapper = $(this).parent().parent().parent().data("currentwrapper");

      if (typeof $("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
        if (parseInt($("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesFilesUpload > ul').find('li').length){
          $("div.multiplesFilesUpload > div.inputbutton").show();
        }else{
          $("div.multiplesFilesUpload > div.inputbutton").hide();
        }
      }

      $(".multiplesFilesUpload .inputbutton label input").attr("disabled","true");
      $(".multiplesFilesUpload .inputbutton label .buttonlabel").html('En espera...');
      $(this).parent().find('span.buttonlabel').html('Cargando...');
      
      upFile.readFiles();
      //upFile.upload();
    });

    if (upFile.options[upFile.currentWrapper].showRemoteFiles == true){
      upFile.showRemoteFiles(string.wrapper);
    }
  },
  readFiles: function(){
    var reader, file, fileextension;
    
    for (i = 0; i < upFile.files.length; i++){
      reader = new FileReader();
      file = upFile.files[i],
      fileextension = file.name.split(".");
      fileextension = fileextension[fileextension.length-1];
      if (['mp3','ogg','wav','jpg','jpeg','gif','png','pdf','doc','docx','xls','xlsx','csv','txt','zip','rar','avi','mpeg','mpg','mp4','m4v','wmv','mov'].indexOf(fileextension) == -1) {
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'Error, solo se permiten archivos de audio, imágenes, vídeos, documentos Word, Excel, PDF, txt, zip y rar.',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });

        //Reestablecer botón de cargar e input file
        $(".multiplesFilesUpload .inputbutton label input").removeAttr("disabled");
        $(".multiplesFilesUpload .inputbutton label .buttonlabel").html('Cargar archivos');
        
        //Eliminar el archivo del array de archivos (no no ser una imagen)
        var index = upFile.files.indexOf(file);
        if (index > -1) {
          upFile.files.splice(index, 1);
        }

        return;
      }
      reader.onload = function(d) {
        var _date = new Date(),
        li_file_id = 'upFile' + _date.getTime();

        $("#" + upFile.options[upFile.currentWrapper].wrapper + " .imageList").append('<li class="image" data-status="queue" data-localfilename="'+file.name+'"> \
          <div id="'+li_file_id+'" class="file">'+file.name+'</div> \
          <div class="feet"> \
            <input type="text" name="feet" placeholder="Escriba la descripción del archivo..."> \
          </div> \
          <div class="cancel">×</div> \
          <div class="progress"> \
            <div class="blue"></div> \
          </div> \
        </li>').sortable({
          placeholder: "ui-state-highlight",
          cancel: '.feet'
        }).disableSelection().find(".cancel").click(function(){
          var index = uploadFile.files.indexOf($(this).parent().data("localfilename")),
          _this_item = $(this);

          msgalert.showAlert({
            title: 'Confirmation!', 
            text: 'Are you sure you want to delete this item?',
            doneButtonLabel: {
              visible: true,
              label: 'OK'
            },
            cancelButtonLabel: {
              visible: true,
              label: 'Cancel'
            }
          }, function(){
            //Callback botón Done
            if (index > -1) {
              upAudioFile.files.splice(index, 1);
            }
            if (_this_item.parent().data("status") == "uploading"){
              upAudioFile.xhrObj.abort();
            }
            _this_item.parent().remove();
            if (typeof $("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
              if (parseInt($("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesFilesUpload > ul').find('li').length){
                $("div.multiplesFilesUpload > div.inputbutton").show();
              }else{
                $("div.multiplesFilesUpload > div.inputbutton").hide();
              }
            }
          }, function(){
            //Callback botón Cancel
            return false;
          });

        });

        upFile.upload();

      };
      reader.onabort = function(e){
        upFile.console('Lectura de archivo cancelada...');
      };
      reader.readAsDataURL(file);
    }
  },
  upload:function(){
    var formdata = new FormData(),
    file;
    upFile.xhrObj = upFile.njx(upFile.xhrObj);

    var querystring = '';//'uploadFolder='+upFile.options[upFile.currentWrapper].uploadFolder;

    if (upFile.files.length == 0){
      return;
    }

    file = upFile.files[0];
    formdata.append('files[]', file);

    upFile.xhrObj.open("POST", upFile.options[upFile.currentWrapper].uploadScript + '&' + querystring, true);

    upFile.xhrObj.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var percent = Math.round((e.loaded / e.total) * 100);
        $("#" + upFile.options[upFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress div.blue").css("width", percent + "%");
      }
    }, false);

    upFile.xhrObj.upload.addEventListener('abort', function(e) {
      upFile.console('Carga de archivo cancelada...');
      upFile.uploading = false;
      upFile.xhrObj = null;
      $("#" + upFile.options[upFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "aborted");
      //upFile.upload();
    }, false);

    upFile.xhrObj.addEventListener('loadstart', function(e) {
      upFile.uploading = true;
    });
    upFile.xhrObj.addEventListener('load', function(e) {

      var index = upFile.files.indexOf(file);
      if (index > -1) {
        upFile.files.splice(index, 1);
      }

      if (this.readyState == 4) {
        upFile.uploading = false;
        try {
          upFile.variableJSONResponse = JSON.parse(upFile.xhrObj.responseText);
        }catch(e){
          msgalert.showAlert({
            title: 'Atención!', 
            text: upFile.error[0],
            doneButtonLabel: {
              visible: true,
              label: 'Aceptar'
            },
            cancelButtonLabel: {
              visible: false,
              label: null
            }
          }, function(){
            //Callback botón Done
          }, function(){
            //Callback botón Cancel
          });
          upFile.console('Error con la llamada a "'+ upFile.options[upFile.currentWrapper].uploadScript +'". La respuesta no corresponde a un JSON');
          return;
        }
        
        $("#" + upFile.options[upFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"'] div.progress").css("display","none");
        
        if (this.status == 200) {
          if (upFile.files.length > 0){
            upFile.upload();
          }else {
            upFile.files.length = 0;
          }
          if (upFile.variableJSONResponse.status == "ok"){

            $(".multiplesFilesUpload .inputbutton label input").removeAttr("disabled");
            $(".multiplesFilesUpload .inputbutton label .buttonlabel").html('Cargar archivos');

            $("#" + upFile.options[upFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-status", "uploaded");
            
            $("#" + upFile.options[upFile.currentWrapper].wrapper + " li[data-localfilename='"+file.name+"']").attr("data-serverfilename", upFile.variableJSONResponse.name);

            if (typeof $("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
              if (parseInt($("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesFilesUpload > ul > li > div.file').length){
                $("div.multiplesFilesUpload > div.inputbutton").show();
              }else{
                $("div.multiplesFilesUpload > div.inputbutton").hide();
              }
            }

            if (typeof upFile.options[upFile.currentWrapper].onuploaded === "function"){
              upFile.options[upFile.currentWrapper].onuploaded();
            }

            return;
          }else if (upFile.variableJSONResponse.status == "error"){
            msgalert.showAlert({
              title: 'Atención!', 
              text: upFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
          }else {
            msgalert.showAlert({
              title: 'Atención!', 
              text: upFile.error[0],
              doneButtonLabel: {
                visible: true,
                label: 'Aceptar'
              },
              cancelButtonLabel: {
                visible: false,
                label: null
              }
            }, function(){
              //Callback botón Done
            }, function(){
              //Callback botón Cancel
            });
            return;
          }
        }
      }
    });
    upFile.xhrObj.send(formdata); 
  },
  getUploadedFiles: function(_id){
    var imagesarray = [];
    //var imagesstring = "[";
    $(_id).find("ul.imageList li").each(function(){
      if ($(this).data("status") == "queue" || $(this).data("status") == "uploading"){
        msgalert.showAlert({
          title: 'Atención!', 
          text: 'El archivo "'+ $(this).data("localfilename") +'" aún no ha terminado de cargar. Por favor, espere unos instantes...',
          doneButtonLabel: {
            visible: true,
            label: 'Aceptar'
          },
          cancelButtonLabel: {
            visible: false,
            label: null
          }
        }, function(){
          //Callback botón Done
        }, function(){
          //Callback botón Cancel
        });
        return false;
      }

      imagesarray.push({ comment: $(this).find(".feet input").val().replace(new RegExp('"', 'g'), '\\\"'), file: $(this).data("serverfilename") });
    });
    return imagesarray;
  },
  showRemoteFiles:function(_data, wrapper, _callback){
    var _date = new Date(),
    li_file_id = 'upFile' + _date.getTime(),
    html = "";
    for (var i = 0; i < _data.length; i++){
      html += '<li class="image" data-status="uploaded" data-serverfilename="'+_data[i].file+'" data-localfilename="'+_data[i].file+'"> \
        <div class="file">'+_data[i].file+'</div> \
        <div class="feet"> \
          <input type="text" name="feet" value="'+_data[i].comment+'" placeholder="Escriba la descripción del archivo..."> \
        </div> \
        <a href="../' + app.data.filesFolder + _data[i].file+'" target="_blank" class="preview" data-icon="s"></a> \
        <div class="cancel">×</div> \
      </li>';
    }

    $(wrapper).find("ul.imageList").html(html).sortable({
      placeholder: "ui-state-highlight",
      cancel: '.feet'
    }).disableSelection().find(".cancel").click(function(){
      var _this_item = $(this);

      msgalert.showAlert({
        title: 'Confirmation!', 
        text: 'Are you sure you want to delete this item?',
        doneButtonLabel: {
          visible: true,
          label: 'OK'
        },
        cancelButtonLabel: {
          visible: true,
          label: 'Cancel'
        }
      }, function(){
        //Callback botón Done
        _this_item.parent().remove();
        if (typeof $("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
          if (parseInt($("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesFilesUpload > ul > li div.file').length){
            $("div.multiplesFilesUpload > div.inputbutton").show();
          }else{
            $("div.multiplesFilesUpload > div.inputbutton").hide();
          }
        }
      }, function(){
        //Callback botón Cancel
        return false;
      });
    });

    var wQuick = setInterval(function(){
      if ($('div.multiplesFilesUpload > ul > li > div.file').length > 0){
        clearInterval(wQuick);

        if (typeof $("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles") !== "undefined"){
          if (parseInt($("div.multiplesFilesUpload div.inputbutton label input").data("maxfiles")) > $('div.multiplesFilesUpload > ul > li > div.file').length){
            $("div.multiplesFilesUpload > div.inputbutton").show();
          }else{
            $("div.multiplesFilesUpload > div.inputbutton").hide();
          }

          if (typeof _callback === "function"){
            _callback();
          }
        }
      }
    }, 10);

  },
  console:function(msg){
    if (typeof console != "undefined") {
      console.error(msg);
    } 
  },
  xhrObj: null,
  uploading: false,
  currentWrapper: 0,
  inputsWrapper: null,
  files: [],
  FileCounter: 0,
  variableJSONResponse: {},
  options: [],
  error:[
    'Error inesperado. Por favor, intente nuevamente...'
  ]
  
};



var mangole = mangole || {};
(function(ns){
  // Leer languageIndex desde app.data.config si existe, sino usar 0 (español)
  ns.languageIndex = (typeof app !== 'undefined' && app.data && typeof app.data.config.languageIndex !== 'undefined') 
    ? app.data.config.languageIndex 
    : 0;
  
  // ============================================================================
  // COMPONENTES DE UI MOVIDOS DENTRO DEL CLOSURE PARA ACCESO A ns
  // ============================================================================
  
  window.jlistpicker = {
    opened: false,
    sel_callback: null,
    cancel_callback: null,
    sel_option: null,
    sel_radio: null,
    config: {},
    showPicker: function(_config, selected_callback, cancel_callback){
      // Detectar tema y definir colores
      const isDark = document.documentElement.classList.contains('theme-dark');
      const colors = isDark ? {
        bg: '#1a1a2e',
        bgSecondary: '#16213e',
        text: '#eaeaea',
        textSecondary: '#a0a0a0',
        border: '#2d3748',
        accent: '#667eea',
        accentSecondary: '#ccc',
        shadow: 'rgba(0,0,0,0.3)'
      } : {
        bg: '#ffffff',
        bgSecondary: '#f1f1f1',
        text: '#000000',
        textSecondary: '#555555',
        border: '#ccc',
        accent: '#22a7f0',
        accentSecondary: '#ccc',
        shadow: 'rgba(0,0,0,0.8)'
      };
      
      /*if (typeof _config === "object"){
        this.config = _config;
      }*/
      this.config = {
        title: (typeof _config.title === "undefined") ? '' : ((_config.title instanceof Array) ? _config.title[ns.languageIndex] : _config.title), 
        items: (typeof _config.items !== "object") ? [] : _config.items,
        selectedValue: (typeof _config.selectedValue === "undefined") ? '' : _config.selectedValue,
        doneButtonLabel: (typeof _config.doneButtonLabel === "undefined") ? '' : ((_config.doneButtonLabel instanceof Array) ? _config.doneButtonLabel[ns.languageIndex] : _config.doneButtonLabel),
        cancelButtonLabel: (typeof _config.cancelButtonLabel === "undefined") ? '' : ((_config.cancelButtonLabel instanceof Array) ? _config.cancelButtonLabel[ns.languageIndex] : _config.cancelButtonLabel),
        hideButtons: (typeof _config.hideButtons === "undefined") ? false : _config.hideButtons,
        hideRadioCircles: (typeof _config.hideRadioCircles === "undefined") ? false : _config.hideRadioCircles,
        hideTitle: (typeof _config.hideTitle === "undefined") ? false : _config.hideTitle,
        onRender: (typeof _config.onRender === "undefined") ? null : _config.onRender,
        closeOnSelectedItem: (typeof _config.closeOnSelectedItem === "undefined") ? true : _config.closeOnSelectedItem,
        optionsType: (typeof _config.optionsType === "undefined") ? 'radio' : _config.optionsType
      };
      if (typeof selected_callback === "function"){
        this.sel_callback = (function(){ return selected_callback; })();
      }
      if (typeof cancel_callback === "function"){
        this.cancel_callback = (function(){ return cancel_callback; })();
      }
      var displayradio = "";
      if (this.config.hideRadioCircles == true){
        displayradio = "display:none;";
      }
      var items_list = "";
      for (var i = 0; i < this.config.items.length; i++){
        if (i == 0){
          items_list += '<div class="mangole-listpicker-win-body-option" data-index="'+i+'" data-value="'+this.config.items[i].value+'" style="position:relative; width:100%; min-height:61px; float:left; padding:0 40px 0 20px;">';
        }else{ 
          items_list += '<div class="mangole-listpicker-win-body-option" data-index="'+i+'" data-value="'+this.config.items[i].value+'" style="position:relative; width:100%; min-height:61px; float:left; padding:0 40px 0 20px; border-top:1px '+colors.border+' solid;">';
        }
        var itemText = (this.config.items[i].text instanceof Array) ? this.config.items[i].text[ns.languageIndex] : this.config.items[i].text;
        items_list += '<label style="display:block; width:100%; height:100%; float:left; color:'+colors.text+';"> \
          <span class="mangole-listpicker-win-body-option-text" style="display:block; min-height: 60px; line-height:normal; padding-top:18px; padding-bottom: 18px; cursor: pointer; color:'+colors.text+';">'+itemText+'</span>';

        if (this.config.optionsType == "radio"){
          items_list += '  <div class="mangole-listpicker-win-body-option-radio" style="'+displayradio+' position:absolute; width:20px; height:20px; top:50%; right:17px; margin:-10px 0 0 0; border-radius:10px; border:1px '+colors.border+' solid; padding:3px; background:'+colors.bg+'; box-shadow:0 0 1px '+colors.border+';">';
            if (this.config.selectedValue == this.config.items[i].value){
              items_list += '<div id="mangole-listpicker-win-body-option-radio-sel" style="width:12px; height:12px; border-radius:10px; background-color:'+colors.accent+';"></div>';
            }else{
              items_list += '<div style="width:12px; height:12px; border-radius:10px; background-color:'+colors.accentSecondary+';"></div>';
            }
          items_list += '   </div>';
        }else if (this.config.optionsType == "checkbox"){
          items_list += '  <div class="mangole-listpicker-win-body-option-radio" style="'+displayradio+' position:absolute; width:20px; height:20px; top:50%; right:17px; margin:-10px 0 0 0; border:2px '+colors.border+' solid; padding:2px; background:'+colors.bg+'; box-shadow:0 0 1px '+colors.border+';">';
            if (this.config.selectedValue == this.config.items[i].value){
              items_list += '<input type="checkbox" checked="checked" style="float:left;">';//'<div id="mangole-listpicker-win-body-option-radio-sel" style="width:12px; height:12px; background-color:#22a7f0;"></div>';
            }else{
              items_list += '<input type="checkbox" style="float:left;">';//'<div style="width:12px; height:12px; background-color:#ccc;"></div>';
            }
          items_list += '   </div>';
        }

        items_list += '  </label> \
        </div>';
      }
      var maxWinHeight = (window.innerHeight - 150) + "px",
      html = '<div id="mangole-listpicker000-win" style="display:none; opacity:0; position:absolute; width:90%; max-width: 400px; height:auto; max-height:'+maxWinHeight+'; background:'+colors.bg+'; top:50%; left:50%; margin:0 0 0 -45%; border-radius:1px; box-shadow:0 2px 5px '+colors.shadow+'; overflow:hidden">';
        if (this.config.hideTitle != true){
          html += '<div style="width:100%; height:40px; float:left; font-weight:bold; line-height:40px; vertical-align:middle; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-bottom:1px '+colors.border+' solid; font-size:15px; background-color: '+colors.bgSecondary+'; color:'+colors.text+'; border-radius: 1px 1px 0 0;">'+this.config.title+'</div>';
        }
        html += '<div id="mangole-listpicker000-win-body" style="width:100%; height:auto; float:left; overflow-y:auto; line-height:60px; vertical-align:middle; font-size:17px;">'+items_list+'</div>';
        if (this.config.hideButtons != true){
          html += '<div style="width:100%; height:50px; float:left; font-weight:bold; border-top:1px '+colors.border+' solid; text-align:center; line-height:49px; vertical-align:middle; font-size:15px;">';
          if (this.config.doneButtonLabel == ""){
            html += '<div id="mangole-listpicker-win-button1" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+this.config.cancelButtonLabel+'</div>';
          }else{
            html += '<div id="mangole-listpicker-win-button1" style="width:50%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+this.config.cancelButtonLabel+'</div>';
          }
          if (this.config.cancelButtonLabel == ""){
            html += '<div id="mangole-listpicker-win-button2" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; color:'+colors.text+';">'+this.config.doneButtonLabel+'</div>';
          }else{
            html += '<div id="mangole-listpicker-win-button2" style="width:50%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; color:'+colors.text+';">'+this.config.doneButtonLabel+'</div>';
          }
          html += '</div>';
        }
      html += '</div>';
      var background = document.createElement("DIV");
      background.setAttribute("id", "mangole-listpicker000");
      background.setAttribute("style", "position:fixed; width:100%; height:100%; top:0; left:0; background: rgba(0,0,0,0.6); z-index:99999; -webkit-box-sizing: border-box; box-sizing: border-box; -webkit-user-select: none; -webkit-transition-duration: .100s; transition-duration: .100s;");
      background.innerHTML = html;
      var listpicker = document.getElementById("mangole-listpicker000");
      if (listpicker){
        try {
          listpicker.removeEventListener('click');
        }catch(e){

        }
        listpicker.parentNode.removeChild(listpicker);
      }
      document.querySelector("body").appendChild(background);
      var button1 = document.getElementById("mangole-listpicker-win-button1"),
      button2 = document.getElementById("mangole-listpicker-win-button2");
      if (button1){
        button1.addEventListener('click', function(event){
          event.stopPropagation();
          jlistpicker.removePicker();
        });
      }
      if (button2){
        button2.addEventListener('click', function(event){
          event.stopPropagation();
          jlistpicker.itemClicked();
        });
      }
      //Ocultar menu al hacer click en el fondo
      document.getElementById("mangole-listpicker000").addEventListener('click', function(event){
        event.stopPropagation();
        if (event.target.getAttribute("id") == "mangole-listpicker000"){
          jlistpicker.removePicker();
        }
      });
      var items_list_item = document.querySelectorAll("#mangole-listpicker000-win-body > div.mangole-listpicker-win-body-option");
      for (var i = 0; i < items_list_item.length; i++){
        items_list_item[i].addEventListener('click', function(event){
          event.stopPropagation();

          if (jlistpicker.config.optionsType == "radio"){
            if (jlistpicker.sel_radio !== null){
              jlistpicker.sel_radio.style.backgroundColor = "#ccc";
            }else{
              if (document.getElementById("mangole-listpicker-win-body-option-radio-sel")){
                document.getElementById("mangole-listpicker-win-body-option-radio-sel").style.backgroundColor = "#ccc";
              }
            }
            jlistpicker.sel_radio = this.getElementsByTagName("LABEL")[0].getElementsByClassName("mangole-listpicker-win-body-option-radio")[0].getElementsByTagName("DIV")[0];
            jlistpicker.sel_radio.style.backgroundColor = "#22a7f0";//"#22a7f0
          }else if (jlistpicker.config.optionsType == "checkbox"){

          }
          jlistpicker.sel_option = this;
          
          if (jlistpicker.config.hideButtons == true || jlistpicker.config.doneButtonLabel == ""){
            jlistpicker.itemClicked();
            return false;
          }
        });
      }
      var win = document.getElementById("mangole-listpicker000-win");
      if (this.config.hideTitle == true){
        var title_buttons_height = 50;
      }else{
        var title_buttons_height = 90;
      }
      if (this.config.hideButtons == true){
        title_buttons_height -= 50;
      }
      win.style.display = "block";
      win.style.marginTop = "-" + (win.offsetHeight / 2) + "px";
      //Horizontal position
      win.style.marginLeft = "-" + (win.offsetWidth / 2) + "px";
      document.getElementById("mangole-listpicker000-win-body").style.maxHeight = (win.offsetHeight - title_buttons_height) + "px";
      win.style.opacity = 1;
      var _this = this
      //Resize picker on windows resize
      window.addEventListener("resize", function(){
        if (!document.getElementById("mangole-listpicker000-win")){
          return false;
        }
        var win = document.getElementById("mangole-listpicker000-win"),
        title_buttons_height = 90;
        if (_this.config.hideButtons == true){
          title_buttons_height -= 50;
        }
        win.style.marginTop = "-" + (win.offsetHeight / 2) + "px";
        win.style.maxHeight = (window.innerHeight - 150) + "px";
        win.style.height = (window.innerHeight - 150) + "px";
        document.getElementById("mangole-listpicker000-win-body").style.maxHeight = (win.offsetHeight - title_buttons_height) + "px";
        document.getElementById("mangole-listpicker000-win-body").style.height = (win.offsetHeight - title_buttons_height) + "px";
      });
      if (typeof this.config.onRender === "function"){
        this.config.onRender();
      }
      this.opened = true;
    },
    removePicker: function(){
      this.opened = false;
      this.sel_callback = null;
      this.cancel_callback = null;
      this.sel_radio = null;
      this.sel_option = null;
      this.config = {};
      var items_list_item = document.querySelectorAll("#mangole-listpicker000-win-body > div.mangole-listpicker-win-body-option");
      for (var i = 0; i < items_list_item.length; i++){
        try {
          items_list_item[i].removeEventListener('click');
        }catch(e){

        }
      }
      var button1 = document.getElementById("mangole-listpicker-win-button1"),
      button2 = document.getElementById("mangole-listpicker-win-button2");
      var listpicker = document.getElementById("mangole-listpicker000");

      try {
        if (button1){
          button1.removeEventListener('click');
        }
        if (button2){
          button2.removeEventListener('click');
        }
        
        listpicker.removeEventListener('click');
      }catch(e){

      }
      try {
        window.removeEventListener('resize');
      }catch(e){

      }
      listpicker.parentNode.removeChild(listpicker);
    },
    itemClicked: function(el){
      if (this.sel_option == null){
        this.removePicker();
        return false;
      }

      if (jlistpicker.config.optionsType == "checkbox"){
        var items_list_item = document.querySelectorAll("#mangole-listpicker000-win-body > div.mangole-listpicker-win-body-option"),
        item = [];
        for (var i = 0; i < items_list_item.length; i++){
          if (items_list_item[i].getElementsByTagName('LABEL')[0].getElementsByClassName('mangole-listpicker-win-body-option-radio')[0].getElementsByTagName('INPUT')[0].checked == true){
            item.push({
              text: items_list_item[i].getElementsByTagName('LABEL')[0].getElementsByClassName('mangole-listpicker-win-body-option-text')[0].textContent,
              value: items_list_item[i].getAttribute("data-value"),
              index: items_list_item[i].getAttribute("data-index")
            });
          }
        }
      }else if (jlistpicker.config.optionsType == "radio"){
        var item = {
          text: (typeof el === "undefined") ? this.sel_option.getElementsByTagName('LABEL')[0].getElementsByClassName('mangole-listpicker-win-body-option-text')[0].textContent : el.getElementsByTagName('LABEL')[0].getElementsByClassName('mangole-listpicker-win-body-option-text')[0].textContent,
          value: (typeof el === "undefined") ? this.sel_option.getAttribute("data-value") : el.getAttribute("data-value"),
          index: (typeof el === "undefined") ? this.sel_option.getAttribute("data-index") : el.getAttribute("data-index")
        };
      }

      if (typeof this.sel_callback === "function"){
        this.sel_callback(item);
      }
      if (typeof this.cancel_callback === "function"){
        this.cancel_callback();
      }
      if (this.config.closeOnSelectedItem != false){
        this.removePicker();
      }
    }
  };

   window.msginput = {
    opened: false,
    sel_callback: null,
    cancel_callback: null,
    sel_option: null,
    sel_radio: null,
    show: function(config, selected_callback, cancel_callback){
      // Detectar tema y definir colores
      const isDark = document.documentElement.classList.contains('theme-dark');
      const colors = isDark ? {
        bg: '#1a1a2e',
        bgSecondary: '#16213e',
        text: '#eaeaea',
        textSecondary: '#a0a0a0',
        border: '#2d3748',
        inputBorder: '#4a5568',
        label: '#a0a0a0',
        shadow: 'rgba(0,0,0,0.3)'
      } : {
        bg: '#ffffff',
        bgSecondary: '#f1f1f1',
        text: '#000000',
        textSecondary: '#555555',
        border: '#ccc',
        inputBorder: '#9e9e9e',
        label: '#9e9e9e',
        shadow: 'rgba(0,0,0,0.8)'
      };
      
      if (typeof config !== "object"){
        var config = {
          title: '', 
          items: [
            { name: '', type: '', label: '', value: '' }
          ],
          doneButtonLabel: '',
          cancelButtonLabel: '',
          hideButtons: false,
          autoClose: true
        }
      }
      if (typeof selected_callback === "function"){
        window.msginput.sel_callback = (function(){ return selected_callback; })();
      }
      if (typeof cancel_callback === "function"){
        window.msginput.cancel_callback = (function(){ return cancel_callback; })();
      }

      var items_list = "";
      for (var i = 0; i < config.items.length; i++){
        
        if (config.items[i].type == "textarea"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<textarea style="width:100%; min-width:100%; max-width:100%; min-height: 3rem; z-index:2; color: '+colors.text+'; overflow: auto; overflow-y: hidden; padding: 1.6rem 0; resize: none; min-height: 3rem; box-sizing:content-box; transition: 0.3s; content-box; background-color: transparent; border: none; border-bottom: 1px solid '+colors.inputBorder+'; outline: none; font-size: 1rem; margin: 0 0 15px 0;" name="'+config.items[i].name+'">'+config.items[i].value+'</textarea>';
          items_list += '<label style="color: '+colors.label+'; position: absolute; z-index:1; top: 0.8rem; left: 20px; font-weight:bold; font-size: 1rem; cursor: text; -webkit-transition: 0.2s ease-out; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }else if (config.items[i].type == "number"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<input type="number" style="width:100%; height: 3rem; z-index:2; color: '+colors.text+'; transition: all .3s; box-sizing:content-box; background-color: transparent; border: none; border-bottom: 1px solid '+colors.inputBorder+'; outline: none; font-size: 1rem; margin: 0 0 15px 0;" name="'+config.items[i].name+'" value="'+config.items[i].value+'" />';
          items_list += '<label style="color: '+colors.label+'; position: absolute; z-index:1; top: 0.8rem; left: 20px; font-weight:bold; font-size: 1rem; cursor: text; -webkit-transition: 0.2s ease-out; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }else if (config.items[i].type == "text"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<input type="text" style="width:100%; height: 3rem; z-index:2; color: '+colors.text+'; transition: all .3s; box-sizing:content-box; background-color: transparent; border: none; border-bottom: 1px solid '+colors.inputBorder+'; outline: none; font-size: 1rem; margin: 0 0 15px 0;" name="'+config.items[i].name+'" value="'+config.items[i].value+'" />';
          items_list += '<label style="color: '+colors.label+'; position: absolute; z-index:1; top: 0.8rem; left: 20px; font-weight:bold; font-size: 1rem; cursor: text; -webkit-transition: 0.2s ease-out; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }else if (config.items[i].type == "email"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<input type="email" style="width:100%; height: 3rem; z-index:2; color: '+colors.text+'; transition: all .3s; box-sizing:content-box; background-color: transparent; border: none; border-bottom: 1px solid '+colors.inputBorder+'; outline: none; font-size: 1rem; margin: 0 0 15px 0;" name="'+config.items[i].name+'" value="'+config.items[i].value+'" />';
          items_list += '<label style="color: '+colors.label+'; position: absolute; z-index:1; top: 0.8rem; left: 20px; font-weight:bold; font-size: 1rem; cursor: text; -webkit-transition: 0.2s ease-out; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }else if (config.items[i].type == "password"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<input type="password" style="width:100%; height: 3rem; z-index:2; color: '+colors.text+'; transition: all .3s; box-sizing:content-box; background-color: transparent; border: none; border-bottom: 1px solid '+colors.inputBorder+'; outline: none; font-size: 1rem; margin: 0 0 15px 0;" name="'+config.items[i].name+'" value="'+config.items[i].value+'" />';
          items_list += '<label style="color: '+colors.label+'; position: absolute; z-index:1; top: 0.8rem; left: 20px; font-weight:bold; font-size: 1rem; cursor: text; -webkit-transition: 0.2s ease-out; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }else if (config.items[i].type == "label"){
          items_list += '<div class="mangole-msginput-win-body-option" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;">';
          items_list += '<span style="width:100%; height: 3rem; color: '+colors.text+'; box-sizing:content-box; background-color: transparent; font-size: 1rem; margin: 0 0 15px 0;">'+config.items[i].label+'</span>';
          items_list += '</div>';
        }else if (config.items[i].type == "select"){
          items_list += '<div class="mangole-msginput-win-body-option property-field field-floating has-value" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem; border-top: 1px solid '+colors.border+';">';
          items_list += '<select name="'+config.items[i].name+'" style="width:100%; height: 50px; padding: 16px 10px 0px 10px; border: none; border-radius: 0; font-size: 13px; background: transparent; outline: none; cursor: pointer; font-size: 1rem; color: '+colors.text+';">';
          if (config.items[i].options && Array.isArray(config.items[i].options)){
            for (var j = 0; j < config.items[i].options.length; j++){
              var selected = (config.items[i].options[j].value == config.items[i].value) ? ' selected' : '';
              items_list += '<option value="'+config.items[i].options[j].value+'"'+selected+'>'+config.items[i].options[j].label+'</option>';
            }
          }
          items_list += '</select>';
          items_list += '<label class="property-label" style="color: '+colors.label+'; position: absolute; z-index: 1; top: 4px; left: 20px; font-weight: bold; font-size: 0.8rem; cursor: text; transition: 0.2s ease-out;">'+config.items[i].label+'</label>';
          items_list += '</div>';
        }


        /*else if (config.items[i].type == "radio"){
          items_list += '  <div class="mangole-listpicker-win-body-option-radio" style="'+displayradio+' position:absolute; width:20px; height:20px; top:50%; right:17px; margin:-10px 0 0 0; border-radius:10px; border:1px #ccc solid; padding:3px; background:#fff; box-shadow:0 0 1px #f1f1f1;">';
            if (this.config.selectedValue == this.config.items[i].value){
              items_list += '<div id="mangole-listpicker-win-body-option-radio-sel" style="width:12px; height:12px; border-radius:10px; background-color:#22a7f0;"></div>';
            }else{
              items_list += '<div style="width:12px; height:12px; border-radius:10px; background-color:#ccc;"></div>';
            }
          items_list += '   </div>';
        }*/else if (config.items[i].type == "checkbox"){
          items_list += '<label class="mangole-msginput-win-body-option2" style="position:relative; width:100%; min-height:61px; float:left; padding:0 20px; margin-top:0.5rem;"> \
            <span style="display: inline-block; width:100%; padding-top: 20px; color: '+colors.text+'; box-sizing:content-box; background-color: transparent; font-size: 1rem;">'+config.items[i].label+'</span> \
            <input type="checkbox" name="'+config.items[i].name+'" value="'+config.items[i].value+'" style="position:absolute; width:20px; height:20px; top:50%; right:17px; margin:-10px 0 0 0; border:2px '+colors.border+' solid; padding:2px; background:'+colors.bg+'; box-shadow:0 0 1px '+colors.border+';"> \
          </label>';
        }
   

      }

      var maxWinHeight = (window.innerHeight - 150) + "px",
      html = '<div id="mangole-msginput000-win" style="display:none; opacity:0; position:absolute; width:90%; max-width: 400px; height:auto; max-height:'+maxWinHeight+'; background:'+colors.bg+'; top:50%; left:50%; margin:0 0 0 -45%; border-radius:1px; box-shadow:0 2px 5px '+colors.shadow+'; overflow:hidden"> \
        '+((config.title == null) ? '' : '<div style="width:100%; height:40px; float:left; font-weight:bold; line-height:40px; vertical-align:middle; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-bottom:1px '+colors.border+' solid; font-size:15px; background-color: '+colors.bgSecondary+'; color:'+colors.text+'; border-radius: 1px 1px 0 0;">'+((config.title instanceof Array) ? config.title[ns.languageIndex] : config.title)+'</div>')+' \
        <div id="mangole-msginput000-win-body" style="width:100%; height:auto; float:left; padding:10px 0 0 0; overflow-y:auto; font-size:17px;"><form id="mangole-msginput000-win-body-form" onsubmit="return false">'+items_list+'</form></div>';
        if (config.hideButtons != true){
          html += '<div style="width:100%; height:50px; float:left; font-weight:bold; border-top:1px '+colors.border+' solid; text-align:center; line-height:49px; vertical-align:middle; font-size:15px;">';
          if (config.doneButtonLabel == ""){
            html += '<div id="mangole-msginput-win-button1" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+((config.cancelButtonLabel instanceof Array) ? config.cancelButtonLabel[ns.languageIndex] : config.cancelButtonLabel)+'</div>';
          }else{
            html += '<div id="mangole-msginput-win-button1" style="width:50%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+((config.cancelButtonLabel instanceof Array) ? config.cancelButtonLabel[ns.languageIndex] : config.cancelButtonLabel)+'</div>';
          }

          if (config.cancelButtonLabel == ""){
            html += '<div id="mangole-msginput-win-button2" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; color:'+colors.text+';">'+((config.doneButtonLabel instanceof Array) ? config.doneButtonLabel[ns.languageIndex] : config.doneButtonLabel)+'</div>';
          }else{
            html += '<div id="mangole-msginput-win-button2" style="width:50%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; color:'+colors.text+';">'+((config.doneButtonLabel instanceof Array) ? config.doneButtonLabel[ns.languageIndex] : config.doneButtonLabel)+'</div>';
          }
          html += '</div>';
        }
      html += '</div>';

      var background = document.createElement("DIV");
      background.setAttribute("id", "mangole-msginput000");
      background.setAttribute("style", "position:fixed; width:100%; height:100%; top:0; left:0; background: rgba(0,0,0,0.6); z-index:99999; -webkit-box-sizing: border-box; box-sizing: border-box; -webkit-user-select: none; -webkit-transition-duration: .100s; transition-duration: .100s;;");

      background.innerHTML = html;

      document.querySelector("body").appendChild(background);

      var iscreated = window.setInterval(function(){
        if (document.getElementById('mangole-msginput000-win-body-form')){
          clearInterval(iscreated);
          if (document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > input[type="text"]').length > 0 || 
            document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > input[type="number"]').length > 0 || 
            document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > input[type="email"]').length > 0 || 
            document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > input[type="password"]').length > 0){
            document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > input')[0].focus();
          }else if (document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > textarea').length > 0){
            document.querySelectorAll('#mangole-msginput000-win-body-form > div.mangole-msginput-win-body-option > textarea')[0].focus();
          }
        }
      }, 10);

      var button1 = document.getElementById("mangole-msginput-win-button1"),
      button2 = document.getElementById("mangole-msginput-win-button2");

      if (button1){
        button1.addEventListener('click', function(e){
          e.stopPropagation();
          window.msginput.removeMsg();
        });
      }
      if (button2){
        button2.addEventListener('click', function(e){
          e.stopPropagation();
          window.msginput.proceed(config.autoClose);
        });
      }

      //Ocultar menu al hacer click en el fondo
      document.getElementById("mangole-msginput000").addEventListener('click', function(e){
        e.stopPropagation();
        if (e.target.getAttribute("id") == "mangole-msginput000"){
          window.msginput.removeMsg();
        }
      });
      
      var items_list_item = document.querySelectorAll("#mangole-msginput000-win-body div.mangole-msginput-win-body-option");
      
      for (var i = 0; i < items_list_item.length; i++){
        var inputElement = items_list_item[i].querySelector('textarea,input:not([type="checkbox"]),select');
        
        // Saltar si no hay elemento de input (ej: tipo "label")
        if (!inputElement) continue;
        
        // Auto-resize para textarea
        if (inputElement.nodeName === 'TEXTAREA') {
          var autoResize = function() {
            var textarea = this;
            var win = document.getElementById("mangole-msginput000-win");
            var winBody = document.getElementById("mangole-msginput000-win-body");
            
            // Calcular altura máxima permitida (pantalla - margen - título - botones)
            var maxWinHeight = window.innerHeight - 150;
            var titleButtonsHeight = 90;
            if (config.hideButtons == true) titleButtonsHeight -= 50;
            if (config.title == null) titleButtonsHeight -= 40;
            
            // Calcular altura máxima del textarea
            var maxTextareaHeight = maxWinHeight - titleButtonsHeight - 60; // 60px de padding/margin
            
            // Reset altura para calcular scrollHeight correctamente
            textarea.style.height = 'auto';
            
            // Aplicar nueva altura (mínimo 3rem, máximo calculado)
            var newHeight = Math.max(48, Math.min(textarea.scrollHeight, maxTextareaHeight));
            textarea.style.height = newHeight + 'px';
            
            // Forzar reflow para que el DOM se actualice
            if (win) {
              win.offsetHeight; // Force reflow
              
              // Remover max-height del winBody temporalmente para que crezca libremente
              if (winBody) {
                winBody.style.maxHeight = 'none';
              }
              
              // Forzar otro reflow después de remover max-height
              win.offsetHeight;
              
              // Ahora recalcular con las dimensiones reales
              var actualWinHeight = win.offsetHeight;
              
              // Limitar altura del modal si excede el máximo
              if (actualWinHeight > maxWinHeight) {
                if (winBody) {
                  winBody.style.maxHeight = (maxWinHeight - titleButtonsHeight) + "px";
                }
              } else {
                if (winBody) {
                  winBody.style.maxHeight = (actualWinHeight - titleButtonsHeight) + "px";
                }
              }
              
              // Reposicionar el modal verticalmente
              win.style.marginTop = "-" + (Math.min(actualWinHeight, maxWinHeight) / 2) + "px";
            }
          };
          
          inputElement.addEventListener('input', autoResize, false);
          inputElement.addEventListener('change', autoResize, false);
          
          // Aplicar auto-resize inicial si hay valor
          if (inputElement.value) {
            setTimeout(function() {
              autoResize.call(inputElement);
            }, 0);
          }
        }
        
        if (items_list_item[i].querySelector("label") !== null){
          items_list_item[i].querySelector("label").addEventListener('click', function(e){
            e.stopPropagation();
            var input = this.parentNode.querySelector('textarea,input:not([type="checkbox"]),select');
            if (input && input.nodeName !== 'SELECT'){
              this.style.fontSize = '0.8rem';
              this.style.top = '-0.7rem';
              this.style.color = '#000';
              input.style.borderBottom = "1px #000 solid";
              input.style.boxShadow = "0 1px 0 0 #000";
              input.focus();
            }
          }, true);
        }
        
        inputElement.addEventListener('focus', function(e){
          e.stopPropagation();
          var label = this.parentNode.querySelector("label");
          if (label && this.nodeName !== 'SELECT'){
            label.style.fontSize = '0.8rem';
            label.style.top = '-0.7rem';
            label.style.color = '#000';
            this.style.borderBottom = "1px #000 solid";
            this.style.boxShadow = "0 1px 0 0 #000";
          }
        }, true);
        
        inputElement.addEventListener('blur', function(e){
          e.stopPropagation();
          var label = this.parentNode.querySelector("label");
          if (label && this.nodeName !== 'SELECT'){
            if (this.value == ""){
              label.style.fontSize = '1rem';
              if (this.nodeName == "INPUT"){
                label.style.top = '0.8rem';
              }else if (this.nodeName == "TEXTAREA"){
                label.style.top = '0.8rem';
              }
            }
            label.style.color = '#9e9e9e';
            this.style.borderBottom = "1px #9e9e9e solid";
            this.style.boxShadow = "";
          }
        }, true);
      }

      var win = document.getElementById("mangole-msginput000-win");
      var title_buttons_height = 90;
      if (config.hideButtons == true){
        title_buttons_height -= 50;
      }
      if (config.title == null){
        title_buttons_height -= 40;
      }

      win.style.display = "block";
      win.style.marginTop = "-" + (win.offsetHeight / 2) + "px";
      document.getElementById("mangole-msginput000-win-body").style.maxHeight = (win.offsetHeight - title_buttons_height) + "px";
      win.style.opacity = 1;

      //Horizontal position
      win.style.marginLeft = "-" + (win.offsetWidth / 2) + "px";

      window.msginput.opened = true;
    },
    removeMsg: function(){
      window.msginput.opened = false;

      window.msginput.sel_callback = null;
      window.msginput.cancel_callback = null;
      window.msginput.sel_radio = null;
      window.msginput.sel_option = null;

      var items_list_item = document.querySelectorAll("#mangole-msginput000-win-body div.mangole-msginput-win-body-option");
      for (var i = 0; i < items_list_item.length; i++){
        
        try {
          items_list_item[i].removeEventListener('click', function(e){});
        }catch(e){

        }
      }

      var button1 = document.getElementById("mangole-msginput-win-button1"),
      button2 = document.getElementById("mangole-msginput-win-button2");

      var msginputvar = document.getElementById("mangole-msginput000");

      try {
        if (button1){
          button1.removeEventListener('click', function(e){});
        }
        if (button2){
          button2.removeEventListener('click', function(e){});
        }

        msginputvar.removeEventListener('click', function(e){});
      }catch(e){

      }

      msginputvar.parentNode.removeChild(msginputvar);
    },
    proceed: function(autoClose){
      var item = [],
      form = document.getElementById("mangole-msginput000-win-body-form");
      for (var i=0; i < form.elements.length; i++){

        item[form.elements[i].name] = {
          value: form.elements[i].value,
          type: form.elements[i].type,
          checked: form.elements[i].checked == true
        }
      }
      if (typeof window.msginput.sel_callback === "function"){
        window.msginput.sel_callback(item);
      }
      if (typeof window.msginput.cancel_callback === "function"){
        window.msginput.cancel_callback();
      }
      if (autoClose == false){ return false;}

      window.msginput.removeMsg();
    }
  };


  // Mover msgalert dentro del closure para tener acceso a ns
  window.msgalert = {
    opened: false,
    sel_callback: null,
    cancel_callback: null,
    showAlert: function(config, selected_callback, cancel_callback){
      // Detectar tema y definir colores
      const isDark = document.documentElement.classList.contains('theme-dark');
      const colors = isDark ? {
        bg: '#1a1a2e',
        bgSecondary: '#16213e',
        text: '#eaeaea',
        textSecondary: '#a0a0a0',
        border: '#2d3748',
        shadow: 'rgba(0,0,0,0.3)',
        icon: '#FF9800'
      } : {
        bg: '#ffffff',
        bgSecondary: '#f1f1f1',
        text: '#333',
        textSecondary: '#555',
        border: '#ccc',
        shadow: 'rgba(0,0,0,0.8)',
        icon: '#FF9800'
      };
      
      if (msgalert.opened == true){
        this.removeAlert();
        //return false;
      }
      if (typeof config !== "object"){
        var config = {
          title: '', 
          text: '',
          icon: false,
          doneButtonLabel: {
            visible: false,
            label: ''
          },
          cancelButtonLabel: {
            visible: false,
            label: ''
          }
        }
      }
      
      // Establecer valores por defecto para propiedades faltantes
      config.title = config.title || '';
      config.text = config.text || config.message || '';
      config.icon = (config.icon !== undefined) ? config.icon : false;
      config.doneButtonLabel = config.doneButtonLabel || {
        visible: true,
        label: 'Aceptar'
      };
      config.cancelButtonLabel = config.cancelButtonLabel || {
        visible: false,
        label: 'Cancelar'
      };
      
      if (typeof selected_callback === "function"){
        msgalert.sel_callback = (function(){ return selected_callback; })();
      }
      if (typeof cancel_callback === "function"){
        msgalert.cancel_callback = (function(){ return cancel_callback; })();
      }

      var maxWinHeight = (window.innerHeight - 150),
      html = '<div id="mangole-msgalert000-win" style="display:none; opacity:0; position:absolute; width:90%; max-width: 400px; height:auto; max-height:'+((maxWinHeight < 240) ? '240px' : maxWinHeight + 'px')+'; background:'+colors.bg+'; top:50%; left:50%; margin:0 0 0 -45%; border-radius:1px; box-shadow:0 2px 5px '+colors.shadow+'; overflow:hidden"> \
        <div style="width: 100%; float: left; font-weight: bold; overflow: hidden; padding: 20px 20px; text-overflow: ellipsis; white-space: nowrap; font-size: 20px; color: '+colors.text+';">'+((config.title instanceof Array) ? config.title[ns.languageIndex] : config.title)+'</div> \
        <div id="mangole-msgalert000-win-body" style="width:100%; height:auto; float:left; overflow-y:auto; line-height:60px; vertical-align:middle; font-size:17px;"> \
          <div class="mangole-msgalert-win-body-option" style="position: relative;  width: 100%; float: left; padding: 0px 20px 30px 20px; line-height: normal; color: '+colors.text+';"> \
            '+((config.icon != false) ? '<span style="display: inline-block; float: right; margin: 0 20px 0 10px; font-size: 70px; color: '+colors.icon+';" data-icon="$"></span>' : '')+''+((config.text instanceof Array) ? config.text[ns.languageIndex] : config.text)+' \
          </div> \
        </div>';
        
        // Solo renderizar contenedor de botones si hay al menos un botón visible
        if (config.doneButtonLabel.visible == true || config.cancelButtonLabel.visible == true){
          html += '<div style="width:100%; height:50px; float:left; cursor: pointer; font-weight:bold; border-top:1px '+colors.border+' solid; text-align:center; line-height:49px; vertical-align:middle; font-size:15px;">';
          
          if (config.doneButtonLabel.visible == true && config.cancelButtonLabel.visible == false){
            html += '<div id="mangole-msgalert-win-button2" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+((config.doneButtonLabel.label instanceof Array) ? config.doneButtonLabel.label[ns.languageIndex] : config.doneButtonLabel.label)+'</div>';
          }else if (config.doneButtonLabel.visible == true && config.cancelButtonLabel.visible == true){
            html += '<div id="mangole-msgalert-win-button1" style="width:50%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+((config.cancelButtonLabel.label instanceof Array) ? config.cancelButtonLabel.label[ns.languageIndex] : config.cancelButtonLabel.label)+'</div> \
            <div id="mangole-msgalert-win-button2" style="width:50%; height:49px; float:left; border-right:1px '+colors.border+' solid; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; color:'+colors.text+';">'+((config.doneButtonLabel.label instanceof Array) ? config.doneButtonLabel.label[ns.languageIndex] : config.doneButtonLabel.label)+'</div>';
          }else if (config.doneButtonLabel.visible == false && config.cancelButtonLabel.visible == true){
            html += '<div id="mangole-msgalert-win-button1" style="width:100%; height:49px; float:left; overflow:hidden; text-align:center; padding:0 10px; text-overflow:ellipsis; white-space: nowrap; border-right:1px '+colors.border+' solid; color:'+colors.text+';">'+((config.cancelButtonLabel.label instanceof Array) ? config.cancelButtonLabel.label[ns.languageIndex] : config.cancelButtonLabel.label)+'</div>';
          }
          
          html += '</div>';
        }
        
        html += '</div>';

      var background = document.createElement("DIV");
      background.setAttribute("id", "mangole-msgalert000");
      background.setAttribute("style", "position:fixed; width:100%; height:100%; top:0; left:0; background: rgba(0,0,0,0.6); z-index:99999; -webkit-box-sizing: border-box; box-sizing: border-box; -webkit-user-select: none; -webkit-transition-duration: .100s; transition-duration: .100s;");

      background.innerHTML = html;

      document.querySelector("body").appendChild(background);

      var button1 = document.getElementById("mangole-msgalert-win-button1"),
      button2 = document.getElementById("mangole-msgalert-win-button2");

      if (button1){
        button1.addEventListener('click', function(event){
          event.stopPropagation();
          if (typeof msgalert.cancel_callback === "function"){
            msgalert.cancel_callback();
          }
          msgalert.removeAlert();
        });
      }
      if (button2){
        button2.addEventListener('click', function(event){
          event.stopPropagation();
          if (typeof msgalert.sel_callback === "function"){
            msgalert.sel_callback();
          }
          msgalert.removeAlert();
        });
      }


      var win = document.getElementById("mangole-msgalert000-win");

      var title_buttons_height = 90;
      if (config.hideButtons == true){
        title_buttons_height -= 50;
      }

      win.style.display = "block";
      
      //Vertical position
      win.style.marginTop = "-" + (win.offsetHeight / 2) + "px";
      document.getElementById("mangole-msgalert000-win-body").style.maxHeight = (win.offsetHeight - title_buttons_height) + "px";

      //Horizontal position
      win.style.marginLeft = "-" + (win.offsetWidth / 2) + "px";
      //document.getElementById("mangole-msgalert000-win-body").style.maxHeight = (win.offsetHeight - title_buttons_height) + "px";


      win.style.opacity = 1;

      msgalert.opened = true;
    },
    removeAlert: function(){
      msgalert.opened = false;

      msgalert.sel_callback = null;
      msgalert.cancel_callback = null;

      try {
        var button1 = document.getElementById("mangole-msgalert-win-button1"),
        button2 = document.getElementById("mangole-msgalert-win-button2");

        if (button1){
          button1.removeEventListener('click');
        }
        if (button2){
          button2.removeEventListener('click');
        }

        
      }catch(e){

      }
      var msgalertid = document.getElementById("mangole-msgalert000");
      msgalertid.parentNode.removeChild(msgalertid);

      
    }
  };
  
  /**
   * Resolver ID de control: transforma ID corto a ID largo según contexto del formulario
   * @param {string} shortId - ID corto del control (ej: 'panel', 'textbox1')
   * @param {number} pageNum - Número de página (opcional, se detecta automáticamente)
   * @returns {string} ID largo del control (ej: 'formname-page0-panel')
   */
  ns.resolveControlId = function(shortId, pageNum) {
    // Validar que shortId sea una string válida
    if (!shortId || typeof shortId !== 'string') {
      return shortId;
    }
    
    // Si el ID ya contiene '#', preservarlo
    const hasHash = shortId.startsWith('#');
    const cleanId = hasHash ? shortId.substring(1) : shortId;
    
    // Obtener formulario activo
    const formKeys = Object.keys(window.forms || {});
    if (formKeys.length === 0) return shortId; // Sin formularios, retornar como está
    
    // Buscar formulario con _shortIds activo
    let formObj = null;
    for (const key of formKeys) {
      const form = window.forms[key];
      if (form && form._shortIds && form.opened) {
        formObj = form;
        break;
      }
    }
    
    // Si no hay formulario con _shortIds o no está abierto, retornar ID original
    if (!formObj || !formObj._slug) {
      return shortId;
    }
    
    // Si ya tiene el prefijo del formulario, retornar como está
    if (cleanId.startsWith(formObj._slug + '-')) {
      return shortId;
    }
    
    // Detectar página actual si no se proporciona
    if (pageNum === undefined || pageNum === null) {
      const currentPage = document.querySelector('.page-container, [data-page]');
      pageNum = currentPage ? parseInt(currentPage.dataset.page || currentPage.getAttribute('data-page')) : 0;
      if (isNaN(pageNum)) pageNum = 0;
    }
    
    // Transformar: 'panel' → 'formname-page0-panel'
    const longId = `${formObj._slug}-page${pageNum}-${cleanId}`;
    return hasHash ? `#${longId}` : longId;
  };
  
  ns.loadForm = function(parameters, callback) {
    if (!parameters || !parameters.parent || !parameters.form) {
      console.warn("loadForm: parámetros inválidos");
      return false;
    }
    // Indicar el nombre del form abierto
    ns.openedForm = parameters.form;
    // Helper para obtener objeto de formulario
    const getFormObject = () => {
      if (Array.isArray(parameters.form)) {
        return parameters.form.reduce((acc, key) => (acc ? acc[key] : undefined), window.forms);
      }
      return window.forms?.[parameters.form];
    };
    const obj = getFormObject();
    if (typeof obj !== "object") {
      console.error("loadForm: no se encontró el formulario", parameters.form);
      return false;
    }
    const finalize = () => {
      // Ejecutar forms.init() ANTES de onLoad solo para home
      // Esto permite preparar datos de compatibilidad antes de renderizar el menú
      if (parameters.form === 'home' && typeof window.forms?.init === 'function') {
        window.forms.init();
      }
      
      if (typeof obj.pages?.[parameters.page]?.onLoad === "function") {
        obj.pages[parameters.page].onLoad();
      }
      if (typeof callback === "function") {
        callback();
      }
    };
    // Si no hay que limpiar antes
    if (parameters.cleanBefore === false) {
      // Verificar si existe sistema de configuración de campos por cliente
      if (typeof fieldConfig !== 'undefined' && 
          obj.pages && 
          obj.pages[parameters.page] && 
          obj.pages[parameters.page].controls &&
          parameters.projectId) {
        
        // Sistema disponible: cargar configuraciones ANTES de renderizar
        fieldConfig.load(parameters.form, parameters.page, parameters.projectId, function(config) {
          // Aplicar configuraciones al array de controles
          const controls = obj.pages[parameters.page].controls;
          fieldConfig.applyToControls(controls, config);
          
          // Renderizar con configuraciones aplicadas
          ns.loadObjectToForm(-1, obj, parameters, finalize);
        }, function(error) {
          // Error al cargar configs: continuar sin ellas (fallback seguro)
          console.warn('fieldConfig: Error al cargar configuraciones, usando defaults');
          ns.loadObjectToForm(-1, obj, parameters, finalize);
        }, {
          customer: parameters.customer || null,
          style: parameters.style || null
        });
        
      } else {
        // Sistema NO disponible: renderizar normalmente
        ns.loadObjectToForm(-1, obj, parameters, finalize);
      }
    } else {
      this.cleanForm(parameters.parent, () => {
        // Verificar si existe sistema de configuración de campos por cliente
        if (typeof fieldConfig !== 'undefined' && 
            obj.pages && 
            obj.pages[parameters.page] && 
            obj.pages[parameters.page].controls &&
            parameters.projectId) {
          
          // Sistema disponible: cargar configuraciones ANTES de renderizar
          fieldConfig.load(parameters.form, parameters.page, parameters.projectId, function(config) {
            // Aplicar configuraciones al array de controles
            const controls = obj.pages[parameters.page].controls;
            fieldConfig.applyToControls(controls, config);
            
            // Renderizar con configuraciones aplicadas
            ns.loadObjectToForm(-1, obj, parameters, finalize);
          }, function(error) {
            // Error al cargar configs: continuar sin ellas (fallback seguro)
            console.warn('fieldConfig: Error al cargar configuraciones, usando defaults');
            ns.loadObjectToForm(-1, obj, parameters, finalize);
          }, {
            customer: parameters.customer || null,
            style: parameters.style || null
          });
          
        } else {
          // Sistema NO disponible: renderizar normalmente
          ns.loadObjectToForm(-1, obj, parameters, finalize);
        }
      });
    }
    return true;
  };
  ns.fillControl = function(_id, html, callback) {
    const element = document.querySelector(_id);
    if (!element) {
      console.error(`fillControl: El selector "${_id}" no existe en el DOM`);
      return false;
    }
    let selector;
    const controlType = element.getAttribute("data-control");
    switch (controlType) {
      case "form":
        selector = document.querySelector(ns.form(_id).selector);
        break;
      case "panel":
        selector = document.querySelector(ns.panel(_id).selector);
        break;
      case "splitcontainer":
        selector = element;
        break;
      default:
        selector = element;
        break;
    }
    if (typeof callback === "function") {
      callback(html, selector);
    }
    return selector; // <-- útil si quieres manipularlo sin callback
  };
  ns.cleanForm = function(parent, callback) {
    const elements = document.querySelectorAll(parent);
    if (!elements.length) {
      console.warn(`cleanForm: no se encontraron elementos con selector "${parent}"`);
      if (typeof callback === "function") callback();
      return false;
    }
    elements.forEach(el => {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    });
    if (typeof callback === "function") {
      callback();
    }
    return true;
  };

  ns.loadObjectToForm = function(i, obj, parameters, callback) {
    // Normalizar parámetros
    parameters.page = parameters.page || 0;
    const page = obj.pages[parameters.page];
    const controls = page ? page.controls : [];
    // Control de índice para la recursión
    const x = i + 1;
    if (x >= controls.length) {
      if (typeof callback === "function") callback();
      return false;
    }
    // Obtener control actual
    const ctrl = controls[x];
    ctrl.parent = ctrl.parent || parameters.parent;
    const controlType = ctrl.controlType;
    // Función para verificar acceso de forma concisa
    const hasAccess = () => {
      //if (!app || !app.data) {
      //  return true;
      //}
      // Verificar acceso por módulos
      if (ctrl.modulesaccess && app.data.modulesaccess) {
        return app.data.modulesaccess[ctrl.modulesaccess]?.show === 1;
      }
      // Verificar acceso por nivel de usuario
      //if (ctrl.access && app.data.level) {
      //  return ctrl.access.includes(app.data.level);
      //}
      // Por defecto permitir acceso si no hay configuración específica
      return !ctrl.modulesaccess;// && !ctrl.access;
    };
    // Función para continuar con el siguiente control
    const nextControl = () => ns.loadObjectToForm(x, obj, parameters, callback);
    // Si no tiene acceso, continuar con el siguiente
    if (!hasAccess()) {
      nextControl();
      return;
    }
    // Mapa de factories para eliminar redundancia
    const controlFactories = {
      chart: () => ns.chartgraph().create({
        parent: ctrl.parent,
        dataFrom: ctrl
      }, nextControl),
      panel: () => ns.panel().create({
        parent: ctrl.parent,
        dataFrom: ctrl
      }, nextControl),
      form: () => {
        const formElement = document.getElementById(ctrl.id);
        if (formElement) {
          ns.form('#' + ctrl.id).close(() => {
            ns.form().create(ctrl, nextControl);
          });
        } else {
          ns.form().create(ctrl, nextControl);
        }
      },
      // Controles que necesitan parámetros estándar
      structuredlayout: () => ns.structuredlayout().create(getStandardParams(), nextControl),
      blankwrapper: () => ns.blankwrapper().create(getStandardParams(), nextControl),
      jspaint: () => ns.jspaint().create(getStandardParams(), nextControl),
      contenteditable: () => ns.contenteditable().create(getStandardParams(), nextControl),
      droppableform: () => ns.droppableform().create(getStandardParams(), nextControl),
      blankdialog: () => ns.blankdialog().create(getStandardParams(), nextControl),
      label: () => ns.label().create(getStandardParams(), nextControl),
      link: () => ns.link().create(getStandardParams(), nextControl),
      button: () => ns.button().create(getStandardParams(), nextControl),
      blankbutton: () => ns.blankbutton().create(getStandardParams(), nextControl),
      togglebutton: () => ns.togglebutton().create(getStandardParams(), nextControl),
      tabs: () => ns.tabs().create(getStandardParams(), nextControl),
      tabmenu: () => ns.tabmenu().create(getStandardParams(), nextControl),
      inputfile: () => ns.inputfile().create(getStandardParams(), nextControl),
      orderedlist: () => ns.orderedlist().create(getStandardParams(), nextControl),
      audiofileuploader: () => ns.audiofileuploader().create(getStandardParams(), nextControl),
      fileuploader: () => ns.fileuploader().create(getStandardParams(), nextControl),
      selectbox: () => ns.selectbox().create(getStandardParams(), nextControl),
      textarea: () => ns.textarea().create(getStandardParams(), nextControl),
      datepicker: () => ns.datepicker().create(getStandardParams(), nextControl),
      // Controles con dataFormRoot para datagrids
      datagrid: () => ns.datagrid().create(getDatagridParams(), nextControl),
      datagridv3: () => ns.datagridv3().create(getDatagridParams(), nextControl),
      // Controles que necesitan instanciación
      textbox: () => new ns.textbox().create(getStandardParams(), nextControl),
      checkbox: () => new ns.checkbox().create(getStandardParams(), nextControl),
      sidebarmenu: () => new ns.sidebarmenu().create(getStandardParams(), nextControl),
      // Controles con parámetros especiales
      splitcontainer: () => ns.splitcontainer().create({
        parent: ctrl.parent,
        dataFrom: ctrl
      }, nextControl),
      panelrotator: () => ns.panelrotator().create({
        parent: ctrl.parent,
        dataFrom: ctrl
      }, nextControl)
    };
    // Funciones helper para parámetros
    function getStandardParams() {
      return {
        parent: ctrl.parent,
        form: parameters.form,
        page: parameters.page,
        control: x,
        dataFrom: ctrl
      };
    }
    function getDatagridParams() {
      return {
        parent: ctrl.parent,
        form: parameters.form,
        page: parameters.page,
        control: x,
        dataFrom: ctrl,
        dataFormRoot: [parameters.page, x]
      };
    }
    // Ejecutar factory o continuar si no existe
    const factory = controlFactories[controlType];
    if (factory) {
      factory();
    } else {
      nextControl();
    }
  };

  window.chartgraph = ns.chartgraph = function(_id) {
    // Helpers para simplificar el código
    const getElement = (elementId) => document.getElementById(elementId);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const createChartElement = (params) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-chart-canvas');
      html.setAttribute('data-control', 'chart');
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      return html;
    };
    const waitForElement = (elementId, callback) => {
      const interval = setInterval(() => {
        if (getElement(elementId)) {
          clearInterval(interval);
          callback();
        }
      }, 10);
    };
    const createChart = (params) => {
      const chartFactories = {
        PieChart: () => {
          const data = new google.visualization.arrayToDataTable(params.data);
          const chart = new google.visualization.PieChart(getElement(params.id));
          chart.draw(data, params.options);
        },
        LineChart: () => {
          const data = new google.visualization.arrayToDataTable(params.data);
          const chart = new google.visualization.LineChart(getElement(params.id));
          chart.draw(data, params.options);
        },
        BarCharts: () => {
          const data = new google.visualization.arrayToDataTable(params.data);
          const chart = new google.charts.Bar(getElement(params.id));
          chart.draw(data, params.options);
        },
        Bar: () => {
          // Implementación pendiente para tipo Bar
          console.warn('Tipo de gráfico "Bar" aún no implementado');
        }
      };
      const factory = chartFactories[params.type];
      if (factory) {
        google.charts.setOnLoadCallback(factory);
      }
    };
    return {
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || 'canvas0';
        params.parent = params.parent || '';
        // Validar ID único
        if (getElement(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento HTML
        const html = createChartElement(params);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
            waitForElement(params.id, () => createChart(params));
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };
  window.panelrotator = ns.panelrotator = function(_id) {
    // Helpers para simplificar el código
    const getElement = (selector) => document.querySelector(selector);
    const getAllElements = (selector) => document.querySelectorAll(selector);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const hasClass = (element, className) => {
      if (!element) {
        return false;
      }
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (!element) {
        return;
      }
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (!element) {
        return;
      }
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const toggleClass = (element, className) => {
      if (hasClass(element, className)) {
        removeClass(element, className);
      } else {
        addClass(element, className);
      }
    };
    const createPanelElement = (panelData, index) => {
      const panel = document.createElement('DIV');
      const baseClass = 'mangole-panel-rotator';
      const panelClass = `${baseClass}${index === 0 ? ` ${baseClass}-active` : ''} panel${index}`;
      panel.setAttribute('class', panelClass);
      if (panelData.css) {
        panel.setAttribute('style', panelData.css);
      }
      panel.innerHTML = panelData.content;
      return panel;
    };
    return {
      panel: function(n) {
        const selector = `${_id} > div.mangole-panel-rotator.panel${n}`;
        const activeSelector = `${_id} > div.mangole-panel-rotator.mangole-panel-rotator-active.panel${n}`;
        return {
          selector,
          isActive: !!getElement(activeSelector),
          fill: function(html, callback) {
            try {
              const element = getElement(selector);
              if (element) {
                element.innerHTML = html;
              }
              executeCallback(callback);
            } catch(e) {
              console.error(e.message);
            }
          }
        };
      },
      show: function(_tab, callback) {
        const element = getElement(`${_id} > div.mangole-panel-rotator.panel${_tab}`);
        if (element && !hasClass(element, 'mangole-panel-rotator-active')) {
          addClass(element, 'mangole-panel-rotator-active');
        }
        executeCallback(callback);
      },
      hide: function(_tab, callback) {
        const element = getElement(`${_id} > div.mangole-panel-rotator.panel${_tab}`);
        if (element && hasClass(element, 'mangole-panel-rotator-active')) {
          removeClass(element, 'mangole-panel-rotator-active');
        }
        executeCallback(callback);
      },
      rotate: function(callback) {
        try {
          const panels = getAllElements(`${_id} > div.mangole-panel-rotator`);
          const [div1, div2] = panels;
          if (div1 && div2) {
            toggleClass(div1, 'mangole-panel-rotator-active');
            toggleClass(div2, 'mangole-panel-rotator-active');
          }
          executeCallback(callback);
        } catch(e) {
          console.error(e.message);
        }
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || 'panel' + Date.now();
        params.parent = params.parent || '';
        params.content = params.content || '';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento wrapper
        const html = document.createElement('DIV');
        html.setAttribute('id', params.id);
        html.setAttribute('class', 'mangole-panel-rotator-wrapper');
        html.setAttribute('data-control', 'panelrotator');
        if (params.css) {
          html.setAttribute('style', params.css);
        }
        // Crear paneles
        if (params.panels && Array.isArray(params.panels)) {
          params.panels.forEach((panelData, index) => {
            const panel = createPanelElement(panelData, index);
            html.appendChild(panel);
          });
        }
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.splitcontainer = ns.splitcontainer = function(_id) {
    // Helpers para simplificar el código
    const getElement = (selector) => {
      return (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(selector);
    };
    const getCellElement = (rowNum, cellNum) => {
      return document.querySelector(`${_id} > div.row${rowNum} > div.cell${cellNum}`);
    };
    const executeCallback = (callback, ...args) => {
      if (typeof callback === 'function') {
        callback(...args);
      }
    };
    const hasClass = (element, className) => {
      if (!element) {
        return false;
      }
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property 'addClass' of '${_id}' because is null`);
        return false;
      }
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property 'removeClass' of '${_id}' because is null`);
        return false;
      }
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const createRowElement = (rowData, rowIndex) => {
      const row = document.createElement('DIV');
      const rowClass = `mangole-split-container-row row${rowIndex}${rowData.class ? ` ${rowData.class}` : ''}`;
      row.setAttribute('class', rowClass);
      if (rowData.css) {
        row.setAttribute('style', rowData.css);
      }
      return row;
    };
    const createCellElement = (cellData, cellIndex, rowData, isDesignMode) => {
      const cell = document.createElement('DIV');
      const cellClass = `mangole-split-container-cell cell${cellIndex}${cellData.class ? ` ${cellData.class}` : ''}`;
      cell.setAttribute('class', cellClass);
      if (isDesignMode) {
        cell.setAttribute('data-role', 'droppable');
      }
      if (cellData.css) {
        cell.setAttribute('style', cellData.css);
      }
      cell.innerHTML = cellData.content;
      return cell;
    };
    return {
      hide: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'block';
        }
        executeCallback(callback);
      },
      addClass: function(_className) {
        const element = getElement(_id);
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = getElement(_id);
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = getElement(_id);
        return hasClass(element, _className);
      },
      row: function(_rown) {
        return {
          cell: function(_celln) {
            const selector = `${_id} > div.row${_rown} > div.cell${_celln}`;
            return {
              sel: function(callback) {
                const element = getCellElement(_rown, _celln);
                if (!element) {
                  console.log(`Uncaught TypeError: Cannot read property 'sel' of '${selector}' because is null`);
                } else {
                  if (typeof callback === 'function') {
                    callback(element);
                  } else {
                    return element;
                  }
                }
              },
              selector: `#${_id} > div.row${_rown} > div.cell${_celln}`,
              fill: function(_html, callback) {
                const element = getCellElement(_rown, _celln);
                if (!element) {
                  console.log(`Uncaught TypeError: Cannot read property 'fill' of '${selector}' because is null`);
                } else {
                  element.innerHTML = _html;
                  executeCallback(callback);
                }
              },
              html: function(_html, callback) {
                const element = getCellElement(_rown, _celln);
                if (!element) {
                  console.log(`Uncaught TypeError: Cannot read property 'html' of '${selector}' because is null`);
                } else {
                  element.innerHTML = _html;
                  executeCallback(callback);
                }
              }
            };
          }
        };
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || `panel${Date.now()}`;
        params.parent = params.parent || '';
        params.content = params.content || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento contenedor
        const html = document.createElement('DIV');
        html.setAttribute('id', params.id);
        const containerClass = `mangole-split-container${params.class ? ` ${params.class}` : ''}`;
        html.setAttribute('class', containerClass);
        html.setAttribute('data-control', 'splitcontainer');
        if (params.css) {
          html.setAttribute('style', params.css);
        }
        if (isDesignMode) {
          html.setAttribute('data-role', 'draggable');
        }
        // Crear filas y celdas
        if (params.rows && Array.isArray(params.rows)) {
          params.rows.forEach((rowData, rowIndex) => {
            const row = createRowElement(rowData, rowIndex);
            if (rowData.cell && Array.isArray(rowData.cell)) {
              rowData.cell.forEach((cellData, cellIndex) => {
                const cell = createCellElement(cellData, cellIndex, rowData, isDesignMode);
                row.appendChild(cell);
              });
            }
            html.appendChild(row);
          });
        }
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };



  window.sidebarmenu = ns.sidebarmenu = function(_id){
    // Si se pasa un _id, buscar la instancia existente en el storage
    if (_id) {
      // Remover # si existe
      var cleanId = _id.replace('#', '');
      
      // Buscar en el storage global de controles
      if (window._mangoleControls && window._mangoleControls[cleanId]) {
        return window._mangoleControls[cleanId];
      }
    }
    
    return {
      create: function(parameters,callback){
        if (typeof parameters === "undefined"){
          var parameters = {};
        }
        
        if (typeof parameters.form !== "undefined"){
          var ro_form = "";
            if (parameters.form instanceof Array){
              for (var i = 0; i < parameters.form.length; i++){
                ro_form += "['" + parameters.form[i] + "']";
              }
            }else{
              ro_form = "['" + parameters.form + "']";
            }
        }else{
          var ro_form = null;
        }
        if (typeof parameters.page !== "undefined"){
          var ro_page = parameters.page;
        }else{
          var ro_page = null;
        }
        if (typeof parameters.control !== "undefined"){
          var ro_control = parameters.control;
        }else{
          var ro_control = null;
        }

        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object"){
          var parameters = parameters.dataFrom;
        }

        parameters.id = (typeof parameters.id === "undefined") ? id = id.panel() : id = parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined" || parameters.parent == null) ? "" : parameters.parent;

        if (document.getElementById(parameters.id)){
          console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
        }

        var html = document.createElement("UL");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-sidebar-menu");
        html.setAttribute("data-control", "sidebarmenu");

        if (typeof parameters.css !== "undefined" && parameters.css != null){
          html.setAttribute("style", parameters.css);
        }

        if (typeof parameters.devmode !== "undefined" && parameters.devmode == "design"){
          html.setAttribute("data-role", "draggable");
        }

        var label,icon,li_parent,li_child,options,icon_child,label_child;
        if (typeof parameters.title !== "undefined" && parameters.title != null && parameters.title.label != null && parameters.title.label !== ""){
          var title = document.createElement("LI");
          title.setAttribute("class", "mangole-sidebar-menu-title");
          if (typeof parameters.title.css !== "undefined" && parameters.title.css != null && typeof parameters.title.css.parent !== "undefined" && parameters.title.css.parent != null){
            title.setAttribute("style", parameters.title.css.parent);
          }

          icon = document.createElement("SPAN");
          icon.setAttribute("class", "mangole-sidebar-menu-icon");
          if (parameters.title.icon.image != null){
            icon.innerHTML = '<img src="' + parameters.title.icon.image + '" />';
          }else{
            if (parameters.title.icon.font != null){
              icon.setAttribute("data-icon", parameters.title.icon.font);
            }
          }
          // Aplicar icon.css (CSS del icono) + css.icon (CSS del span)
          var iconStyles = '';
          if (typeof parameters.title.icon.css !== "undefined" && parameters.title.icon.css != null){
            iconStyles += parameters.title.icon.css;
          }
          if (typeof parameters.title.css !== "undefined" && parameters.title.css != null && typeof parameters.title.css.icon !== "undefined" && parameters.title.css.icon != null){
            iconStyles += (iconStyles ? '; ' : '') + parameters.title.css.icon;
          }
          if (iconStyles){
            icon.setAttribute("style", iconStyles);
          }
          title.appendChild(icon);

          label = document.createElement("SPAN");
          label.setAttribute("class", "mangole-sidebar-menu-label");
          label.innerHTML = ((parameters.title.label instanceof Array) ? parameters.title.label[ns.languageIndex] : parameters.title.label);

          if (typeof parameters.title.css !== "undefined" && parameters.title.css != null && typeof parameters.title.css.label !== "undefined" && parameters.title.css.label != null){
            label.setAttribute("style", parameters.title.css.label);
          }
          title.appendChild(label);

          html.appendChild(title);
        }

        for (var i = 0; i < parameters.options.length; i++){
          // Renderizar opción (las validaciones de permisos ya se hicieron en _generateOptionsFromDataSource)
          li_parent = document.createElement("LI");
          
          // Agregar atributo data-order para ordenamiento posterior
          if (typeof parameters.options[i].order !== "undefined" && parameters.options[i].order !== null){
            li_parent.setAttribute("data-order", parameters.options[i].order);
          } else {
            li_parent.setAttribute("data-order", "999"); // Por defecto al final
          }
          
          if (typeof parameters.options[i].css !== "undefined" && parameters.options[i].css != null && typeof parameters.options[i].css.parent !== "undefined" && parameters.options[i].css.parent != null){
            li_parent.setAttribute("style", parameters.options[i].css.parent);
          }

          if (typeof parameters.options[i].function === "function" && ro_page != null && ro_control != null){
            li_parent.setAttribute("onclick", 'window[\'forms\']'+ro_form+'.pages['+ro_page+'].controls['+ro_control+'].options['+i+'].function(this)');
          }

          icon = document.createElement("SPAN");
          icon.setAttribute("class", "mangole-sidebar-menu-icon");
          if (parameters.options[i].icon.image != null){
            icon.innerHTML = '<img src="' + parameters.options[i].icon.image + '" />';
          }else{
            if (parameters.options[i].icon.font != null){
              icon.setAttribute("data-icon", parameters.options[i].icon.font);
            }
          }
          // Aplicar icon.css (CSS del icono) + css.icon (CSS del span)
          var iconStyles = '';
          if (typeof parameters.options[i].icon.css !== "undefined" && parameters.options[i].icon.css != null){
            iconStyles += parameters.options[i].icon.css;
          }
          if (typeof parameters.options[i].css !== "undefined" && parameters.options[i].css != null && typeof parameters.options[i].css.icon !== "undefined" && parameters.options[i].css.icon != null){
            iconStyles += (iconStyles ? '; ' : '') + parameters.options[i].css.icon;
          }
          if (iconStyles){
            icon.setAttribute("style", iconStyles);
          }
          li_parent.appendChild(icon);

          label = document.createElement("SPAN");
          label.setAttribute("class", "mangole-sidebar-menu-label");
          label.innerHTML = ((parameters.options[i].label instanceof Array) ? parameters.options[i].label[ns.languageIndex] : parameters.options[i].label);
          if (typeof parameters.options[i].css !== "undefined" && parameters.options[i].css != null && typeof parameters.options[i].css.label !== "undefined" && parameters.options[i].css.label != null){
            label.setAttribute("style", parameters.options[i].css.label);
          }
          li_parent.appendChild(label);

          if (parameters.options[i].options != null && parameters.options[i].options.length > 0){
            options = document.createElement("UL");
            options.setAttribute("class", "mangole-sidebar-menu-li-options");
            for (var x = 0; x < parameters.options[i].options.length; x++){
              li_child = document.createElement("LI");
              
              if (typeof parameters.options[i].options[x].css !== "undefined" && parameters.options[i].options[x].css != null && typeof parameters.options[i].options[x].css.parent !== "undefined" && parameters.options[i].options[x].css.parent != null){
                li_child.setAttribute("style", parameters.options[i].options[x].css.parent);
              }

              if (typeof parameters.options[i].options[x].function === "function" && ro_page != null && ro_control != null){
                li_child.setAttribute("onclick", 'window[\'forms\']'+ro_form+'.pages['+ro_page+'].controls['+ro_control+'].options['+i+'].options['+x+'].function(this)');
              }

              if (parameters.options[i].options[x].icon.image != null || parameters.options[i].options[x].icon.font != null){
                icon_child = document.createElement("SPAN");
                icon_child.setAttribute("class", "mangole-sidebar-menu-icon");
                if (parameters.options[i].options[x].icon.image != null){
                  icon_child.innerHTML = '<img src="' + parameters.options[i].options[x].icon.image + '" />';
                }else{
                  if (parameters.options[i].options[x].icon.font != null){
                    icon_child.setAttribute("data-icon", parameters.options[i].options[x].icon.font);
                  }
                }
                // Aplicar icon.css (CSS del icono) + css.icon (CSS del span)
                var iconChildStyles = '';
                if (typeof parameters.options[i].options[x].icon.css !== "undefined" && parameters.options[i].options[x].icon.css != null){
                  iconChildStyles += parameters.options[i].options[x].icon.css;
                }
                if (typeof parameters.options[i].options[x].css !== "undefined" && parameters.options[i].options[x].css != null && typeof parameters.options[i].options[x].css.icon !== "undefined" && parameters.options[i].options[x].css.icon != null){
                  iconChildStyles += (iconChildStyles ? '; ' : '') + parameters.options[i].options[x].css.icon;
                }
                if (iconChildStyles){
                  icon_child.setAttribute("style", iconChildStyles);
                }
                li_child.appendChild(icon_child);
              }

              label_child = document.createElement("SPAN");
              label_child.setAttribute("class", "mangole-sidebar-menu-label");
              if (typeof parameters.options[i].options[x].css !== "undefined" && parameters.options[i].options[x].css != null && typeof parameters.options[i].options[x].css.label !== "undefined" && parameters.options[i].options[x].css.label != null){
                label_child.setAttribute("style", parameters.options[i].options[x].css.label);
              }
              label_child.innerHTML = ((parameters.options[i].options[x].label instanceof Array) ? parameters.options[i].options[x].label[ns.languageIndex] : parameters.options[i].options[x].label);
              li_child.appendChild(label_child);

              options.appendChild(li_child);
            }
            li_parent.appendChild(options);
          }

          if (typeof li_parent !== "undefined"){
            html.appendChild(li_parent);
          }
          
        }

        if (typeof parameters.parent !== "undefined" && parameters.parent != "" && parameters.parent != null){
          ns.fillControl(parameters.parent, html, function(html, selector){
            selector.appendChild(html);

            var sidebar_li_options = document.querySelectorAll('#' + parameters.id + ' li ul.mangole-sidebar-menu-li-options');
            var sidebar_li = document.querySelectorAll('#' + parameters.id + ' li');
            for (var i = 0; i < sidebar_li_options.length; i++){
              sidebar_li_options[i].style.display = "none";
            }

            var hasClass = false;
            for (var i = 0; i < sidebar_li.length; i++){
              sidebar_li[i].addEventListener('click', function(event){

                if (!this.getElementsByClassName('mangole-sidebar-menu-li-options')[0]){
                  return false;
                }

                if (this.classList){
                  hasClass = this.classList.contains('mangole-li-active');
                }else{
                  hasClass = new RegExp('(^| )' + 'mangole-li-active' + '( |$)', 'gi').test(this.className);
                }
                if (hasClass){
                  return false;
                }

                sidebar_liq = document.querySelectorAll('#' + parameters.id + ' li.mangole-li-active');
                if (sidebar_liq[0]){
                  if (sidebar_liq[0].classList){
                    sidebar_liq[0].classList.remove('mangole-li-active');
                  }else{
                    sidebar_liq[0].className = sidebar_liq[0].className.replace(new RegExp('(^|\\b)' + 'mangole-li-active'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                  }
                }

                sidebar_li_options = document.querySelectorAll('#' + parameters.id + ' li ul.mangole-sidebar-menu-li-options.mangole-options-active');
                if (sidebar_li_options[0]){
                  if (sidebar_li_options[0].classList){
                    sidebar_li_options[0].classList.remove('mangole-options-active');
                  }else{
                    sidebar_li_options[0].className = sidebar_li_options[0].className.replace(new RegExp('(^|\\b)' + 'mangole-options-active'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                  }
                  sidebar_li_options[0].style.display = "none";
                }

                sidebar_li_options = this.getElementsByClassName('mangole-sidebar-menu-li-options')[0];
                if (sidebar_li_options){
                  if (sidebar_li_options.classList){
                    sidebar_li_options.classList.add('mangole-options-active');
                  }else{
                    sidebar_li_options.className += ' ' + 'mangole-options-active';
                  }
                  sidebar_li_options.style.display = "block";
                }

                if (this.classList){
                  this.classList.add('mangole-li-active');
                }else{
                  this.className += ' ' + 'mangole-li-active';
                }
                
              }, false);
            }
          });

          

        }else if (parameters.parent == ""){
          return html;
        }

        if (callback && typeof(callback) === "function"){
          callback();
        }
        
        // Crear objeto de instancia para retornar
        const instance = {
          config: parameters,
          _ro_form: ro_form,
          _ro_page: ro_page,
          _ro_control: ro_control,
          _generateOptionsFromDataSource: this._generateOptionsFromDataSource,
          _createParentFunction: this._createParentFunction,
          _createLeafFunction: this._createLeafFunction,
          openSubmenu: this.openSubmenu,
          _getChildrenFromDataSource: this._getChildrenFromDataSource,
          openSidebarmenu: this.openSidebarmenu,
          closeSidebarmenu: this.closeSidebarmenu,
          populate: this.populate
        };
        
        // Guardar instancia en storage global
        if (!window._mangoleControls) {
          window._mangoleControls = {};
        }
        window._mangoleControls[parameters.id] = instance;
        
        return instance;
      },
      
      // ============================================================================
      // MÉTODO PRIVADO: Generar options desde dataSource
      // ============================================================================
      _generateOptionsFromDataSource: function(config, ro_form, ro_page, ro_control){
        let data = config.data;

        // Si data está vacío, intentar obtener de app.data.modulesaccess
        if (!data || Object.keys(data).length === 0) {
          if (typeof app !== 'undefined' && app.data && app.data.modulesaccess) {
            data = app.data.modulesaccess;
          } else {
            return [];
          }
        }
        
        const mapping = config.mapping || {};
        const filters = config.filters || {};
        const options = [];
        
        // Mapeo por defecto
        const keyLabel = mapping.label || 'menu_label';
        const keyIcon = mapping.icon || 'icon';
        const keyOrder = mapping.order || 'order';
        const keyFunction = mapping.onclick || 'function_name';
        const keyType = mapping.type || 'type';
        const keyParent = mapping.parent || 'parent_code';
        const keyPermissions = mapping.permissions || 'permissions';
        
        // Convertir objeto a array y filtrar
        const items = [];
        
        Object.keys(data).forEach(key => {
          const item = data[key];
          
          // Aplicar filtros de tipo
          if (filters.type && !filters.type.includes(item[keyType])) {
            return;
          }
          
          // Filtro de permisos: solo mostrar si read === true
          if (item[keyPermissions] && item[keyPermissions].read !== true) {
            return;
          }
          
          items.push({
            key: key,
            ...item
          });
        });
        
        // Ordenar por campo order
        items.sort((a, b) => (a[keyOrder] || 0) - (b[keyOrder] || 0));
        
        // Generar estructura de options
        items.forEach((item, index) => {
          const hasChildren = item.has_children === true || item.has_children === 1;
          
          options.push({
            label: item[keyLabel] || item.key,
            icon: {
              font: item[keyIcon] || null,
              image: null,
              css: null
            },
            css: {
              parent: null,
              label: null,
              icon: null
            },
            order: item[keyOrder] !== undefined ? item[keyOrder] : 999,
            function: hasChildren ? 
              this._createParentFunction(item.key, item[keyFunction], config, ro_form, ro_page, ro_control, index) :
              this._createLeafFunction(item[keyFunction], ro_form, ro_page, ro_control, index),
            options: [] // Los hijos se cargarán dinámicamente con openSubmenu
          });
        });
        
        return options;
      },
      
      // ============================================================================
      // MÉTODO PRIVADO: Crear función para padre con hijos
      // ============================================================================
      _createParentFunction: function(parentKey, functionName, dataSourceConfig, ro_form, ro_page, ro_control, optionIndex){  
        // ✅ SOLUCIÓN: Capturar valores en el scope de la closure con const
        const _ro_form = ro_form;
        const _ro_page = ro_page;
        const _ro_control = ro_control;
        const _parentKey = parentKey;
        const _functionName = functionName;
        const _dataSourceConfig = dataSourceConfig;
        
        return function(_this){
          // Ejecutar función onclick del padre si existe Y es una función válida
          if (_functionName && _functionName.trim() !== '') {
            try {
              if (typeof eval(_functionName) === 'function') {
                eval(_functionName + '()');
              }
            } catch(e) {
              // Silencioso: si la función no existe, continuar sin error
            }
          }
          
          // Aplicar estilo de selección (reemplazar jQuery con nativo)
          const parentUL = _this.closest('ul[data-control="sidebarmenu"]');
          if (parentUL) {
            const allLinks = parentUL.querySelectorAll('li a');
            allLinks.forEach(link => link.style.background = '');
          }
          _this.style.background = 'url(img/leftmenuarrow.png) no-repeat right center';
          
          // Abrir submenú con hijos
          if (_ro_form && _ro_page !== null && _ro_control !== null) {
            const menuId = _this.closest('[data-control="sidebarmenu"]').id;
           
            window.mangole.sidebarmenu('#' + menuId).openSubmenu({
              parent_key: _parentKey,
              dataSource: _dataSourceConfig,
              onClose: function(){
                _this.style.background = '';
              }
            });
          }
        };
      },
      
      // ============================================================================
      // MÉTODO PRIVADO: Crear función para hoja (sin hijos)
      // ============================================================================
      _createLeafFunction: function(functionName, ro_form, ro_page, ro_control, optionIndex){
        if (!functionName) return null;
        
        return function(_this){
          try {
            // Ejecutar la función tal como viene de la DB (puede ser window.forms.xxx.functions.yyy)
            eval(functionName + '()');
          } catch(e) {
            // Silencioso: si la función no existe, no hacer nada
          }
        };
      },
      
      // ============================================================================
      // MÉTODO PÚBLICO: Abrir submenú lateral deslizante
      // ============================================================================
      openSubmenu: function(config){
        const parentKey = config.parent_key;
        const dataSourceConfig = config.dataSource;
        const onClose = config.onClose || function(){};
        
        // Obtener hijos del parent
        const children = this._getChildrenFromDataSource(parentKey, dataSourceConfig);

        if (children.length === 0) {
          return;
        }
        
        // Preparar opciones para el sidebar (formato esperado por openSidebarmenu)
        const childrenOptions = children.map(child => ({
          label: child.label,
          onclick: function(){
            // Evaluar la función onclick del hijo
            if (typeof child.onclick === 'string') {
              try {
                // Si es string, intentar ejecutarlo como código
                eval(child.onclick);
              } catch(e) {
                // Silencioso: si la función no existe, no hacer nada
              }
            } else if (typeof child.onclick === 'function') {
              // Si es función, ejecutarla directamente
              child.onclick();
            }
          }
        }));

        
        // Llamar al método interno openSidebarmenu
        this.openSidebarmenu(childrenOptions);
      },
      
      // ============================================================================
      // MÉTODO PÚBLICO: openSidebarmenu(childrenOptions)
      // Abre el submenú lateral deslizante con opciones dinámicas
      // ============================================================================
      openSidebarmenu: function(childrenOptions){
        // childrenOptions: Array de objetos con estructura { label: 'texto', onclick: function(){} }
        
        var workspace = document.querySelector('#window-workspace > div.workspace');
        if (!workspace) {
          console.error('No se encontró el contenedor workspace');
          return;
        }

        var existingOverlay = document.getElementById('mangole-sidebar-submenu-overlay');
        
        if (existingOverlay) {
          // Si ya existe, solo actualizar las opciones
          var optionsWrapper = existingOverlay.querySelector('.mangole-sidebar-submenu-options-wrapper');
          if (optionsWrapper) {
            // Limpiar opciones existentes
            optionsWrapper.innerHTML = '';
            
            // Agregar nuevas opciones
            childrenOptions.forEach(function(option){
              var optionDiv = document.createElement('div');
              optionDiv.className = 'mangole-sidebar-submenu-options';
              optionDiv.textContent = option.label;
              optionDiv.onclick = function(){
                if (typeof option.onclick === 'function') {
                  option.onclick();
                }
                // Llamar al método closeSidebarmenu del mismo control
                var sidebarControl = window.mangole.sidebarmenu('#sidebarmenu1');
                if (sidebarControl && typeof sidebarControl.closeSidebarmenu === 'function') {
                  sidebarControl.closeSidebarmenu();
                }
              };
              optionsWrapper.appendChild(optionDiv);
            });
          }
          
          // Mostrar el menú con animación
          var sidebar = document.getElementById('mangole-sidebar-submenu');
          if (sidebar) {
            sidebar.style.transform = 'translate3d(0, 0, 0)';
          }
        } else {
          // Crear todo desde cero
          
          // 1. Crear overlay
          var overlay = document.createElement('div');
          overlay.id = 'mangole-sidebar-submenu-overlay';
          overlay.className = 'mangole-sidebar-submenu-overlay';
          
          // 2. Crear sidebar
          var sidebar = document.createElement('div');
          sidebar.id = 'mangole-sidebar-submenu';
          sidebar.className = 'mangole-sidebar-submenu';
          
          // 3. Crear wrapper de opciones
          var optionsWrapper = document.createElement('div');
          optionsWrapper.className = 'mangole-sidebar-submenu-options-wrapper';
          
          // 4. Crear opciones
          childrenOptions.forEach(function(option){
            var optionDiv = document.createElement('div');
            optionDiv.className = 'mangole-sidebar-submenu-options';
            optionDiv.textContent = option.label;
            optionDiv.onclick = function(){
              if (typeof option.onclick === 'function') {
                option.onclick();
              }
              // Llamar al método closeSidebarmenu del mismo control
              var sidebarControl = window.mangole.sidebarmenu('#sidebarmenu1');
              if (sidebarControl && typeof sidebarControl.closeSidebarmenu === 'function') {
                sidebarControl.closeSidebarmenu();
              }
            };
            optionsWrapper.appendChild(optionDiv);
          });
          
          // 5. Crear botón de cerrar
          var closeButton = document.createElement('div');
          closeButton.className = 'mangole-sidebar-submenu-close-button';
          closeButton.textContent = '×';
          closeButton.onclick = function(){
            // Llamar al método closeSidebarmenu del mismo control
            var sidebarControl = window.mangole.sidebarmenu('#sidebarmenu1');
            if (sidebarControl && typeof sidebarControl.closeSidebarmenu === 'function') {
              sidebarControl.closeSidebarmenu();
            }
          };
          
          // 6. Ensamblar estructura
          sidebar.appendChild(optionsWrapper);
          sidebar.appendChild(closeButton);
          overlay.appendChild(sidebar);
          workspace.appendChild(overlay);
          
          // 7. Evento click en overlay (fondo negro)
          overlay.addEventListener('click', function(event){
            event.stopPropagation();
            if (event.target.getAttribute('id') === 'mangole-sidebar-submenu-overlay') {
              // Llamar al método closeSidebarmenu del mismo control
              var sidebarControl = window.mangole.sidebarmenu('#sidebarmenu1');
              if (sidebarControl && typeof sidebarControl.closeSidebarmenu === 'function') {
                sidebarControl.closeSidebarmenu();
              }
            }
          });
          
          // 8. Animación de entrada (esperar a que exista en el DOM)
          var canopen = setInterval(function(){
            if (document.getElementById('mangole-sidebar-submenu')) {
              clearInterval(canopen);
              sidebar.style.transform = 'translate3d(0, 0, 0)';
            }
          }, 10);
        }
      },
      
      // ============================================================================
      // MÉTODO PÚBLICO: closeSidebarmenu()
      // Cierra el submenú lateral deslizante con animación
      // ============================================================================
      closeSidebarmenu: function(){
        var sidebar = document.getElementById('mangole-sidebar-submenu');
        var overlay = document.getElementById('mangole-sidebar-submenu-overlay');
        
        if (!sidebar || !overlay) {
          return;
        }
        
        // Función para limpiar después de la transición
        var onTransitionEnd = function(e){
          sidebar.removeEventListener('webkitTransitionEnd', onTransitionEnd);
          sidebar.removeEventListener('transitionend', onTransitionEnd);
          
          // Remover overlay completo del DOM
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          
          // Limpiar background de items del menú principal
          var menuItems = document.querySelectorAll('#sidebarmenu1 li a');
          menuItems.forEach(function(item){
            item.style.background = '';
          });
        };
        
        // Agregar listener para cuando termine la transición
        sidebar.addEventListener('webkitTransitionEnd', onTransitionEnd);
        sidebar.addEventListener('transitionend', onTransitionEnd);
        
        // Aplicar transformación para ocultar
        sidebar.style.transform = 'translate3d(-100%, 0, 0)';
      },
      
      // ============================================================================
      // MÉTODO PRIVADO: Obtener hijos de un parent desde dataSource
      // ============================================================================
      _getChildrenFromDataSource: function(parentKey, config){
        const data = config.data;
        const mapping = config.mapping || {};
        const keyLabel = mapping.label || 'menu_label';
        const keyFunction = mapping.onclick || 'function_name';
        const keyOrder = mapping.order || 'order';
        const keyParent = mapping.parent || 'parent_code';
        const keyPermissions = mapping.permissions || 'permissions';
        
        const children = [];
        
        Object.keys(data).forEach(key => {
          const item = data[key];
          
          // Filtrar por parent_code
          if (item[keyParent] !== parentKey) return;
          
          // Filtro de permisos: solo mostrar si read === true
          if (item[keyPermissions] && item[keyPermissions].read !== true) return;
          
          children.push({
            key: key,
            label: item[keyLabel] || key,
            onclick: item[keyFunction] || 'javascript:void(0)', // Usar la función tal como viene de la DB
            order: item[keyOrder] || 0
          });
        });
        
        // Ordenar por order
        children.sort((a, b) => a.order - b.order);
        
        return children;
      },
      
      // ============================================================================
      // MÉTODO PÚBLICO: populate(data)
      // Puebla el menú con datos externos preservando opciones manuales existentes
      // ============================================================================
      populate: function(data) {
        if (!data || typeof data !== 'object') {
          console.error('[sidebarmenu.populate] Datos inválidos:', data);
          return this;
        }
        
        // 1. Actualizar el dataSource con los nuevos datos
        this.config.dataSource = this.config.dataSource || {};
        this.config.dataSource.data = data;

        // 2. Preservar SOLO opciones manuales especiales (Resumen, Ayuda, Cerrar sesión)
        // Estas tienen orders especiales: 0 (Resumen), 998 (Ayuda), 999 (Cerrar sesión)
        const allManualOptions = this.config.options || [];
        const specialOptions = allManualOptions.filter(opt => {
          const order = opt.inner?.order !== undefined ? opt.inner.order : 999;
          return order === 0 || order >= 998; // Solo preservar opciones especiales
        });

        // 3. Generar opciones desde el dataSource (módulos de BD)
        const generatedOptions = this._generateOptionsFromDataSource(
          this.config.dataSource,
          this._ro_form,
          this._ro_page,
          this._ro_control
        );

        // 4. Combinar opciones especiales + generadas (sin duplicados)
        const allOptions = [...specialOptions, ...generatedOptions];
        
        // 5. Ordenar todas las opciones por 'order'
        allOptions.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          return orderA - orderB;
        });

        // 6. Actualizar config.options Y también el objeto original en window.forms
        this.config.options = allOptions;
        
        // ✅ CRÍTICO: Actualizar TAMBIÉN el array original en window.forms
        // Esto es necesario porque el onclick busca en window['forms'][...].pages[...].controls[...].options[index]
        if (this._ro_form && this._ro_page !== null && this._ro_control !== null) {
          try {
            // Construir la ruta al array original
            let formPath = this._ro_form.replace(/\['/g, '.').replace(/'\]/g, '');
            // Ejemplo: "[\'home\']" → ".home"
            
            // Evaluar y actualizar
            const formsRoot = window.forms;
            const formName = formPath.replace('.', '');
            
            if (formsRoot && formsRoot[formName] && 
                formsRoot[formName].pages && 
                formsRoot[formName].pages[this._ro_page] &&
                formsRoot[formName].pages[this._ro_page].controls &&
                formsRoot[formName].pages[this._ro_page].controls[this._ro_control]) {
              
              formsRoot[formName].pages[this._ro_page].controls[this._ro_control].options = allOptions;
            }
          } catch(e) {
            console.warn('[sidebarmenu.populate] No se pudo actualizar window.forms:', e);
          }
        }

        // 7. Obtener el UL del menú
        const ul = document.getElementById(this.config.id);
        if (!ul) {
          console.error('[sidebarmenu.populate] Elemento UL no encontrado:', this.config.id);
          return this;
        }
        
        // 8. LIMPIAR COMPLETAMENTE el DOM (eliminar todas las opciones)
        ul.innerHTML = '';
        
        // 9. REGENERAR TODO el menú con el orden correcto
        // IMPORTANTE: Usar misma lógica que create() para generar onclick correctamente
        const ro_form = this._ro_form;
        const ro_page = this._ro_page;
        const ro_control = this._ro_control;
        
        allOptions.forEach((option, index) => {
          const li = document.createElement('LI');
          li.setAttribute('data-order', option.order || 999);
          
          // Aplicar CSS del parent
          if (option.css && option.css.parent) {
            li.setAttribute('style', option.css.parent);
          }
          
          // Asignar onclick directamente al LI
          if (typeof option.function === 'function' && ro_page !== null && ro_control !== null && ro_form) {
            li.onclick = function(e) {
              e.preventDefault();
              const forms = window.forms;
              const formName = ro_form.replace(/\['/g, '').replace(/'\]/g, '');
              
              if (forms && forms[formName] && 
                  forms[formName].pages && 
                  forms[formName].pages[ro_page] &&
                  forms[formName].pages[ro_page].controls &&
                  forms[formName].pages[ro_page].controls[ro_control] &&
                  forms[formName].pages[ro_page].controls[ro_control].options &&
                  forms[formName].pages[ro_page].controls[ro_control].options[index] &&
                  typeof forms[formName].pages[ro_page].controls[ro_control].options[index].function === 'function') {
                
                forms[formName].pages[ro_page].controls[ro_control].options[index].function.call(this, this);
              }
            };
          }
          
          // Icono
          const iconSpan = document.createElement('SPAN');
          iconSpan.setAttribute('class', 'mangole-sidebar-menu-icon');
          if (option.icon) {
            if (option.icon.font) {
              iconSpan.setAttribute('data-icon', option.icon.font);
            } else if (option.icon.image) {
              iconSpan.style.backgroundImage = `url(${option.icon.image})`;
            }
          }
          if (option.css && option.css.icon) {
            iconSpan.setAttribute('style', option.css.icon);
          }
          
          // Label
          const labelSpan = document.createElement('SPAN');
          labelSpan.setAttribute('class', 'mangole-sidebar-menu-label');
          labelSpan.textContent = option.label || 'Sin nombre';
          if (option.css && option.css.label) {
            labelSpan.setAttribute('style', option.css.label);
          }
          
          li.appendChild(iconSpan);
          li.appendChild(labelSpan);
          
          ul.appendChild(li);
        });
        
        return this; // Para encadenamiento
      }
    }
  };

  window.panel = ns.panel = function(_id) {
    // Helpers para simplificar el código
    const getElement = (selector) => document.querySelector(selector);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const getLocalizedText = (text) => {
      return text instanceof Array ? text[ns.languageIndex] : text;
    };
    const createHeadingElement = (titleContent, isDesignMode) => {
      const heading = document.createElement('DIV');
      heading.setAttribute('class', 'mangole-panel-heading');
      heading.innerHTML = getLocalizedText(titleContent);
      if (isDesignMode) {
        heading.setAttribute('data-role', 'droppable');
      }
      return heading;
    };
    const createBodyElement = (content, hasTitle, hasFooter, isDesignMode) => {
      const body = document.createElement('DIV');
      const bodyClass = `mangole-panel-body${hasTitle ? ' with-heading' : ''}${hasFooter ? ' with-footer' : ''}`;
      body.setAttribute('class', bodyClass);
      if (isDesignMode) {
        body.setAttribute('data-role', 'droppable');
      }
      body.innerHTML = content;
      return body;
    };
    const createFooterElement = (isDesignMode) => {
      const footer = document.createElement('DIV');
      footer.setAttribute('class', 'mangole-panel-footer');
      if (isDesignMode) {
        footer.setAttribute('data-role', 'droppable');
      }
      return footer;
    };
    return {
      selector: `${_id} > div.mangole-panel-body`,
      titleSelector: `${_id} > div.mangole-panel-heading`,
      hide: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'block';
        }
        executeCallback(callback);
      },
      title: function(_title) {
        const titleElement = getElement(`${_id} > div.mangole-panel-heading`);
        if (typeof _title === 'undefined') {
          return titleElement ? titleElement.innerHTML : '';
        } else {
          if (titleElement) {
            titleElement.innerHTML = _title;
          }
        }
      },
      html: function(_html) {
        const bodyElement = getElement(`${_id} > div.mangole-panel-body`);
        if (bodyElement) {
          bodyElement.innerHTML = _html;
        }
      },
      css: function(_prop, _value) {
        const element = getElement(_id);
        if (!element) {
          return false;
        }
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const headerEl = element.querySelector('.mangole-panel-heading');
          const bodyEl = element.querySelector('.mangole-panel-body');
          
          return {
            parent: element.getAttribute('style') || '',
            header: headerEl ? headerEl.getAttribute('style') || '' : '',
            content: bodyEl ? bodyEl.getAttribute('style') || '' : ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, header, content}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            element.setAttribute('style', _prop.parent);
          }
          if (_prop.header !== undefined) {
            const headerEl = element.querySelector('.mangole-panel-heading');
            if (headerEl) headerEl.setAttribute('style', _prop.header);
          }
          if (_prop.content !== undefined) {
            const bodyEl = element.querySelector('.mangole-panel-body');
            if (bodyEl) bodyEl.setAttribute('style', _prop.content);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al padre
        element.style[_prop] = _value;
      },
      showHeader: function(callback) {
        const element = getElement(_id);
        if (!element) {
          return false;
        }
        const header = element.querySelector('.mangole-panel-heading');
        if (header) {
          header.style.display = '';
        }
        executeCallback(callback);
      },
      hideHeader: function(callback) {
        const element = getElement(_id);
        if (!element) {
          return false;
        }
        const header = element.querySelector('.mangole-panel-heading');
        if (header) {
          header.style.display = 'none';
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || `panel${Date.now()}`;
        params.title = params.title === null || params.title === false ? false : params.title;
        params.footer = params.footer === true ? true : false;
        params.parent = params.parent || '';
        params.content = params.content || '';
        const isDesignMode = params.devmode === 'design';
        const hasTitle = params.title !== false;
        const hasFooter = params.footer === true;
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento contenedor
        const html = document.createElement('DIV');
        html.setAttribute('id', params.id);
        const panelClass = `mangole-panel${params.class ? ` ${params.class}` : ''}`;
        html.setAttribute('class', panelClass);
        html.setAttribute('data-control', 'panel');
        if (isDesignMode) {
          html.setAttribute('data-role', 'draggable');
        }
        
        // Soportar CSS estructurado { parent, header, content } o string simple
        if (params.css) {
          if (typeof params.css === 'object' && params.css.parent) {
            html.setAttribute('style', params.css.parent);
          } else if (typeof params.css === 'string') {
            html.setAttribute('style', params.css);
          }
        }
        
        // Crear título si existe
        if (hasTitle) {
          const heading = createHeadingElement(params.title, isDesignMode);
          // Aplicar CSS específico del header
          if (params.css && typeof params.css === 'object' && params.css.header) {
            heading.setAttribute('style', params.css.header);
          }
          html.appendChild(heading);
        }
        
        // Crear cuerpo del panel
        const body = createBodyElement(params.content, hasTitle, hasFooter, isDesignMode);
        // Aplicar CSS específico del content
        if (params.css && typeof params.css === 'object' && params.css.content) {
          body.setAttribute('style', params.css.content);
        }
        html.appendChild(body);
        
        // Crear pie si existe
        if (hasFooter) {
          const footer = createFooterElement(isDesignMode);
          html.appendChild(footer);
        }
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.form = ns.form = function(_id) {
    // Helpers para simplificar el código
    const getElement = (selector) => document.querySelector(selector);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const generateFormId = () => {
      const formCount = document.querySelectorAll('.mangole-form').length + 1;
      return `form${formCount}`;
    };
    return {
      selector: _id,
      getElement: function() {
        return document.querySelector(_id);
      },
      hide: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = getElement(_id);
        if (element) {
          element.style.display = 'block';
        }
        executeCallback(callback);
      },
      close: function(callback) {
        const form = getElement(_id);
        if (form && form.parentNode) {
          form.parentNode.removeChild(form);
        }
        executeCallback(callback);
      },
      html: function(html, callback) {
        try {
          const element = getElement(_id);
          if (element) {
            element.innerHTML = html;
          }
          executeCallback(callback);
        } catch(e) {
          console.error(e.message);
        }
      },
      append: function(html, callback) {
        try {
          const element = getElement(_id);
          if (element) {
            if (typeof html === 'string') {
              const temp = document.createElement('div');
              temp.innerHTML = html;
              while (temp.firstChild) {
                element.appendChild(temp.firstChild);
              }
            } else if (html instanceof HTMLElement || (html && html.nodeType)) {
              element.appendChild(html);
            } else if (html instanceof NodeList || Array.isArray(html)) {
              html.forEach(el => {
                if (el instanceof HTMLElement || (el && el.nodeType)) {
                  element.appendChild(el.cloneNode ? el.cloneNode(true) : el);
                }
              });
            }
          }
          executeCallback(callback);
        } catch(e) {
          console.error(e.message);
        }
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters || {};
        params.id = params.id || generateFormId();
        params.parent = params.parent || '';
        params.content = params.content || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento contenedor simple
        const html = document.createElement('DIV');
        html.setAttribute('id', params.id);
        html.setAttribute('class', 'mangole-form');
        html.setAttribute('data-control', 'form');
        if (params.css) {
          html.setAttribute('style', params.css);
        }
        if (isDesignMode) {
          html.setAttribute('data-role', 'draggable');
        }
        html.innerHTML = params.content;
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.contenteditable = ns.contenteditable = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const createContentEditableElement = (params, isDesignMode) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      const editableClass = `mangole-contenteditable${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', editableClass);
      html.setAttribute('data-control', 'contenteditable');
      html.setAttribute('contenteditable', 'true');
      html.setAttribute('onkeydown', "if (event.keyCode == 13) { document.execCommand('insertHTML', false, '<br /><br />'); return false; }");
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      html.innerHTML = params.content;
      return html;
    };
    return {
      html: function(_html, callback) {
        const element = validateElement('html');
        if (!element) {
          return false;
        }
        if (typeof _html === 'string' || typeof _html === 'number') {
          element.innerHTML = _html;
        } else {
          return element.innerHTML;
        }
        executeCallback(callback);
      },
      text: function(_text, callback) {
        const element = validateElement('text');
        if (!element) {
          return false;
        }
        if (typeof _text === 'string' || typeof _text === 'number') {
          element.innerText = _text;
        } else {
          return element.innerText;
        }
        executeCallback(callback);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (!element) {
          return false;
        }
        element.style.display = 'none';
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (!element) {
          return false;
        }
        element.style.display = '';
        executeCallback(callback);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        element.style[_prop] = _value;
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.content = params.content || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento contenteditable
        const html = createContentEditableElement(params, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.droppableform = ns.droppableform = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const createDroppableFormElement = (params) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      const droppableClass = `mangole-droppableform${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', droppableClass);
      html.setAttribute('data-control', 'droppableform');
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      html.innerHTML = params.content;
      return html;
    };
    return {
      html: function(_html, callback) {
        const element = validateElement('html');
        if (!element) {
          return false;
        }
        if (typeof _html === 'string' || typeof _html === 'number') {
          element.innerHTML = _html;
        } else {
          return element.innerHTML;
        }
        executeCallback(callback);
      },
      text: function(_text, callback) {
        const element = validateElement('text');
        if (!element) {
          return false;
        }
        if (typeof _text === 'string' || typeof _text === 'number') {
          element.innerText = _text;
        } else {
          return element.innerText;
        }
        executeCallback(callback);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (!element) {
          return false;
        }
        element.style.display = 'none';
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (!element) {
          return false;
        }
        element.style.display = '';
        executeCallback(callback);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        element.style[_prop] = _value;
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || '';
        params.parent = params.parent || '';
        params.content = params.content || '';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento droppableform
        const html = createDroppableFormElement(params);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.placeCaretAtEnd = ns.placeCaretAtEnd = function(el){
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
    }
  }

  window.structuredlayout = ns.structuredlayout = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };

    return {
      // Métodos para el elemento PADRE
      hide: function(callback) {
        const element = validateElement('hide');
        if (!element) return false;
        element.style.display = 'none';
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (!element) return false;
        element.style.display = '';
        executeCallback(callback);
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) return false;
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) return false;
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) return false;
        return hasClass(element, _className);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) return false;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const headerEl = element.querySelector('.mangole-structured-layout-header');
          const leftMenuEl = element.querySelector('.mangole-structured-layout-left-menu');
          const contentEl = element.querySelector('.mangole-structured-layout-content');
          const rightMenuEl = element.querySelector('.mangole-structured-layout-right-menu');
          const footerEl = element.querySelector('.mangole-structured-layout-footer');
          
          return {
            parent: element.getAttribute('style') || '',
            header: headerEl ? headerEl.getAttribute('style') || '' : '',
            leftMenu: leftMenuEl ? leftMenuEl.getAttribute('style') || '' : '',
            content: contentEl ? contentEl.getAttribute('style') || '' : '',
            rightMenu: rightMenuEl ? rightMenuEl.getAttribute('style') || '' : '',
            footer: footerEl ? footerEl.getAttribute('style') || '' : ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, header, leftMenu, content, rightMenu, footer}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            element.setAttribute('style', _prop.parent);
          }
          if (_prop.header !== undefined) {
            const headerEl = element.querySelector('.mangole-structured-layout-header');
            if (headerEl) headerEl.setAttribute('style', _prop.header);
          }
          if (_prop.leftMenu !== undefined) {
            const leftMenuEl = element.querySelector('.mangole-structured-layout-left-menu');
            if (leftMenuEl) leftMenuEl.setAttribute('style', _prop.leftMenu);
          }
          if (_prop.content !== undefined) {
            const contentEl = element.querySelector('.mangole-structured-layout-content');
            if (contentEl) contentEl.setAttribute('style', _prop.content);
          }
          if (_prop.rightMenu !== undefined) {
            const rightMenuEl = element.querySelector('.mangole-structured-layout-right-menu');
            if (rightMenuEl) rightMenuEl.setAttribute('style', _prop.rightMenu);
          }
          if (_prop.footer !== undefined) {
            const footerEl = element.querySelector('.mangole-structured-layout-footer');
            if (footerEl) footerEl.setAttribute('style', _prop.footer);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al padre
        element.style[_prop] = _value;
      },

      // Métodos para HEADER
      header: {
        html: function(_html, callback) {
          const element = validateElement('header.html');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          if (header) header.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('header.append');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          if (header) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              header.appendChild(_html);
            } else {
              header.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('header.addClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          if (header) addClass(header, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('header.removeClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          if (header) removeClass(header, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('header.hasClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          return header ? hasClass(header, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('header.css');
          if (!element) return false;
          const header = element.querySelector('.mangole-structured-layout-header');
          if (!header) return false;
          
          if (_prop === undefined) {
            return header.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            header.setAttribute('style', _prop);
          } else {
            header.style[_prop] = _value;
          }
        }
      },

      // Métodos para LEFT MENU
      leftMenu: {
        html: function(_html, callback) {
          const element = validateElement('leftMenu.html');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          if (leftMenu) leftMenu.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('leftMenu.append');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          if (leftMenu) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              leftMenu.appendChild(_html);
            } else {
              leftMenu.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('leftMenu.addClass');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          if (leftMenu) addClass(leftMenu, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('leftMenu.removeClass');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          if (leftMenu) removeClass(leftMenu, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('leftMenu.hasClass');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          return leftMenu ? hasClass(leftMenu, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('leftMenu.css');
          if (!element) return false;
          const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
          if (!leftMenu) return false;
          
          if (_prop === undefined) {
            return leftMenu.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            leftMenu.setAttribute('style', _prop);
          } else {
            leftMenu.style[_prop] = _value;
          }
        }
      },

      // Métodos para CONTENT (área principal)
      content: {
        html: function(_html, callback) {
          const element = validateElement('content.html');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          if (content) content.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('content.append');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          if (content) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              content.appendChild(_html);
            } else {
              content.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('content.addClass');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          if (content) addClass(content, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('content.removeClass');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          if (content) removeClass(content, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('content.hasClass');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          return content ? hasClass(content, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('content.css');
          if (!element) return false;
          const content = element.querySelector('.mangole-structured-layout-content');
          if (!content) return false;
          
          if (_prop === undefined) {
            return content.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            content.setAttribute('style', _prop);
          } else {
            content.style[_prop] = _value;
          }
        }
      },

      // Métodos para RIGHT MENU
      rightMenu: {
        html: function(_html, callback) {
          const element = validateElement('rightMenu.html');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          if (rightMenu) rightMenu.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('rightMenu.append');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          if (rightMenu) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              rightMenu.appendChild(_html);
            } else {
              rightMenu.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('rightMenu.addClass');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          if (rightMenu) addClass(rightMenu, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('rightMenu.removeClass');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          if (rightMenu) removeClass(rightMenu, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('rightMenu.hasClass');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          return rightMenu ? hasClass(rightMenu, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('rightMenu.css');
          if (!element) return false;
          const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
          if (!rightMenu) return false;
          
          if (_prop === undefined) {
            return rightMenu.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            rightMenu.setAttribute('style', _prop);
          } else {
            rightMenu.style[_prop] = _value;
          }
        }
      },

      // Métodos para FOOTER
      footer: {
        html: function(_html, callback) {
          const element = validateElement('footer.html');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          if (footer) footer.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('footer.append');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          if (footer) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              footer.appendChild(_html);
            } else {
              footer.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('footer.addClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          if (footer) addClass(footer, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('footer.removeClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          if (footer) removeClass(footer, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('footer.hasClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          return footer ? hasClass(footer, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('footer.css');
          if (!element) return false;
          const footer = element.querySelector('.mangole-structured-layout-footer');
          if (!footer) return false;
          
          if (_prop === undefined) {
            return footer.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            footer.setAttribute('style', _prop);
          } else {
            footer.style[_prop] = _value;
          }
        }
      },

      // Métodos para mostrar/ocultar secciones
      showHeader: function(callback) {
        const element = validateElement('showHeader');
        if (!element) return false;
        const header = element.querySelector('.mangole-structured-layout-header');
        if (header) header.style.display = '';
        executeCallback(callback);
      },
      hideHeader: function(callback) {
        const element = validateElement('hideHeader');
        if (!element) return false;
        const header = element.querySelector('.mangole-structured-layout-header');
        if (header) header.style.display = 'none';
        executeCallback(callback);
      },
      showLeftMenu: function(callback) {
        const element = validateElement('showLeftMenu');
        if (!element) return false;
        const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
        if (leftMenu) leftMenu.style.display = '';
        executeCallback(callback);
      },
      hideLeftMenu: function(callback) {
        const element = validateElement('hideLeftMenu');
        if (!element) return false;
        const leftMenu = element.querySelector('.mangole-structured-layout-left-menu');
        if (leftMenu) leftMenu.style.display = 'none';
        executeCallback(callback);
      },
      showRightMenu: function(callback) {
        const element = validateElement('showRightMenu');
        if (!element) return false;
        const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
        if (rightMenu) rightMenu.style.display = '';
        executeCallback(callback);
      },
      hideRightMenu: function(callback) {
        const element = validateElement('hideRightMenu');
        if (!element) return false;
        const rightMenu = element.querySelector('.mangole-structured-layout-right-menu');
        if (rightMenu) rightMenu.style.display = 'none';
        executeCallback(callback);
      },
      showFooter: function(callback) {
        const element = validateElement('showFooter');
        if (!element) return false;
        const footer = element.querySelector('.mangole-structured-layout-footer');
        if (footer) footer.style.display = '';
        executeCallback(callback);
      },
      hideFooter: function(callback) {
        const element = validateElement('hideFooter');
        if (!element) return false;
        const footer = element.querySelector('.mangole-structured-layout-footer');
        if (footer) footer.style.display = 'none';
        executeCallback(callback);
      },

      // Método CREATE
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || '';
        params.parent = params.parent || '';
        params.content = params.content || '';
        params.hasHeader = params.hasHeader || false;
        params.hasLeftMenu = params.hasLeftMenu || false;
        params.hasRightMenu = params.hasRightMenu || false;
        params.hasFooter = params.hasFooter || false;
        const isDesignMode = params.devmode === 'design';
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear contenedor principal
        const wrapper = document.createElement('DIV');
        wrapper.setAttribute('id', params.id);
        wrapper.setAttribute('class', 'mangole-structured-layout');
        wrapper.setAttribute('data-control', 'structuredlayout');
        if (isDesignMode) {
          wrapper.setAttribute('data-role', 'draggable');
          wrapper.setAttribute('data-role', 'droppable');
        }
        
        // Aplicar CSS - soporta objeto estructurado o string legacy
        if (params.css) {
          if (typeof params.css === 'object' && params.css.parent) {
            wrapper.setAttribute('style', params.css.parent);
          } else if (typeof params.css === 'string') {
            wrapper.setAttribute('style', params.css);
          }
        }
        
        // Crear header si está habilitado
        if (params.hasHeader) {
          const header = document.createElement('DIV');
          header.setAttribute('id', `${params.id}-header`);
          header.setAttribute('class', 'mangole-structured-layout-header');
          header.setAttribute('data-control', 'structuredlayout-section');
          if (isDesignMode) {
            header.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al header
          if (params.css && typeof params.css === 'object' && params.css.header) {
            header.setAttribute('style', params.css.header);
          }
          wrapper.appendChild(header);
        }
        
        // Crear contenedor de contenido (wrapper para los 3 elementos centrales)
        const contentWrapper = document.createElement('DIV');
        contentWrapper.setAttribute('class', 'mangole-structured-layout-content-wrapper');
        
        // Crear left menu si está habilitado
        if (params.hasLeftMenu) {
          const leftMenu = document.createElement('DIV');
          leftMenu.setAttribute('id', `${params.id}-left-menu`);
          leftMenu.setAttribute('class', 'mangole-structured-layout-left-menu');
          leftMenu.setAttribute('data-control', 'structuredlayout-section');
          if (isDesignMode) {
            leftMenu.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al left menu
          if (params.css && typeof params.css === 'object' && params.css.leftMenu) {
            leftMenu.setAttribute('style', params.css.leftMenu);
          }
          contentWrapper.appendChild(leftMenu);
        }
        
        // Crear content (obligatorio)
        const content = document.createElement('DIV');
        content.setAttribute('id', `${params.id}-content`);
        content.setAttribute('class', 'mangole-structured-layout-content');
        content.setAttribute('data-control', 'structuredlayout-section');
        if (isDesignMode) {
          content.setAttribute('data-role', 'droppable');
        }
        content.innerHTML = getLocalizedText(params.content);
        // Aplicar CSS al content
        if (params.css && typeof params.css === 'object' && params.css.content) {
          content.setAttribute('style', params.css.content);
        }
        contentWrapper.appendChild(content);
        
        // Crear right menu si está habilitado
        if (params.hasRightMenu) {
          const rightMenu = document.createElement('DIV');
          rightMenu.setAttribute('id', `${params.id}-right-menu`);
          rightMenu.setAttribute('class', 'mangole-structured-layout-right-menu');
          rightMenu.setAttribute('data-control', 'structuredlayout-section');
          if (isDesignMode) {
            rightMenu.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al right menu
          if (params.css && typeof params.css === 'object' && params.css.rightMenu) {
            rightMenu.setAttribute('style', params.css.rightMenu);
          }
          contentWrapper.appendChild(rightMenu);
        }
        
        wrapper.appendChild(contentWrapper);
        
        // Crear footer si está habilitado
        if (params.hasFooter) {
          const footer = document.createElement('DIV');
          footer.setAttribute('id', `${params.id}-footer`);
          footer.setAttribute('class', 'mangole-structured-layout-footer');
          footer.setAttribute('data-control', 'structuredlayout-section');
          if (isDesignMode) {
            footer.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al footer
          if (params.css && typeof params.css === 'object' && params.css.footer) {
            footer.setAttribute('style', params.css.footer);
          }
          wrapper.appendChild(footer);
        }
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, wrapper, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return wrapper;
        }
        
        executeCallback(callback);
      }
    };
  };

  window.blankwrapper = ns.blankwrapper = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const createBlankWrapperElement = (params, isDesignMode) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-blank-wrapper');
      html.setAttribute('data-control', 'blankwrapper');
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
        html.setAttribute('data-role', 'droppable');
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      html.innerHTML = getLocalizedText(params.content);
      return html;
    };
    return {
      getElement: function() {
        return document.querySelector(_id);
      },
      // Métodos para el elemento PADRE
      html: function(_html, callback) {
        const element = validateElement('html');
        if (element) {
          element.innerHTML = _html;
        }
        executeCallback(callback);
      },
      append: function(_html, callback) {
        const element = validateElement('append');
        if (element) {
          // Detectar si _html es un elemento DOM nativo (HTMLElement)
          if (_html instanceof HTMLElement || _html instanceof Node) {
            element.appendChild(_html);
          } else {
            element.innerHTML += _html;
          }
        }
        executeCallback(callback);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (!element) {
          return false;
        }
        element.style.display = 'none';
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (!element) {
          return false;
        }
        element.style.display = '';
        executeCallback(callback);
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const headerEl = element.querySelector('.mangole-blank-wrapper-header');
          const bodyEl = element.querySelector('.mangole-blank-wrapper-body');
          const footerEl = element.querySelector('.mangole-blank-wrapper-footer');
          
          return {
            parent: element.getAttribute('style') || '',
            header: headerEl ? headerEl.getAttribute('style') || '' : '',
            content: bodyEl ? bodyEl.getAttribute('style') || '' : '',
            footer: footerEl ? footerEl.getAttribute('style') || '' : ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, header, content, footer}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            element.setAttribute('style', _prop.parent);
          }
          if (_prop.header !== undefined) {
            const headerEl = element.querySelector('.mangole-blank-wrapper-header');
            if (headerEl) headerEl.setAttribute('style', _prop.header);
          }
          if (_prop.content !== undefined) {
            const bodyEl = element.querySelector('.mangole-blank-wrapper-body');
            if (bodyEl) bodyEl.setAttribute('style', _prop.content);
          }
          if (_prop.footer !== undefined) {
            const footerEl = element.querySelector('.mangole-blank-wrapper-footer');
            if (footerEl) footerEl.setAttribute('style', _prop.footer);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al padre
        element.style[_prop] = _value;
      },

      // Métodos estructurados para HEADER
      header: {
        getElement: function() {
          const element = validateElement('header.html');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          return header;
        },
        html: function(_html, callback) {
          const element = validateElement('header.html');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) header.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('header.append');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              header.appendChild(_html);
            } else {
              header.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        show: function(callback) {
          const element = validateElement('header.show');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) header.style.display = '';
          executeCallback(callback);
        },
        hide: function(callback) {
          const element = validateElement('header.hide');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) header.style.display = 'none';
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('header.addClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) addClass(header, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('header.removeClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (header) removeClass(header, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('header.hasClass');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          return header ? hasClass(header, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('header.css');
          if (!element) return false;
          const header = element.querySelector('.mangole-blank-wrapper-header');
          if (!header) return false;
          
          if (_prop === undefined) {
            return header.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            header.setAttribute('style', _prop);
          } else {
            header.style[_prop] = _value;
          }
        }
      },

      // Métodos estructurados para CONTENT (body)
      content: {
        getElement: function() {
          const element = validateElement('content.html');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          return body;
        },
        html: function(_html, callback) {
          const element = validateElement('content.html');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) body.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('content.append');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              body.appendChild(_html);
            } else {
              body.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        show: function(callback) {
          const element = validateElement('content.show');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) body.style.display = '';
          executeCallback(callback);
        },
        hide: function(callback) {
          const element = validateElement('content.hide');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) body.style.display = 'none';
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('content.addClass');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) addClass(body, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('content.removeClass');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (body) removeClass(body, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('content.hasClass');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          return body ? hasClass(body, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('content.css');
          if (!element) return false;
          const body = element.querySelector('.mangole-blank-wrapper-body');
          if (!body) return false;
          
          if (_prop === undefined) {
            return body.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            body.setAttribute('style', _prop);
          } else {
            body.style[_prop] = _value;
          }
        }
      },

      // Métodos estructurados para FOOTER
      footer: {
        getElement: function() {
          const element = validateElement('footer.html');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          return footer;
        },
        html: function(_html, callback) {
          const element = validateElement('footer.html');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) footer.innerHTML = _html;
          executeCallback(callback);
        },
        append: function(_html, callback) {
          const element = validateElement('footer.append');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) {
            // Detectar si _html es un elemento DOM nativo (HTMLElement)
            if (_html instanceof HTMLElement || _html instanceof Node) {
              footer.appendChild(_html);
            } else {
              footer.innerHTML += _html;
            }
          }
          executeCallback(callback);
        },
        show: function(callback) {
          const element = validateElement('footer.show');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) footer.style.display = '';
          executeCallback(callback);
        },
        hide: function(callback) {
          const element = validateElement('footer.hide');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) footer.style.display = 'none';
          executeCallback(callback);
        },
        addClass: function(_className) {
          const element = validateElement('footer.addClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) addClass(footer, _className);
        },
        removeClass: function(_className) {
          const element = validateElement('footer.removeClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (footer) removeClass(footer, _className);
        },
        hasClass: function(_className) {
          const element = validateElement('footer.hasClass');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          return footer ? hasClass(footer, _className) : false;
        },
        css: function(_prop, _value) {
          const element = validateElement('footer.css');
          if (!element) return false;
          const footer = element.querySelector('.mangole-blank-wrapper-footer');
          if (!footer) return false;
          
          if (_prop === undefined) {
            return footer.getAttribute('style') || '';
          }
          if (typeof _prop === 'object') {
            footer.setAttribute('style', _prop);
          } else {
            footer.style[_prop] = _value;
          }
        }
      },

      // Métodos legacy para compatibilidad hacia atrás
      showHeader: function(callback) {
        return this.header.show(callback);
      },
      hideHeader: function(callback) {
        return this.header.hide(callback);
      },
      showFooter: function(callback) {
        return this.footer.show(callback);
      },
      hideFooter: function(callback) {
        return this.footer.hide(callback);
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || '';
        params.parent = params.parent || '';
        params.content = params.content || '';
        params.hasHeader = params.hasHeader || false;
        params.hasFooter = params.hasFooter || false;
        const isDesignMode = params.devmode === 'design';
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear contenedor principal
        const wrapper = document.createElement('DIV');
        wrapper.setAttribute('id', params.id);
        wrapper.setAttribute('class', 'mangole-blank-wrapper');
        wrapper.setAttribute('data-control', 'blankwrapper');
        if (isDesignMode) {
          wrapper.setAttribute('data-role', 'draggable');
          wrapper.setAttribute('data-role', 'droppable');
        }
        
        // Aplicar CSS - soporta objeto estructurado o string legacy
        if (params.css) {
          if (typeof params.css === 'object' && params.css.parent) {
            wrapper.setAttribute('style', params.css.parent);
          } else if (typeof params.css === 'string') {
            wrapper.setAttribute('style', params.css);
          }
        }
        
        // Crear header si está habilitado
        if (params.hasHeader) {
          const header = document.createElement('DIV');
          header.setAttribute('id', `${params.id}-header`);
          header.setAttribute('class', 'mangole-blank-wrapper-header');
          header.setAttribute('data-control', 'blankwrapper-section');
          if (isDesignMode) {
            header.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al header
          if (params.css && typeof params.css === 'object' && params.css.header) {
            header.setAttribute('style', params.css.header);
          }
          wrapper.appendChild(header);
        }
        
        // Crear body (obligatorio)
        const body = document.createElement('DIV');
        body.setAttribute('id', `${params.id}-body`);
        body.setAttribute('class', 'mangole-blank-wrapper-body');
        body.setAttribute('data-control', 'blankwrapper-section');
        if (isDesignMode) {
          body.setAttribute('data-role', 'droppable');
        }
        body.innerHTML = getLocalizedText(params.content);
        // Aplicar CSS al body/content
        if (params.css && typeof params.css === 'object' && params.css.content) {
          body.setAttribute('style', params.css.content);
        }
        wrapper.appendChild(body);
        
        // Crear footer si está habilitado
        if (params.hasFooter) {
          const footer = document.createElement('DIV');
          footer.setAttribute('id', `${params.id}-footer`);
          footer.setAttribute('class', 'mangole-blank-wrapper-footer');
          footer.setAttribute('data-control', 'blankwrapper-section');
          if (isDesignMode) {
            footer.setAttribute('data-role', 'droppable');
          }
          // Aplicar CSS al footer
          if (params.css && typeof params.css === 'object' && params.css.footer) {
            footer.setAttribute('style', params.css.footer);
          }
          wrapper.appendChild(footer);
        }
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, wrapper, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return wrapper;
        }
        
        executeCallback(callback);
      }
    };
  };


  window.jspaint = ns.jspaint = function(_id, _options, callback){
    var _this = this;
    var mousePressed = false,
    lastX = null,
    lastY = null;

    this.canvasId = null;

    this.cStep = -1;
    this.cPushArray = new Array();

    this.ctx = null;
    this.options = {
      id: _id,
      lineWidth: (typeof _options.lineWidth !== "undefined") ? _options.lineWidth : 5,
      color: (typeof _options.color !== "undefined") ? _options.color : 'black',
      canvasWidth: (typeof _options.canvasWidth !== "undefined") ? _options.canvasWidth : 200,
      canvasHeight: (typeof _options.canvasHeight !== "undefined") ? _options.canvasHeight : 200,
      canvasStyle: (typeof _options.canvasStyle !== "undefined") ? 'style="'+_options.canvasStyle+'"' : '',
      backgroundImage: (typeof _options.backgroundImage !== "undefined") ? _options.backgroundImage : 'img/white-bg.png',
      enableTouch: (typeof _options.enableTouch !== "undefined") ? _options.enableTouch : true,
    };
    this.getData = function(){
      return document.querySelector('#' + _this.canvasId).toDataURL();
    };
    this.create =  function(_callback){
      _this.canvasId = new Date().getTime() / 1000;
      _this.canvasId = 'canvas' + parseInt(_this.canvasId);

      document.querySelector(_id).innerHTML = '<canvas id="'+_this.canvasId+'" width="'+_this.options.canvasWidth+'" height="'+_this.options.canvasHeight+'" '+_this.options.canvasStyle+'></canvas>';
      var iscreated = window.setInterval(function() {
        if (document.querySelector('#' + _this.canvasId) !== null){
          clearInterval(iscreated);
          _this.init(_callback);
        }
      }, 10);
    };
    this.init = function(_callback){ 
      var element = document.querySelector('#' + _this.canvasId);
      _this.ctx = element.getContext("2d");
      element.addEventListener('click', function(event){
        var rect = this.getBoundingClientRect(),
        offset = {
          top: rect.top + document.body.scrollTop,
          left: rect.left + document.body.scrollLeft
        };

        _this.lastX = event.pageX - offset.left-1;
        _this.lastY = event.pageY - offset.top;

        _this.draw(event.pageX - offset.left, event.pageY - offset.top, true);
      });
      element.addEventListener('mousedown', function(event){
        _this.mousePressed = true;

        var rect = this.getBoundingClientRect(),
        offset = {
          top: rect.top + document.body.scrollTop,
          left: rect.left + document.body.scrollLeft
        };

        _this.draw(event.pageX - offset.left, event.pageY - offset.top, false);
      });
      element.addEventListener('mousemove', function(event){
        if (_this.mousePressed) {

          var rect = this.getBoundingClientRect(),
          offset = {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
          };
          _this.draw(event.pageX - offset.left, event.pageY - offset.top, true);
        }
      });
      element.addEventListener('mouseup', function(event){
        if (_this.mousePressed) {
          _this.mousePressed = false;
          _this.cPush();
        }
      });
      element.addEventListener('mouseleave', function(event){
        if (_this.mousePressed) {
          _this.mousePressed = false;
          _this.cPush();
        }
      });
      
      // Touch events for mobile support
      if (_this.options.enableTouch) {
        element.addEventListener('touchstart', function(event){
          event.preventDefault();
          _this.mousePressed = true;
          var touch = event.touches[0];
          var rect = this.getBoundingClientRect();
          var x = touch.clientX - rect.left;
          var y = touch.clientY - rect.top;
          _this.draw(x, y, false);
        });
        
        element.addEventListener('touchmove', function(event){
          event.preventDefault();
          if (_this.mousePressed) {
            var touch = event.touches[0];
            var rect = this.getBoundingClientRect();
            var x = touch.clientX - rect.left;
            var y = touch.clientY - rect.top;
            _this.draw(x, y, true);
          }
        });
        
        element.addEventListener('touchend', function(event){
          event.preventDefault();
          if (_this.mousePressed) {
            _this.mousePressed = false;
            _this.cPush();
          }
        });
        
        element.addEventListener('touchcancel', function(event){
          event.preventDefault();
          if (_this.mousePressed) {
            _this.mousePressed = false;
            _this.cPush();
          }
        });
      }
      
      if (typeof initialImage !== "undefined"){
        _this.drawImage(initialImage);
      }else if (_this.options.backgroundImage){
        _this.drawImage(_this.options.backgroundImage);
      }
      
      if (typeof _callback === "function"){
        _callback();
      }
    };
    this.text = function(_text, x, y){
      _this.ctx.font = '30pt Calibri';
      _this.ctx.textAlign = 'center';
      _this.ctx.fillStyle = 'blue';
      _this.ctx.fillText(_text, x, y);
    };
    this.draw = function(x, y, isDown) {
      if (isDown) {
          _this.ctx.beginPath();
          _this.ctx.strokeStyle = _this.options.color;
          _this.ctx.lineWidth = _this.options.lineWidth;
          _this.ctx.lineJoin = "round";
          _this.ctx.moveTo(_this.lastX, _this.lastY);
          _this.ctx.lineTo(x, y);
          _this.ctx.closePath();
          _this.ctx.stroke();
      }
      _this.lastX = x;
      _this.lastY = y;
    };
    this.clearArea = function(_callback){
      _this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      _this.ctx.clearRect(0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
      //_this.ctx = null;
      if (typeof _callback === "function"){
        _callback();
      }
    };
    this.drawImage = function(_image){
      var image = new Image();
      image.onload = function(){
        //_this.ctx.drawImage(image, 0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
        var w = _this.ctx.canvas.width,
        h = _this.ctx.canvas.height,
        iw = image.width,
        ih = image.height,
        r = Math.min(w / iw, h / ih),
        new_prop_w = iw * r,   /// new prop. width
        new_prop_h = ih * r,   /// new prop. height
        cx, cy, cw, ch, ar = 1,
        x = 0,
        y = 0,
        offsetX = 0.5,
        offsetY = 0.5;

        /// keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        /// decide which gap to fill    
        if (new_prop_w < w) ar = w / new_prop_w;
        if (new_prop_h < h) ar = h / new_prop_h;
        new_prop_w *= ar;
        new_prop_h *= ar;

        /// calc source rectangle
        cw = iw / (new_prop_w / w);
        ch = ih / (new_prop_h / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        /// make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        /// fill image in dest. rectangle
        _this.ctx.drawImage(image, cx, cy, cw, ch, x, y, w, h);
        _this.cPush();
      };
      image.src = _image;
    };

    this.cPush = function(){
      _this.cStep++;
      if (_this.cStep < _this.cPushArray.length){
        _this.cPushArray.length = _this.cStep;
      }

      _this.cPushArray.push(document.querySelector('#' + _this.canvasId).toDataURL());
    };
    this.cUndo = function(){
      if (_this.cStep > 0){
        _this.cStep--;
        var canvasPic = new Image();
        canvasPic.src = _this.cPushArray[_this.cStep];
        canvasPic.onload = function(){
          _this.ctx.drawImage(canvasPic, 0, 0);
        }
      }
    };
    this.cRedo = function(){
      if (_this.cStep < _this.cPushArray.length - 1) {
        _this.cStep++;
        var canvasPic = new Image();
        canvasPic.src = _this.cPushArray[_this.cStep];
        canvasPic.onload = function () {
          _this.ctx.drawImage(canvasPic, 0, 0);
        }
      }
    };


    this.create(callback);
  };

  window.blankdialog = ns.blankdialog = function(_id) {
    return {
      html: function(_html, callback) {
        if (document.querySelector(_id) === null) {
          console.log(`Uncaught TypeError: Cannot read property 'html' of '${_id}' because is null`);
        } else {
          document.querySelector(_id).innerHTML = _html;
          if (typeof callback === "function") {
            callback();
          }
        }
      },
      hide: function(callback) {
        const element = (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
        if (element === null) {
          console.log(`Uncaught TypeError: Cannot read property 'hide' of '${_id}' because is null`);
          return false;
        } else {
          element.style.display = 'none';
        }
        if (typeof callback === "function") {
          callback();
        }
      },
      show: function(callback) {
        const element = (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
        if (element === null) {
          console.log(`Uncaught TypeError: Cannot read property 'show' of '${_id}' because is null`);
          return false;
        } else {
          element.style.display = '';
        }
        if (typeof callback === "function") {
          callback();
        }
      },
      css: function(_prop, _value) {
        const element = (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
        if (element === null) {
          console.log(`Uncaught TypeError: Cannot read property 'css' of '${_id}' because is null`);
          return false;
        } else {
          element.style[_prop] = _value;
        }
      },
      create: function(parameters, callback) {
        if (typeof parameters === "undefined") {
          parameters = {};
        }
        // Extraer form, page, control ANTES de procesar dataFrom
        let ro_form = "";
        if (typeof parameters.form !== "undefined") {
          if (Array.isArray(parameters.form)) {
            for (let i = 0; i < parameters.form.length; i++) {
              ro_form += "['" + parameters.form[i] + "']";
            }
          } else {
            ro_form = "['" + parameters.form + "']";
          }
        } else {
          ro_form = null;
        }
        const ro_page = (typeof parameters.page !== "undefined") ? parameters.page : null;
        const ro_control = (typeof parameters.control !== "undefined") ? parameters.control : null;
        // Procesar dataFrom
        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object") {
          parameters = parameters.dataFrom;
        }
        parameters.id = (typeof parameters.id === "undefined") ? id.panel() : parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined") ? "" : parameters.parent;
        parameters.content = (typeof parameters.content === "undefined" || parameters.content == null) ? "" : parameters.content;
        if (document.getElementById(parameters.id)) {
          console.error(`Se ha creado otro elemento con el ID "${parameters.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        const html = document.createElement("DIV");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-dialog" + ((typeof parameters.class !== "undefined" && parameters.class != null) ? ' ' + parameters.class : ''));
        html.setAttribute("data-control", "blankdialog");
        if (typeof parameters.css !== "undefined" && parameters.css != null) {
          html.setAttribute("style", parameters.css);
        }
        html.innerHTML = '<div class="mangole-dialog-workarea">' + parameters.content + '</div><div title="Cerrar" class="mangole-close" onclick="' + ((typeof parameters.onclosebuttonclicked === "function" && ro_page != null && ro_control != null) ? 'window[\'forms\']' + ro_form + '.pages[' + ro_page + '].controls[' + ro_control + '].onclosebuttonclicked()' : '') + '">×</div>';
        if (typeof parameters.parent !== "undefined" && parameters.parent != "" && parameters.parent != null) {
          ns.fillControl(parameters.parent, html, function(html, selector) {
            selector.appendChild(html);
          });
        } else if (parameters.parent == "") {
          return html;
        }
        if (callback && typeof(callback) === "function") {
          callback();
        }
      }
    };
  };

  window.label = ns.label = function(_id) {
    // Resolver ID corto si usa _shortIds
    _id = ns.resolveControlId(_id);
    
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const createLabelElement = (params, isDesignMode) => {
      const html = document.createElement('SPAN');
      html.setAttribute('id', params.id);
      const labelClass = `mangole-label${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', labelClass);
      html.setAttribute('data-control', 'label');
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      html.innerHTML = getLocalizedText(params.value);
      return html;
    };
    return {
      html: function(_html, callback) {
        const element = validateElement('html');
        if (element) {
          element.innerHTML = _html;
        }
        executeCallback(callback);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      create: function(parameters, callback) {
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.value = params.value || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento label
        const html = createLabelElement(params, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };
   
  window.link = ns.link = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createLinkElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('A');
      html.setAttribute('id', params.id);
      html.setAttribute('href', params.href);
      html.setAttribute('class', params.class ? params.class : 'mangole-link');
      html.setAttribute('data-control', 'link');
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      if (params.disabled) {
        html.setAttribute('disabled', 'disabled');
        html.setAttribute('data-disabled', '1');
      }
      // Event handlers - dual path for form-referenced vs standalone links
      if (typeof params.onclick === 'function') {
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced links
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].onclick(this)}`);
        } else {
          // Path 2: Standalone links - direct function execution
          const functionName = `${params.id}_onclick_handler`;
          window[functionName] = params.onclick;
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){${functionName}(this)}`);
        }
      }
      html.innerHTML = getLocalizedText(params.value);
      return html;
    };
    return {
      html: function(_html, callback) {
        const element = validateElement('html');
        if (element) {
          element.innerHTML = _html;
        }
        executeCallback(callback);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = 'block';
        }
        executeCallback(callback);
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      disabled: function(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.value = params.value || '';
        params.class = params.class || '';
        params.href = params.href || 'javascript:void(0);';
        params.disabled = params.disabled === true;
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento link
        const html = createLinkElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.button = ns.button = function(_id) {
    // Resolver ID corto si usa _shortIds
    _id = ns.resolveControlId(_id);
    
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createButtonElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('BUTTON');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-btn');
      html.setAttribute('data-control', 'button');
      html.innerHTML = getLocalizedText(params.label);
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.tooltip) {
        html.setAttribute('title', getLocalizedText(params.tooltip));
      }
      if (params.disabled) {
        html.setAttribute('disabled', 'disabled');
        html.setAttribute('data-disabled', '1');
      }
      if (params.tabindex) {
        html.setAttribute('tabindex', params.tabindex);
      }
      if (params.class) {
        addClass(html, params.class);
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      if (typeof params.function === 'function') {
        if (ro_page !== null && ro_control !== null) {
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].function(this)}`);
        } else {
          // Para botones creados sin referencias de formulario, usar addEventListener
          html.addEventListener('click', function() {
            if (!this.getAttribute('disabled')) {
              params.function(this);
            }
          });
        }
      }
      return html;
    };
    return {
      value: function(_value) {
        const element = validateElement('value');
        if (!element) {
          return false;
        }
        if (typeof _value === 'string' || typeof _value === 'number') {
          element.innerText = _value;
        } else {
          return element.innerText;
        }
      },
      data: function(_key, _value) {
        const element = validateElement('data');
        if (!element) {
          return false;
        }
        if (typeof _key === 'string' && typeof _value === 'undefined') {
          return element.getAttribute(`data-${_key}`);
        } else if (typeof _key === 'string' && typeof _value !== 'undefined') {
          if (_value === '') {
            element.removeAttribute(`data-${_key}`);
          } else {
            element.setAttribute(`data-${_key}`, _value);
          }
        }
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      hidden: function(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible: function(callback) {
        const element = validateElement('visible');
        if (element) {
          element.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled: function(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento button
        const html = createButtonElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.blankbutton = ns.blankbutton = function(_id) {
    // Resolver ID corto si usa _shortIds
    _id = ns.resolveControlId(_id);
    
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createBlankButtonElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('BUTTON');
      html.setAttribute('id', params.id);
      html.setAttribute('data-control', 'blankbutton');
      html.innerHTML = getLocalizedText(params.label);
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.tooltip) {
        html.setAttribute('title', getLocalizedText(params.tooltip));
      }
      if (params.disabled) {
        html.setAttribute('disabled', 'disabled');
        html.setAttribute('data-disabled', '1');
      }
      if (params.tabindex) {
        html.setAttribute('tabindex', params.tabindex);
      }
      if (params.class) {
        addClass(html, params.class);
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      if (typeof params.function === 'function') {
        if (ro_page !== null && ro_control !== null) {
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].function(this)}`);
        } else {
          // Para botones creados sin referencias de formulario, usar addEventListener
          html.addEventListener('click', function() {
            if (!this.getAttribute('disabled')) {
              params.function(this);
            }
          });
        }
      }
      return html;
    };
    return {
      value: function(_value) {
        const element = validateElement('value');
        if (!element) {
          return false;
        }
        if (typeof _value === 'string' || typeof _value === 'number') {
          element.innerText = _value;
        } else {
          return element.innerText;
        }
      },
      data: function(_key, _value) {
        const element = validateElement('data');
        if (!element) {
          return false;
        }
        if (typeof _key === 'string' && typeof _value === 'undefined') {
          return element.getAttribute(`data-${_key}`);
        } else if (typeof _key === 'string' && typeof _value !== 'undefined') {
          if (_value === '') {
            element.removeAttribute(`data-${_key}`);
          } else {
            element.setAttribute(`data-${_key}`, _value);
          }
        }
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      hidden: function(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible: function(callback) {
        const element = validateElement('visible');
        if (element) {
          element.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled: function(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento blankbutton
        const html = createBlankButtonElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };


  window.togglebutton = ns.togglebutton = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createToggleButtonElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-toggle-button');
      html.setAttribute('data-control', 'togglebutton');
      html.setAttribute('data-value1', params.values[0]);
      html.setAttribute('data-value2', params.values[1]);
      html.setAttribute('data-state', '0');
      html.innerHTML = '<button class="mangole-toggle-button"></button>';
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.tooltip) {
        html.setAttribute('title', getLocalizedText(params.tooltip));
      }
      if (params.disabled) {
        html.setAttribute('disabled', 'disabled');
        html.setAttribute('data-disabled', '1');
      }
      if (params.class) {
        addClass(html, params.class);
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      // Event handlers - dual path for form-referenced vs standalone togglebuttons  
      if (typeof params.function === 'function') {
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced togglebuttons
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){ if(this.getAttribute('data-state') == 1){ this.setAttribute('data-state', '0') }else{ this.setAttribute('data-state', '1') } window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].function(this)}`);
        } else {
          // Path 2: Standalone togglebuttons - direct function execution
          const functionName = `${params.id}_function_handler`;
          window[functionName] = params.function;
          html.setAttribute('onclick', `if(!this.getAttribute('disabled')){ if(this.getAttribute('data-state') == 1){ this.setAttribute('data-state', '0') }else{ this.setAttribute('data-state', '1') } ${functionName}(this)}`);
        }
      }
      return html;
    };
    return {
      state: function(_value) {
        const element = validateElement('state');
        if (!element) {
          return false;
        }
        if (typeof _value === 'number') {
          if (element.getAttribute('data-value1') == _value) {
            element.setAttribute('data-state', '0');
          } else if (element.getAttribute('data-value2') == _value) {
            element.setAttribute('data-state', '1');
          }
        } else {
          const state = element.getAttribute('data-state');
          if (state == 0) {
            return element.getAttribute('data-value1');
          } else if (state == 1) {
            return element.getAttribute('data-value2');
          }
        }
      },
      stateValues: function(_value1, _value2) {
        const element = validateElement('stateValues');
        if (!element) {
          return false;
        }
        if (typeof _value1 !== 'undefined' && typeof _value2 !== 'undefined') {
          element.setAttribute('data-value1', _value1);
          element.setAttribute('data-value2', _value2);
        }
      },
      data: function(_key, _value) {
        const element = validateElement('data');
        if (!element) {
          return false;
        }
        if (typeof _key === 'string' && typeof _value === 'undefined') {
          return element.getAttribute(`data-${_key}`);
        } else if (typeof _key === 'string' && typeof _value !== 'undefined') {
          if (_value === '') {
            element.removeAttribute(`data-${_key}`);
          } else {
            element.setAttribute(`data-${_key}`, _value);
          }
        }
      },
      addClass: function(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass: function(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass: function(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.parentNode.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.parentNode.style.display = '';
        }
        executeCallback(callback);
      },
      hidden: function(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.parentNode.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible: function(callback) {
        const element = validateElement('visible');
        if (element) {
          element.parentNode.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled: function(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.values = params.values || [0, 1];
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento togglebutton
        const html = createToggleButtonElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };


  

  window.tabs = ns.tabs = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createTabElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('A');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-tabs');
      html.setAttribute('data-control', 'tabs');
      html.setAttribute('href', 'javascript:void(0);');
      html.textContent = getLocalizedText(params.label);
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.tooltip) {
        html.setAttribute('title', getLocalizedText(params.tooltip));
      }
      if (params.disabled) {
        html.setAttribute('disabled', 'disabled');
        html.setAttribute('data-disabled', '1');
      }
      if (params.tabindex) {
        html.setAttribute('tabindex', params.tabindex);
      }
      if (params.css) {
        html.setAttribute('style', params.css);
      }
      // Event handlers - dual path for form-referenced vs standalone tabs
      if (typeof params.function === 'function') {
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced tabs
          html.setAttribute('onclick', `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].function()`);
        } else {
          // Path 2: Standalone tabs - direct function execution
          const functionName = `${params.id}_function_handler`;
          window[functionName] = params.function;
          html.setAttribute('onclick', `${functionName}()`);
        }
      }
      return html;
    };
    return {
      hide: function(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show: function(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      disabled: function(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      create: function(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento tab
        const html = createTabElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    };
  };

  window.tabmenu = ns.tabmenu = function(_id) {
    // Helpers
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    
    return {
      tab: function(n) {
        const element = getElement();
        if (!element) {
          return null;
        }
        const tabElement = element.querySelector(`.mangole-tabmenu-tab[data-tab-index="${n}"]`);
        
        return {
          disabled: function(state) {
            if (!tabElement) return false;
            if (state !== undefined) {
              if (state === true) {
                tabElement.setAttribute('disabled', 'disabled');
                tabElement.classList.add('disabled');
              } else {
                tabElement.removeAttribute('disabled');
                tabElement.classList.remove('disabled');
              }
            }
            return tabElement.hasAttribute('disabled');
          },
          hide: function() {
            if (tabElement) {
              tabElement.style.display = 'none';
            }
          },
          show: function() {
            if (tabElement) {
              tabElement.style.display = '';
            }
          },
          text: function(value) {
            if (!tabElement) return '';
            if (value !== undefined) {
              tabElement.textContent = value;
            }
            return tabElement.textContent;
          },
          html: function(value) {
            if (!tabElement) return '';
            if (value !== undefined) {
              tabElement.innerHTML = value;
            }
            return tabElement.innerHTML;
          }
        };
      },
      
      addTab: function(config) {
        const element = getElement();
        if (!element) return;
        
        const tabsContainer = element.querySelector('.mangole-tabmenu-tabs');
        if (!tabsContainer) return;
        
        const currentTabs = tabsContainer.querySelectorAll('.mangole-tabmenu-tab');
        const newIndex = currentTabs.length;
        
        const tab = document.createElement('A');
        tab.className = 'mangole-tabmenu-tab';
        tab.href = 'javascript:void(0);';
        tab.setAttribute('data-tab-index', newIndex);
        tab.textContent = getLocalizedText(config.label || '');
        
        if (config.css) tab.setAttribute('style', config.css);
        if (config.class) tab.className += ' ' + config.class;
        if (config.tooltip) tab.setAttribute('title', getLocalizedText(config.tooltip));
        if (config.tabindex) tab.setAttribute('tabindex', config.tabindex);
        if (config.disabled) {
          tab.setAttribute('disabled', 'disabled');
          tab.classList.add('disabled');
        }
        
        tabsContainer.appendChild(tab);
      },
      
      removeTab: function(n) {
        const element = getElement();
        if (!element) return;
        
        const tabElement = element.querySelector(`.mangole-tabmenu-tab[data-tab-index="${n}"]`);
        if (tabElement) {
          tabElement.remove();
          
          // Reindexar los tabs restantes
          const tabs = element.querySelectorAll('.mangole-tabmenu-tab');
          tabs.forEach((tab, index) => {
            tab.setAttribute('data-tab-index', index);
          });
        }
      },
      
      create: function(parameters, callback) {
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        params.id = params.id || 'tabmenu' + Date.now();
        params.parent = params.parent || '';
        params.tabs = params.tabs || [];
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear contenedor principal
        const html = document.createElement('DIV');
        html.setAttribute('id', params.id);
        html.setAttribute('class', 'mangole-tabmenu-container' + (params.class ? ' ' + params.class : ''));
        html.setAttribute('data-control', 'tabmenu');
        
        // Aplicar CSS al contenedor
        if (params.css && params.css.parent) {
          html.setAttribute('style', params.css.parent);
        }
        
        // Crear contenedor de tabs con scroll horizontal
        const tabsContainer = document.createElement('DIV');
        tabsContainer.className = 'mangole-tabmenu-tabs';
        
        // Aplicar CSS solo si el usuario lo especifica
        if (params.css && params.css.tabs) {
          tabsContainer.setAttribute('style', params.css.tabs);
        }
        
        // Crear tabs
        params.tabs.forEach((tabConfig, index) => {
          const tab = document.createElement('A');
          tab.className = 'mangole-tabmenu-tab';
          tab.href = 'javascript:void(0);';
          tab.setAttribute('data-tab-index', index);
          tab.textContent = getLocalizedText(tabConfig.label || '');
          
          // Aplicar CSS solo si el usuario lo especifica
          if (tabConfig.css) {
            tab.setAttribute('style', tabConfig.css);
          }
          
          if (tabConfig.class) tab.className += ' ' + tabConfig.class;
          if (tabConfig.tooltip) tab.setAttribute('title', getLocalizedText(tabConfig.tooltip));
          if (tabConfig.tabindex) tab.setAttribute('tabindex', tabConfig.tabindex);
          if (tabConfig.disabled) {
            tab.setAttribute('disabled', 'disabled');
            tab.classList.add('disabled');
          }
          
          // Event handler para clase active (siempre presente)
          tab.addEventListener('click', function(e) {
            e.preventDefault();
            if (!this.hasAttribute('disabled')) {
              // Remover clase active de todos los tabs
              tabsContainer.querySelectorAll('.mangole-tabmenu-tab').forEach(t => {
                t.classList.remove('active');
              });
              // Agregar clase active al tab clickeado
              this.classList.add('active');
            }
          });
          
          // Event handler para callback de usuario
          if (typeof params.function === 'function') {
            tab.addEventListener('click', function(e) {
              if (!this.hasAttribute('disabled')) {
                params.function(index);
              }
            });
            
            // También agregar onclick para form-referenced
            if (ro_form && ro_page !== null && ro_control !== null) {
              const onclickCode = `
                if (!this.hasAttribute('disabled')) {
                  this.parentElement.querySelectorAll('.mangole-tabmenu-tab').forEach(t => t.classList.remove('active'));
                  this.classList.add('active');
                  window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].function(${index});
                }
              `;
              tab.setAttribute('onclick', onclickCode);
            }
          }
          
          tabsContainer.appendChild(tab);
        });
        
        html.appendChild(tabsContainer);
        
        // Insertar en parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        
        executeCallback(callback);
      }
    };
  };

  window.textbox = ns.textbox = function(_id) {
    // Resolver ID corto si usa _shortIds
    _id = ns.resolveControlId(_id);
    
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const toggleAttribute = (element, attribute, value) => {
      if (value === true) {
        element.setAttribute(attribute, attribute);
      } else if (value === false) {
        element.removeAttribute(attribute);
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createTextboxElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      const cssClasses = [
        'mangole-general-textbox',
        params.isEmail && 'isemail',
        params.class
      ].filter(Boolean).join(' ');
      html.className = cssClasses;
      html.setAttribute('data-control', 'textbox');
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.css?.parent) {
        html.style.cssText = params.css.parent;
      }
      // Label
      const label = document.createElement('LABEL');
      let labelText = getLocalizedText(params.label);
      // Agregar asterisco si es required y no lo tiene ya
      if (params.required === true && !labelText.includes('*')) {
        labelText += ' *';
      }
      label.textContent = labelText;
      if (params.css?.label) {
        label.style.cssText = params.css.label;
      }
      html.appendChild(label);
      // Email button
      if (params.isEmail) {
        const emailButton = document.createElement('A');
        emailButton.href = 'javascript:void(0);';
        emailButton.className = 'textbox-send-email-button';
        emailButton.target = '_blank';
        html.appendChild(emailButton);
      }
      // Input
      const input = document.createElement('INPUT');
      // Mapeo de inputType a type HTML
      const inputTypeMap = {
        'password': 'password',
        'email': 'email',
        'phone': 'tel',
        'url': 'url',
        'number': 'number',
        'numeric': 'number',
        'search': 'search',
        'text': 'text',
        'date': 'text'
      };
      input.type = inputTypeMap[params.inputType] || 'text';
      input.id = params.id;
      if (params.css?.input) {
        input.style.cssText = params.css.input;
      }
      const setAttributeIf = (attr, value) => {
        if (value) input.setAttribute(attr, value);
      };
      setAttributeIf('pattern', params.pattern);
      setAttributeIf('value', params.value);
      setAttributeIf('placeholder', getLocalizedText(params.placeholder));
      setAttributeIf('tabindex', params.tabindex);
      setAttributeIf('max', params.maxLength);
      setAttributeIf('min', params.minLength);
      setAttributeIf('title', getLocalizedText(params.tooltip));
      
      // ========== SISTEMA DE SANITIZACIÓN ==========
      // Configurar inputType para sanitización
      if (params.inputType) {
        input.setAttribute('data-input-type', params.inputType);
      }
      
      // Configurar sanitización automática en input
      if (params.sanitizeOnInput === true) {
        input.setAttribute('data-sanitize-input', 'true');
        // Agregar evento de sanitización en tiempo real
        input.addEventListener('input', function() {
          var currentValue = this.value;
          var cursorPosition = this.selectionStart;
          var inputType = this.getAttribute('data-input-type');
          
          if (inputType) {
            var sanitizedValue = DataSanitizer.sanitize(currentValue, inputType);
            if (sanitizedValue !== currentValue) {
              this.value = sanitizedValue;
              // Mantener posición del cursor
              this.setSelectionRange(cursorPosition, cursorPosition);
            }
          }
        });
      }
      
      // Configurar sanitización en output (al obtener valor)
      if (params.sanitizeOnOutput === true) {
        input.setAttribute('data-sanitize-output', 'true');
      }
      
      // Configurar validación requerida
      if (params.required === true) {
        input.setAttribute('required', 'true');
        input.setAttribute('data-required', 'true');
      }
      
      // Configurar longitudes para validación
      if (params.minLength) {
        input.setAttribute('data-min-length', params.minLength);
      }
      if (params.maxLength) {
        input.setAttribute('data-max-length', params.maxLength);
      }
      
      // ========== VALIDACIÓN AUTOMÁTICA ==========
      // Validar automáticamente al perder foco (blur) si existe inputType
      if (params.inputType) {
        input.addEventListener('blur', function() {
          const textboxInstance = ns.textbox('#' + this.id);
          if (textboxInstance && typeof textboxInstance.validate === 'function') {
            textboxInstance.validate();
          }
        });
        
        // Validar en tiempo real (input) si se especifica validateOnInput
        if (params.validateOnInput === true) {
          input.addEventListener('input', function() {
            const textboxInstance = ns.textbox('#' + this.id);
            if (textboxInstance && typeof textboxInstance.validate === 'function') {
              textboxInstance.validate();
            }
          });
        }
      }
      // ========== FIN VALIDACIÓN AUTOMÁTICA ==========
      // ========== FIN SISTEMA DE SANITIZACIÓN ==========
      
      // Configurar autocomplete para campos de contraseña
      if (input.type === 'password') {
        input.setAttribute('autocomplete', 'off');
      }
      
      if (params.readonly) {
        input.readOnly = true;
        input.setAttribute('data-readonly', '1');
      }
      if (params.disabled) {
        input.disabled = true;
        input.setAttribute('data-disabled', '1');
      }
      // Event handlers - dual path for form-referenced vs standalone textboxes
      if (ro_form && ro_page !== null && ro_control !== null) {
        // Path 1: Form-referenced textboxes
        const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
        const events = ['onchange', 'onfocus', 'onblur', 'onclick', 'onpaste', 'oncut', 'oninput', 'onmouseover', 'onmouseout'];
        const keyEvents = ['onkeydown', 'onkeyup', 'onkeypress'];
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            input.setAttribute(event, `${formPath}.${event}(this)`);
          }
        });
        keyEvents.forEach(event => {
          if (typeof params[event] === 'function') {
            input.setAttribute(event, `${formPath}.${event}(this, (event.keyCode || event.which))`);
          }
        });
      } else {
        // Path 2: Standalone textboxes - direct function storage like ns.button
        const events = ['onchange', 'onfocus', 'onblur', 'onclick', 'onpaste', 'oncut', 'oninput', 'onmouseover', 'onmouseout'];
        const keyEvents = ['onkeydown', 'onkeyup', 'onkeypress'];
        
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            // Almacenar la función directamente en el elemento como hace ns.button
            input[`_mangole${event}`] = params[event];
            input.setAttribute(event, `if(this._mangole${event}){this._mangole${event}(this)}`);
          }
        });
        
        keyEvents.forEach(event => {
          if (typeof params[event] === 'function') {
            // Almacenar la función directamente en el elemento como hace ns.button
            input[`_mangole${event}`] = params[event];
            input.setAttribute(event, `if(this._mangole${event}){this._mangole${event}(this, (event.keyCode || event.which))}`);
          }
        });
      }
      html.appendChild(input);
      return html;
    };
    return {
      sel: () => getElement(),
      setfocus() {
        const element = validateElement('setfocus');
        if (element) {
          element.focus();
        }
      },
      value(_value) {
        const element = validateElement('value');
        if (!element) {
          return false;
        }
        if (_value !== undefined) {
          element.value = _value;
          const emailButton = element.parentNode.querySelector('.textbox-send-email-button');
          if (emailButton) {
            emailButton.setAttribute('href', `mailto:${_value}`);
          }
        } else {
          // Retorna el valor sanitizado según el inputType
          var rawValue = element.value;
          var inputType = this.getInputType();
          var sanitizeOnOutput = element.getAttribute('data-sanitize-output') === 'true';
          
          if (sanitizeOnOutput && inputType) {
            return DataSanitizer.sanitize(rawValue, inputType);
          }
          return rawValue;
        }
      },
      valueRaw() {
        // Retorna el valor sin sanitizar
        const element = validateElement('valueRaw');
        if (!element) {
          return false;
        }
        return element.value;
      },
      getInputType() {
        // Obtiene el inputType configurado en el control
        const element = validateElement('getInputType');
        if (!element) {
          return null;
        }
        return element.getAttribute('data-input-type') || null;
      },
      validate() {
        // Valida el valor actual del control
        const element = validateElement('validate');
        if (!element) {
          return false;
        }
        var inputType = this.getInputType();
        
        // Si no hay inputType, no validar (consistente con textarea/selectbox)
        if (!inputType) {
          element.removeAttribute('data-validation-errors');
          removeClass(element.parentNode, 'has-error');
          return true;
        }
        
        var value = element.value;
        var required = element.hasAttribute('required') || element.getAttribute('data-required') === 'true';
        var minLength = element.getAttribute('min') || element.getAttribute('data-min-length');
        var maxLength = element.getAttribute('max') || element.getAttribute('data-max-length');
        
        var options = {
          required: required,
          minLength: minLength ? parseInt(minLength) : null,
          maxLength: maxLength ? parseInt(maxLength) : null
        };
        
        var result = DataSanitizer.validate(value, inputType, options);
        
        // Almacenar errores en el elemento y aplicar clases visuales
        if (result.isValid) {
          element.removeAttribute('data-validation-errors');
          removeClass(element.parentNode, 'has-error');
          removeClass(element, 'input-error');
          addClass(element.parentNode, 'has-success');
          addClass(element, 'input-valid');
        } else {
          element.setAttribute('data-validation-errors', JSON.stringify(result.errors));
          removeClass(element.parentNode, 'has-success');
          removeClass(element, 'input-valid');
          addClass(element.parentNode, 'has-error');
          addClass(element, 'input-error');
        }
        
        return result.isValid;
      },
      getErrors() {
        // Retorna los errores de validación actuales
        const element = validateElement('getErrors');
        if (!element) {
          return [];
        }
        var errorsJson = element.getAttribute('data-validation-errors');
        if (errorsJson) {
          try {
            return JSON.parse(errorsJson);
          } catch(e) {
            return [];
          }
        }
        return [];
      },
      sanitize() {
        // Sanitiza el valor actual del control y lo actualiza
        const element = validateElement('sanitize');
        if (!element) {
          return false;
        }
        var inputType = this.getInputType();
        
        // Si no hay inputType, no sanitizar (consistente con textarea/selectbox)
        if (!inputType) {
          return element.value;
        }
        
        var rawValue = element.value;
        var sanitizedValue = DataSanitizer.sanitize(rawValue, inputType);
        element.value = sanitizedValue;
        return sanitizedValue;
      },
      data(_key, _value) {
        const element = validateElement('data');
        if (!element || typeof _key !== 'string') {
          return false;
        }
        if (_value === undefined) {
          return element.getAttribute(`data-${_key}`);
        } else {
          if (_value === '') {
            element.removeAttribute(`data-${_key}`);
          } else {
            element.setAttribute(`data-${_key}`, _value);
          }
        }
      },
      placeholder(_value) {
        const element = validateElement('placeholder');
        if (!element) {
          return false;
        }
        if (_value !== undefined) {
          element.setAttribute('placeholder', _value);
        } else {
          return element.getAttribute('placeholder');
        }
      },
      addClass(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      hide(callback) {
        const element = validateElement('hide');
        if (element) {
          element.parentNode.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = validateElement('show');
        if (element) {
          element.parentNode.style.display = '';
        }
        executeCallback(callback);
      },
      hidden(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.parentNode.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible(callback) {
        const element = validateElement('visible');
        if (element) {
          element.parentNode.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled(option, callback) {
        const element = validateElement('disabled');
        if (element) {
          toggleAttribute(element, 'disabled', option);
        }
        executeCallback(callback);
      },
      readonly(option, callback) {
        const element = validateElement('readonly');
        if (element) {
          toggleAttribute(element, 'readonly', option);
        }
        executeCallback(callback);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.value = params.value || '';
        params.tooltip = params.tooltip || '';
        params.placeholder = params.placeholder || '';
        params.tabindex = params.tabindex || '';
        params.pattern = params.pattern || '';
        params.maxLength = params.maxLength || '';
        params.minLength = params.minLength || '';
        params.disabled = Boolean(params.disabled);
        params.readonly = Boolean(params.readonly);
        params.isEmail = Boolean(params.isEmail);
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento textbox
        const html = createTextboxElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        executeCallback(callback);
      }
    }
    
  };

  window.checkbox = ns.checkbox = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createCheckboxElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      html.setAttribute('class', 'mangole-general-textbox');
      html.setAttribute('data-control', 'checkbox');
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      if (params.css?.parent) {
        html.setAttribute('style', params.css.parent);
      }
      // Label container
      const label = document.createElement('LABEL');
      // Input checkbox
      const input = document.createElement('INPUT');
      input.setAttribute('type', 'checkbox');
      input.setAttribute('id', params.id);
      if (params.css?.input) {
        input.setAttribute('style', params.css.input);
      }
      if (params.tabindex) {
        input.setAttribute('tabindex', params.tabindex);
      }
      if (params.checked) {
        input.setAttribute('checked', 'checked');
      }
      if (params.value) {
        input.setAttribute('value', params.value);
      }
      if (params.tooltip) {
        input.setAttribute('title', getLocalizedText(params.tooltip));
      }
      if (params.disabled) {
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('data-disabled', '1');
      }
      // Event handlers - dual path for form-referenced vs standalone checkboxes
      if (ro_form && ro_page !== null && ro_control !== null) {
        // Path 1: Form-referenced checkboxes
        const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
        const events = ['onchange', 'onfocus', 'onblur', 'onclick', 'onmouseover', 'onmouseout'];
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            input.setAttribute(event, `${formPath}.${event}(this)`);
          }
        });
      } else {
        // Path 2: Standalone checkboxes - direct function execution
        const events = ['onchange', 'onfocus', 'onblur', 'onclick', 'onmouseover', 'onmouseout'];
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            const functionName = `${params.id}_${event}_handler`;
            window[functionName] = params[event];
            input.setAttribute(event, `${functionName}(this)`);
          }
        });
      }
      // Append input and label text
      label.appendChild(input);
      let labelText = getLocalizedText(params.label);
      // Agregar asterisco si es required y no lo tiene ya
      if (params.required === true && !labelText.includes('*')) {
        labelText += ' *';
      }
      label.appendChild(document.createTextNode(labelText));
      if (params.css?.label) {
        label.style.cssText = params.css.label;
      }
      html.appendChild(label);
      return html;
    };
    return {
      sel: () => getElement(),
      checked(_value) {
        const element = validateElement('checked');
        if (!element) {
          return false;
        }
        if (typeof _value === 'string' || typeof _value === 'number') {
          element.checked = !(_value == 0 || _value == false);
        } else {
          return element.checked ? 1 : 0;
        }
      },
      data(_key, _value) {
        const element = validateElement('data');
        if (!element || typeof _key !== 'string') {
          return false;
        }
        if (_value === undefined) {
          return element.getAttribute(`data-${_key}`);
        } else {
          if (_value === '') {
            element.removeAttribute(`data-${_key}`);
          } else {
            element.setAttribute(`data-${_key}`, _value);
          }
        }
      },
      addClass(_className) {
        const element = validateElement('addClass');
        if (!element) {
          return false;
        }
        addClass(element, _className);
      },
      removeClass(_className) {
        const element = validateElement('removeClass');
        if (!element) {
          return false;
        }
        removeClass(element, _className);
      },
      hasClass(_className) {
        const element = validateElement('hasClass');
        if (!element) {
          return false;
        }
        return hasClass(element, _className);
      },
      hide(callback) {
        const element = validateElement('hide');
        if (element) {
          element.parentNode.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = validateElement('show');
        if (element) {
          element.parentNode.style.display = '';
        }
        executeCallback(callback);
      },
      hidden(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.parentNode.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible(callback) {
        const element = validateElement('visible');
        if (element) {
          element.parentNode.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return false;
        }
        if (option === true) {
          element.setAttribute('disabled', 'disabled');
        } else if (option === false) {
          element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.description = params.description || '';
        params.tooltip = params.tooltip || '';
        params.value = params.value || '';
        params.tabindex = params.tabindex || '';
        params.disabled = Boolean(params.disabled);
        params.checked = Boolean(params.checked);
        // CSS normalization
        params.css = {
          parent: params.css?.parent || null,
          input: params.css?.input || ''
        };
        const isDesignMode = params.devmode === 'design';
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        // Crear elemento checkbox
        const html = createCheckboxElement(params, ro_form, ro_page, ro_control, isDesignMode);
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html.outerHTML;
        }
        if (callback && typeof callback === 'function') {
          callback(html.outerHTML);
        }
      }
    };
  };

  window.inputfile = ns.inputfile = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const hasClass = (element, className) => {
      if (element.classList) {
        return element.classList.contains(className);
      } else {
        return new RegExp(`(^| )${className}( |$)`, 'gi').test(element.className);
      }
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createInputFileElement = (params) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      html.setAttribute('class', 'mangole-general-inputfile multiplesImagesUpload');
      html.setAttribute('data-control', 'inputfile');
      if (params.description && params.description !== '') {
        html.innerHTML = `<span class="mangole-general-inputfile-description">${getLocalizedText(params.description)}</span>`;
      }
      if (params.label && params.label !== '') {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mangole-general-inputfile-label';
        labelSpan.innerHTML = getLocalizedText(params.label);
        if (params.css?.label) {
          labelSpan.style.cssText = params.css.label;
        }
        html.appendChild(labelSpan);
      }
      if (params.css?.parent) {
        html.setAttribute('style', params.css.parent);
      }
      return html;
    };
    const initializeUploadFile = (params) => {
      if (typeof uploadFile !== 'undefined' && uploadFile.init) {
        uploadFile.init({
          wrapper: params.id,
          uploadScript: params.uploadScript,
          uploadTempFolder: params.uploadTempFolder,
          showRemoteImages: false,
          remoteImagesScript: '/upload_image.php?key=show',
          images: '',
          inputName: `${params.id}input`,
          imagesWidth: params.imagesWidth[0],
          maxImages: params.maxImages,
          uploadFolder: params.uploadFolder,
          crop: params.crop,
          defaultImages: params.defaultImages,
          buttonText: params.buttonText,
          onuploaded: params.onuploaded
        });
      }
    };
    return {
      setfocus() {
        const element = validateElement('setfocus');
        if (element) {
          element.focus();
        }
      },
      hide(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      hidden(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.parentNode.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible(callback) {
        const element = validateElement('visible');
        if (element) {
          element.parentNode.style.visibility = '';
        }
        executeCallback(callback);
      },
      disabled(option, callback) {
        const element = validateElement('disabled');
        if (element) {
          if (option === true) {
            element.setAttribute('disabled', 'disabled');
          } else if (option === false) {
            element.removeAttribute('disabled');
          }
        }
        executeCallback(callback);
      },
      readonly(option, callback) {
        const element = validateElement('readonly');
        if (element) {
          if (option === true) {
            element.setAttribute('readonly', 'readonly');
          } else if (option === false) {
            element.removeAttribute('readonly');
          }
        }
        executeCallback(callback);
      },
      addClass(_className) {
        const element = validateElement('addClass');
        if (element) {
          addClass(element, _className);
        }
      },
      removeClass(_className) {
        const element = validateElement('removeClass');
        if (element) {
          removeClass(element, _className);
        }
      },
      css: function(_prop, _value) {
        const element = validateElement('css');
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.description = params.description || '';
        params.buttonText = params.buttonText || '';
        params.uploadScript = params.uploadScript ? encodeURI(params.uploadScript) : '';
        params.imagesWidth = params.imagesWidth || ['800,800'];
        params.defaultImages = params.defaultImages || '';
        params.maxImages = params.maxImages || '';
        params.uploadFolder = params.uploadFolder ? encodeURI(params.uploadFolder) : '';
        params.crop = params.uploadFolder ? params.crop : 'no';
        params.onuploaded = (() => params.onuploaded)();
        
        // CSS normalization
        params.css = {
          parent: params.css?.parent || null,
          input: params.css?.input || ''
        };
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear elemento inputfile
        const html = createInputFileElement(params);
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
            // Inicializar el cargador de imágenes
            initializeUploadFile(params);
          });
        } else if (params.parent === '') {
          return html;
        }
        
        executeCallback(callback);
      }
    };
  };



  window.audiofileuploader = ns.audiofileuploader = function(_id){
    return {
      setfocus: function(){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'setfocus\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).focus();
        }
      },
      hide: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'hide\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).parentNode.style.display = 'none';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      show: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'show\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).parentNode.style.display = '';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      hidden: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'hidden\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).parentNode.style.visibility = 'hidden';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      visible: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'visible\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).parentNode.style.visibility = '';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      disabled: function(option,callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'disabled\' of \''+_id+'\' because is null');
          return false;
        }else{
          if (option == true){
            document.querySelector(_id).setAttribute("disabled", "disabled");
          }else if (option == false){
            document.querySelector(_id).removeAttribute("disabled");
          }
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      readonly: function(option,callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'readonly\' of \''+_id+'\' because is null');
          return false;
        }else{
          if (option == true){
            document.querySelector(_id).setAttribute("readonly", "readonly");
          }else if (option == false){
            document.querySelector(_id).removeAttribute("readonly");
          }
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      create: function(parameters,callback){
        if (typeof parameters === "undefined"){
          var parameters = {};
        }
        if (typeof parameters.form !== "undefined"){
          var ro_form = "";
          if (parameters.form instanceof Array){
            for (var i = 0; i < parameters.form.length; i++){
              ro_form += "['" + parameters.form[i] + "']";
            }
          }else{
            ro_form = "['" + parameters.form + "']";
          }
        }else{
          var ro_form = null;
        }
        if (typeof parameters.page !== "undefined"){
          var ro_page = parameters.page;
        }else{
          var ro_page = null;
        }
        if (typeof parameters.control !== "undefined"){
          var ro_control = parameters.control;
        }else{
          var ro_control = null;
        }
        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object"){
          var parameters = parameters.dataFrom;
        }
        parameters.id = (typeof parameters.id === "undefined") ? id = id.panel() : id = parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined") ? "" : parameters.parent;
        parameters.label = (typeof parameters.label === "undefined" || parameters.label == null) ? "" : parameters.label;
        parameters.description = (typeof parameters.description === "undefined" || parameters.description == null) ? "" : parameters.description;
        parameters.uploadScript = (typeof parameters.uploadScript === "undefined" || parameters.uploadScript == null) ? "" : parameters.uploadScript;
        parameters.maxFiles = (typeof parameters.maxFiles === "undefined" || parameters.maxFiles == null) ? 0 : parameters.maxFiles;
        parameters.uploadFolder = (typeof parameters.uploadFolder === "undefined" || parameters.uploadFolder == null) ? "" : parameters.uploadFolder;
        parameters.onuploaded = (function(){ return parameters.onuploaded })();
        if (document.getElementById(parameters.id)){
          console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
        }
        if (typeof parameters.css === "undefined" || parameters.css == null){
          parameters.css = {parent: null};
          parameters.css = {input: ""};
        }else{
          parameters.css.parent = (typeof parameters.css.parent === "undefined" || parameters.css.parent == null) ? null : parameters.css.parent;
          parameters.css.input = (typeof parameters.css.input === "undefined" || parameters.css.input == null) ? "" : parameters.css.input;
        }
        var html = document.createElement("DIV");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-general-inputfile multiplesImagesUpload");
        html.setAttribute("data-control", "inputfile");

        if (typeof parameters.css.parent !== "undefined" && parameters.css.parent != null){
          html.setAttribute("style", parameters.css.parent);
        }
        if (typeof parameters.parent !== "undefined" && parameters.parent != "" && parameters.parent != null){
          ns.fillControl(parameters.parent, html, function(html, selector){
            selector.appendChild(html);
            //Inicializar el cargador de imágenes
            upAudioFile.init({
              'wrapper'           : parameters.id,
              'genresArray'       : parameters.genresArray,
              'uploadScript'      : parameters.uploadScript,
              'uploadTempFolder'  : parameters.uploadTempFolder,
              'showRemoteFiles'   : false,
              'remoteImagesScript': '/upload_image.php?key=show',
              'inputName'         : parameters.id + 'input',
              'uploadFolder'      : parameters.uploadFolder,
              'maxFiles'          : (typeof parameters.maxFiles === "undefined" || parameters.maxFiles == 0) ? 200 : parameters.maxFiles,
              'onuploaded'        : parameters.onuploaded
            });
          });
        }else if (parameters.parent == ""){
          return html;
        }
        if (callback && typeof(callback) === "function"){
          callback();
        }
      }
    }
  };


  window.fileuploader = ns.fileuploader = function(_id){
    return {
      setfocus: function(){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'setfocus\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).focus();
        }
      },
      hide: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'hide\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).style.display = 'none';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      show: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'show\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).style.display = '';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      hidden: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'hidden\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).style.visibility = 'hidden';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      visible: function(callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'visible\' of \''+_id+'\' because is null');
          return false;
        }else{
          document.querySelector(_id).style.visibility = '';
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      disabled: function(option,callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'disabled\' of \''+_id+'\' because is null');
          return false;
        }else{
          if (option == true){
            document.querySelector(_id).setAttribute("disabled", "disabled");
          }else if (option == false){
            document.querySelector(_id).removeAttribute("disabled");
          }
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      readonly: function(option,callback){
        if (document.querySelector(_id) === null){
          console.log('Uncaught TypeError: Cannot read property \'readonly\' of \''+_id+'\' because is null');
          return false;
        }else{
          if (option == true){
            document.querySelector(_id).setAttribute("readonly", "readonly");
          }else if (option == false){
            document.querySelector(_id).removeAttribute("readonly");
          }
        }
        if (typeof callback === "function"){
          callback();
        }
      },
      create: function(parameters,callback){
        if (typeof parameters === "undefined"){
          var parameters = {};
        }
        if (typeof parameters.form !== "undefined"){
          var ro_form = "";
          if (parameters.form instanceof Array){
            for (var i = 0; i < parameters.form.length; i++){
              ro_form += "['" + parameters.form[i] + "']";
            }
          }else{
            ro_form = "['" + parameters.form + "']";
          }
        }else{
          var ro_form = null;
        }
        if (typeof parameters.page !== "undefined"){
          var ro_page = parameters.page;
        }else{
          var ro_page = null;
        }
        if (typeof parameters.control !== "undefined"){
          var ro_control = parameters.control;
        }else{
          var ro_control = null;
        }
        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object"){
          var parameters = parameters.dataFrom;
        }

        parameters.id = (typeof parameters.id === "undefined") ? id = id.panel() : id = parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined") ? "" : parameters.parent;
        parameters.label = (typeof parameters.label === "undefined" || parameters.label == null) ? "" : parameters.label;
        parameters.description = (typeof parameters.description === "undefined" || parameters.description == null) ? "" : parameters.description;
        parameters.tooltip = (typeof parameters.tooltip === "undefined" || parameters.tooltip == null) ? "" : ((parameters.tooltip instanceof Array) ? parameters.tooltip[ns.languageIndex] : parameters.tooltip);
        parameters.uploadScript = (typeof parameters.uploadScript === "undefined" || parameters.uploadScript == null) ? "" : parameters.uploadScript;
        parameters.maxFiles = (typeof parameters.maxFiles === "undefined" || parameters.maxFiles == null) ? 0 : parameters.maxFiles;
        parameters.uploadFolder = (typeof parameters.uploadFolder === "undefined" || parameters.uploadFolder == null) ? "" : parameters.uploadFolder;
        parameters.onuploaded = (function(){ return parameters.onuploaded })();
        
        if (document.getElementById(parameters.id)){
          console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
        }

        if (typeof parameters.css === "undefined" || parameters.css == null){
          parameters.css = {parent: null};
          parameters.css = {input: ""};
        }else{
          parameters.css.parent = (typeof parameters.css.parent === "undefined" || parameters.css.parent == null) ? null : parameters.css.parent;
          parameters.css.input = (typeof parameters.css.input === "undefined" || parameters.css.input == null) ? "" : parameters.css.input;
        }

        var html = document.createElement("DIV");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-general-inputfile multiplesFilesUpload");
        html.setAttribute("data-control", "inputfile");

        if (typeof parameters.css.parent !== "undefined" && parameters.css.parent != null){
          html.setAttribute("style", parameters.css.parent);
        }
        if (typeof parameters.parent !== "undefined" && parameters.parent != "" && parameters.parent != null){
          ns.fillControl(parameters.parent, html, function(html, selector){
            selector.appendChild(html);
            //Inicializar el cargador de imágenes
            upFile.init({
              'wrapper'           : parameters.id,
              'uploadScript'      : parameters.uploadScript,
              'uploadTempFolder'  : parameters.uploadTempFolder,
              'showRemoteFiles'   : false,
              'remoteImagesScript': '/upload_file.php?key=show',
              'inputName'         : parameters.id + 'input',
              'uploadFolder'      : parameters.uploadFolder,
              'maxFiles'          : (typeof parameters.maxFiles === "undefined" || parameters.maxFiles == 0) ? 200 : parameters.maxFiles,
              'onuploaded'        : parameters.onuploaded
            });
          });
        }else if (parameters.parent == ""){
          return html;
        }
        if (callback && typeof(callback) === "function"){
          callback();
        }
      }
    }
  };


  window.orderedlist = ns.orderedlist = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const addClass = (element, className) => {
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ` ${className}`;
      }
    };
    const removeClass = (element, className) => {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(
          new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), 
          ' '
        );
      }
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createListItem = (itemData, element) => {
      const html = document.createElement('DIV');
      
      // Set data attributes
      if (itemData.attr) {
        Object.keys(itemData.attr).forEach(key => {
          if (itemData.attr.hasOwnProperty(key)) {
            html.setAttribute(`data-${key}`, itemData.attr[key]);
          }
        });
        html.setAttribute('data-deleted', '1');
        html.setAttribute('data-isnew', itemData.attr.isnew || 'yes');
      }
      
      // Set ID if provided
      if (itemData.id) {
        html.id = itemData.id;
      }
      
      // Set class
      const itemClass = `mangole-orderedlist-item${itemData.class ? ` ${itemData.class}` : ''}`;
      html.setAttribute('class', itemClass);
      
      // Create content with optional delete button
      const deleteButton = shouldShowDeleteButton(element) 
        ? createDeleteButton() 
        : '';
      html.innerHTML = itemData.text + deleteButton;
      
      return html;
    };
    const shouldShowDeleteButton = (element) => {
      return element.getAttribute('data-deletebutton') === null || 
             element.getAttribute('data-deletebutton') === 'true';
    };
    const createDeleteButton = () => {
      return `<div class="mangole-orderedlist-item-remove" onclick="this.parentNode.setAttribute('data-deleted', 0); this.parentNode.style.display = 'none'; var _this = this, isdeleted = setInterval(function(){ if ( _this.parentNode.getAttribute('data-deleted') == 0 ){ clearInterval(isdeleted); eval( _this.parentNode.parentNode.getAttribute('data-onitemdeleted') ); if (_this.parentNode.parentNode.getAttribute('data-onchange') != null ){ eval(_this.parentNode.parentNode.getAttribute('data-onchange')); } } }, 10); ">×</div>`;
    };
    const initializeSortable = (element) => {
      if ((element.getAttribute('data-sortable') === null || element.getAttribute('data-sortable') === 'true') && 
          typeof $ !== 'undefined' && $.fn.sortable) {
        $(_id).sortable({
          placeholder: 'ui-state-highlight',
          cancel: '.feet'
        }).disableSelection();
      }
    };
    const triggerOnChange = (element) => {
      const onChangeAttr = element.getAttribute('data-onchange');
      if (onChangeAttr) {
        eval(onChangeAttr);
      }
    };
    const extractDataAttributes = (element) => {
      const data = {};
      Array.from(element.attributes).forEach(attr => {
        if (/^data-/.test(attr.name)) {
          const camelCaseName = attr.name.substr(5).replace(/-(.)/g, (match, letter) => 
            letter.toUpperCase()
          );
          data[camelCaseName] = attr.value;
        }
      });
      return data;
    };
    const getFirstTextNode = (element) => {
      for (let i = 0; i < element.childNodes.length; i++) {
        const curNode = element.childNodes[i];
        const whitespace = /^\s*$/;
        if (curNode.nodeName === '#text' && !whitespace.test(curNode.nodeValue)) {
          return curNode.nodeValue;
        }
      }
      return '';
    };
    const processDataArray = (dataArray, targetElement, clearFirst = false) => {
      if (clearFirst) {
        targetElement.innerHTML = '';
      }
      
      dataArray.forEach(itemData => {
        const listItem = createListItem(itemData, targetElement);
        targetElement.appendChild(listItem);
      });
      
      initializeSortable(targetElement);
      triggerOnChange(targetElement);
    };
    const createOrderedListElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      html.setAttribute('id', params.id);
      
      const className = `mangole-orderedlist${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', className);
      html.setAttribute('data-control', 'orderedlist');
      
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      
      if (params.deletebutton === false) {
        html.setAttribute('data-deletebutton', params.deletebutton);
      }
      if (params.sortable === false) {
        html.setAttribute('data-sortable', params.sortable);
      }
      
      if (params.css?.parent) {
        html.setAttribute('style', params.css.parent);
      }
      
      // Event handlers - dual path for form-referenced vs standalone orderedlists
      if (typeof params.onitemdeleted === 'function') {
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced orderedlists
          html.setAttribute('data-onitemdeleted', `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].onitemdeleted('${params.id}')`);
        } else {
          // Path 2: Standalone orderedlists - direct function execution
          const functionName = `${params.id}_onitemdeleted_handler`;
          window[functionName] = params.onitemdeleted;
          html.setAttribute('data-onitemdeleted', `${functionName}('${params.id}')`);
        }
      }
      
      if (typeof params.onchange === 'function') {
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced orderedlists
          html.setAttribute('data-onchange', `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].onchange('${params.id}')`);
        } else {
          // Path 2: Standalone orderedlists - direct function execution
          const functionName = `${params.id}_onchange_handler`;
          window[functionName] = params.onchange;
          html.setAttribute('data-onchange', `${functionName}('${params.id}')`);
        }
      }
      
      return html;
    };
    
    return {
      hide(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      hidden(callback) {
        const element = validateElement('hidden');
        if (element) {
          element.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },
      visible(callback) {
        const element = validateElement('visible');
        if (element) {
          element.style.visibility = '';
        }
        executeCallback(callback);
      },
      addClass(_className) {
        const element = validateElement('addClass');
        if (element) {
          addClass(element, _className);
        }
      },
      removeClass(_className) {
        const element = validateElement('removeClass');
        if (element) {
          removeClass(element, _className);
        }
      },
      append(_data, callback) {
        const element = validateElement('append');
        if (element && Array.isArray(_data)) {
          processDataArray(_data, element, false);
        }
        executeCallback(callback);
      },
      fill(_data, callback) {
        const element = validateElement('fill');
        if (element && Array.isArray(_data)) {
          processDataArray(_data, element, true);
        }
        executeCallback(callback);
      },
      clear() {
        const element = validateElement('clear');
        if (element) {
          element.innerHTML = '';
          triggerOnChange(element);
        }
      },
      getList(callback) {
        const element = getElement();
        const items = element ? element.querySelectorAll('div.mangole-orderedlist-item') : [];
        
        const listArray = Array.from(items).map(item => ({
          text: getFirstTextNode(item),
          attr: extractDataAttributes(item)
        }));
        
        if (typeof callback === 'function') {
          callback(listArray);
        } else {
          return listArray;
        }
      },
      getOnlyActiveItems(callback) {
        const element = getElement();
        const activeItems = element ? element.querySelectorAll('div.mangole-orderedlist-item[data-deleted="1"]') : [];
        
        const listArray = Array.from(activeItems).map(item => ({
          text: getFirstTextNode(item),
          attr: extractDataAttributes(item)
        }));
        
        if (typeof callback === 'function') {
          callback(listArray);
        } else {
          return listArray;
        }
      },
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.class = params.class || '';
        
        // CSS normalization
        params.css = {
          parent: params.css?.parent || null,
          item: params.css?.item || ''
        };
        
        const isDesignMode = params.devmode === 'design';
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear elemento orderedlist
        const html = createOrderedListElement(params, ro_form, ro_page, ro_control, isDesignMode);
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        
        executeCallback(callback);
      }
    };
  };

  window.textarea = ns.textarea = function(_id){
    // Helper functions reutilizables
    const getElement = (methodName) => {
      const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${methodName}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };

    const executeCallback = (callback) => {
      if (typeof callback === "function") callback();
    };

    const getLocalizedText = (text) => {
      return Array.isArray(text) ? text[ns.languageIndex] : text;
    };

    const toggleAttribute = (element, attribute, value) => {
      if (value === true) {
        element.setAttribute(attribute, attribute);
      } else if (value === false) {
        element.removeAttribute(attribute);
      }
    };

    const isRichTextArea = (element) => {
      return element.getAttribute("data-isrichtextarea") === 'true';
    };

    return {
      setfocus() {
        const element = getElement('setfocus');
        if (element) {
          element.focus();
        }
      },

      addClass(_className) {
        const element = getElement('addClass');
        if (!element) {
          return false;
        }
        
        if (element.classList) {
          element.classList.add(_className);
        } else {
          element.className += ' ' + _className;
        }
      },

      removeClass(_className) {
        const element = getElement('removeClass');
        if (!element) {
          return false;
        }
        
        if (element.classList) {
          element.classList.remove(_className);
        } else {
          const regex = new RegExp('(^|\\b)' + _className.split(' ').join('|') + '(\\b|$)', 'gi');
          element.className = element.className.replace(regex, ' ');
        }
      },
      value(_value) {
        const element = getElement('value');
        if (!element) return false;

        if (_value !== undefined) {
          // Setter
          if (isRichTextArea(element)) {
            element.value = _value;
            
            // Para rich text areas con Quill editor
            const setRichTextValue = () => {
              const editor = element.querySelector('div.ql-editor');
              if (editor) {
                editor.innerHTML = _value;
                return true;
              }
              return false;
            };

            // Intentar establecer el valor inmediatamente, si no funciona, usar interval
            if (!setRichTextValue()) {
              const interval = setInterval(() => {
                if (setRichTextValue()) {
                  clearInterval(interval);
                }
              }, 10);
              
              // Timeout de seguridad
              setTimeout(() => clearInterval(interval), 1000);
            }
          } else {
            element.value = _value;
          }
        } else {
          // Getter con sanitización opcional
          let rawValue;
          
          if (isRichTextArea(element)) {
            const editor = element.querySelector('div.ql-editor');
            rawValue = editor ? editor.innerHTML : '';
            element.value = rawValue;
          } else {
            rawValue = element.value;
          }
          
          // 🆕 Aplicar sanitización si está configurada
          const sanitizeOnOutput = element.getAttribute('data-sanitize-output') === 'true';
          const inputType = element.getAttribute('data-input-type');
          
          if (sanitizeOnOutput && inputType && typeof DataSanitizer !== 'undefined') {
            return DataSanitizer.sanitize(rawValue, inputType);
          }
          
          return rawValue;
        }
      },
      append(_value) {
        if (typeof _value !== "string" && typeof _value !== "number") {
          return false;
        }
        
        const element = getElement('append');
        if (!element) {
          return false;
        }

        if (isRichTextArea(element)) {
          // Para rich text areas, buscar la instancia de Quill correspondiente
          const quillInstance = window.quill?.find(q => `#${q.id}` === _id);
          if (quillInstance) {
            quillInstance.instance.root.innerHTML += _value;
          }
        } else {
          element.value += _value;
        }
      },
      data(_key, _value) {
        const element = getElement('data');
        if (!element || typeof _key !== "string") {
          return false;
        }
        
        const dataKey = "data-" + _key;
        
        if (_value === undefined) {
          // Getter
          return element.getAttribute(dataKey);
        } else {
          // Setter
          if (_value === "") {
            element.removeAttribute(dataKey);
          } else {
            element.setAttribute(dataKey, _value);
          }
        }
      },

      placeholder(_value) {
        const element = getElement('placeholder');
        if (!element) {
          return false;
        }
        
        if (_value !== undefined) {
          element.setAttribute('placeholder', _value);
        } else {
          return element.getAttribute('placeholder');
        }
      },
      hasClass(_className) {
        const element = getElement('hasClass');
        if (!element) {
          return false;
        }
        
        if (element.classList) {
          return element.classList.contains(_className);
        } else {
          return new RegExp('(^| )' + _className + '( |$)', 'gi').test(element.className);
        }
      },

      hide(callback) {
        const element = getElement('hide');
        if (element) {
          element.parentNode.style.display = 'none';
        }
        executeCallback(callback);
      },

      show(callback) {
        const element = getElement('show');
        if (element) {
          element.parentNode.style.display = '';
        }
        executeCallback(callback);
      },

      hidden(callback) {
        const element = getElement('hidden');
        if (element) {
          element.parentNode.style.visibility = 'hidden';
        }
        executeCallback(callback);
      },

      visible(callback) {
        const element = getElement('visible');
        if (element) {
          element.parentNode.style.visibility = '';
        }
        executeCallback(callback);
      },

      disabled(option, callback) {
        const element = getElement('disabled');
        if (element) {
          toggleAttribute(element, 'disabled', option);
        }
        executeCallback(callback);
      },

      readonly(option, callback) {
        const element = getElement('readonly');
        if (!element) {
          return false;
        }

        if (isRichTextArea(element)) {
          // Para rich text areas, cambiar contenteditable del editor
          const editor = element.querySelector('.ql-editor');
          if (editor) {
            editor.contentEditable = option ? "false" : "true";
          }
        } else {
          // Para textarea normal
          toggleAttribute(element, 'readonly', option);
        }
        
        executeCallback(callback);
      },
      
      // 🆕 Métodos de Sanitización y Validación (v1.0.19)
      valueRaw() { //Retorna el valor sin sanitizar
        const element = getElement('valueRaw');
        if (!element) return '';
        
        if (isRichTextArea(element)) {
          const editor = element.querySelector('div.ql-editor');
          return editor ? editor.innerHTML : '';
        }
        return element.value;
      },
      
      validate() { //Valida el campo según su configuración
        const element = getElement('validate');
        if (!element) return true;
        
        const inputType = element.getAttribute('data-input-type');
        const required = element.getAttribute('data-required') === 'true';
        
        if (!inputType) return true; // Sin validación si no hay inputType
        
        const value = isRichTextArea(element) 
          ? (element.querySelector('div.ql-editor')?.innerHTML || '')
          : element.value;
        
        const validation = DataSanitizer.validate(value, inputType, { required: required });
        
        // Aplicar clases visuales
        if (validation.isValid) {
          removeClass(element.parentNode, 'has-error');
          removeClass(element, 'input-error');
          addClass(element.parentNode, 'has-success');
          addClass(element, 'input-valid');
        } else {
          removeClass(element.parentNode, 'has-success');
          removeClass(element, 'input-valid');
          addClass(element.parentNode, 'has-error');
          addClass(element, 'input-error');
        }
        
        return validation.isValid;
      },
      
      getErrors() { //Retorna array de errores de validación
        const element = getElement('getErrors');
        if (!element) return [];
        
        const inputType = element.getAttribute('data-input-type');
        const required = element.getAttribute('data-required') === 'true';
        
        if (!inputType) return [];
        
        const value = isRichTextArea(element)
          ? (element.querySelector('div.ql-editor')?.innerHTML || '')
          : element.value;
        
        const validation = DataSanitizer.validate(value, inputType, { required: required });
        return validation.errors;
      },
      
      sanitize() { //Sanitiza manualmente el valor actual
        const element = getElement('sanitize');
        if (!element) return;
        
        const inputType = element.getAttribute('data-input-type');
        if (!inputType) return;
        
        if (isRichTextArea(element)) {
          const editor = element.querySelector('div.ql-editor');
          if (editor) {
            editor.innerHTML = DataSanitizer.sanitize(editor.innerHTML, inputType);
          }
        } else {
          element.value = DataSanitizer.sanitize(element.value, inputType);
        }
      },
      
      getInputType() { //Retorna el inputType configurado
        const element = getElement('getInputType');
        if (!element) return null;
        return element.getAttribute('data-input-type');
      },
      
      css: function(_prop, _value) {
        const element = getElement('css');
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      
      create(parameters = {}, callback) {
        // Normalización de parámetros del formulario
        const getFormPath = () => {
          if (!parameters.form){ 
            return null
          };
          if (Array.isArray(parameters.form)) {
            return parameters.form.map(f => `['${f}']`).join('');
          }
          return `['${parameters.form}']`;
        };

        const ro_form = getFormPath();
        const ro_page = parameters.page ?? null;
        const ro_control = parameters.control ?? null;

        // Si dataFrom está definido, usar sus propiedades
        if (parameters.dataFrom && typeof parameters.dataFrom === "object") {
          parameters = parameters.dataFrom;
        }

        // Normalización de parámetros con valores por defecto más limpia
        const defaults = {
          id: parameters.id || id.panel(),
          parent: parameters.parent || "",
          label: parameters.label || "",
          value: parameters.value || "",
          description: parameters.description || "",
          tooltip: parameters.tooltip || "",
          disabled: Boolean(parameters.disabled),
          readonly: Boolean(parameters.readonly),
          maxLength: parameters.maxLength || "",
          minLength: parameters.minLength || "",
          tabindex: parameters.tabindex || "",
          placeholder: parameters.placeholder || "",
          pattern: parameters.pattern || "",
          isrichtextarea: Boolean(parameters.isrichtextarea),
          toolbar: parameters.toolbar || ""
        };

        // Merge de parámetros optimizado
        parameters = { ...parameters, ...defaults };
        
        // Validación de ID único
        if (document.getElementById(parameters.id)) {
          console.error(`Se ha creado otro elemento con el ID "${parameters.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }

        // Normalización de CSS con valores por defecto
        parameters.css = {
          parent: parameters.css?.parent || null,
          input: parameters.css?.input || ""
        };

        // Creación del contenedor principal
        const html = document.createElement("DIV");
        
        // Construcción de clases CSS de forma más limpia
        const cssClasses = [
          "mangole-general-textbox",
          parameters.class
        ].filter(Boolean).join(" ");
        
        html.className = cssClasses;
        html.setAttribute("data-control", "textarea");

        // Configuraciones condicionales
        if (parameters.devmode === "design") {
          html.setAttribute("data-role", "draggable");
        }

        if (parameters.css.parent) {
          html.style.cssText = parameters.css.parent;
        }

        // Creación y adición del label
        const label = document.createElement("LABEL");
        let labelText = getLocalizedText(parameters.label);
        // Agregar asterisco si es required y no lo tiene ya
        if (parameters.required === true && !labelText.includes('*')) {
          labelText += ' *';
        }
        label.textContent = labelText;
        if (parameters.css?.label) {
          label.style.cssText = parameters.css.label;
        }
        html.appendChild(label);

        // Creación del elemento de entrada (textarea o div para rich text)
        const input = document.createElement(parameters.isrichtextarea ? "DIV" : "TEXTAREA");
        input.id = parameters.id;

        // Configuración específica para rich text area
        if (parameters.isrichtextarea) {
          input.className = "quilleditor";
          input.setAttribute("data-isrichtextarea", "true");
        }

        // Helper function para establecer atributos condicionales
        const setAttributeIf = (element, attr, value) => {
          if (value) element.setAttribute(attr, value);
        };

        // Aplicar CSS personalizado
        if (parameters.css.input) {
          input.style.cssText = parameters.css.input;
        }

        // Configuración de valor inicial
        if (parameters.value) {
          if (parameters.isrichtextarea) {
            input.innerHTML = parameters.value;
          } else {
            input.value = parameters.value;
          }
        }

        // Configurar atributos
        setAttributeIf(input, "title", getLocalizedText(parameters.tooltip));

        // Estados del textarea
        if (parameters.readonly) {
          input.readOnly = true;
          input.setAttribute("data-readonly", "1");
        }

        if (parameters.disabled) {
          input.disabled = true;
          input.setAttribute("data-disabled", "1");
        }
        
        // 🆕 Configuración de sanitización y validación
        if (typeof parameters.inputType !== 'undefined' && parameters.inputType) {
          input.setAttribute('data-input-type', parameters.inputType);
        }
        
        if (typeof parameters.sanitizeOnInput !== 'undefined' && parameters.sanitizeOnInput === true) {
          input.setAttribute('data-sanitize-input', 'true');
        }
        
        if (typeof parameters.sanitizeOnOutput !== 'undefined' && parameters.sanitizeOnOutput === true) {
          input.setAttribute('data-sanitize-output', 'true');
        }
        
        if (typeof parameters.required !== 'undefined' && parameters.required === true) {
          input.setAttribute('data-required', 'true');
        }
        
        // ========== VALIDACIÓN AUTOMÁTICA ==========
        // Validar automáticamente al perder foco (blur) si existe inputType
        if (parameters.inputType) {
          input.addEventListener('blur', function() {
            const textareaInstance = ns.textarea('#' + this.id);
            if (textareaInstance && typeof textareaInstance.validate === 'function') {
              textareaInstance.validate();
            }
          });
          
          // Validar en tiempo real (input) si se especifica validateOnInput
          if (parameters.validateOnInput === true) {
            input.addEventListener('input', function() {
              const textareaInstance = ns.textarea('#' + this.id);
              if (textareaInstance && typeof textareaInstance.validate === 'function') {
                textareaInstance.validate();
              }
            });
          }
        }
        // ========== FIN VALIDACIÓN AUTOMÁTICA ==========
        
        // Configuración de event handlers (opcional - actualmente comentados en el código original)
        const hasFormReferences = ro_form && ro_page !== null && ro_control !== null;
        
        if (hasFormReferences) {
          const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
          
          // Los event handlers están comentados en el código original
          // Se pueden habilitar si se necesitan en el futuro
          /*
          const eventHandlers = {
            onchange: 'onchange(this)',
            onfocus: 'onfocus(this)', 
            onblur: 'onblur(this)',
            onkeydown: 'onkeydown(this, (event.keyCode || event.which))',
            onkeyup: 'onkeyup(this, (event.keyCode || event.which))',
            onclick: 'onclick(this)',
            onpaste: 'onpaste(this)',
            oncut: 'oncut(this)',
            oninput: 'oninput(this)',
            onmouseover: 'onmouseover(this)',
            onmouseout: 'onmouseout(this)',
            onkeypress: 'onkeypress(this, (event.keyCode || event.which))'
          };

          Object.entries(eventHandlers).forEach(([event, handler]) => {
            if (typeof parameters[event] === "function") {
              input.setAttribute(event, `${formPath}.${handler}`);
            }
          });
          */
        }

        // Agregar el input al contenedor
        html.appendChild(input);

        // Gestión del parent y inicialización
        if (parameters.parent) {
          ns.fillControl(parameters.parent, html, (html, selector) => {
            selector.appendChild(html);

            if (parameters.isrichtextarea) {
              // Configuración de Quill editor para rich text areas
              const initializeQuillEditor = () => {
                const options = {
                  theme: 'snow',
                  modules: {
                    imageResize: {
                      displaySize: true
                    }
                  }
                };

                // Agregar toolbar personalizada si se especifica
                if (parameters.toolbar) {
                  options.modules.toolbar = parameters.toolbar;
                }

                // Verificar si ya existe una instancia de Quill para este ID
                const existingQuillIndex = window.quill?.findIndex(q => q.id === parameters.id) ?? -1;
                
                const quillInstance = {
                  id: parameters.id,
                  instance: new Quill('#' + parameters.id, options)
                };

                // Inicializar array global de Quill si no existe
                if (!window.quill) window.quill = [];

                // Agregar o reemplazar instancia
                if (existingQuillIndex >= 0) {
                  window.quill[existingQuillIndex] = quillInstance;
                } else {
                  window.quill.push(quillInstance);
                }

                const currentIndex = existingQuillIndex >= 0 ? existingQuillIndex : window.quill.length - 1;

                // Agregar handler personalizado para imágenes
                if (typeof window.quill_selectLocalImage === 'function') {
                  quillInstance.instance.getModule('toolbar').addHandler('image', () => {
                    window.quill_selectLocalImage(currentIndex);
                  });
                }

                // Configurar funciones personalizadas de toolbar si existen
                if (parameters.functions && typeof parameters.functions === "object" && hasFormReferences) {
                  Object.entries(parameters.functions).forEach(([key, func]) => {
                    if (typeof func === "function") {
                      const toolbarButton = document.querySelector(`#${parameters.id}`).parentNode.querySelector(`div.ql-toolbar .ql-${key}`);
                      if (toolbarButton) {
                        toolbarButton.setAttribute("onclick", 
                          `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}].functions.${key}(document.querySelector('#${parameters.id} > div.ql-editor'))`
                        );
                      }
                    }
                  });
                }
              };

              // Inicializar Quill editor
              initializeQuillEditor();
            }

            executeCallback(callback);
          });
        } else if (parameters.parent === "") {
          return html;
        }

      }
    }
    
  };

  window.datepicker = ns.datepicker = function(_id) {
    // Helpers para simplificar el código
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createDatePickerElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      
      const className = `mangole-general-textbox${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', className);
      html.setAttribute('data-control', 'datepicker');
      
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      
      if (params.css?.parent) {
        html.setAttribute('style', params.css.parent);
      }
      
      // Label
      const label = document.createElement('LABEL');
      let labelText = getLocalizedText(params.label);
      // Agregar asterisco si es required y no lo tiene ya
      if (params.required === true && !labelText.includes('*')) {
        labelText += ' *';
      }
      label.textContent = labelText;
      if (params.css?.label) {
        label.style.cssText = params.css.label;
      }
      html.appendChild(label);
      
      // Input
      const input = document.createElement('INPUT');
      input.setAttribute('type', 'text');
      input.setAttribute('id', params.id);
      
      if (params.css?.input) {
        input.setAttribute('style', params.css.input);
      }
      
      // Set attributes conditionally
      const setAttributeIf = (attr, value) => {
        if (value) input.setAttribute(attr, value);
      };
      
      setAttributeIf('value', params.value);
      setAttributeIf('placeholder', getLocalizedText(params.placeholder));
      setAttributeIf('tabindex', params.tabindex);
      setAttributeIf('title', getLocalizedText(params.tooltip));
      
      if (params.readonly) {
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('data-readonly', '1');
      }
      
      if (params.disabled) {
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('data-disabled', '1');
      }
      
      // 🆕 Configuración de sanitización para datepicker
      // Datepicker siempre usa dateFormat, no inputType
      if (typeof params.dateFormat !== 'undefined' && params.dateFormat) {
        input.setAttribute('data-date-format', params.dateFormat);
      }
      
      if (typeof params.sanitizeOnOutput !== 'undefined' && params.sanitizeOnOutput === true) {
        input.setAttribute('data-sanitize-output', 'true');
      }
      
      if (typeof params.required !== 'undefined' && params.required === true) {
        input.setAttribute('data-required', 'true');
      }
      
      // ========== VALIDACIÓN AUTOMÁTICA ==========
      // Validar automáticamente al perder foco (blur) si existe dateFormat
      if (params.dateFormat) {
        input.addEventListener('blur', function() {
          const datepickerInstance = ns.datepicker('#' + this.id);
          if (datepickerInstance && typeof datepickerInstance.validate === 'function') {
            datepickerInstance.validate();
          }
        });
        
        // Validar también al cambiar fecha
        input.addEventListener('change', function() {
          const datepickerInstance = ns.datepicker('#' + this.id);
          if (datepickerInstance && typeof datepickerInstance.validate === 'function') {
            datepickerInstance.validate();
          }
        });
      }
      // ========== FIN VALIDACIÓN AUTOMÁTICA ==========
      
      // Event handlers - dual path for form-referenced vs standalone datepickers
      if (ro_form && ro_page !== null && ro_control !== null) {
        // Path 1: Form-referenced datepickers
        const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
        const events = [
          'onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup',
          'onclick', 'onpaste', 'oncut', 'oninput', 'onmouseover', 'onmouseout'
        ];
        
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            input.setAttribute(event, `${formPath}.${event}(this)`);
          }
        });
        
        // Special handling for calendar click event
        if (typeof params.oncalclick === 'function') {
          input.setAttribute('data-oncalclick', `${formPath}.oncalclick(date)`);
        }
      } else {
        // Path 2: Standalone datepickers - direct function execution
        const events = [
          'onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup',
          'onclick', 'onpaste', 'oncut', 'oninput', 'onmouseover', 'onmouseout'
        ];
        
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            // Store function in a global scope and reference it
            const functionName = `${params.id}_${event}_handler`;
            window[functionName] = params[event];
            input.setAttribute(event, `${functionName}(this)`);
          }
        });
        
        // Special handling for calendar click event in standalone mode
        if (typeof params.oncalclick === 'function') {
          const calClickFunctionName = `${params.id}_oncalclick_handler`;
          window[calClickFunctionName] = params.oncalclick;
          input.setAttribute('data-oncalclick', `${calClickFunctionName}(date)`);
        }
      }
      
      html.appendChild(input);
      return html;
    };
    const setupCalendarLanguages = () => {
      if (typeof dhtmlXCalendarObject === 'undefined') {
        return;
      }
      
      const langData = {
        es: {
          monthesFNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
          monthesSNames: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          daysFNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
          daysSNames: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'],
          weekstart: 1,
          weekname: 'w'
        },
        en: {
          monthesFNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          monthesSNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          daysFNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          daysSNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          weekstart: 1,
          weekname: 'w'
        },
        fr: {
          monthesFNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
          monthesSNames: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
          daysFNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
          daysSNames: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
          weekstart: 1,
          weekname: 'w'
        }
      };
      
      Object.keys(langData).forEach(lang => {
        dhtmlXCalendarObject.prototype.langData[lang] = langData[lang];
      });
    };
    const initializeCalendar = (params) => {
      if (typeof dhtmlXCalendarObject === 'undefined') {
        console.warn('dhtmlXCalendarObject is not available');
        return;
      }
      
      setupCalendarLanguages();
      
      const myCalendar = new dhtmlXCalendarObject([params.id]);
      const languages = ['es', 'en', 'fr'];
      
      if (app?.data?.language !== undefined && languages[ns.languageIndex]) {
        myCalendar.loadUserLanguage(languages[ns.languageIndex]);
      }
      
      myCalendar.setDateFormat(params.dateFormat);
      
      // Attach calendar click event
      myCalendar.attachEvent('onClick', (date) => {
        const element = document.querySelector(`#${params.id}`);
        const onCalClickAttr = element?.getAttribute('data-oncalclick');
        if (onCalClickAttr) {
          eval(onCalClickAttr);
        }
      });
      
      return myCalendar;
    };
    
    return {
      setfocus() { //Establece el foco en el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) element.focus();
      },
      
      value(_value) { //Obtiene o establece el valor del datepicker
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) return false;
        
        if (_value !== undefined) {
          element.value = _value;
        } else {
          // Getter con sanitización de fecha
          const rawValue = element.value;
          
          // 🆕 Sanitizar fecha según dateFormat (siempre para datepicker)
          const sanitizeOnOutput = element.getAttribute('data-sanitize-output') === 'true';
          const dateFormat = element.getAttribute('data-date-format');
          
          if (sanitizeOnOutput && dateFormat && typeof DataSanitizer !== 'undefined') {
            return DataSanitizer.sanitize(rawValue, 'date', { dateFormat: dateFormat });
          }
          
          return rawValue;
        }
      },
      
      hide(callback) { //Oculta el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) element.parentNode.style.display = 'none';
        if (typeof callback === 'function') callback();
      },
      
      show(callback) { //Muestra el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) element.parentNode.style.display = '';
        if (typeof callback === 'function') callback();
      },
      
      hidden(callback) { //Hace invisible el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) element.parentNode.style.visibility = 'hidden';
        if (typeof callback === 'function') callback();
      },
      
      visible(callback) { //Hace visible el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) element.parentNode.style.visibility = '';
        if (typeof callback === 'function') callback();
      },
      
      disabled(option, callback) { //Habilita/deshabilita el campo
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) {
          option ? element.setAttribute('disabled', 'disabled') : element.removeAttribute('disabled');
        }
        if (typeof callback === 'function') callback();
      },
      
      readonly(option, callback) { //Establece el campo como solo lectura
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) {
          option ? element.setAttribute('readonly', 'readonly') : element.removeAttribute('readonly');
        }
        if (typeof callback === 'function') callback();
      },
      
      addClass(_className) { //Agrega una clase CSS
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) {
          element.classList ? element.classList.add(_className) : (element.className += ' ' + _className);
        }
      },
      
      removeClass(_className) { //Remueve una clase CSS
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (element) {
          if (element.classList) {
            element.classList.remove(_className);
          } else {
            const regex = new RegExp('(^|\\b)' + _className.split(' ').join('|') + '(\\b|$)', 'gi');
            element.className = element.className.replace(regex, ' ');
          }
        }
      },
      
      // 🆕 Métodos de Sanitización y Validación (v1.0.19)
      valueRaw() { //Retorna el valor sin sanitizar
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        return element ? element.value : '';
      },
      
      validate() { //Valida el campo de fecha
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) return true;
        
        const required = element.getAttribute('data-required') === 'true';
        const value = element.value;
        
        let isValid = true;
        
        // Validar si es requerido y está vacío
        if (required && (!value || value.trim() === '')) {
          isValid = false;
        } else if (value && value.trim() !== '') {
          // Si tiene valor, validar formato de fecha
          isValid = this.isValidDate(value);
        }
        
        // Aplicar clases visuales
        if (isValid) {
          removeClass(element.parentNode, 'has-error');
          removeClass(element, 'input-error');
          addClass(element.parentNode, 'has-success');
          addClass(element, 'input-valid');
        } else {
          removeClass(element.parentNode, 'has-success');
          removeClass(element, 'input-valid');
          addClass(element.parentNode, 'has-error');
          addClass(element, 'input-error');
        }
        
        return isValid;
      },
      
      getErrors() { //Retorna array de errores de validación
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) return [];
        
        const required = element.getAttribute('data-required') === 'true';
        const value = element.value;
        const errors = [];
        
        if (required && (!value || value.trim() === '')) {
          errors.push('Este campo es requerido');
          return errors;
        }
        
        if (value && value.trim() !== '' && !this.isValidDate(value)) {
          errors.push('Formato de fecha inválido');
        }
        
        return errors;
      },
      
      isValidDate(dateString) { //Valida que sea una fecha válida
        if (!dateString || dateString.trim() === '') return false;
        
        var date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      
      sanitize() { //Sanitiza manualmente el valor de fecha actual
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) return;
        
        const dateFormat = element.getAttribute('data-date-format') || '%Y-%m-%d';
        
        if (typeof DataSanitizer !== 'undefined') {
          element.value = DataSanitizer.sanitize(element.value, 'date', { dateFormat: dateFormat });
        }
      },
      
      getDateFormat() { //Retorna el dateFormat configurado
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) return null;
        return element.getAttribute('data-date-format');
      },
      
      css: function(_prop, _value) {
        const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.value = params.value || '';
        params.description = params.description || '';
        params.tooltip = params.tooltip || '';
        params.disabled = Boolean(params.disabled);
        params.readonly = Boolean(params.readonly);
        params.maxDate = params.maxDate || '';
        params.minDate = params.minDate || '';
        params.tabindex = params.tabindex || '';
        params.placeholder = params.placeholder || '';
        params.dateFormat = params.dateFormat || '%Y-%m-%d';
        
        // CSS normalization
        params.css = {
          parent: params.css?.parent || null,
          input: params.css?.input || ''
        };
        
        const isDesignMode = params.devmode === 'design';
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear elemento datepicker
        const html = createDatePickerElement(params, ro_form, ro_page, ro_control, isDesignMode);
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
            // Initialize calendar after DOM insertion
            initializeCalendar(params);
          });
        } else if (params.parent === '') {
          // For cases where parent is empty string, initialize calendar later
          setTimeout(() => initializeCalendar(params), 0);
          return html;
        } else {
          // Initialize calendar after DOM is ready
          initializeCalendar(params);
        }
        
        executeCallback(callback);
      }
    };
  };


  window.colorlist = ns.colorlist = function(_id) {
    // Helpers para simplificar el código
    const getElement = () => (_id.nodeType && _id.nodeType === 1) ? _id : document.querySelector(_id);
    const executeCallback = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    const validateElement = (operation) => {
      const element = getElement();
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${operation}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const getLocalizedText = (content) => {
      return content instanceof Array ? content[ns.languageIndex] : content;
    };
    const buildFormReference = (form) => {
      if (!form) {
        return null;
      }
      if (Array.isArray(form)) {
        return form.map(item => `['${item}']`).join('');
      }
      return `['${form}']`;
    };
    const createColorListElement = (params, ro_form, ro_page, ro_control, isDesignMode) => {
      const html = document.createElement('DIV');
      
      const className = `mangole-general-textbox${params.class ? ` ${params.class}` : ''}`;
      html.setAttribute('class', className);
      html.setAttribute('data-control', 'colorlist');
      
      if (isDesignMode) {
        html.setAttribute('data-role', 'draggable');
      }
      
      if (params.css?.parent) {
        html.setAttribute('style', params.css.parent);
      }
      
      // Label
      if (params.label) {
        const label = document.createElement('LABEL');
        let labelText = getLocalizedText(params.label);
        // Agregar asterisco si es required y no lo tiene ya
        if (params.required === true && !labelText.includes('*')) {
          labelText += ' *';
        }
        label.textContent = labelText;
        if (params.css?.label) {
          label.style.cssText = params.css.label;
        }
        html.appendChild(label);
      }
      
      // Input para el color selector
      const input = document.createElement('INPUT');
      input.setAttribute('type', 'text');
      input.setAttribute('id', params.id);
      input.setAttribute('class', 'color-selector');
      
      if (params.css?.input) {
        input.setAttribute('style', params.css.input);
      }
      
      // Set attributes conditionally
      const setAttributeIf = (attr, value) => {
        if (value) input.setAttribute(attr, value);
      };
      
      setAttributeIf('value', params.value);
      setAttributeIf('placeholder', getLocalizedText(params.placeholder));
      setAttributeIf('tabindex', params.tabindex);
      setAttributeIf('title', getLocalizedText(params.tooltip));
      
      if (params.readonly) {
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('data-readonly', '1');
      }
      
      if (params.disabled) {
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('data-disabled', '1');
      }
      
      // Event handlers - dual path for form-referenced vs standalone colorlists
      if (ro_form && ro_page !== null && ro_control !== null) {
        // Path 1: Form-referenced colorlists
        const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
        const events = ['onchange', 'onclick', 'onfocus', 'onblur'];
        
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            input.setAttribute(event, `${formPath}.${event}(this)`);
          }
        });
      } else {
        // Path 2: Standalone colorlists - direct function execution
        const events = ['onchange', 'onclick', 'onfocus', 'onblur'];
        
        events.forEach(event => {
          if (typeof params[event] === 'function') {
            const functionName = `${params.id}_${event}_handler`;
            window[functionName] = params[event];
            input.setAttribute(event, `${functionName}(this)`);
          }
        });
      }
      
      html.appendChild(input);
      
      // Nota: Integración con bootstrap-colorselector pendiente de implementar
      // Referencia: http://bootstrap-colorselector.flaute.com/
      
      return html;
    };
    
    return {
      hide(callback) {
        const element = validateElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = validateElement('show');
        if (element) {
          element.style.display = 'block';
        }
        executeCallback(callback);
      },
      value(newValue) {
        const element = validateElement('value');
        if (!element) {
          return '';
        }
        
        const input = element.querySelector('input');
        if (!input) {
          return '';
        }
        
        if (typeof newValue !== 'undefined') {
          input.value = newValue;
          return newValue;
        }
        
        return input.value;
      },
      disabled(option, callback) {
        const element = validateElement('disabled');
        if (!element) {
          return;
        }
        
        const input = element.querySelector('input');
        if (input) {
          if (option === true) {
            input.setAttribute('disabled', 'disabled');
            input.setAttribute('data-disabled', '1');
          } else {
            input.removeAttribute('disabled');
            input.removeAttribute('data-disabled');
          }
        }
        executeCallback(callback);
      },
      create(parameters, callback) {
        // Extraer form, page, control ANTES de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;
        
        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.value = params.value || '';
        params.description = params.description || '';
        params.tooltip = params.tooltip || '';
        params.disabled = Boolean(params.disabled);
        params.readonly = Boolean(params.readonly);
        params.tabindex = params.tabindex || '';
        params.placeholder = params.placeholder || '';
        
        // CSS normalization
        params.css = {
          parent: params.css?.parent || null,
          input: params.css?.input || ''
        };
        
        const isDesignMode = params.devmode === 'design';
        
        // Validar ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }
        
        // Crear elemento colorlist
        const html = createColorListElement(params, ro_form, ro_page, ro_control, isDesignMode);
        
        // Procesar según el parent
        if (params.parent && params.parent !== '') {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }
        
        executeCallback(callback);
      }
    };
  };

  window.selectbox = ns.selectbox = function(_id) {
    // Helpers modernos reutilizables
    const getElement = (methodName) => {
      const element = (_id?.nodeType === 1) ? _id : document.querySelector(_id);
      if (!element) {
        console.log(`Uncaught TypeError: Cannot read property '${methodName}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };

    const executeCallback = (callback) => {
      if (typeof callback === 'function') callback();
    };

    const validateElement = ($element, context) => {
      if (!$element.length) {
        console.error(`Elemento padre no encontrado para ${context}:`, $element);
        return false;
      }
      return true;
    };

    const getLocalizedText = (text) => {
      return Array.isArray(text) ? text[ns.languageIndex] || text[0] : text;
    };

    const buildFormReference = (form) => {
      if (!form) return null;
      return Array.isArray(form) ? form.map(item => `['${item}']`).join('') : `['${form}']`;
    };

    const addClass = (element, className) => {
      if (!element) return;
      if (element.classList) {
        element.classList.add(...className.split(' '));
      } else {
        element.className += ' ' + className;
      }
    };

    const removeClass = (element, className) => {
      if (!element) return;
      if (element.classList) {
        element.classList.remove(className);
      } else {
        const regex = new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi');
        element.className = element.className.replace(regex, ' ');
      }
    };

    return {
      value(_value, _text) {
        const element = getElement('value');
        if (!element) return false;
        
        if (_value === undefined || _value === null) {
          // Getter con sanitización opcional
          const rawValue = element.value;
          
          // 🆕 Aplicar sanitización si está configurada
          const sanitizeOnOutput = element.getAttribute('data-sanitize-output') === 'true';
          const inputType = element.getAttribute('data-input-type');
          
          if (sanitizeOnOutput && inputType && typeof DataSanitizer !== 'undefined') {
            return DataSanitizer.sanitize(rawValue, inputType);
          }
          
          return rawValue;
        }
        
        if (typeof _value === 'string' || typeof _value === 'number') {
          if (typeof _text === 'string') {
            const option = document.createElement('option');
            option.selected = true;
            option.value = _value;
            option.textContent = getLocalizedText(_text);
            element.appendChild(option);
          } else {
            element.value = _value;
          }
        } else if (Array.isArray(_value)) {
          _value.forEach(item => {
            const option = document.createElement('option');
            option.value = getLocalizedText(item.value);
            
            if (item.selected === true) {
              option.selected = true;
            }
            
            if (item.data && typeof item.data === 'object') {
              Object.entries(item.data).forEach(([key, val]) => {
                option.setAttribute(`data-${key}`, val);
              });
            }
            option.textContent = getLocalizedText(item.text);
            element.appendChild(option);
          });
        }
      },

      getText() {
        const element = getElement('getText');
        return element?.options.length > 0 ? element.options[element.selectedIndex].text : '';
      },

      getData() {
        const element = getElement('getData');
        return element?.options.length > 0 ? element.options[element.selectedIndex].dataset : '';
      },

      placeholder(_value) {
        const element = getElement('placeholder');
        if (!element) return false;
        
        return _value !== undefined 
          ? element.setAttribute('placeholder', _value)
          : element.getAttribute('placeholder');
      },

      clear(callback) {
        const element = getElement('clear');
        if (element) {
          element.options.length = 0;
        }
        executeCallback(callback);
      },

      addClass(_className) {
        const element = getElement('addClass');
        if (element) {
          element.classList ? element.classList.add(_className) : (element.className += ' ' + _className);
        }
      },

      removeClass(_className) {
        const element = getElement('removeClass');
        if (element) {
          if (element.classList) {
            element.classList.remove(_className);
          } else {
            const regex = new RegExp('(^|\\b)' + _className.split(' ').join('|') + '(\\b|$)', 'gi');
            element.className = element.className.replace(regex, ' ');
          }
        }
      },

      hide(callback) {
        const element = getElement('hide');
        if (element) element.parentNode.style.display = 'none';
        executeCallback(callback);
      },

      show(callback) {
        const element = getElement('show');
        if (element) element.parentNode.style.display = '';
        executeCallback(callback);
      },

      hidden(callback) {
        const element = getElement('hidden');
        if (element) element.parentNode.style.visibility = 'hidden';
        executeCallback(callback);
      },

      visible(callback) {
        const element = getElement('visible');
        if (element) element.parentNode.style.visibility = '';
        executeCallback(callback);
      },

      disabled(option, callback) {
        const element = getElement('disabled');
        if (element) {
          option ? element.setAttribute('disabled', 'disabled') : element.removeAttribute('disabled');
        }
        executeCallback(callback);
      },
      readonly(option, callback) {
        const element = getElement('readonly');
        if (element) {
          option ? element.setAttribute('readonly', 'readonly') : element.removeAttribute('readonly');
        }
        executeCallback(callback);
      },
      
      // 🆕 Métodos de Sanitización y Validación (v1.0.19)
      valueRaw() { //Retorna el valor sin sanitizar
        const element = getElement('valueRaw');
        return element ? element.value : '';
      },
      
      validate() { //Valida el campo según su configuración
        const element = getElement('validate');
        if (!element) return true;
        
        const inputType = element.getAttribute('data-input-type');
        const required = element.getAttribute('data-required') === 'true';
        
        if (!inputType) return true;
        
        const validation = DataSanitizer.validate(element.value, inputType, { required: required });
        
        // Aplicar clases visuales
        if (validation.isValid) {
          removeClass(element.parentNode, 'has-error');
          removeClass(element, 'input-error');
          addClass(element.parentNode, 'has-success');
          addClass(element, 'input-valid');
        } else {
          removeClass(element.parentNode, 'has-success');
          removeClass(element, 'input-valid');
          addClass(element.parentNode, 'has-error');
          addClass(element, 'input-error');
        }
        
        return validation.isValid;
      },
      
      getErrors() { //Retorna array de errores de validación
        const element = getElement('getErrors');
        if (!element) return [];
        
        const inputType = element.getAttribute('data-input-type');
        const required = element.getAttribute('data-required') === 'true';
        
        if (!inputType) return [];
        
        const validation = DataSanitizer.validate(element.value, inputType, { required: required });
        return validation.errors;
      },
      
      sanitize() { //Sanitiza manualmente el valor actual
        const element = getElement('sanitize');
        if (!element) return;
        
        const inputType = element.getAttribute('data-input-type');
        if (!inputType) return;
        
        element.value = DataSanitizer.sanitize(element.value, inputType);
      },
      
      getInputType() { //Retorna el inputType configurado
        const element = getElement('getInputType');
        if (!element) return null;
        return element.getAttribute('data-input-type');
      },
      
      css: function(_prop, _value) {
        const element = getElement('css');
        if (!element) {
          return false;
        }
        const parent = element.parentNode;
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const labelEl = parent.querySelector('label');
          
          return {
            parent: parent.getAttribute('style') || '',
            label: labelEl ? labelEl.getAttribute('style') || '' : '',
            input: element.getAttribute('style') || ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, label, input}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            parent.setAttribute('style', _prop.parent);
          }
          if (_prop.label !== undefined) {
            const labelEl = parent.querySelector('label');
            if (labelEl) labelEl.setAttribute('style', _prop.label);
          }
          if (_prop.input !== undefined) {
            element.setAttribute('style', _prop.input);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al input
        element.style[_prop] = _value;
      },
      
      create(parameters = {}, callback) {
        // Extraer referencias de form antes de procesar dataFrom
        const originalParams = parameters || {};
        const ro_form = buildFormReference(originalParams.form);
        const ro_page = originalParams.page !== undefined ? originalParams.page : null;
        const ro_control = originalParams.control !== undefined ? originalParams.control : null;

        // Normalizar parámetros
        const params = parameters?.dataFrom && typeof parameters.dataFrom === 'object' 
          ? parameters.dataFrom 
          : parameters || {};
        
        // Copiar eventos del objeto original si existen
        const events = ['onchange', 'onclick', 'onfocus', 'onblur'];
        events.forEach(event => {
          if (typeof originalParams[event] === 'function') {
            params[event] = originalParams[event];
          }
        });
        
        params.id = params.id || id.panel();
        params.parent = params.parent || '';
        params.label = params.label || '';
        params.description = params.description || '';
        params.tooltip = params.tooltip || '';
        params.disabled = Boolean(params.disabled);
        params.tabindex = params.tabindex || '';
        params.css = params.css || {};

        // Validación de ID único
        if (document.getElementById(params.id)) {
          console.error(`Se ha creado otro elemento con el ID "${params.id}". Esto puede provocar un mal funcionamiento en la aplicación.`);
        }

        // Construcción del HTML
        const html = document.createElement('DIV');
        const cssClasses = ['mangole-general-textbox', params.class].filter(Boolean).join(' ');
        html.className = cssClasses;
        html.setAttribute('data-control', 'selectbox');

        if (params.devmode === 'design') {
          html.setAttribute('data-role', 'draggable');
        }

        if (params.css.parent) {
          html.style.cssText = params.css.parent;
        }

        // Crear y agregar label
        if (params.label) {
          const label = document.createElement('LABEL');
          let labelText = getLocalizedText(params.label);
          // Agregar asterisco si es required y no lo tiene ya
          if (params.required === true && !labelText.includes('*')) {
            labelText += ' *';
          }
          label.innerHTML = labelText;
          if (params.css?.label) {
            label.style.cssText = params.css.label;
          }
          html.appendChild(label);
        }

        // Crear elemento select
        const select = document.createElement('SELECT');
        select.id = params.id;

        // Configurar atributos
        [
          ['tabindex', params.tabindex],
          ['title', getLocalizedText(params.tooltip)]
        ].forEach(([attr, value]) => {
          if (value) select.setAttribute(attr, value);
        });

        if (params.css.input) {
          select.style.cssText = params.css.input;
        }

        if (params.disabled) {
          select.setAttribute('disabled', 'disabled');
          select.setAttribute('data-disabled', '1');
        }

        // Event handlers - dual path para form-referenced vs standalone
        if (ro_form && ro_page !== null && ro_control !== null) {
          // Path 1: Form-referenced selectboxes
          const formPath = `window['forms']${ro_form}.pages[${ro_page}].controls[${ro_control}]`;
          const events = ['onchange', 'onclick', 'onfocus', 'onblur'];
          
          events.forEach(event => {
            if (typeof params[event] === 'function') {
              select.setAttribute(event, `${formPath}.${event}(this)`);
            }
          });
        } else {
          // Path 2: Standalone selectboxes
          const events = ['onchange', 'onclick', 'onfocus', 'onblur'];
          
          events.forEach(event => {
            if (typeof params[event] === 'function') {
              const functionName = `${params.id}_${event}_handler`;
              window[functionName] = params[event];
              select.setAttribute(event, `${functionName}(this)`);
            }
          });
        }

        // Crear opciones si se proporciona value.others
        if (params.value?.others) {
          params.value.others.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData[0];
            
            if (params.value.default === optionData[0]) {
              option.selected = true;
            }
            
            option.textContent = getLocalizedText(optionData[1]);
            
            // 🆕 Soporte para data attributes (tercer elemento del array)
            if (optionData[2] && Array.isArray(optionData[2])) {
              optionData[2].forEach(dataObj => {
                if (dataObj && typeof dataObj === 'object') {
                  Object.entries(dataObj).forEach(([key, value]) => {
                    option.setAttribute(key, value);
                  });
                }
              });
            }
            
            select.appendChild(option);
          });
        }

        html.appendChild(select);

        // Descripción
        if (params.description) {
          const small = document.createElement('SMALL');
          small.innerHTML = getLocalizedText(params.description);
          html.appendChild(small);
        }

        // Gestión del parent
        if (params.parent) {
          ns.fillControl(params.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (params.parent === '') {
          return html;
        }

        executeCallback(callback);
      }
    };
  };



  window.datagrid = ns.datagrid = function(_id){
    // Helpers modernos reutilizables
    const getElement = (methodName) => {
      if (_id?.nodeType === 1) return _id;
      const element = typeof _id === 'string' ? document.querySelector(_id) : null;
      if (!element && methodName) {
        console.log(`Uncaught TypeError: Cannot read property '${methodName}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const executeCallback = (callback) => {
      if (typeof callback === 'function') callback();
    };
    const validateElement = ($element, context) => {
      if (!$element || ($element.length !== undefined && !$element.length)) {
        console.error(`Elemento no encontrado para ${context}:`, $element);
        return false;
      }
      return true;
    };
    const getLocalizedText = (text) => {
      return Array.isArray(text) ? text[ns.languageIndex] || text[0] : text;
    };
    const buildFormReference = (form, page, control) => {
      if (!form) return null;
      const formPath = Array.isArray(form) ? form.map(item => `['${item}']`).join('') : `['${form}']`;
      return `window.forms${formPath}.pages[${page}].controls[${control}]`;
    };
    
    return {
      touchCounter: null,
      currentRow: {
        visible(value) {
          const row = this.getRowElement();
          if (!row) return false;
          
          if (value === true) {
            row.style.display = '';
          } else if (value === false) {
            row.style.display = 'none';
          } else {
            return false;
          }
        },
        index: _id?.target?.closest('.mangole-datagrid-row')?.getAttribute('data-index') || null,
        cell(index = 0) {
          const row = this.getRowElement();
          if (!row) {
            return { value: null };
          }
          
          const cells = row.getElementsByClassName('mangole-datagrid-cell');
          if (!cells || index >= cells.length || index < 0) {
            return { value: null };
          }
          
          const cell = cells[index];
          return { 
            value: cell && 'innerHTML' in cell ? cell.innerHTML : (cell ? cell.textContent : null) 
          };
        },
        getRowElement() {
          if (!_id?.target) return null;
          
          // Si el target es directamente una fila
          if (_id.target.classList?.contains('mangole-datagrid-row')) {
            return _id.target;
          }
          
          // Buscar la fila padre más cercana
          return _id.target.closest('.mangole-datagrid-row');
        }
      },
      currentCell: {
        css(_value) {
          const cell = this.getCellElement();
          if (_value !== undefined && _value !== false) {
            cell?.setAttribute('style', _value);
          } else {
            return cell?.getAttribute('style') || null;
          }
        },
        get index() {
          const cell = this.getCellElement();
          return cell?.getAttribute('data-index') || null;
        },
        get value() {
          const cell = this.getCellElement();
          return cell?.textContent || null;
        },
        attr(_data, _value) {
          const cell = this.getCellElement();
          if (_value !== undefined && _value !== false) {
            cell?.setAttribute(_data, _value);
          } else {
            return cell?.getAttribute(_data) || null;
          }
        },
        getCellElement() {
          if (!_id?.target) return null;
          
          // Si el target es directamente una celda
          if (_id.target.classList?.contains('mangole-datagrid-cell')) {
            return _id.target;
          }
          
          // Si el target está dentro de una celda (como un botón)
          return _id.target.closest('.mangole-datagrid-cell');
        },
        insideControl: {
          checkbox: {
            value: _id?.target?.nodeName === 'INPUT' && _id.target.type === 'checkbox' ? _id.target.value : null
          },
          radio: {
            value: _id?.target?.nodeName === 'INPUT' && _id.target.type === 'radio' ? _id.target.getAttribute('data-index') : null
          },
          select: {
            value: _id?.target?.nodeName === 'SELECT' ? _id.target.value : null
          },
          textbox: {
            value: _id?.target?.nodeName === 'INPUT' && _id.target.type === 'text' ? _id.target.value : null
          }
        }
      },
      rowsLength() {
        return document.querySelectorAll(`${_id} > div.mangole-datagrid-row`).length;
      },
      row(rowIndex) {
        const getRowElement = () => document.querySelector(`${_id} > div.mangole-datagrid-row[data-index="${rowIndex}"]`);
        const getCellElement = (cellIndex) => {
          const rows = document.querySelector(_id)?.getElementsByClassName('mangole-datagrid-row');
          return rows?.[rowIndex]?.getElementsByClassName('mangole-datagrid-cell')?.[cellIndex] || null;
        };
        
        return {
          hide() {
            const row = getRowElement();
            if (row) row.style.display = 'none';
          },
          cell(cellIndex) {
            const rows = document.querySelector(_id)?.getElementsByClassName('mangole-datagrid-row');
            const cells = rows?.[rowIndex]?.getElementsByClassName('mangole-datagrid-cell');
            
            if (!rows || rowIndex > rows.length || !cells || cellIndex > cells.length) {
              return { value: null };
            }
            
            return {
              value: cells[cellIndex]?.textContent || null,
              html(html) {
                const cell = getCellElement(cellIndex);
                if (cell) cell.innerHTML = html;
              },
              text(text) {
                const cell = getCellElement(cellIndex);
                if (cell) {
                  cell.textContent = text;
                  cell.setAttribute('title', text);
                }
              },
              attr(_data, _value) {
                const cell = getCellElement(cellIndex);
                if (cell) cell.setAttribute(_data, _value);
              },
              css(_value) {
                const cell = getCellElement(cellIndex);
                if (cell) cell.setAttribute('style', _value);
              },
              data: function(_key, _value){
                var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex];
                if (typeof _key === "string" && typeof _value === "undefined"){
                  if (element === null){
                    console.log('Uncaught TypeError: Cannot read property \'data\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+']\' because is null');
                    return false;
                  }else{
                    return element.getAttribute("data-"+_key);
                  }
                }else if (typeof _key === "string" && typeof _value !== "undefined"){
                  if (element === null){
                    console.log('Uncaught TypeError: Cannot read property \'data\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+']\' because is null');
                    return false;
                  }else{
                    if (_value == ""){
                      element.removeAttribute("data-"+_key);
                    }else{
                      element.setAttribute("data-"+_key, _value);
                    }
                  }
                }
              },
              insideControl: {
                checkbox: function(_value){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('input');
                  if (typeof _value === "boolean" || typeof _value === "string" || typeof _value === "number"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'checkbox\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.checkbox\' because is null');
                      return false;
                    }else{
                      if (typeof _value === "boolean"){
                        element.checked = _value;
                        if (_value == true){
                          element.value = 1;
                        }else{
                          element.value = 0;
                        }
                      }else{
                        if (_value == 1 || _value == "1"){
                          element.checked = true;
                          element.value = 1;
                        }else{
                          element.checked = false;
                          element.value = 0;
                        }
                      }
                    }
                  }else if (typeof _value === "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'checkbox\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.checkbox\' because is null');
                      return false;
                    }else{
                      return { value: ((element.checked) ? 1 : 0), instance: element };
                    }
                  }
                },
                radio: function(_value){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('input');
                  if (typeof _value === "string" || typeof _value === "number"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'radio\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.radio\' because is null');
                      return false;
                    }else{
                      element.value = _value;
                    }
                  }else if (typeof _value === "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'radio\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.radio\' because is null');
                      return false;
                    }else{
                      return { value: ((element.checked) ? 1 : 0), instance: element };
                    }
                  }
                },
                select: function(_value){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('select');
                  if (typeof _value === "string" || typeof _value === "number"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'select\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > select\' because is null');
                      return false;
                    }else{
                      element.value = _value;
                    }
                  }else if (typeof _value === "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'select\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > select\' because is null');
                      return false;
                    }else{
                      return { value: element.value, instance: element };
                    }
                  }
                },
                textbox: function(_value){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('input');
                  if (element === null){ element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('select'); }
                  if (typeof _value === "string" || typeof _value === "number"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'textbox\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.textbox\' because is null');
                      return false;
                    }else{
                      element.value = _value;
                    }
                  }else if (typeof _value === "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'textbox\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input.textbox\' because is null');
                      return false;
                    }else{
                      return { value: element.value, instance: element };
                    }
                  }
                },
                disabled: function(option, callback){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('input');
                  if (element === null){ element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('select'); }
                  if (element === null){
                    console.log('Uncaught TypeError: Cannot read property \'disabled\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input\' because is null');
                    return false;
                  }
                  if (option == true){
                    element.setAttribute("disabled", "disabled");
                  }else if (option == false){
                    element.removeAttribute("disabled");
                  }
                  if (typeof callback === "function"){
                    callback();
                  }
                },
                data: function(_key, _value){
                  var element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('input');
                  if (element === null){ element = document.querySelector(_id).getElementsByClassName('mangole-datagrid-row')[rowIndex].getElementsByClassName('mangole-datagrid-cell')[cellIndex].querySelector('select'); }
                  if (typeof _key === "string" && typeof _value === "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'data\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input\' because is null');
                      return false;
                    }else{
                      return element.getAttribute("data-"+_key);
                    }
                  }else if (typeof _key === "string" && typeof _value !== "undefined"){
                    if (element === null){
                      console.log('Uncaught TypeError: Cannot read property \'data\' of \''+_id+' > row['+rowIndex+'] > cell['+cellIndex+'] > input\' because is null');
                      return false;
                    }else{
                      if (_value == ""){
                        element.removeAttribute("data-"+_key);
                      }else{
                        element.setAttribute("data-"+_key, _value);
                      }
                    }
                  }
                }
              }
            }
          },
          delete() {
            const row = getRowElement();
            if (row) {
              while (row.hasChildNodes()) {
                row.removeChild(row.firstChild);
              }
              row.parentNode.removeChild(row);
            }
          }
        }
      },
      hide(callback) {
        const element = getElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = getElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      value: function(callback){
        var rows = document.querySelectorAll(_id + ' div.mangole-datagrid-row'),
        hearder = [],
        data = []
        data_cell = {};
        for (var x = 0; x < document.querySelectorAll(_id + ' div.mangole-datagrid-heading > div.mangole-datagrid-cell').length; x++){
          hearder.push(document.querySelectorAll(_id + ' div.mangole-datagrid-heading > div.mangole-datagrid-cell')[x].textContent);
        }
        for (var i = 0; i < rows.length; i++){
          for (var x = 0; x < rows[i].querySelectorAll('div.mangole-datagrid-cell').length; x++){
            if (rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('input') != null){
              data_cell[rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].getAttribute("data-field")] = rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('input').value;
            }else{
              data_cell[rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].getAttribute("data-field")] = rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].innerHTML.replace(new RegExp('"', 'g'), '\\\"').replace(new RegExp("'", 'g'), "\\'");
            }
          }
          data.push(data_cell);
          data_cell = {};
        }
        if (callback && typeof(callback) === "function"){
          callback({header: hearder, data: data});
          return false;
        }
        return {header: hearder, data: data};
      },
      valueText: function(callback){
        var rows = document.querySelectorAll(_id + ' div.mangole-datagrid-row'),
        hearder = [],
        data = []
        data_cell = {};
        for (var x = 0; x < document.querySelectorAll(_id + ' div.mangole-datagrid-heading > div.mangole-datagrid-cell').length; x++){
          hearder.push(document.querySelectorAll(_id + ' div.mangole-datagrid-heading > div.mangole-datagrid-cell')[x].textContent);
        }
        for (var i = 0; i < rows.length; i++){
          for (var x = 0; x < rows[i].querySelectorAll('div.mangole-datagrid-cell').length; x++){
            if (rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('input') != null){
              data_cell[rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].getAttribute("data-field")] = rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('input').value;
            }else{
              if (rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('select') != null){
                data_cell[rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].getAttribute("data-field")] = rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].querySelector('select').value;
              }else{
                data_cell[rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].getAttribute("data-field")] = rows[i].querySelectorAll('div.mangole-datagrid-cell')[x].textContent;
              }
            }
          }
          data.push(data_cell);
          data_cell = {};
        }
        if (callback && typeof(callback) === "function"){
          callback({header: hearder, data: data});
          return false;
        }
        return {header: hearder, data: data};
      },
      clear(callback) {
        const rows = document.querySelectorAll(`${_id} div.mangole-datagrid-row`);
        rows.forEach(row => {
          while (row.hasChildNodes()) {
            row.removeChild(row.firstChild);
          }
          row.parentNode.removeChild(row);
        });
        executeCallback(callback);
      },
      deleteRow(_index, callback) {
        const row = document.querySelector(`${_id} div.mangole-datagrid-row[data-index="${_index}"]`);
        if (row) {
          while (row.hasChildNodes()) {
            row.removeChild(row.firstChild);
          }
          row.parentNode.removeChild(row);
        }
        // Reindexar filas restantes
        const rows = document.querySelectorAll(`${_id} div.mangole-datagrid-row`);
        rows.forEach((row, index) => {
          row.setAttribute('data-index', index);
        });
        executeCallback(callback);
      },
      fill: function(json){
        var ds_object = document.querySelector(_id),
        parameters = ds_object.getAttribute("data-formrootcoords").split(","),
        form =  ds_object.getAttribute("data-formroot").split(","),
        fieldName = "";
        if (form.length > 1){
          var obbjj = "";
          for (var i = 0; i < form.length; i++){
            obbjj += "['"+form[i]+"']";
          }
          var obj = eval("window['forms']"+obbjj+".pages[parameters[0]].controls[parameters[1]]");
        }else{
          var obj = window['forms'][form[0]].pages[parameters[0]].controls[parameters[1]];
        }
        if (typeof json === "undefined" || json == null){
          return false
        }
        fieldName += document.querySelector(_id + ' > div.mangole-datagrid-heading').outerHTML;

        //Recorre la data para extraer la información que corresponde a cada campo
        for (var x = 0; x < json.length; x++){
          fieldName += '<div class="mangole-datagrid-row" data-index="'+(x)+'">';
          //Recorre cada elemento del array para formar la grilla
          for (var i = 0; i < obj.columns.fieldName.length; i++){
            //Verifica si la columna es visible, para hacer la celda visible
            if (obj.columns.visible[i] == false){
              visible = 'display:none;'
            }else{
              visible = ""
            }
            //Verifica el ancho de la columna para hacer la celda del mismo tamaño
            if (obj.columns.width[i] != 'auto'){
              width = 'width:'+obj.columns.width[i]+';';
            }else{
              width = "";
            }
            if (typeof obj.columns.css !== "undefined"){
              if (typeof obj.columns.css === "object"){
                if (typeof obj.columns.css[i] !== "undefined"){
                  css = obj.columns.css[i];
                }else{
                  css = "";
                }
              }else{
                if (obj.columns.css != ""){
                  css = obj.columns.css;
                }
              }
            }else{
              css = "";
            }
            if (typeof json[x].css !== "undefined"){
              if (typeof json[x].css === "object"){ 
                if (typeof json[x].css[i] !== "undefined"){
                  css += " " + json[x].css[i];
                }else{
                  css += "";
                }
              }else{
                if (json[x].css != ""){
                  css += " " + json[x].css;
                }
              }
            }else{
              css += "";
            }
            //Eventos en cada control dentro de la celda
            var oncellevent = "";
            if (typeof obj.onCellControlClick === "function"){
              oncellevent += ' onclick="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlClick(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlChange === "function"){
              oncellevent += ' onchange="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlChange(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlBlur === "function"){
              oncellevent += ' onblur="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlBlur(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlPaste === "function"){
              oncellevent += ' onpaste="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlPaste(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlCut === "function"){
              oncellevent += ' oncut="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlCut(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlKeyup === "function"){
              oncellevent += ' onkeyup="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeyup(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlKeypress === "function"){
              oncellevent += ' onkeypress="javascript:var code = (event.keyCode ? event.keyCode : event.which); if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeypress(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, code); };"';
            }

            //Verifica qué tipo de contenido tendrá la celda
            if (obj.columns.type[i] == "checkbox"){
              fieldName += '<div class="mangole-datagrid-cell center" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="checkbox" name="'+i+'" onclick="if (this.checked){ this.value = 1; }else{ this.value = 0; }" '+((typeof json[x][obj.columns.fieldName[i]] === "boolean" && json[x][obj.columns.fieldName[i]] == true || json[x][obj.columns.fieldName[i]] == 1 || json[x][obj.columns.fieldName[i]] == "1") ? 'checked="checked" value="1"' : 'value="0"')+' '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "radiobox"){
              fieldName += '<div class="mangole-datagrid-cell center" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="radio" name="radio" data-index="'+i+'" '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "text"){
              //Verifica si la celda tiene valor vacío. En caso diferente, la llena con el valor correspondiente de la data
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'" '+((typeof obj.columns.tooltip !== "undefined" && obj.columns.tooltip[i] == false) ? '' : 'title="'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'"')+'>'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }else if (obj.columns.type[i] == "select"){
              //fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+'"><select '+oncellevent+'><option></option></select></div><!-- mangole-datagrid-cell-->';
              if (json[x][obj.columns.fieldName[i]] instanceof Array){
                var optionshtml = '';
                for (var p = 0; p < json[x][obj.columns.fieldName[i]].length; p++){
                  optionshtml += '<option value="'+json[x][obj.columns.fieldName[i]][p].value+'" '+((typeof json[x][obj.columns.fieldName[i]][p].selected !== "undefined" && json[x][obj.columns.fieldName[i]][p].selected == true) ? 'selected="selected"' : '')+'>'+json[x][obj.columns.fieldName[i]][p].text+'</option>';
                }
                fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'>'+optionshtml+'</select></div><!-- mangole-datagrid-cell-->';
              }else{
                fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'><option value="'+json[x][obj.columns.fieldName[i]]+'">'+json[x][obj.columns.fieldName[i]]+'</option></select></div><!-- mangole-datagrid-cell-->';
              }
            }else if (obj.columns.type[i] == "textbox"){
              fieldName += '<div class="mangole-datagrid-cell textbox-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="'+((typeof obj.columns.contentType !== "undefined") ? ((obj.columns.contentType[i] == "text" || obj.columns.contentType[i] == "date" || obj.columns.contentType[i] == "number" || obj.columns.contentType[i] == "email") ? obj.columns.contentType[i] : 'text') : 'text')+'" '+oncellevent+' value="'+json[x][obj.columns.fieldName[i]]+'"/></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "none"){
              //fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" style="'+visible+' '+width+'"></div><!-- mangole-datagrid-cell-->';
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'">'+json[x][obj.columns.fieldName[i]]+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }
          }
          fieldName += '</div><!-- mangole-datagrid-row-->';
        }
        //Llena el datagrid con los campos y sus respectivos datos
        ds_object.innerHTML = fieldName;
      },
      append: function(json, _callback){
        var ds_object = document.querySelector(_id);
        
        // Validar que el datagrid existe
        if (!ds_object) {
          console.error(`Uncaught TypeError: Cannot append to datagrid '${_id}' because element is null`);
          return false;
        }
        
        var parameters = ds_object.getAttribute("data-formrootcoords").split(","),
        form =  ds_object.getAttribute("data-formroot").split(","),
        fieldName = "",
        row = null;

        if (form.length > 1){
          var obbjj = "";
          for (var i = 0; i < form.length; i++){
            obbjj += "['"+form[i]+"']";
          }
          var obj = eval("window['forms']"+obbjj+".pages[parameters[0]].controls[parameters[1]]");
        }else{
          var obj = window['forms'][form[0]].pages[parameters[0]].controls[parameters[1]];
        }
        if (typeof json === "undefined" || json == null){
          return false
        }
        var nindex = document.querySelectorAll(_id + ' > div.mangole-datagrid-row').length;
        //Recorre la data para extraer la información que corresponde a cada campo
        for (var x = 0; x < json.length; x++){
          row = document.createElement("DIV");
          row.setAttribute("class", "mangole-datagrid-row");
          row.setAttribute("data-index", nindex);
          nindex++;
          //Recorre cada elemento del array para formar la grilla
          for (var i = 0; i < obj.columns.fieldName.length; i++){
            //Verifica si la columna es visible, para hacer la celda visible
            if (obj.columns.visible[i] == false){
              visible = 'display:none;'
            }else{
              visible = ""
            }
            //Verifica el ancho de la columna para hacer la celda del mismo tamaño
            if (obj.columns.width[i] != 'auto'){
              width = 'width:'+obj.columns.width[i]+';';
            }else{
              width = "";
            }
            if (typeof obj.columns.css !== "undefined"){
              if (typeof obj.columns.css === "object"){
                if (typeof obj.columns.css[i] !== "undefined"){
                  css = obj.columns.css[i];
                }else{
                  css = "";
                }
              }else{
                if (obj.columns.css != ""){
                  css = obj.columns.css;
                }
              }
            }else{
              css = "";
            }
            if (typeof json[x].css !== "undefined"){
              if (typeof json[x].css === "object"){ 
                if (typeof json[x].css[i] !== "undefined"){
                  css += " " + json[x].css[i];
                }else{
                  css += "";
                }
              }else{
                if (json[x].css != ""){
                  css += " " + json[x].css;
                }
              }
            }else{
              css += "";
            }
            //Eventos en cada control dentro de la celda
            var oncellevent = "";
            if (typeof obj.onCellControlClick === "function"){
              oncellevent += ' onclick="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlClick(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlChange === "function"){
              oncellevent += ' onchange="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlChange(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlBlur === "function"){
              oncellevent += ' onblur="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlBlur(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlPaste === "function"){
              oncellevent += ' onpaste="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlPaste(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlCut === "function"){
              oncellevent += ' oncut="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlCut(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlKeyup === "function"){
              oncellevent += ' onkeyup="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeyup(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
            }
            if (typeof obj.onCellControlKeypress === "function"){
              oncellevent += ' onkeypress="javascript:var code = (event.keyCode ? event.keyCode : event.which); if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeypress(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, code); };"';
            }
            //Verifica qué tipo de contenido tendrá la celda
            if (obj.columns.type[i] == "checkbox"){
              fieldName += '<div class="mangole-datagrid-cell center" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="checkbox" name="'+i+'" onclick="if (this.checked){ this.value = 1; }else{ this.value = 0; }" '+((typeof json[x][obj.columns.fieldName[i]] === "boolean" && json[x][obj.columns.fieldName[i]] == true || json[x][obj.columns.fieldName[i]] == 1 || json[x][obj.columns.fieldName[i]] == "1") ? 'checked="checked" value="1"' : 'value="0"')+' '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "radiobox"){
              fieldName += '<div class="mangole-datagrid-cell center" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="radio" name="radio" data-index="'+i+'" '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "text"){
              //Verifica si la celda tiene valor vacío. En caso diferente, la llena con el valor correspondiente de la data
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'" '+((typeof obj.columns.tooltip !== "undefined" && obj.columns.tooltip[i] == false) ? '' : 'title="'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'"')+'>'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }else if (obj.columns.type[i] == "select"){
              //fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+'"><select '+oncellevent+'><option value="'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][0] : json[x][obj.columns.fieldName[i]])+'">'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][1] : json[x][obj.columns.fieldName[i]])+'</option></select></div><!-- mangole-datagrid-cell-->';
              if (json[x][obj.columns.fieldName[i]] instanceof Array){
                var optionshtml = '';
                for (var p = 0; p < json[x][obj.columns.fieldName[i]].length; p++){
                  optionshtml += '<option value="'+json[x][obj.columns.fieldName[i]][p].value+'" '+((typeof json[x][obj.columns.fieldName[i]][p].selected !== "undefined" && json[x][obj.columns.fieldName[i]][p].selected == true) ? 'selected="selected"' : '')+'>'+json[x][obj.columns.fieldName[i]][p].text+'</option>';
                }
                fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'>'+optionshtml+'</select></div><!-- mangole-datagrid-cell-->';
              }else{
                fieldName += '<div class="mangole-datagrid-cell select-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'><option value="'+json[x][obj.columns.fieldName[i]]+'">'+json[x][obj.columns.fieldName[i]]+'</option></select></div><!-- mangole-datagrid-cell-->';
              }
            }else if (obj.columns.type[i] == "textbox"){
              fieldName += '<div class="mangole-datagrid-cell textbox-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="'+((typeof obj.columns.contentType !== "undefined") ? ((obj.columns.contentType[i] == "text" || obj.columns.contentType[i] == "date" || obj.columns.contentType[i] == "number" || obj.columns.contentType[i] == "email") ? obj.columns.contentType[i] : 'text') : 'text')+'" '+oncellevent+' value="'+json[x][obj.columns.fieldName[i]]+'"/></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "none"){
              //fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" style="'+visible+' '+width+'"></div><!-- mangole-datagrid-cell-->';
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'">'+json[x][obj.columns.fieldName[i]]+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }
          }
          row.innerHTML = fieldName;
          //Llena el datagrid con los campos y sus respectivos datos
          ds_object.appendChild(row);
          row = null;
        }
        if (typeof _callback == "function"){
          _callback();
        }
      },
      create: function(parameters,callback){
        if (typeof parameters === "undefined"){
          var parameters = {};
        }
        if (typeof parameters.form !== "undefined"){
          var ro_form = "",
          dataformroot = "", 
          dataformrootCOMMA = "";
          if (parameters.form instanceof Array){
            for (var i = 0; i < parameters.form.length; i++){
              ro_form += "['" + parameters.form[i] + "']";
              dataformroot += dataformrootCOMMA + parameters.form[i];
              dataformrootCOMMA = ',';
            }
          }else{
            ro_form = "['" + parameters.form + "']";
            dataformroot = parameters.form;
          }
        }else{
          var ro_form = null;
        }
        if (typeof parameters.page !== "undefined"){
          var ro_page = parameters.page;
        }else{
          var ro_page = null;
        }
        if (typeof parameters.control !== "undefined"){
          var ro_control = parameters.control;
        }else{
          var ro_control = null;
        }

        if (typeof parameters.dataFormRoot !== "undefined" && typeof parameters.dataFormRoot === "object"){
          var dataformrootcoords = parameters.dataFormRoot;
        }else{
          var dataformrootcoords = null;
        }
        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object"){
          var parameters = parameters.dataFrom;
        }

        parameters.id = (typeof parameters.id === "undefined") ? id = id.panel() : id = parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined") ? "" : parameters.parent;

        if (document.getElementById(parameters.id)){
          console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
        }

        // Construcción del header del datagrid
        const createHeaderCell = (i) => {
          const visible = parameters.columns.visible[i] === false ? 'display:none;' : '';
          const widthValue = parameters.columns.width[i];
          const width = (widthValue && widthValue !== 'auto') ? `width:${widthValue};` : '';
          const style = `${visible} ${width}`;
          const text = getLocalizedText(parameters.columns.headerText[i]);
          
          // Eventos del header - Dual path pattern
          let headerEvents = '';
          if (ro_page != null && ro_control != null) {
            // Path 1: Form-referenced headers
            const formRef = buildFormReference(ro_form.replace(/\[|\]|'/g, ''), ro_page, ro_control);
            
            if (typeof parameters.onHeaderCellClick === "function") {
              headerEvents += ` onclick="javascript:if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT'){ }else{ event.stopPropagation(); ${formRef}.onHeaderCellClick(this, this.getAttribute('data-index'), event); };"`;
            }
            
            if (typeof parameters.onHeaderCellDoubleClick === "function") {
              headerEvents += ` ondblclick="javascript:if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT'){ }else{ event.stopPropagation(); ${formRef}.onHeaderCellDoubleClick(this, this.getAttribute('data-index'), event); };"`;
            }
          } else {
            // Path 2: Standalone headers - events will be added via addEventListener after HTML creation
            if (typeof parameters.onHeaderCellClick === "function" || typeof parameters.onHeaderCellDoubleClick === "function") {
              headerEvents += ` data-has-header-events="true" data-cell-index="${i}"`;
            }
          }
          
          const cellTypes = {
            checkbox: `<input type="checkbox" name="${i}" onclick="if (this.checked){ this.value = 1; }else{ this.value = 0; }" />`,
            radiobox: `<input type="radio" name="radio" data-index="${i}" />`,
            text: text,
            select: text,
            textbox: text,
            none: text
          };
          
          const cellClass = parameters.columns.type[i] === 'text' ? '' : ` ${parameters.columns.type[i]}-type`;
          return `<div class="mangole-datagrid-cell${cellClass}" data-index="${i}" style="${style}"${headerEvents}>${cellTypes[parameters.columns.type[i]] || text}</div>`;
        };
        const headerText = parameters.columns.headerText.map((_, i) => createHeaderCell(i)).join('');
        var html = document.createElement("DIV");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-datagrid" + ((parameters.class != null && typeof parameters.class !== "undefined") ? ' ' + parameters.class : ''));
        html.setAttribute("data-control", "datagrid");
        html.setAttribute("data-formrootcoords", dataformrootcoords);
        html.setAttribute("data-formroot", dataformroot);
        if (typeof parameters.devmode !== "undefined" && parameters.devmode == "design"){
          html.setAttribute("data-role", "draggable");
        }
        // Soportar CSS estructurado { parent, header, content, footer } o string simple
        if (typeof parameters.css !== "undefined" && parameters.css != null){
          if (typeof parameters.css === 'object' && parameters.css.parent) {
            html.setAttribute("style", parameters.css.parent);
          } else if (typeof parameters.css === 'string') {
            html.setAttribute("style", parameters.css);
          }
        }
        // Configuración de eventos del datagrid
        if (ro_page != null && ro_control != null) {
          const formRef = buildFormReference(ro_form.replace(/\[|\]|'/g, ''), ro_page, ro_control);
          const events = [];
          // Verifica si el target es válido para eventos (excluye header y elementos interactivos específicos)
          const isValidTarget = () => 
            `!(event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
              event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
              event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
              (event.target.onclick && typeof event.target.onclick === 'function'))`;
          if (typeof parameters.onclick === "function") {
            events.push(`${formRef}.onclick(this)`);
          }
          if (typeof parameters.onCellClick === "function") {
            events.push(`if (${isValidTarget()}) { ${formRef}.onCellClick(event, this); }`);
          }
          if (events.length > 0) {
            html.setAttribute("onclick", `javascript:${events.join('; ')};`);
          }
          if (typeof parameters.onCellDoubleClick === "function") {
            const dblClickEvent = `if (${isValidTarget()}) { ${formRef}.onCellDoubleClick(event, this); }`;
            html.setAttribute("ondblclick", `javascript:${dblClickEvent};`);
          }
        } else {
          // Path 2: Standalone datagrid
          if (typeof parameters.onclick === "function") {
            html.addEventListener('click', function(event) {
              // Solo ejecuta si no es header o elementos interactivos específicos
              if (!(event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onclick.call(this, event);
              }
            });
          }
          if (typeof parameters.onCellClick === "function") {
            html.addEventListener('click', function(event) {
              // Solo ejecuta si no es header o elementos interactivos específicos
              if (!(event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onCellClick.call(this, event, this);
              }
            });
          }
          if (typeof parameters.onCellDoubleClick === "function") {
            html.addEventListener('dblclick', function(event) {
              // Solo ejecuta si no es header o elementos interactivos específicos
              if (!(event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onCellDoubleClick.call(this, event, this);
              }
            });
          }
        }
        // Construir header con CSS si está disponible
        const headerStyle = (typeof parameters.css === 'object' && parameters.css.header) ? ` style="${parameters.css.header}"` : '';
        const footerStyle = (typeof parameters.css === 'object' && parameters.css.footer) ? ` style="${parameters.css.footer}"` : '';
        const footerHtml = (typeof parameters.css === 'object' && parameters.css.footer) ? `<div class="mangole-datagrid-footer" data-role="datagrid-footer"${footerStyle}></div>` : '';
        html.innerHTML = `<div class="mangole-datagrid-heading grid-header-color-gradient-light" data-role="datagrid-header"${headerStyle}>
          ${headerText}
        </div>${footerHtml}`;
        // Agregar event listeners para headers standalone
        if (ro_page === null || ro_control === null) {
          const headerCells = html.querySelectorAll('[data-has-header-events="true"]');
          headerCells.forEach(cell => {
            if (typeof parameters.onHeaderCellClick === "function") {
              cell.addEventListener('click', function(event) {
                if (event.target.nodeName !== 'INPUT' && event.target.nodeName !== 'SELECT') {
                  event.stopPropagation(); // Evita que se propague al datagrid principal
                  parameters.onHeaderCellClick.call(this, this, this.getAttribute('data-index'), event);
                }
              });
            }
            if (typeof parameters.onHeaderCellDoubleClick === "function") {
              cell.addEventListener('dblclick', function(event) {
                if (event.target.nodeName !== 'INPUT' && event.target.nodeName !== 'SELECT') {
                  event.stopPropagation(); // Evita que se propague al datagrid principal
                  parameters.onHeaderCellDoubleClick.call(this, this, this.getAttribute('data-index'), event);
                }
              });
            }
          });
        }
        if (typeof parameters.parent !== "undefined" && parameters.parent != "" && parameters.parent != null){
          ns.fillControl(parameters.parent, html, function(html, selector){
            selector.appendChild(html);
          });
        }else if (parameters.parent == ""){
          return html;
        }
        if (callback && typeof(callback) === "function"){
          callback();
        }
      }
    }
  };

  window.datagridv3 = ns.datagridv3 = function(_id){
    // Helpers modernos reutilizables
    const getElement = (methodName) => {
      if (_id?.nodeType === 1) return _id;
      const element = typeof _id === 'string' ? document.querySelector(_id) : null;
      if (!element && methodName) {
        console.log(`Uncaught TypeError: Cannot read property '${methodName}' of '${_id}' because is null`);
        return null;
      }
      return element;
    };
    const executeCallback = (callback) => {
      if (typeof callback === 'function') callback();
    };
    const validateElement = ($element, context) => {
      if (!$element || ($element.length !== undefined && !$element.length)) {
        console.error(`Elemento no encontrado para ${context}:`, $element);
        return false;
      }
      return true;
    };
    const getLocalizedText = (text) => {
      return Array.isArray(text) ? text[ns.languageIndex] || text[0] : text;
    };
    const buildFormReference = (form, page, control) => {
      if (!form) return null;
      const formPath = Array.isArray(form) ? form.map(item => `['${item}']`).join('') : `['${form}']`;
      return `window.forms${formPath}.pages[${page}].controls[${control}]`;
    };
    
    return {
      touchCounter: null,
      currentRow: {
        visible(value) {
          const row = this.getRowElement();
          if (!row) return false;
          
          if (value === true) {
            row.style.display = '';
          } else if (value === false) {
            row.style.display = 'none';
          } else {
            return false;
          }
        },
        index: _id?.target?.closest('.mangole-datagrid-row')?.getAttribute('data-index') || null,
        cell(index = 0) {
          const row = this.getRowElement();
          if (!row) {
            return { value: null };
          }
          
          const cells = row.getElementsByClassName('mangole-datagrid-cell');
          if (!cells || index >= cells.length || index < 0) {
            return { value: null };
          }
          
          const cell = cells[index];
          return { 
            value: cell && 'innerHTML' in cell ? cell.innerHTML : (cell ? cell.textContent : null) 
          };
        },
        getRowElement() {
          if (!_id?.target) return null;
          
          // Si el target es directamente una fila
          if (_id.target.classList?.contains('mangole-datagrid-row')) {
            return _id.target;
          }
          
          // Buscar la fila padre más cercana
          return _id.target.closest('.mangole-datagrid-row');
        }
      },
      currentCell: {
        css(_value) {
          const cell = this.getCellElement();
          if (_value !== undefined && _value !== false) {
            cell?.setAttribute('style', _value);
          } else {
            return cell?.getAttribute('style') || null;
          }
        },
        get index() {
          const cell = this.getCellElement();
          return cell?.getAttribute('data-index') || null;
        },
        get value() {
          const cell = this.getCellElement();
          return cell?.textContent || null;
        },
        attr(_data, _value) {
          const cell = this.getCellElement();
          if (_value !== undefined && _value !== false) {
            cell?.setAttribute(_data, _value);
          } else {
            return cell?.getAttribute(_data) || null;
          }
        },
        getCellElement() {
          if (!_id?.target) return null;
          
          // Si el target es directamente una celda
          if (_id.target.classList?.contains('mangole-datagrid-cell')) {
            return _id.target;
          }
          
          // Si el target está dentro de una celda (como un botón)
          return _id.target.closest('.mangole-datagrid-cell');
        }
      },
      rowsLength() {
        return document.querySelectorAll(`${_id} > div.mangole-datagrid-content > div.mangole-datagrid-row`).length;
      },
      row: (rowIndex) => {
        const getRowElement = () => document.querySelector(`${_id} > div.mangole-datagrid-content > div.mangole-datagrid-row[data-index="${rowIndex}"]`);
        const getCellElement = (cellIndex) => {
          const rows = document.querySelectorAll(`${_id} > div.mangole-datagrid-content > div.mangole-datagrid-row`);
          return rows?.[rowIndex]?.querySelectorAll('div.mangole-datagrid-cell')?.[cellIndex];
        };
        
        return {
          hide: () => {
            const row = getRowElement();
            if (row) row.style.display = 'none';
          },
          cell: (cellIndex) => {
            const cellElement = getCellElement(cellIndex);
            const contentType = cellElement?.getAttribute('data-contenttype') || 'text';
            const inputElement = cellElement?.querySelector('input, select');
            
            return {
              // GET value - Detección automática
              get value() {
                if (!cellElement) return null;
                
                // Si hay input/select, retorna su valor
                if (inputElement) {
                  if (inputElement.type === 'checkbox') {
                    return inputElement.checked;
                  }
                  return inputElement.value;
                }
                
                // Si es celda vacía, retorna textContent
                return cellElement.textContent || null;
              },
              
              // Método unificado value() - SET/GET inteligente
              value: (_value) => {
                if (!cellElement) {
                  console.error(`Cannot read property 'value' of '${_id} > row[${rowIndex}] > cell[${cellIndex}]' because is null`);
                  return null;
                }
                
                // GET
                if (_value === undefined) {
                  if (inputElement) {
                    if (inputElement.type === 'checkbox') {
                      return inputElement.checked;
                    }
                    return inputElement.value;
                  }
                  return cellElement.textContent || null;
                }
                
                // SET
                if (inputElement) {
                  if (inputElement.type === 'checkbox') {
                    inputElement.checked = typeof _value === "boolean" ? _value : (_value == 1 || _value == "1");
                  } else {
                    inputElement.value = _value;
                  }
                } else {
                  cellElement.textContent = _value;
                }
              },
              
              // Método text() - Solo para celdas sin input
              text: (text) => {
                if (inputElement) {
                  console.error(`El método .text() no aplica a celdas con input (contentType: ${contentType}). Use .value() en su lugar.`);
                  return;
                }
                
                if (cellElement) {
                  cellElement.textContent = text;
                  cellElement.setAttribute("title", text);
                }
              },
              
              // Método html() - Solo para celdas sin input
              html: (html) => {
                if (inputElement) {
                  console.error(`El método .html() no aplica a celdas con input (contentType: ${contentType}). Use .value() en su lugar.`);
                  return;
                }
                
                if (cellElement) cellElement.innerHTML = html;
              },
              
              // Método attr() - Aplica al input si existe, sino al cellElement
              attr: (_data, _value) => {
                const target = inputElement || cellElement;
                
                if (!target) {
                  console.error(`Cannot read property 'attr' of '${_id} > row[${rowIndex}] > cell[${cellIndex}]' because is null`);
                  return null;
                }
                
                // GET
                if (_value === undefined) {
                  return target.getAttribute(_data);
                }
                
                // SET
                target.setAttribute(_data, _value);
              },
              
              // Método css() - Aplica al input si existe, sino al cellElement
              css: (_value) => {
                const target = inputElement || cellElement;
                
                if (!target) return null;
                
                // GET
                if (_value === undefined) {
                  return target.getAttribute('style');
                }
                
                // SET
                target.setAttribute("style", _value);
              },
              
              // Método data() - Aplica al input si existe, sino al cellElement
              data: (_key, _value) => {
                const target = inputElement || cellElement;
                
                if (!target) {
                  console.error(`Cannot read property 'data' of '${_id} > row[${rowIndex}] > cell[${cellIndex}]' because is null`);
                  return null;
                }
                
                // GET
                if (typeof _key === "string" && _value === undefined) {
                  return target.getAttribute(`data-${_key}`);
                }
                
                // SET
                if (typeof _key === "string" && _value !== undefined) {
                  _value === "" ? target.removeAttribute(`data-${_key}`) : target.setAttribute(`data-${_key}`, _value);
                }
              },
              
              // Método disabled() - Solo para inputs
              disabled: (option, callback) => {
                if (!inputElement) {
                  console.error(`El método .disabled() solo aplica a celdas con input (contentType actual: ${contentType})`);
                  return;
                }
                
                // GET
                if (option === undefined) {
                  return inputElement.disabled;
                }
                
                // SET
                if (option === true) {
                  inputElement.setAttribute("disabled", "disabled");
                } else if (option === false) {
                  inputElement.removeAttribute("disabled");
                }
                
                executeCallback(callback);
              },
              
              // Método readonly() - Solo para inputs
              readonly: (option, callback) => {
                if (!inputElement) {
                  console.error(`El método .readonly() solo aplica a celdas con input (contentType actual: ${contentType})`);
                  return;
                }
                
                // GET
                if (option === undefined) {
                  return inputElement.readOnly || inputElement.hasAttribute('readonly');
                }
                
                // SET
                if (option === true) {
                  inputElement.setAttribute("readonly", "readonly");
                } else if (option === false) {
                  inputElement.removeAttribute("readonly");
                }
                
                executeCallback(callback);
              }
            }
          },
          
          delete: () => {
            const row = getRowElement();
            if (row) {
              row.remove();
            }
          }
        };
      },
      hide(callback) {
        const element = getElement('hide');
        if (element) {
          element.style.display = 'none';
        }
        executeCallback(callback);
      },
      show(callback) {
        const element = getElement('show');
        if (element) {
          element.style.display = '';
        }
        executeCallback(callback);
      },
      value(callback) {
        const rows = document.querySelectorAll(`${_id} > div.mangole-datagrid-content > div.mangole-datagrid-row`);
        const headerCells = document.querySelectorAll(`${_id} div.mangole-datagrid-heading > div.mangole-datagrid-cell`);
        
        const header = Array.from(headerCells).map(cell => cell.textContent);
        const data = [];
        
        for (const row of rows) {
          const dataCell = {};
          const cells = row.querySelectorAll('div.mangole-datagrid-cell');
          
          for (const cell of cells) {
            const field = cell.getAttribute('data-field');
            const input = cell.querySelector('input');
            
            if (input) {
              dataCell[field] = input.value;
            } else {
              dataCell[field] = cell.innerHTML.replace(/"/g, '\\"').replace(/'/g, "\\'");
            }
          }
          data.push(dataCell);
        }
        
        const result = { header, data };
        if (typeof callback === 'function') {
          callback(result);
          return false;
        }
        return result;
      },
      valueText(callback) {
        const rows = document.querySelectorAll(`${_id} > div.mangole-datagrid-content > div.mangole-datagrid-row`);
        const headerCells = document.querySelectorAll(`${_id} div.mangole-datagrid-heading > div.mangole-datagrid-cell`);
        
        const header = Array.from(headerCells).map(cell => cell.textContent);
        const data = [];
        
        for (const row of rows) {
          const dataCell = {};
          const cells = row.querySelectorAll('div.mangole-datagrid-cell');
          
          for (const cell of cells) {
            const field = cell.getAttribute('data-field');
            const input = cell.querySelector('input');
            const select = cell.querySelector('select');
            
            if (input) {
              dataCell[field] = input.value;
            } else if (select) {
              dataCell[field] = select.value;
            } else {
              dataCell[field] = cell.textContent;
            }
          }
          data.push(dataCell);
        }
        
        const result = { header, data };
        if (typeof callback === 'function') {
          callback(result);
          return false;
        }
        return result;
      },
      clear(callback) {
        const rows = document.querySelectorAll(`${_id} div.mangole-datagrid-content > div.mangole-datagrid-row`);
        rows.forEach(row => {
          row.remove();
        });
        executeCallback(callback);
      },
      deleteRow(_index, callback) {
        const row = document.querySelector(`${_id} div.mangole-datagrid-content > div.mangole-datagrid-row[data-index="${_index}"]`);
        if (row) {
          row.remove();
        }
        
        // Reindexar filas restantes
        const remainingRows = document.querySelectorAll(`${_id} div.mangole-datagrid-content > div.mangole-datagrid-row`);
        remainingRows.forEach((row, index) => {
          row.setAttribute('data-index', index);
        });
        
        executeCallback(callback);
      },
      css: function(_prop, _value) {
        const element = getElement('css');
        if (!element) {
          return false;
        }
        
        // GET: Sin parámetros, retorna objeto con CSS de todas las secciones
        if (_prop === undefined) {
          const headerEl = element.querySelector('.mangole-datagrid-heading');
          const contentEl = element.querySelector('.mangole-datagrid-content');
          const footerEl = element.querySelector('.mangole-datagrid-footer');
          
          return {
            parent: element.getAttribute('style') || '',
            header: headerEl ? headerEl.getAttribute('style') || '' : '',
            content: contentEl ? contentEl.getAttribute('style') || '' : '',
            footer: footerEl ? footerEl.getAttribute('style') || '' : ''
          };
        }
        
        // SET modo estructurado: Objeto con {parent, header, content, footer}
        if (typeof _prop === 'object' && _value === undefined) {
          if (_prop.parent !== undefined) {
            element.setAttribute('style', _prop.parent);
          }
          if (_prop.header !== undefined) {
            const headerEl = element.querySelector('.mangole-datagrid-heading');
            if (headerEl) headerEl.setAttribute('style', _prop.header);
          }
          if (_prop.content !== undefined) {
            const contentEl = element.querySelector('.mangole-datagrid-content');
            if (contentEl) contentEl.setAttribute('style', _prop.content);
          }
          if (_prop.footer !== undefined) {
            const footerEl = element.querySelector('.mangole-datagrid-footer');
            if (footerEl) footerEl.setAttribute('style', _prop.footer);
          }
          return true;
        }
        
        // SET modo legacy: css('property', 'value') afecta solo al padre
        element.style[_prop] = _value;
      },
      showHeader: function(callback) {
        const element = getElement('showHeader');
        if (!element) {
          return false;
        }
        const header = element.querySelector('.mangole-datagrid-heading');
        if (header) {
          header.style.display = '';
        }
        executeCallback(callback);
      },
      hideHeader: function(callback) {
        const element = getElement('hideHeader');
        if (!element) {
          return false;
        }
        const header = element.querySelector('.mangole-datagrid-heading');
        if (header) {
          header.style.display = 'none';
        }
        executeCallback(callback);
      },
      fill: function(json, callback){
        // Obtener el elemento del datagrid
        var ds_object = document.querySelector(_id);
        
        if (!ds_object) {
          console.error('datagridv3.fill(): No se encontró el elemento', _id);
          return false;
        }
        
        if (typeof json === "undefined" || json == null){
          return false;
        }
        
        // 1. Limpiar contenido existente
        var contentContainer = ds_object.querySelector('div.mangole-datagrid-content');
        if (contentContainer) {
          contentContainer.innerHTML = '';
        }
        
        // 2. Llamar a append() para agregar las filas
        return this.append(json, callback);
      },
      append: function(json, _callback){
        // Validación 1: Verificar que el elemento exista
        var ds_object = document.querySelector(_id);
        
        if (!ds_object) {
          console.error('datagridv3.append(): No se encontró el elemento', _id);
          return false;
        }
        
        // Validación 2: Verificar que json sea válido
        if (typeof json === "undefined" || json == null){
          return false;
        }
        
        // Obtener atributos con optional chaining para evitar errores
        var parameters = ds_object.getAttribute("data-formrootcoords")?.split(",") || [],
        form = ds_object.getAttribute("data-formroot")?.split(",") || [],
        fieldName = "",
        row = null,
        visible = "",
        width = "",
        css = "";

        // Intentar obtener el objeto del control desde window.forms
        var obj = null;
        
        if (form.length > 0 && form[0] !== "" && typeof window['forms'] !== 'undefined') {
          try {
            if (form.length > 1){
              var obbjj = "";
              for (var i = 0; i < form.length; i++){
                obbjj += "['"+form[i]+"']";
              }
              obj = eval("window['forms']"+obbjj+".pages[parameters[0]].controls[parameters[1]]");
            } else {
              obj = window['forms'][form[0]].pages[parameters[0]].controls[parameters[1]];
            }
          } catch(e) {
            // Si falla, intentar obtener desde el DOM
            obj = null;
          }
        }
        
        // Fallback: Si no se pudo obtener desde forms, extraer columns del DOM
        if (!obj || !obj.columns) {
          var headerCells = ds_object.querySelectorAll('.mangole-datagrid-heading > .mangole-datagrid-cell');
          if (headerCells.length > 0) {
            obj = {
              columns: {
                fieldName: [],
                visible: [],
                width: [],
                type: [],
                contentType: [],
                css: [],
                tooltip: []
              }
            };
            
            headerCells.forEach(function(cell, index) {
              obj.columns.fieldName.push(cell.getAttribute('data-orderfield') || 'field' + index);
              obj.columns.visible.push(cell.style.display !== 'none');
              obj.columns.width.push(cell.style.width || 'auto');
              
              var cellType = cell.classList.contains('checkbox-type') ? 'checkbox' : 
                             cell.classList.contains('radiobox-type') ? 'radiobox' :
                             cell.classList.contains('textbox-type') ? 'textbox' :
                             cell.classList.contains('select-type') ? 'select' :
                             cell.classList.contains('none-type') ? 'none' : 'text';
              obj.columns.type.push(cellType);
              
              // Extraer contentType desde data-contenttype del header
              var contentType = cell.getAttribute('data-contenttype') || 'text';
              obj.columns.contentType.push(contentType);
              
              obj.columns.css.push('');
              obj.columns.tooltip.push(true);
            });
          } else {
            console.error('datagridv3.append(): No se pudieron determinar las columnas');
            return false;
          }
        }

        var nindex = document.querySelectorAll(_id + ' > div.mangole-datagrid-content > div.mangole-datagrid-row').length;
        //Recorre la data para extraer la información que corresponde a cada campo
        for (var x = 0; x < json.length; x++){
          // IMPORTANTE: Reiniciar fieldName para cada fila
          fieldName = "";
          row = document.createElement("DIV");
          row.setAttribute("class", "mangole-datagrid-row");
          row.setAttribute("data-index", nindex);
          nindex++;
          //Recorre cada elemento del array para formar la grilla
          for (var i = 0; i < obj.columns.fieldName.length; i++){
            //Verifica si la columna es visible, para hacer la celda visible
            if (obj.columns.visible[i] == false){
              visible = 'display:none;';
            }else{
              visible = "";
            }
            //Verifica el ancho de la columna para hacer la celda del mismo tamaño
            if (obj.columns.width[i] != 'auto'){
              width = 'width:'+obj.columns.width[i]+';';
            }else{
              width = "";
            }

            if (typeof obj.columns.css !== "undefined"){
              if (typeof obj.columns.css === "object"){
                if (typeof obj.columns.css[i] !== "undefined"){
                  css = obj.columns.css[i];
                }else{
                  css = "";
                }
              }else{
                if (obj.columns.css != ""){
                  css = obj.columns.css;
                }
              }
            }else{
              css = "";
            }

            if (typeof json[x].css !== "undefined"){
              if (typeof json[x].css === "object"){ 
                if (typeof json[x].css[i] !== "undefined"){
                  css += " " + json[x].css[i];
                }else{
                  css += "";
                }
              }else{
                if (json[x].css != ""){
                  css += " " + json[x].css;
                }
              }
            }else{
              css += "";
            }

            //Eventos en cada control dentro de la celda
            var oncellevent = "";
            // Solo agregar eventos si existe el contexto de formulario
            if (form.length > 0 && form[0] !== "" && parameters.length > 0) {
              if (typeof obj.onCellControlClick === "function"){
                oncellevent += ' onclick="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlClick(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlChange === "function"){
                oncellevent += ' onchange="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlChange(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlBlur === "function"){
                oncellevent += ' onblur="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlBlur(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlPaste === "function"){
                oncellevent += ' onpaste="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlPaste(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlCut === "function"){
                oncellevent += ' oncut="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlCut(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlKeyup === "function"){
                oncellevent += ' onkeyup="javascript:if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeyup(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, event.keyCode); };"';
              }
              if (typeof obj.onCellControlKeypress === "function"){
                oncellevent += ' onkeypress="javascript:var code = (event.keyCode ? event.keyCode : event.which); if (event.target.nodeName && event.target.nodeName == \'INPUT\' || event.target.nodeName == \'SELECT\'){ window[\'forms\'][\''+form[0]+'\'].pages['+parameters[0]+'].controls['+parameters[1]+'].onCellControlKeypress(this, this.parentNode.parentNode.getAttribute(\'data-index\'), this.parentNode.getAttribute(\'data-index\'), event, code); };"';
              }
            }
            
            //Verifica qué tipo de contenido tendrá la celda - AGREGADO data-contenttype
            if (obj.columns.type[i] == "checkbox"){
              fieldName += '<div class="mangole-datagrid-cell center checkbox-type" data-contenttype="checkbox" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="checkbox" name="'+i+'" '+((typeof json[x][obj.columns.fieldName[i]] === "boolean" && json[x][obj.columns.fieldName[i]] == true || json[x][obj.columns.fieldName[i]] == 1 || json[x][obj.columns.fieldName[i]] == "1") ? 'checked="checked"' : '')+' '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "radiobox"){
              var radioChecked = (json[x][obj.columns.fieldName[i]] === true || json[x][obj.columns.fieldName[i]] === 1 || json[x][obj.columns.fieldName[i]] === "1") ? 'checked="checked"' : '';
              fieldName += '<div class="mangole-datagrid-cell center radiobox-type" data-contenttype="radiobox" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="radio" name="radio_'+obj.columns.fieldName[i]+'" data-index="'+i+'" '+radioChecked+' '+oncellevent+' /></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "text"){
              //Verifica si la celda tiene valor vacío. En caso diferente, la llena con el valor correspondiente de la data
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell" data-contenttype="text" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell" data-contenttype="text" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell" data-contenttype="text" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'" '+((typeof obj.columns.tooltip !== "undefined" && obj.columns.tooltip[i] == false) ? '' : 'title="'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'"')+'>'+((json[x][obj.columns.fieldName[i]] instanceof Array) ? json[x][obj.columns.fieldName[i]][ns.languageIndex] : json[x][obj.columns.fieldName[i]])+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }else if (obj.columns.type[i] == "select"){
              if (json[x][obj.columns.fieldName[i]] instanceof Array){
                var optionshtml = '';
                for (var p = 0; p < json[x][obj.columns.fieldName[i]].length; p++){
                  var selected = (typeof json[x][obj.columns.fieldName[i]][p].selected !== "undefined" && json[x][obj.columns.fieldName[i]][p].selected == true) ? 'selected="selected"' : '';
                  optionshtml += '<option value="'+json[x][obj.columns.fieldName[i]][p].value+'" '+selected+'>'+json[x][obj.columns.fieldName[i]][p].text+'</option>';
                }
                fieldName += '<div class="mangole-datagrid-cell select-type" data-contenttype="select" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'>'+optionshtml+'</select></div><!-- mangole-datagrid-cell-->';
              }else{
                var displayValue = (typeof json[x][obj.columns.fieldName[i]] !== "undefined" && json[x][obj.columns.fieldName[i]] !== null) ? json[x][obj.columns.fieldName[i]] : '';
                fieldName += '<div class="mangole-datagrid-cell select-type" data-contenttype="select" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><select '+oncellevent+'><option value="'+displayValue+'">'+displayValue+'</option></select></div><!-- mangole-datagrid-cell-->';
              }
            }else if (obj.columns.type[i] == "textbox"){
              var inputValue = (typeof json[x][obj.columns.fieldName[i]] !== "undefined" && json[x][obj.columns.fieldName[i]] !== null) ? json[x][obj.columns.fieldName[i]] : '';
              // Tipos de input válidos
              var validTypes = ['text', 'number', 'date', 'email', 'password', 'tel', 'url', 'time', 'datetime-local', 'color'];
              var inputType = (typeof obj.columns.contentType !== "undefined" && validTypes.indexOf(obj.columns.contentType[i]) !== -1) ? obj.columns.contentType[i] : 'text';
              fieldName += '<div class="mangole-datagrid-cell textbox-type" data-contenttype="textbox" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"><input type="'+inputType+'" '+oncellevent+' value="'+inputValue+'"/></div><!-- mangole-datagrid-cell-->';
            }else if (obj.columns.type[i] == "none"){
              if (obj.columns.fieldName[i] == ""){
                fieldName += '<div class="mangole-datagrid-cell none-type" data-contenttype="none" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
              }else{
                if (typeof json[x][obj.columns.fieldName[i]] === "undefined"){
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-contenttype="none" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'"></div><!-- mangole-datagrid-cell-->';
                }else{
                  fieldName += '<div class="mangole-datagrid-cell none-type" data-contenttype="none" data-index="'+i+'" data-field="'+obj.columns.fieldName[i]+'" style="'+visible+' '+width+' '+css+'">'+json[x][obj.columns.fieldName[i]]+'</div><!-- mangole-datagrid-cell-->';
                }
              }
            }
          }
          row.innerHTML = fieldName;
          //Llena el datagrid con los campos y sus respectivos datos
          ds_object.querySelector('div.mangole-datagrid-content').appendChild(row);
          row = null;
        }
        if (typeof _callback == "function"){
          _callback();
        }
      },
      create(parameters = {}, callback) {
        // Configuración de formulario
        let ro_form = null, ro_page = null, ro_control = null;
        let dataformroot = '';
        
        if (parameters.form) {
          if (Array.isArray(parameters.form)) {
            ro_form = parameters.form.map(f => `['${f}']`).join('');
            dataformroot = parameters.form.join(',');
          } else {
            ro_form = `['${parameters.form}']`;
            dataformroot = parameters.form;
          }
        }
        
        ro_page = parameters.page || null;
        ro_control = parameters.control || null;

        if (typeof parameters.dataFormRoot !== "undefined" && typeof parameters.dataFormRoot === "object"){
          var dataformrootcoords = parameters.dataFormRoot;
        }else{
          var dataformrootcoords = null;
        }
        if (typeof parameters.dataFrom !== "undefined" && typeof parameters.dataFrom === "object"){
          var parameters = parameters.dataFrom;
        }

        parameters.id = (typeof parameters.id === "undefined") ? id = id.panel() : id = parameters.id;
        parameters.parent = (typeof parameters.parent === "undefined") ? "" : parameters.parent;

        if (document.getElementById(parameters.id)){
          console.error('Se ha creado otro elemento con el ID "' + parameters.id + '". Esto puede provocar un mal funcionamiento en la aplicación.');
        }

        // Construcción del header del datagridv3
        const createHeaderCell = (i) => {
          const visible = parameters.columns.visible[i] === false ? 'display:none;' : '';
          const widthValue = parameters.columns.width[i];
          const width = (widthValue && widthValue !== 'auto') ? `width:${widthValue};` : '';
          const style = `${visible} ${width}`;
          const text = getLocalizedText(parameters.columns.headerText[i]);
          const contentType = parameters.columns.contentType && parameters.columns.contentType[i] ? parameters.columns.contentType[i] : 'text';
          
          // Eventos del header - Dual path pattern
          let headerEvents = '';
          if (ro_page != null && ro_control != null) {
            // Path 1: Form-referenced headers
            const formRef = buildFormReference(ro_form.replace(/\[|\]|'/g, ''), ro_page, ro_control);
            
            if (typeof parameters.onHeaderCellClick === "function") {
              headerEvents += ` onclick="javascript:if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT'){ }else{ event.stopPropagation(); ${formRef}.onHeaderCellClick(this, this.getAttribute('data-index'), event); };"`;
            }
            
            if (typeof parameters.onHeaderCellDoubleClick === "function") {
              headerEvents += ` ondblclick="javascript:if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT'){ }else{ event.stopPropagation(); ${formRef}.onHeaderCellDoubleClick(this, this.getAttribute('data-index'), event); };"`;
            }
          } else {
            // Path 2: Standalone headers - events will be added via addEventListener after HTML creation
            headerEvents += ` data-has-header-events="true" data-cell-index="${i}"`;
          }
          
          const cellTypes = {
            checkbox: `<input type="checkbox" name="${i}" />`,
            radiobox: `<input type="radio" name="radio" data-index="${i}" />`,
            text: text,
            select: text,
            textbox: text,
            none: text
          };
          
          const cellClass = parameters.columns.type[i] === 'text' ? '' : ` ${parameters.columns.type[i]}-type`;
          return `<div class="mangole-datagrid-cell${cellClass}" data-contenttype="${contentType}" data-field="${parameters.columns.fieldName[i]}" data-orderfield="${parameters.columns.fieldName[i]}" data-order="ASC" data-index="${i}" style="${style}"${headerEvents}>${cellTypes[parameters.columns.type[i]] || text}</div>`;
        };
        
        const headerText = parameters.columns.headerText.map((_, i) => createHeaderCell(i)).join('');

        var html = document.createElement("DIV");
        html.setAttribute("id", parameters.id);
        html.setAttribute("class", "mangole-datagridv3" + ((parameters.class != null && typeof parameters.class !== "undefined") ? ' ' + parameters.class : ''));
        html.setAttribute("data-control", "datagridv3");
        html.setAttribute("data-formrootcoords", dataformrootcoords);
        html.setAttribute("data-formroot", dataformroot);

        if (typeof parameters.devmode !== "undefined" && parameters.devmode == "design"){
          html.setAttribute("data-role", "draggable");
        }

        // Aplicar CSS estructurado o legacy
        if (typeof parameters.css !== "undefined" && parameters.css != null){
          if (typeof parameters.css === 'object' && parameters.css.parent) {
            // CSS estructurado: aplicar sección parent al wrapper
            html.style.cssText = parameters.css.parent;
          } else if (typeof parameters.css === 'string') {
            // CSS legacy: aplicar string directamente
            html.setAttribute("style", parameters.css);
          }
        }

        // Configuración de eventos del datagridv3 - Dual path pattern
        if (ro_page != null && ro_control != null) {
          // Path 1: Form-referenced datagridv3
          const formRef = buildFormReference(ro_form.replace(/\[|\]|'/g, ''), ro_page, ro_control);
          const events = [];
          
          // Verifica si el target es válido para eventos (excluye header, content div y elementos interactivos específicos)
          const isValidTarget = () => 
            `!(event.target.getAttribute('data-role') === 'datagrid-content' || 
              event.target.getAttribute('data-role') === 'datagrid-header' ||
              event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
              event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
              event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
              (event.target.onclick && typeof event.target.onclick === 'function'))`;

          if (typeof parameters.onclick === "function") {
            events.push(`${formRef}.onclick(this)`);
          }

          if (typeof parameters.onCellClick === "function") {
            events.push(`if (${isValidTarget()}) { ${formRef}.onCellClick(event, this); }`);
          }

          if (events.length > 0) {
            html.setAttribute("onclick", `javascript:${events.join('; ')};`);
          }

          if (typeof parameters.onCellDoubleClick === "function") {
            const dblClickEvent = `if (${isValidTarget()}) { ${formRef}.onCellDoubleClick(event, this); }`;
            html.setAttribute("ondblclick", `javascript:${dblClickEvent};`);
          }
        } else {
          // Path 2: Standalone datagridv3

          if (typeof parameters.onclick === "function") {
            html.addEventListener('click', function(event) {
              // Solo ejecuta si no es header, content div o elementos interactivos específicos
              if (!(event.target.getAttribute('data-role') === 'datagrid-content' || 
                    event.target.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onclick.call(this, event);
              }
            });
          }

          if (typeof parameters.onCellClick === "function") {
            html.addEventListener('click', function(event) {
              // Solo ejecuta si no es header, content div o elementos interactivos específicos
              if (!(event.target.getAttribute('data-role') === 'datagrid-content' || 
                    event.target.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onCellClick.call(this, event, this);
              }
            });
          }

          if (typeof parameters.onCellDoubleClick === "function") {
            html.addEventListener('dblclick', function(event) {
              // Solo ejecuta si no es header, content div o elementos interactivos específicos
              if (!(event.target.getAttribute('data-role') === 'datagrid-content' || 
                    event.target.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.parentNode.getAttribute('data-role') === 'datagrid-header' ||
                    event.target.nodeName === 'INPUT' || event.target.nodeName === 'SELECT' ||
                    event.target.nodeName === 'BUTTON' || event.target.type === 'button' ||
                    (event.target.onclick && typeof event.target.onclick === 'function'))) {
                parameters.onCellDoubleClick.call(this, event, this);
              }
            });
          }
        }

        // Clase condicional fullheight
        const fullHeightClass2 = (parameters.fullHeight === true || parameters.fullHeight === 'true' || parameters.fullHeight === 1) ? 'fullheight' : '';
        const withoutFooterClass2 = parameters.showFooter !== false ? '' : 'withoutfooter';
        
        // Botón de configuración de columnas (solo si allowColumnConfiguration es true)
        const formId = ro_form ? ro_form.replace(/\[|\]|'/g, '') : 'unknown';
        const showColumnBtn = parameters.allowColumnConfiguration !== false;
        const columnsSelectorBtn = showColumnBtn ? `<button class="btn-datagrid-columns" 
          onclick="if(window.DatagridColumnSelector){window.DatagridColumnSelector.open('${parameters.id}', '${formId}', ${parameters.onColumnsSaved ? `{onSave: ${parameters.onColumnsSaved}}` : '{}'});}else{msgalert.showAlert({title: 'Error', text: 'El selector de columnas no está cargado. Asegúrese de incluir datagrid-column-selector.js', icon: false, doneButtonLabel: {visible: true, label: 'Aceptar'}, cancelButtonLabel: {visible: false}}, () => {});}" 
          title="Configurar columnas visibles">
          ⚙️
        </button>` : '';
        
        html.innerHTML = `<div class="mangole-datagrid-heading" data-role="datagrid-header">
          ${headerText}
          ${columnsSelectorBtn}
        </div>
        <div class="mangole-datagrid-content ${fullHeightClass2} ${withoutFooterClass2}" data-role="datagrid-content"></div>`;

        if (parameters.showFooter !== false) {
          html.innerHTML += '<div class="mangole-datagrid-footer" data-role="datagrid-footer"></div>';
        }

        // Aplicar CSS estructurado a secciones internas si existe
        if (typeof parameters.css === 'object' && parameters.css !== null) {
          const headerEl = html.querySelector('[data-role="datagrid-header"]');
          const contentEl = html.querySelector('[data-role="datagrid-content"]');
          const footerEl = html.querySelector('[data-role="datagrid-footer"]');

          if (parameters.css.header && headerEl) {
            headerEl.style.cssText = parameters.css.header;
          }
          if (parameters.css.content && contentEl) {
            contentEl.style.cssText = parameters.css.content;
          }
          if (parameters.css.footer && footerEl) {
            footerEl.style.cssText = parameters.css.footer;
          }
        }

        // Agregar event listeners para headers standalone
        if (ro_page === null || ro_control === null) {
          const headerCells = html.querySelectorAll('[data-has-header-events="true"]');
          headerCells.forEach(cell => {
            if (typeof parameters.onHeaderCellClick === "function") {
              cell.addEventListener('click', function(event) {
                if (event.target.nodeName !== 'INPUT' && event.target.nodeName !== 'SELECT') {
                  event.stopPropagation(); // Evita que se propague al datagrid principal
                  parameters.onHeaderCellClick.call(this, this, this.getAttribute('data-index'), event);
                }
              });
            }
            
            if (typeof parameters.onHeaderCellDoubleClick === "function") {
              cell.addEventListener('dblclick', function(event) {
                if (event.target.nodeName !== 'INPUT' && event.target.nodeName !== 'SELECT') {
                  event.stopPropagation(); // Evita que se propague al datagrid principal
                  parameters.onHeaderCellDoubleClick.call(this, this, this.getAttribute('data-index'), event);
                }
              });
            }
          });
        }

        if (parameters.parent && parameters.parent !== "") {
          ns.fillControl(parameters.parent, html, (html, selector) => {
            selector.appendChild(html);
          });
        } else if (parameters.parent === "") {
          return html;
        }
        
        // Auto-llenar datos si vienen en parameters.data
        if (parameters.data && Array.isArray(parameters.data) && parameters.data.length > 0) {
          setTimeout(() => {
            try {
              if (typeof _id === 'string') {
                datagridv3(_id).fill(parameters.data);
              } else {
                datagridv3('#' + parameters.id).fill(parameters.data);
              }
            } catch (error) {
              console.warn('No se pudo llenar datagridv3 automáticamente:', error);
            }
          }, 50);
        }
        
        // Auto-aplicar configuración de columnas guardada en localStorage
        setTimeout(() => {
          try {
            const formId = ro_form ? ro_form.replace(/\[|\]|'/g, '') : 'unknown';
            const key = `datagrid_${formId}_${parameters.id}_columns`;
            const stored = localStorage.getItem(key);
            
            if (stored) {
              const config = JSON.parse(stored);
              if (config.visibleColumns && Array.isArray(config.visibleColumns)) {
                if (ns.datagridv3 && ns.datagridv3.setVisibleColumns) {
                  ns.datagridv3.setVisibleColumns(parameters.id, config.visibleColumns);
                }
              }
            }
          } catch (error) {
            console.warn('No se pudo aplicar configuración de columnas guardada:', error);
          }
        }, 100);
        
        executeCallback(callback);
      }
    }
  };

  /**
   * API para gestión de columnas visibles en datagridv3
   */
  
  /**
   * Establece qué columnas son visibles en el datagrid
   * @param {string} gridId - ID del datagrid
   * @param {Array<string>} visibleFieldNames - Array de fieldNames visibles
   */
  ns.datagridv3.setVisibleColumns = function(gridId, visibleFieldNames) {
    let grid = document.querySelector(`[data-id="${gridId}"]`);
    if (!grid) {
      grid = document.getElementById(gridId);
    }
    if (!grid) {
      console.error('datagridv3.setVisibleColumns(): Grid no encontrado', gridId);
      return;
    }

    // Obtener todas las columnas (headers)
    const headers = grid.querySelectorAll('.mangole-datagrid-heading > .mangole-datagrid-cell');
    
    // Aplicar visibilidad a headers
    headers.forEach(header => {
      const fieldName = header.dataset.field;
      if (fieldName) {
        if (visibleFieldNames.includes(fieldName)) {
          header.classList.remove('hidden');
        } else {
          header.classList.add('hidden');
        }
      }
    });

    // Aplicar visibilidad a todas las filas
    const rows = grid.querySelectorAll('.mangole-datagrid-content .mangole-datagrid-row');
    rows.forEach(row => {
      const cells = row.querySelectorAll('.mangole-datagrid-cell');
      cells.forEach((cell, index) => {
        if (index < headers.length) {
          const header = headers[index];
          const fieldName = header.dataset.field;
          if (fieldName) {
            if (visibleFieldNames.includes(fieldName)) {
              cell.classList.remove('hidden');
            } else {
              cell.classList.add('hidden');
            }
          }
        }
      });
    });

    // Reajustar anchos de columnas visibles para llenar el espacio
    const visibleHeaders = Array.from(headers).filter(h => !h.classList.contains('hidden'));
    const totalVisible = visibleHeaders.length;
    
    if (totalVisible > 0) {
      // Contar cuántas columnas tienen width 'auto'
      const autoColumns = visibleHeaders.filter(h => {
        const width = h.style.width;
        return !width || width === 'auto' || width === '';
      });
      
      if (autoColumns.length > 0) {
        // Distribuir el espacio equitativamente entre columnas auto
        const autoWidth = `${100 / totalVisible}%`;
        autoColumns.forEach(header => {
          header.style.width = autoWidth;
          header.style.flex = '1 1 auto';
          
          // Aplicar también a las celdas correspondientes
          const index = Array.from(headers).indexOf(header);
          rows.forEach(row => {
            const cell = row.querySelectorAll('.mangole-datagrid-cell')[index];
            if (cell) {
              cell.style.width = autoWidth;
              cell.style.flex = '1 1 auto';
            }
          });
        });
      }
    }
  };

  /**
   * Obtiene las columnas visibles actuales
   * @param {string} gridId - ID del datagrid
   * @returns {Array<string>} Array de fieldNames visibles
   */
  ns.datagridv3.getVisibleColumns = function(gridId) {
    let grid = document.querySelector(`[data-id="${gridId}"]`);
    if (!grid) {
      grid = document.getElementById(gridId);
    }
    if (!grid) {
      console.error('datagridv3.getVisibleColumns(): Grid no encontrado', gridId);
      return [];
    }

    const headers = grid.querySelectorAll('.mangole-datagrid-heading > .mangole-datagrid-cell');
    const visibleColumns = [];

    headers.forEach(header => {
      const fieldName = header.dataset.field;
      if (fieldName && !header.classList.contains('hidden')) {
        visibleColumns.push(fieldName);
      }
    });

    return visibleColumns;
  };

  /**
   * Restaura todas las columnas a su estado visible por defecto
   * @param {string} gridId - ID del datagrid
   */
  ns.datagridv3.resetColumnsToDefault = function(gridId) {
    let grid = document.querySelector(`[data-id="${gridId}"]`);
    if (!grid) {
      grid = document.getElementById(gridId);
    }
    if (!grid) {
      console.error('datagridv3.resetColumnsToDefault(): Grid no encontrado', gridId);
      return;
    }

    // Obtener todos los headers
    const headers = grid.querySelectorAll('.mangole-datagrid-heading > .mangole-datagrid-cell');
    const allFieldNames = [];

    headers.forEach(header => {
      const fieldName = header.dataset.field;
      if (fieldName) {
        allFieldNames.push(fieldName);
        header.classList.remove('hidden');
      }
    });

    // Mostrar todas las celdas en todas las filas
    const rows = grid.querySelectorAll('.mangole-datagrid-content .mangole-datagrid-row');
    rows.forEach(row => {
      const cells = row.querySelectorAll('.mangole-datagrid-cell');
      cells.forEach(cell => {
        cell.classList.remove('hidden');
      });
    });
  };

})(mangole);

/**
 * Modal Helper - Sistema de modales estandarizados
 * Utilidad para crear modals consistentes en toda la aplicación
 */
(function() {
  'use strict';
  
  window.ModalHelper = {
    /**
     * Crear un modal estandarizado
     * @param {object} options - Opciones del modal
     * @param {string} options.id - ID único del modal (ej: 'datagrid-columns', 'preview')
     * @param {string} options.title - Título del modal
     * @param {string} options.icon - Emoji del ícono (opcional)
     * @param {string} options.bodyContent - HTML del cuerpo del modal
     * @param {array} options.footerButtons - Array de botones del footer (opcional)
     * @param {function} options.onClose - Callback al cerrar
     * @param {boolean} options.closeOnOverlay - Cerrar al hacer click en overlay (default: true)
     * @param {boolean} options.closeOnEscape - Cerrar con tecla ESC (default: true)
     * @param {string} options.size - Tamaño del modal: 'small', 'medium', 'large', 'fullscreen' (default: 'large')
     * @returns {object} - Objeto con el modal y métodos de control
     */
    create: function(options) {
      // Validar opciones requeridas
      if (!options.id || !options.title) {
        console.error('❌ ModalHelper.create: Se requiere id y title');
        return null;
      }
      
      // Opciones por defecto
      const config = {
        icon: '',
        bodyContent: '',
        footerButtons: [],
        onClose: null,
        onShow: null,
        closeOnOverlay: true,
        closeOnEscape: true,
        size: 'large',
        ...options
      };
      
      // Crear estructura del modal
      const modal = document.createElement('div');
      modal.className = `mangole-modal ${config.id}-modal ${config.size}`;
      modal.setAttribute('data-modal-id', config.id);
      
      // Construir HTML del footer si hay botones
      let footerHtml = '';
      if (config.footerButtons && config.footerButtons.length > 0) {
        const buttonsHtml = config.footerButtons.map(btn => {
          const btnClass = btn.primary ? 'btn btn-primary' : 'btn btn-secondary';
          const btnIcon = btn.icon ? btn.icon + ' ' : '';
          return `<button class="${btnClass}" data-action="${btn.action}">${btnIcon}${btn.label}</button>`;
        }).join('');
        
        footerHtml = `
          <div class="mangole-modal-footer">
            ${buttonsHtml}
          </div>
        `;
      }
      
      modal.innerHTML = `
        <div class="mangole-modal-overlay"></div>
        <div class="mangole-modal-content">
          <div class="mangole-modal-header">
            <h3>${config.icon ? config.icon + ' ' : ''}${config.title}</h3>
            <button class="btn-close-modal" title="Cerrar">✕</button>
          </div>
          <div class="mangole-modal-body">
            ${config.bodyContent}
          </div>
          ${footerHtml}
        </div>
      `;
      
      // Agregar al DOM
      document.body.appendChild(modal);
      
      // Función para cerrar el modal
      const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => {
          modal.remove();
          if (escHandler) {
            document.removeEventListener('keydown', escHandler);
          }
          if (config.onClose && typeof config.onClose === 'function') {
            config.onClose();
          }
        }, 200);
      };
      
      // Event listeners
      const closeBtn = modal.querySelector('.btn-close-modal');
      const overlay = modal.querySelector('.mangole-modal-overlay');
      
      closeBtn.addEventListener('click', closeModal);
      
      if (config.closeOnOverlay) {
        overlay.addEventListener('click', closeModal);
      }
      
      // Cerrar con ESC
      let escHandler = null;
      if (config.closeOnEscape) {
        escHandler = (e) => {
          if (e.key === 'Escape') {
            closeModal();
          }
        };
        document.addEventListener('keydown', escHandler);
      }
      
      // Event listeners para botones del footer
      if (config.footerButtons && config.footerButtons.length > 0) {
        config.footerButtons.forEach(btn => {
          const btnElement = modal.querySelector(`[data-action="${btn.action}"]`);
          if (btnElement) {
            if (btn.action === 'close') {
              // Acción automática: cerrar modal
              btnElement.addEventListener('click', closeModal);
            } else if (btn.onClick && typeof btn.onClick === 'function') {
              // Acción personalizada
              btnElement.addEventListener('click', () => {
                btn.onClick(modal, closeModal);
              });
            }
          }
        });
      }
      
      // Animación de entrada
      setTimeout(() => {
        modal.classList.add('active');
        
        // Ejecutar callback onShow si existe
        if (config.onShow && typeof config.onShow === 'function') {
          config.onShow();
        }
      }, 10);
      
      // Retornar objeto con el modal y métodos útiles
      return {
        element: modal,
        close: closeModal,
        getBody: () => modal.querySelector('.mangole-modal-body'),
        getFooter: () => modal.querySelector('.mangole-modal-footer'),
        setTitle: (newTitle) => {
          const titleElement = modal.querySelector('.mangole-modal-header h3');
          if (titleElement) {
            titleElement.innerHTML = `${config.icon ? config.icon + ' ' : ''}${newTitle}`;
          }
        }
      };
    }
  };
  
})();



