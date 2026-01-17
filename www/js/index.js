/*
 * Script principal de la aplicación Cordova
 * Generado por Mangole Studio
 */

var app = {
    // Inicialización de la aplicación
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // El dispositivo está listo
    onDeviceReady: function() {
        console.log('Device Ready');
        
        // Inicializar StatusBar (si el plugin está instalado)
        if (window.StatusBar) {
            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString('#000000');
        }
        
        // Cargar la primera pantalla
        this.loadInitialScreen();
    },

    // Cargar pantalla inicial
    loadInitialScreen: function() {
        // Aquí se cargará la primera pantalla definida en screens.js
        console.log('Cargando pantalla inicial...');
        
        // Ejemplo: si existe window.forms.home
        if (window.forms && window.forms.home) {
            window.forms.home.show();
        }
    }
};

// Iniciar la aplicación
app.initialize();
