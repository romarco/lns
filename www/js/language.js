/**
 * MangoleStudio - Language System (Mobile)
 * Sistema multiidioma con diccionario de traducciones
 * 
 * ============================================================================
 * FORMAS DE USO:
 * ============================================================================
 * 
 * 1. ARRAY DIRECTO (sin diccionario):
 * ------------------------------------
 * {
 *   controlType: "button",
 *   label: ['Guardar', 'Save', 'Enregistrer']
 * }
 * 
 * Usa automáticamente el índice según app.data.config.languageIndex
 * - languageIndex = 0 → 'Guardar'
 * - languageIndex = 1 → 'Save'
 * - languageIndex = 2 → 'Enregistrer'
 * 
 * 
 * 2. CÓDIGO DE DICCIONARIO (buscar en translations):
 * ---------------------------------------------------
 * {
 *   controlType: "label",
 *   value: lang.login('a')
 * }
 * 
 * Busca el código 'a' en window.translations.login
 * Si translations.login.a = ['Iniciar sesión', 'Log In']
 * → Retorna: ['Iniciar sesión', 'Log In']
 * 
 * Ventaja: Centralizar traducciones y reutilizarlas
 * 
 * 
 * 3. OVERRIDE ES + CÓDIGO (híbrido):
 * -----------------------------------
 * {
 *   controlType: "button",
 *   label: lang.login('Texto personalizado en español', 'a')
 * }
 * 
 * - Usa el primer parámetro como ES (índice 0)
 * - Busca el código 'a' en translations.login para obtener otros idiomas
 * 
 * Si translations.login.a = ['Original ES', 'Log In', 'Se connecter']
 * → Retorna: ['Texto personalizado en español', 'Log In', 'Se connecter']
 * 
 * Ventaja: Personalizar ES pero mantener traducciones de otros idiomas
 * 
 * 
 * EJEMPLO COMPLETO EN UN FORMULARIO:
 * -----------------------------------
 * forms.login = {
 *   pages: [{
 *     controls: [
 *       {
 *         controlType: "label",
 *         value: lang.login('a')  // → ['Iniciar sesión', 'Log In']
 *       },
 *       {
 *         controlType: "textbox",
 *         placeholder: lang.login('b')  // → ['Email *', 'Email *']
 *       },
 *       {
 *         controlType: "button",
 *         label: lang.login('Entrar al sistema', 'e')  // → ['Entrar al sistema', 'Enter']
 *       },
 *       {
 *         controlType: "button",
 *         label: ['Botón sin traducción', 'Untranslated button']  // Array directo
 *       }
 *     ]
 *   }]
 * };
 */

// ============================================================================
// DICCIONARIO DE TRADUCCIONES
// ============================================================================
window.translations = {
    global: {
        a: ['Recargar', 'Reload'],
        b: ['No hay conexión', 'No connection'],
        c: ['Atención', 'Attention'],
        d: ['Error', 'Error'],
        e: ['Aceptar', 'Accept'],
        f: ['Cancelar', 'Cancel'],
        g: ['Cargando...', 'Loading...']
    },
    login: {
        a: ['Iniciar sesión', 'Log In'],
        b: ['Email *', 'Email *'],
        c: ['Contraseña *', 'Password *'],
        d: ['Siguiente', 'Next'],
        e: ['Entrar', 'Enter'],
        f: ['Seleccione sucursal *', 'Select branch *'],
        g: ['Campos Requeridos', 'Required Fields'],
        h: ['Por favor ingrese email y contraseña', 'Please enter email and password'],
        i: ['Email inválido', 'Invalid Email'],
        j: ['Por favor ingrese un email válido', 'Please enter a valid email'],
        k: ['Error de Autenticación', 'Authentication Error'],
        l: ['Credenciales inválidas', 'Invalid credentials'],
        m: ['Error de Conexión', 'Connection Error'],
        n: ['No se pudo conectar con el servidor', 'Could not connect to the server'],
        o: ['Campo Requerido', 'Required Field'],
        p: ['Por favor ingrese su email', 'Please enter your email'],
        q: ['Usuario no encontrado', 'User not found'],
        r: ['No se pudo obtener las sucursales', 'Could not get branches'],
        s: ['Por favor seleccione sucursal e ingrese contraseña', 'Please select a branch and enter a password'],
        t: ['Comenzar', 'Start'],
        u: ['Sucursal', 'Branch']
    },
    index: {
        a: ['Inicio', 'Home'],
        b: ['Menú', 'Menu'],
        c: ['Cerrar sesión', 'Log out']
    }
    // Agregar más nodos según sea necesario
};

// ============================================================================
// FUNCIÓN lang - Proxy dinámico para acceder a traducciones
// ============================================================================
window.lang = new Proxy({}, {
    get: function(target, node) {
        return function(...params) {
            // Validar que exista el nodo en translations
            if (!window.translations || !window.translations[node]) {
                console.warn('[lang] Nodo "' + node + '" no existe en translations');
                // Retornar array vacío según cantidad de idiomas configurados
                var emptyCount = (typeof app !== 'undefined' && app.data && app.data.config.languageIndex !== undefined) 
                    ? app.data.config.languageIndex + 1 
                    : 2;
                return new Array(emptyCount).fill('');
            }
            
            // CASO 1: Un parámetro - Buscar código en diccionario
            if (params.length === 1) {
                var code = params[0];
                
                if (window.translations[node][code]) {
                    return window.translations[node][code];
                }
                
                // Código no existe, retornar vacíos
                console.warn('[lang.' + node + '] Código "' + code + '" no existe');
                return ['', ''];
            }
            
            // CASO 2: Dos parámetros - Override ES (pos 0) + buscar código para otros idiomas
            if (params.length === 2) {
                var overrideES = params[0];
                var code = params[1];
                
                if (window.translations[node][code]) {
                    var original = window.translations[node][code];
                    // Retornar con override en posición 0 (ES), el resto del diccionario
                    return [overrideES].concat(original.slice(1));
                }
                
                // Código no existe, retornar override ES y vacíos para el resto
                console.warn('[lang.' + node + '] Código "' + code + '" no existe, usando solo override ES');
                return [overrideES, ''];
            }
            
            // Caso no contemplado
            console.warn('[lang.' + node + '] Cantidad de parámetros no válida:', params.length);
            return ['', ''];
        };
    }
});

console.log('[Language] ✅ Sistema de traducciones inicializado (diccionario + arrays)');
