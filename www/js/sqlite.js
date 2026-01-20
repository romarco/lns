/**
 * MangoleStudio - SQLite Manager
 * Sistema de base de datos local para apps móviles Cordova
 * 
 * Dependencia: cordova-sqlite-storage plugin
 * 
 * Patrón de callbacks: callback(error, result)
 * - Si error es null → Operación exitosa
 * - Si error tiene valor → Operación falló
 * 
 * @author MangoleStudio
 * @version 1.0.0
 * @date 22 Nov 2025
 */

var SQLite = (function() {
    'use strict';
    
    // ========================================
    // VARIABLES PRIVADAS
    // ========================================
    
    var db = null;              // Instancia de la base de datos
    var isReady = false;        // Estado de inicialización
    var dbName = null;          // Nombre de la base de datos
    var dbVersion = 1;          // Versión de la base de datos
    
    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    /**
     * Inicializar base de datos SQLite o WebSQL (fallback)
     * @param {string} databaseName - Nombre de la base de datos (ej: 'myapp.db')
     * @param {number} version - Versión de la base de datos (ej: 1)
     * @param {function} callback - callback(error, db)
     */
    function init(databaseName, version, callback) {
        console.log('[SQLite] Inicializando base de datos:', databaseName, 'v' + version);
        
        // Validar parámetros
        if (!databaseName) {
            var error = new Error('Nombre de base de datos es requerido');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        dbName = databaseName;
        dbVersion = version || 1;
        
        try {
            // Estrategia: Intentar SQLite plugin primero, luego WebSQL como fallback
            if (window.sqlitePlugin) {
                // Usar plugin de Cordova SQLite (dispositivos móviles)
                console.log('[SQLite] Usando cordova-sqlite-storage plugin');
                db = window.sqlitePlugin.openDatabase({
                    name: dbName,
                    location: 'default',
                    androidDatabaseProvider: 'default'
                });
                
                isReady = true;
                console.log('[SQLite] ✅ Base de datos abierta con SQLite plugin');
                
            } else if (window.openDatabase) {
                // Fallback a WebSQL (navegadores Chromium legacy, testing)
                console.log('[SQLite] Usando WebSQL como fallback (navegador)');
                db = window.openDatabase(dbName, dbVersion.toString(), databaseName, 5 * 1024 * 1024); // 5MB
                
                isReady = true;
                console.log('[SQLite] ✅ Base de datos abierta con WebSQL');
                
            } else {
                throw new Error('Ni SQLite plugin ni WebSQL están disponibles');
            }
            
            if (callback) callback(null, db);
            
        } catch (e) {
            console.error('[SQLite] ❌ Error al abrir base de datos:', e);
            isReady = false;
            if (callback) callback(e, null);
        }
    }
    
    /**
     * Verificar si la base de datos está lista
     * @returns {boolean}
     */
    function isInitialized() {
        return isReady && db !== null;
    }
    
    // ========================================
    // CRUD OPERATIONS
    // ========================================
    
    /**
     * Insertar registro en una tabla
     * @param {string} table - Nombre de la tabla
     * @param {object} data - Datos a insertar {column: value, ...}
     * @param {function} callback - callback(error, insertId)
     */
    function insert(table, data, callback) {
        console.log('[SQLite] INSERT en tabla:', table, data);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada. Llama a SQLite.init() primero.');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!table || !data || typeof data !== 'object') {
            var validationError = new Error('Parámetros inválidos para INSERT');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Construir query
        var columns = Object.keys(data);
        var values = columns.map(function(col) { return data[col]; });
        var placeholders = columns.map(function() { return '?'; }).join(', ');
        
        var sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ')';
        
        console.log('[SQLite] SQL:', sql);
        console.log('[SQLite] Valores:', values);
        
        // Ejecutar query
        db.transaction(function(tx) {
            tx.executeSql(sql, values, function(tx, result) {
                var insertId = result.insertId;
                console.log('[SQLite] ✅ INSERT exitoso. ID:', insertId);
                if (callback) callback(null, insertId);
            }, function(tx, error) {
                console.error('[SQLite] ❌ Error en INSERT:', error.message);
                if (callback) callback(error, null);
            });
        });
    }
    
    /**
     * Actualizar registros en una tabla
     * @param {string} table - Nombre de la tabla
     * @param {object} data - Datos a actualizar {column: value, ...}
     * @param {object} where - Condiciones WHERE {column: value, ...}
     * @param {function} callback - callback(error, rowsAffected)
     */
    function update(table, data, where, callback) {
        console.log('[SQLite] UPDATE en tabla:', table);
        console.log('[SQLite] SET:', data);
        console.log('[SQLite] WHERE:', where);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!table || !data || typeof data !== 'object') {
            var validationError = new Error('Parámetros inválidos para UPDATE');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Construir SET clause
        var setColumns = Object.keys(data);
        var setValues = setColumns.map(function(col) { return data[col]; });
        var setClause = setColumns.map(function(col) { return col + ' = ?'; }).join(', ');
        
        // Construir WHERE clause
        var whereClause = '';
        var whereValues = [];
        
        if (where && typeof where === 'object') {
            var whereColumns = Object.keys(where);
            whereValues = whereColumns.map(function(col) { return where[col]; });
            whereClause = ' WHERE ' + whereColumns.map(function(col) { return col + ' = ?'; }).join(' AND ');
        }
        
        var sql = 'UPDATE ' + table + ' SET ' + setClause + whereClause;
        var allValues = setValues.concat(whereValues);
        
        console.log('[SQLite] SQL:', sql);
        console.log('[SQLite] Valores:', allValues);
        
        // Ejecutar query
        db.transaction(function(tx) {
            tx.executeSql(sql, allValues, function(tx, result) {
                var rowsAffected = result.rowsAffected;
                console.log('[SQLite] ✅ UPDATE exitoso. Filas afectadas:', rowsAffected);
                if (callback) callback(null, rowsAffected);
            }, function(tx, error) {
                console.error('[SQLite] ❌ Error en UPDATE:', error.message);
                if (callback) callback(error, null);
            });
        });
    }
    
    /**
     * Eliminar registros de una tabla
     * @param {string} table - Nombre de la tabla
     * @param {object} where - Condiciones WHERE {column: value, ...}
     * @param {function} callback - callback(error, rowsAffected)
     */
    function deleteRows(table, where, callback) {
        console.log('[SQLite] DELETE de tabla:', table);
        console.log('[SQLite] WHERE:', where);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!table) {
            var validationError = new Error('Nombre de tabla es requerido');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Construir WHERE clause
        var whereClause = '';
        var whereValues = [];
        
        if (where && typeof where === 'object') {
            var whereColumns = Object.keys(where);
            whereValues = whereColumns.map(function(col) { return where[col]; });
            whereClause = ' WHERE ' + whereColumns.map(function(col) { return col + ' = ?'; }).join(' AND ');
        } else {
            console.warn('[SQLite] ⚠️ DELETE sin WHERE: eliminará todos los registros');
        }
        
        var sql = 'DELETE FROM ' + table + whereClause;
        
        console.log('[SQLite] SQL:', sql);
        console.log('[SQLite] Valores:', whereValues);
        
        // Ejecutar query
        db.transaction(function(tx) {
            tx.executeSql(sql, whereValues, function(tx, result) {
                var rowsAffected = result.rowsAffected;
                console.log('[SQLite] ✅ DELETE exitoso. Filas eliminadas:', rowsAffected);
                if (callback) callback(null, rowsAffected);
            }, function(tx, error) {
                console.error('[SQLite] ❌ Error en DELETE:', error.message);
                if (callback) callback(error, null);
            });
        });
    }
    
    /**
     * Seleccionar registros de una tabla
     * @param {string} table - Nombre de la tabla
     * @param {object} where - Condiciones WHERE {column: value, ...} (opcional)
     * @param {function} callback - callback(error, rows)
     */
    function select(table, where, callback) {
        console.log('[SQLite] SELECT de tabla:', table);
        console.log('[SQLite] WHERE:', where);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!table) {
            var validationError = new Error('Nombre de tabla es requerido');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Construir WHERE clause
        var whereClause = '';
        var whereValues = [];
        
        if (where && typeof where === 'object') {
            var whereColumns = Object.keys(where);
            whereValues = whereColumns.map(function(col) { return where[col]; });
            whereClause = ' WHERE ' + whereColumns.map(function(col) { return col + ' = ?'; }).join(' AND ');
        }
        
        var sql = 'SELECT * FROM ' + table + whereClause;
        
        console.log('[SQLite] SQL:', sql);
        console.log('[SQLite] Valores:', whereValues);
        
        // Ejecutar query
        db.transaction(function(tx) {
            tx.executeSql(sql, whereValues, function(tx, result) {
                var rows = [];
                var len = result.rows.length;
                
                for (var i = 0; i < len; i++) {
                    rows.push(result.rows.item(i));
                }
                
                console.log('[SQLite] ✅ SELECT exitoso. Filas encontradas:', rows.length);
                if (callback) callback(null, rows);
            }, function(tx, error) {
                console.error('[SQLite] ❌ Error en SELECT:', error.message);
                if (callback) callback(error, null);
            });
        });
    }
    
    // ========================================
    // QUERIES AVANZADAS
    // ========================================
    
    /**
     * Ejecutar query SQL personalizada
     * @param {string} sql - Query SQL
     * @param {array} params - Parámetros para placeholders (opcional)
     * @param {function} callback - callback(error, result)
     */
    function query(sql, params, callback) {
        console.log('[SQLite] QUERY:', sql);
        console.log('[SQLite] PARAMS:', params);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!sql) {
            var validationError = new Error('SQL query es requerido');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Si params no es array, convertirlo
        if (params && !Array.isArray(params)) {
            params = [];
        }
        
        params = params || [];
        
        // Ejecutar query
        db.transaction(function(tx) {
            tx.executeSql(sql, params, function(tx, result) {
                console.log('[SQLite] ✅ QUERY exitoso');
                
                // Si es SELECT, retornar rows
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    var rows = [];
                    var len = result.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        rows.push(result.rows.item(i));
                    }
                    
                    console.log('[SQLite] Filas retornadas:', rows.length);
                    if (callback) callback(null, rows);
                } else {
                    // Para INSERT/UPDATE/DELETE retornar metadata
                    var metadata = {
                        insertId: result.insertId,
                        rowsAffected: result.rowsAffected
                    };
                    if (callback) callback(null, metadata);
                }
            }, function(tx, error) {
                console.error('[SQLite] ❌ Error en QUERY:', error.message);
                if (callback) callback(error, null);
            });
        });
    }
    
    /**
     * Ejecutar múltiples queries en una transacción
     * @param {array} queries - Array de {sql: '', params: []}
     * @param {function} callback - callback(error, results)
     */
    function executeBatch(queries, callback) {
        console.log('[SQLite] BATCH de', queries.length, 'queries');
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!Array.isArray(queries) || queries.length === 0) {
            var validationError = new Error('queries debe ser un array no vacío');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        var results = [];
        
        db.transaction(function(tx) {
            var executeNext = function(index) {
                if (index >= queries.length) {
                    // Todas las queries ejecutadas
                    console.log('[SQLite] ✅ BATCH exitoso. Queries ejecutadas:', results.length);
                    if (callback) callback(null, results);
                    return;
                }
                
                var query = queries[index];
                var sql = query.sql;
                var params = query.params || [];
                
                console.log('[SQLite] Ejecutando query', (index + 1) + '/' + queries.length + ':', sql);
                
                tx.executeSql(sql, params, function(tx, result) {
                    results.push({
                        index: index,
                        success: true,
                        insertId: result.insertId,
                        rowsAffected: result.rowsAffected
                    });
                    executeNext(index + 1);
                }, function(tx, error) {
                    console.error('[SQLite] ❌ Error en query', (index + 1) + ':', error.message);
                    results.push({
                        index: index,
                        success: false,
                        error: error.message
                    });
                    // Continuar con siguiente query (o detener según preferencia)
                    executeNext(index + 1);
                });
            };
            
            executeNext(0);
        }, function(error) {
            // Error en la transacción
            console.error('[SQLite] ❌ Error en BATCH transaction:', error.message);
            if (callback) callback(error, null);
        });
    }
    
    // ========================================
    // GESTIÓN DE SCHEMA
    // ========================================
    
    /**
     * Crear tabla
     * @param {string} tableName - Nombre de la tabla
     * @param {array} columns - Array de definiciones de columnas
     *   [{name: 'id', type: 'INTEGER PRIMARY KEY', ...}]
     * @param {function} callback - callback(error, result)
     */
    function createTable(tableName, columns, callback) {
        console.log('[SQLite] CREATE TABLE:', tableName);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!tableName || !Array.isArray(columns) || columns.length === 0) {
            var validationError = new Error('Parámetros inválidos para CREATE TABLE');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        // Construir definición de columnas
        var columnDefs = columns.map(function(col) {
            var def = col.name + ' ' + col.type;
            if (col.notNull) def += ' NOT NULL';
            if (col.unique) def += ' UNIQUE';
            if (col.defaultValue !== undefined) def += ' DEFAULT ' + col.defaultValue;
            return def;
        }).join(', ');
        
        var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columnDefs + ')';
        
        console.log('[SQLite] SQL:', sql);
        
        query(sql, [], function(error, result) {
            if (error) {
                console.error('[SQLite] ❌ Error creando tabla:', error.message);
            } else {
                console.log('[SQLite] ✅ Tabla creada:', tableName);
            }
            if (callback) callback(error, result);
        });
    }
    
    /**
     * Eliminar tabla
     * @param {string} tableName - Nombre de la tabla
     * @param {function} callback - callback(error, result)
     */
    function dropTable(tableName, callback) {
        console.log('[SQLite] DROP TABLE:', tableName);
        
        if (!isInitialized()) {
            var error = new Error('Base de datos no inicializada');
            console.error('[SQLite] Error:', error.message);
            if (callback) callback(error, null);
            return;
        }
        
        if (!tableName) {
            var validationError = new Error('Nombre de tabla es requerido');
            console.error('[SQLite] Error:', validationError.message);
            if (callback) callback(validationError, null);
            return;
        }
        
        var sql = 'DROP TABLE IF EXISTS ' + tableName;
        
        console.log('[SQLite] SQL:', sql);
        
        query(sql, [], function(error, result) {
            if (error) {
                console.error('[SQLite] ❌ Error eliminando tabla:', error.message);
            } else {
                console.log('[SQLite] ✅ Tabla eliminada:', tableName);
            }
            if (callback) callback(error, result);
        });
    }
    
    // ========================================
    // UTILIDADES
    // ========================================
    
    /**
     * Cerrar base de datos (compatible con SQLite plugin y WebSQL)
     * @param {function} callback - callback(error)
     */
    function close(callback) {
        console.log('[SQLite] Cerrando base de datos');
        
        if (!db) {
            console.warn('[SQLite] Base de datos ya está cerrada');
            if (callback) callback(null);
            return;
        }
        
        // SQLite plugin tiene close(), WebSQL no (se cierra automáticamente)
        if (typeof db.close === 'function') {
            // Usando SQLite plugin
            db.close(function() {
                console.log('[SQLite] ✅ Base de datos cerrada (SQLite plugin)');
                db = null;
                isReady = false;
                if (callback) callback(null);
            }, function(error) {
                console.error('[SQLite] ❌ Error cerrando base de datos:', error.message);
                if (callback) callback(error);
            });
        } else {
            // Usando WebSQL (no requiere close explícito)
            console.log('[SQLite] ✅ Base de datos marcada como cerrada (WebSQL - no requiere close)');
            db = null;
            isReady = false;
            if (callback) callback(null);
        }
    }
    
    /**
     * Obtener información de la base de datos
     * @returns {object}
     */
    function getInfo() {
        return {
            name: dbName,
            version: dbVersion,
            isReady: isReady,
            db: db
        };
    }
    
    // ========================================
    // API PÚBLICA
    // ========================================
    
    return {
        // Inicialización
        init: init,
        isInitialized: isInitialized,
        
        // CRUD
        insert: insert,
        update: update,
        delete: deleteRows,
        select: select,
        
        // Queries
        query: query,
        executeBatch: executeBatch,
        
        // Schema
        createTable: createTable,
        dropTable: dropTable,
        
        // Utilidades
        close: close,
        getInfo: getInfo
    };
    
})();

// Exponer globalmente
window.SQLite = SQLite;

console.log('[SQLite] ✅ Módulo SQLite cargado y listo para usar');

