/**
 * Sync Manager - Gestor de Sincronización Offline
 * 
 * Responsabilidades:
 * - Gestionar cola de operaciones pendientes cuando no hay conexión
 * - Detectar cambios locales y encolarlos para sincronizar
 * - Enviar operaciones al servidor cuando hay conexión
 * - Recibir cambios del servidor y aplicarlos localmente
 * - Resolver conflictos entre cambios locales y remotos
 * 
 * Dependencias:
 * - SQLite.js para almacenamiento local
 * - ConnectionMonitor.js para detectar estado de red
 */

(function(window) {
    'use strict';

    var SyncManager = {
        // Estado
        isSyncing: false,
        autoSyncEnabled: false,
        autoSyncInterval: null,
        lastSyncTime: null,
        projectId: null, // ID del proyecto actual
        
        // Configuración
        config: {
            syncIntervalMinutes: 5,
            serverUrl: '', // Se configura con init()
            maxRetries: 3,
            retryDelayMs: 2000,
            conflictResolution: 'server-wins', // 'server-wins', 'client-wins', 'manual', 'merge', 'merge-smart'
            mergeRules: {} // Reglas personalizadas para merge-smart
        },
        
        // Callbacks para resolución manual de conflictos
        onConflictDetected: null, // function(conflict, callback)
        conflictQueue: [],

        /**
         * Inicializar Sync Manager
         * @param {object} options - {serverUrl, syncIntervalMinutes, projectId}
         * @param {function} callback - callback(error)
         */
        init: function(options, callback) {
            var self = this;
            
            // Aplicar configuración
            if (options.serverUrl) {
                self.config.serverUrl = options.serverUrl;
            }
            if (options.syncIntervalMinutes) {
                self.config.syncIntervalMinutes = options.syncIntervalMinutes;
            }
            if (options.projectId) {
                self.projectId = options.projectId;
            } else {
                console.error('⚠️ projectId es requerido para Sync Manager');
                if (callback) callback(new Error('projectId is required'));
                return;
            }

            // Crear tabla sync_queue si no existe
            var columns = [
                {name: 'id', type: 'INTEGER', isPrimary: true},
                {name: 'operation_type', type: 'TEXT'}, // 'insert', 'update', 'delete'
                {name: 'table_name', type: 'TEXT'},
                {name: 'record_id', type: 'INTEGER'},
                {name: 'data', type: 'TEXT'}, // JSON
                {name: 'timestamp', type: 'TEXT'},
                {name: 'status', type: 'TEXT'}, // 'pending', 'syncing', 'synced', 'error'
                {name: 'retry_count', type: 'INTEGER', default: 0},
                {name: 'error_message', type: 'TEXT'},
                {name: 'created_at', type: 'TEXT'}
            ];

            SQLite.createTable('sync_queue', columns, function(err) {
                if (err) {
                    console.error('Error creando tabla sync_queue:', err);
                    if (callback) callback(err);
                    return;
                }

                // Crear tabla sync_metadata para guardar lastSyncTime y otros metadatos
                var metadataColumns = [
                    {name: 'key', type: 'TEXT', isPrimary: true},
                    {name: 'value', type: 'TEXT'},
                    {name: 'updated_at', type: 'TEXT'}
                ];

                SQLite.createTable('sync_metadata', metadataColumns, function(err) {
                    if (err) {
                        console.error('Error creando tabla sync_metadata:', err);
                        if (callback) callback(err);
                        return;
                    }

                    // Leer lastSyncTime
                    self.loadLastSyncTime(function(err) {
                        if (err) {
                            console.warn('No se pudo cargar lastSyncTime:', err);
                        }

                        console.log('✅ Sync Manager inicializado');
                        if (callback) callback(null);
                    });
                });
            });
        },

        /**
         * Agregar operación a la cola de sincronización
         * @param {string} operationType - 'insert', 'update', 'delete'
         * @param {string} tableName - Nombre de la tabla
         * @param {object} data - Datos de la operación
         * @param {number} recordId - ID del registro (null para insert)
         * @param {function} callback - callback(error, queueId)
         * @param {boolean} skipValidation - Omitir validación de cambios reales (default: false)
         */
        addOperation: function(operationType, tableName, data, recordId, callback, skipValidation) {
            var self = this;
            
            // Para UPDATE, verificar si hay cambios reales
            if (operationType === 'update' && !skipValidation) {
                self.hasRealChanges(tableName, recordId, data, function(hasChanges) {
                    if (!hasChanges) {
                        console.log('No hay cambios reales, operación no encolada');
                        if (callback) callback(null, null); // null = no encolado
                        return;
                    }
                    
                    // Sí hay cambios, encolar
                    self.enqueueOperation(operationType, tableName, data, recordId, callback);
                });
            } else {
                // INSERT o DELETE, siempre encolar
                self.enqueueOperation(operationType, tableName, data, recordId, callback);
            }
        },

        /**
         * Verificar si hay cambios reales comparando con BD actual
         * @param {string} tableName - Nombre de la tabla
         * @param {number} recordId - ID del registro
         * @param {object} newData - Nuevos datos
         * @param {function} callback - callback(hasChanges)
         */
        hasRealChanges: function(tableName, recordId, newData, callback) {
            SQLite.select(tableName, {id: recordId}, function(err, rows) {
                if (err || rows.length === 0) {
                    // Error o registro no existe, considerar que hay cambios
                    if (callback) callback(true);
                    return;
                }

                var currentData = rows[0];
                var hasChanges = false;

                // Comparar cada campo
                for (var key in newData) {
                    if (currentData[key] != newData[key]) {
                        hasChanges = true;
                        break;
                    }
                }

                if (callback) callback(hasChanges);
            });
        },

        /**
         * Encolar operación sin validaciones
         * @param {string} operationType - 'insert', 'update', 'delete'
         * @param {string} tableName - Nombre de la tabla
         * @param {object} data - Datos de la operación
         * @param {number} recordId - ID del registro (null para insert)
         * @param {function} callback - callback(error, queueId)
         */
        enqueueOperation: function(operationType, tableName, data, recordId, callback) {
            var timestamp = new Date().toISOString();
            
            var queueItem = {
                operation_type: operationType,
                table_name: tableName,
                record_id: recordId || null,
                data: JSON.stringify(data),
                timestamp: timestamp,
                status: 'pending',
                retry_count: 0,
                error_message: null,
                created_at: timestamp
            };

            SQLite.insert('sync_queue', queueItem, function(err, result) {
                if (err) {
                    console.error('Error agregando operación a cola:', err);
                    if (callback) callback(err);
                    return;
                }

                console.log('Operación agregada a cola:', operationType, tableName, 'QueueID:', result.insertId);
                if (callback) callback(null, result.insertId);
            });
        },

        /**
         * Obtener operaciones pendientes de sincronizar
         * @param {function} callback - callback(error, operations)
         */
        getPendingOperations: function(callback) {
            var where = {status: 'pending'};
            
            SQLite.select('sync_queue', where, function(err, rows) {
                if (err) {
                    console.error('Error obteniendo operaciones pendientes:', err);
                    if (callback) callback(err);
                    return;
                }

                // Parsear data JSON
                var operations = rows.map(function(row) {
                    return {
                        id: row.id,
                        operation_type: row.operation_type,
                        table_name: row.table_name,
                        record_id: row.record_id,
                        data: row.data ? JSON.parse(row.data) : null,
                        timestamp: row.timestamp,
                        retry_count: row.retry_count
                    };
                });

                if (callback) callback(null, operations);
            });
        },

        /**
         * Marcar operación como sincronizada
         * @param {number} queueId - ID en sync_queue
         * @param {function} callback - callback(error)
         */
        markAsSynced: function(queueId, callback) {
            var data = {
                status: 'synced',
                error_message: null
            };
            var where = {id: queueId};

            SQLite.update('sync_queue', data, where, function(err) {
                if (err) {
                    console.error('Error marcando operación como synced:', err);
                    if (callback) callback(err);
                    return;
                }

                if (callback) callback(null);
            });
        },

        /**
         * Marcar operación como error
         * @param {number} queueId - ID en sync_queue
         * @param {string} errorMessage - Mensaje de error
         * @param {function} callback - callback(error)
         */
        markAsError: function(queueId, errorMessage, callback) {
            var self = this;

            // Obtener retry_count actual
            SQLite.query('SELECT retry_count FROM sync_queue WHERE id = ?', [queueId], function(err, rows) {
                if (err || rows.length === 0) {
                    console.error('Error obteniendo retry_count:', err);
                    if (callback) callback(err);
                    return;
                }

                var retryCount = rows[0].retry_count + 1;
                var status = retryCount >= self.config.maxRetries ? 'error' : 'pending';

                var data = {
                    status: status,
                    retry_count: retryCount,
                    error_message: errorMessage
                };
                var where = {id: queueId};

                SQLite.update('sync_queue', data, where, function(err) {
                    if (err) {
                        console.error('Error marcando operación como error:', err);
                        if (callback) callback(err);
                        return;
                    }

                    if (callback) callback(null);
                });
            });
        },

        /**
         * Limpiar operaciones sincronizadas exitosamente
         * @param {function} callback - callback(error, deletedCount)
         */
        cleanSyncedOperations: function(callback) {
            var where = {status: 'synced'};

            SQLite.delete('sync_queue', where, function(err, result) {
                if (err) {
                    console.error('Error limpiando operaciones sincronizadas:', err);
                    if (callback) callback(err);
                    return;
                }

                console.log('Operaciones sincronizadas eliminadas:', result.rowsAffected);
                if (callback) callback(null, result.rowsAffected);
            });
        },

        /**
         * Obtener conteo de operaciones por estado
         * @param {function} callback - callback(error, {pending, synced, error})
         */
        getOperationCounts: function(callback) {
            var sql = 'SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status';

            SQLite.query(sql, [], function(err, rows) {
                if (err) {
                    console.error('Error obteniendo conteo de operaciones:', err);
                    if (callback) callback(err);
                    return;
                }

                var counts = {pending: 0, synced: 0, error: 0};
                rows.forEach(function(row) {
                    counts[row.status] = row.count;
                });

                if (callback) callback(null, counts);
            });
        },

        /**
         * Guardar lastSyncTime
         * @param {string} timestamp - ISO timestamp
         * @param {function} callback - callback(error)
         */
        saveLastSyncTime: function(timestamp, callback) {
            this.lastSyncTime = timestamp;

            var data = {
                key: 'last_sync_time',
                value: timestamp,
                updated_at: new Date().toISOString()
            };

            // Usar INSERT OR REPLACE (SQLite)
            var sql = 'INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)';
            var params = [data.key, data.value, data.updated_at];

            SQLite.query(sql, params, function(err) {
                if (err) {
                    console.error('Error guardando lastSyncTime:', err);
                    if (callback) callback(err);
                    return;
                }

                console.log('lastSyncTime guardado:', timestamp);
                if (callback) callback(null);
            });
        },

        /**
         * Cargar lastSyncTime
         * @param {function} callback - callback(error, timestamp)
         */
        loadLastSyncTime: function(callback) {
            var self = this;
            var where = {key: 'last_sync_time'};

            SQLite.select('sync_metadata', where, function(err, rows) {
                if (err) {
                    console.error('Error cargando lastSyncTime:', err);
                    if (callback) callback(err);
                    return;
                }

                if (rows.length > 0) {
                    self.lastSyncTime = rows[0].value;
                    console.log('lastSyncTime cargado:', self.lastSyncTime);
                } else {
                    // Primera sincronización - usar fecha muy antigua
                    self.lastSyncTime = '2000-01-01T00:00:00.000Z';
                    console.log('Primera sincronización, lastSyncTime inicial:', self.lastSyncTime);
                }

                if (callback) callback(null, self.lastSyncTime);
            });
        },

        /**
         * Iniciar sincronización automática
         * @param {function} onSyncComplete - callback(error, result) ejecutado después de cada sync
         */
        startAutoSync: function(onSyncComplete) {
            var self = this;

            if (self.autoSyncEnabled) {
                console.warn('Auto-sync ya está habilitado');
                return;
            }

            self.autoSyncEnabled = true;

            // Ejecutar sync inmediatamente
            self.sync(function(err, result) {
                if (onSyncComplete) onSyncComplete(err, result);

                // Programar siguiente sync
                self.scheduleNextSync(onSyncComplete);
            });

            console.log('✅ Auto-sync habilitado (intervalo: ' + self.config.syncIntervalMinutes + ' minutos)');
        },

        /**
         * Detener sincronización automática
         */
        stopAutoSync: function() {
            this.autoSyncEnabled = false;

            if (this.autoSyncInterval) {
                clearTimeout(this.autoSyncInterval);
                this.autoSyncInterval = null;
            }

            console.log('Auto-sync detenido');
        },

        /**
         * Programar próxima sincronización automática
         * @param {function} onSyncComplete - callback(error, result)
         */
        scheduleNextSync: function(onSyncComplete) {
            var self = this;

            if (!self.autoSyncEnabled) {
                return;
            }

            var intervalMs = self.config.syncIntervalMinutes * 60 * 1000;

            self.autoSyncInterval = setTimeout(function() {
                self.sync(function(err, result) {
                    if (onSyncComplete) onSyncComplete(err, result);

                    // Programar siguiente
                    self.scheduleNextSync(onSyncComplete);
                });
            }, intervalMs);
        },

        /**
         * Ejecutar sincronización completa
         * Envía operaciones locales al servidor y recibe cambios remotos
         * @param {function} callback - callback(error, result)
         */
        sync: function(callback) {
            var self = this;

            if (self.isSyncing) {
                console.warn('Sincronización ya en progreso');
                if (callback) callback(new Error('Sync already in progress'));
                return;
            }

            self.isSyncing = true;
            console.log('🔄 Iniciando sincronización...');

            var syncResult = {
                operationsSent: 0,
                operationsFailed: 0,
                changesReceived: 0,
                conflictsDetected: 0,
                timestamp: new Date().toISOString()
            };

            // Paso 1: Verificar conexión a internet
            if (!navigator.onLine) {
                self.isSyncing = false;
                var offlineError = new Error('Sin conexión a internet');
                console.warn('⚠️ Sincronización cancelada: offline');
                if (callback) callback(offlineError);
                return;
            }
            
            // Paso 1.5: Verificar conectividad real con timeout corto
            self.checkServerReachable(function(isReachable) {
                if (!isReachable) {
                    self.isSyncing = false;
                    var unreachableError = new Error('Servidor no alcanzable (timeout o red lenta)');
                    console.warn('⚠️ Sincronización cancelada: servidor no responde');
                    if (callback) callback(unreachableError);
                    return;
                }
                
                // Servidor alcanzable, continuar con sincronización
                self.performSync(syncResult, callback);
            });
        },

        /**
         * Fetch con timeout que se reinicia mientras haya progreso
         * Previene timeout en conexiones lentas pero activas
         * @param {string} url - URL del endpoint
         * @param {object} options - Opciones de fetch
         * @param {number} inactivityTimeout - Milisegundos sin actividad antes de abortar
         * @returns {Promise}
         */
        fetchWithProgressTimeout: function(url, options, inactivityTimeout) {
            return new Promise(function(resolve, reject) {
                var controller = new AbortController();
                var timeoutId = null;
                var lastActivity = Date.now();

                // Función para resetear timeout
                var resetTimeout = function() {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }

                    lastActivity = Date.now();

                    timeoutId = setTimeout(function() {
                        var inactiveTime = Date.now() - lastActivity;
                        console.warn('Timeout por inactividad:', inactiveTime + 'ms sin respuesta');
                        controller.abort();
                    }, inactivityTimeout);
                };

                // Iniciar timeout
                resetTimeout();

                // Agregar signal al fetch
                options.signal = controller.signal;

                // Realizar fetch
                fetch(url, options)
                    .then(function(response) {
                        // Hay respuesta, resetear timeout
                        resetTimeout();

                        // Si la respuesta tiene body stream, monitorear progreso
                        if (response.body && response.body.getReader) {
                            var reader = response.body.getReader();
                            var chunks = [];

                            var pump = function() {
                                return reader.read().then(function(result) {
                                    // Cada chunk recibido = hay actividad
                                    resetTimeout();

                                    if (result.done) {
                                        // Lectura completa
                                        clearTimeout(timeoutId);

                                        // Reconstruir response
                                        var blob = new Blob(chunks);
                                        return blob.text().then(function(text) {
                                            resolve({
                                                ok: response.ok,
                                                status: response.status,
                                                json: function() {
                                                    return Promise.resolve(JSON.parse(text));
                                                }
                                            });
                                        });
                                    }

                                    chunks.push(result.value);
                                    return pump();
                                });
                            };

                            return pump();
                        } else {
                            // No hay stream, procesar normalmente
                            clearTimeout(timeoutId);
                            resolve(response);
                        }
                    })
                    .catch(function(error) {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            });
        },

        /**
         * Verificar si el servidor es alcanzable (con timeout corto)
         * @param {function} callback - callback(isReachable)
         */
        checkServerReachable: function(callback) {
            var self = this;
            var timeout = 5000; // 5 segundos máximo
            var timedOut = false;

            var timeoutId = setTimeout(function() {
                timedOut = true;
                if (callback) callback(false);
            }, timeout);

            // Hacer ping ligero al servidor
            fetch(self.config.serverUrl + '/ping.php', {
                method: 'GET',
                cache: 'no-cache'
            })
            .then(function(response) {
                clearTimeout(timeoutId);
                if (!timedOut) {
                    if (callback) callback(response.ok);
                }
            })
            .catch(function(error) {
                clearTimeout(timeoutId);
                if (!timedOut) {
                    console.warn('Servidor no alcanzable:', error.message);
                    if (callback) callback(false);
                }
            });
        },

        /**
         * Realizar sincronización (extrae lógica del sync())
         * @param {object} syncResult - Objeto de resultados
         * @param {function} callback - callback(error, result)
         */
        performSync: function(syncResult, callback) {
            var self = this;

            // Obtener operaciones pendientes
            self.getPendingOperations(function(err, operations) {
                if (err) {
                    self.isSyncing = false;
                    console.error('Error obteniendo operaciones pendientes:', err);
                    if (callback) callback(err);
                    return;
                }

                console.log('📤 Operaciones pendientes:', operations.length);

                // Enviar operaciones al servidor
                self.sendOperationsToServer(operations, function(err, sendResults) {
                    if (err) {
                        self.isSyncing = false;
                        console.error('Error enviando operaciones:', err);
                        if (callback) callback(err);
                        return;
                    }

                    syncResult.operationsSent = sendResults.success;
                    syncResult.operationsFailed = sendResults.failed;

                    console.log('✅ Operaciones enviadas:', sendResults.success);
                    if (sendResults.failed > 0) {
                        console.warn('⚠️ Operaciones fallidas:', sendResults.failed);
                    }

                    // Recibir cambios del servidor
                    self.receiveChangesFromServer(function(err, changes) {
                        if (err) {
                            self.isSyncing = false;
                            console.error('Error recibiendo cambios:', err);
                            if (callback) callback(err);
                            return;
                        }

                        syncResult.changesReceived = changes.length;
                        console.log('📥 Cambios recibidos:', changes.length);

                        // Aplicar cambios localmente
                        self.applyChangesLocally(changes, function(err, applyResults) {
                            if (err) {
                                self.isSyncing = false;
                                console.error('Error aplicando cambios:', err);
                                if (callback) callback(err);
                                return;
                            }

                            syncResult.conflictsDetected = applyResults.conflicts;

                            // Actualizar lastSyncTime
                            self.saveLastSyncTime(syncResult.timestamp, function(err) {
                                self.isSyncing = false;

                                if (err) {
                                    console.warn('Error guardando lastSyncTime:', err);
                                }

                                console.log('✅ Sincronización completada');
                                if (callback) callback(null, syncResult);
                            });
                        });
                    });
                });
            });
        },

        /**
         * Enviar operaciones pendientes al servidor
         * @param {array} operations - Array de operaciones
         * @param {function} callback - callback(error, {success, failed})
         */
        sendOperationsToServer: function(operations, callback) {
            var self = this;

            if (operations.length === 0) {
                if (callback) callback(null, {success: 0, failed: 0});
                return;
            }

            // Si hay muchas operaciones, procesar en lotes
            var batchSize = 20; // 20 operaciones por lote
            if (operations.length > batchSize) {
                console.log('📦 Procesando en lotes de', batchSize, '(Total:', operations.length + ')');
                self.sendOperationsInBatches(operations, batchSize, callback);
                return;
            }

            var successCount = 0;
            var failedCount = 0;
            var processedCount = 0;

            // Procesar cada operación
            operations.forEach(function(operation) {
                var payload = {
                    operation_type: operation.operation_type,
                    table_name: operation.table_name,
                    record_id: operation.record_id,
                    data: operation.data,
                    timestamp: operation.timestamp
                };

                // Enviar con timeout adaptativo (30s inicial, extiende si hay progreso)
                self.fetchWithProgressTimeout(
                    self.config.serverUrl + '/sync-receive-operations.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    },
                    30000 // 30 segundos de timeout inactivo
                )
                .then(function(response) {
                    return response.json();
                })
                .then(function(result) {
                    processedCount++;

                    if (result.success) {
                        successCount++;
                        // Marcar como sincronizada
                        self.markAsSynced(operation.id, function(err) {
                            if (err) {
                                console.error('Error marcando como synced:', err);
                            }
                        });
                    } else {
                        failedCount++;
                        // Marcar como error
                        self.markAsError(operation.id, result.message, function(err) {
                            if (err) {
                                console.error('Error marcando como error:', err);
                            }
                        });
                    }

                    // Verificar si terminamos
                    if (processedCount === operations.length) {
                        if (callback) callback(null, {success: successCount, failed: failedCount});
                    }
                })
                .catch(function(error) {
                    processedCount++;
                    failedCount++;

                    var errorMsg = error.name === 'AbortError' 
                        ? 'Timeout (sin actividad por 30s)' 
                        : error.message;

                    console.error('Error enviando operación:', errorMsg);

                    // Marcar como error
                    self.markAsError(operation.id, errorMsg, function(err) {
                        if (err) {
                            console.error('Error marcando como error:', err);
                        }
                    });

                    // Verificar si terminamos
                    if (processedCount === operations.length) {
                        if (callback) callback(null, {success: successCount, failed: failedCount});
                    }
                });
            });
        },

        /**
         * Enviar operaciones en lotes para evitar timeouts
         * @param {array} operations - Todas las operaciones
         * @param {number} batchSize - Tamaño de cada lote
         * @param {function} callback - callback(error, {success, failed})
         */
        sendOperationsInBatches: function(operations, batchSize, callback) {
            var self = this;
            var totalSuccess = 0;
            var totalFailed = 0;
            var currentIndex = 0;

            var processBatch = function() {
                var batch = operations.slice(currentIndex, currentIndex + batchSize);
                
                if (batch.length === 0) {
                    // Terminado
                    console.log('✅ Todos los lotes procesados');
                    if (callback) callback(null, {success: totalSuccess, failed: totalFailed});
                    return;
                }

                console.log('📤 Enviando lote', Math.floor(currentIndex / batchSize) + 1, 
                           '(' + batch.length + ' operaciones)');

                // Enviar lote actual
                self.sendOperationsBatch(batch, function(err, result) {
                    if (err) {
                        console.error('Error en lote:', err);
                        totalFailed += batch.length;
                    } else {
                        totalSuccess += result.success;
                        totalFailed += result.failed;
                    }

                    currentIndex += batchSize;

                    // Pequeña pausa entre lotes para no saturar
                    setTimeout(function() {
                        processBatch();
                    }, 1000);
                });
            };

            processBatch();
        },

        /**
         * Enviar un lote de operaciones
         * @param {array} batch - Lote de operaciones
         * @param {function} callback - callback(error, {success, failed})
         */
        sendOperationsBatch: function(batch, callback) {
            var self = this;
            var successCount = 0;
            var failedCount = 0;
            var processedCount = 0;

            batch.forEach(function(operation) {
                var payload = {
                    operation_type: operation.operation_type,
                    table_name: operation.table_name,
                    record_id: operation.record_id,
                    data: operation.data,
                    timestamp: operation.timestamp,
                    project_id: self.projectId
                };

                // Enviar con timeout adaptativo
                self.fetchWithProgressTimeout(
                    self.config.serverUrl + '/sync-receive-operations.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    },
                    30000
                )
                .then(function(response) {
                    return response.json();
                })
                .then(function(result) {
                    processedCount++;

                    if (result.success) {
                        successCount++;
                        self.markAsSynced(operation.id, function(err) {
                            if (err) console.error('Error marcando como synced:', err);
                        });
                    } else {
                        failedCount++;
                        self.markAsError(operation.id, result.message, function(err) {
                            if (err) console.error('Error marcando como error:', err);
                        });
                    }

                    if (processedCount === batch.length) {
                        if (callback) callback(null, {success: successCount, failed: failedCount});
                    }
                })
                .catch(function(error) {
                    processedCount++;
                    failedCount++;

                    var errorMsg = error.name === 'AbortError' 
                        ? 'Timeout (sin actividad por 30s)' 
                        : error.message;

                    self.markAsError(operation.id, errorMsg, function(err) {
                        if (err) console.error('Error marcando como error:', err);
                    });

                    if (processedCount === batch.length) {
                        if (callback) callback(null, {success: successCount, failed: failedCount});
                    }
                });
            });
        },

        /**
         * Recibir cambios del servidor desde lastSyncTime
         * @param {function} callback - callback(error, changes)
         */
        receiveChangesFromServer: function(callback) {
            var self = this;

            var url = self.config.serverUrl + '/sync-send-changes.php?last_sync=' + encodeURIComponent(self.lastSyncTime) + 
                      '&project_id=' + encodeURIComponent(self.projectId);

            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                if (result.success) {
                    if (callback) callback(null, result.changes || []);
                } else {
                    if (callback) callback(new Error(result.message));
                }
            })
            .catch(function(error) {
                console.error('Error recibiendo cambios:', error);
                if (callback) callback(error);
            });
        },

        /**
         * Aplicar cambios del servidor a SQLite local
         * @param {array} changes - Array de cambios del servidor
         * @param {function} callback - callback(error, {conflicts})
         */
        applyChangesLocally: function(changes, callback) {
            var self = this;

            if (changes.length === 0) {
                if (callback) callback(null, {conflicts: 0});
                return;
            }

            var appliedCount = 0;
            var conflictCount = 0;

            changes.forEach(function(change) {
                var applyCallback = function(err) {
                    appliedCount++;

                    if (err) {
                        console.error('Error aplicando cambio:', err);
                    }

                    // Verificar si terminamos
                    if (appliedCount === changes.length) {
                        if (callback) callback(null, {conflicts: conflictCount});
                    }
                };

                // Verificar si hay conflicto (operación pendiente en la misma tabla/registro)
                self.checkConflict(change, function(conflict) {
                    if (conflict.hasConflict) {
                        conflictCount++;
                        console.warn('⚠️ Conflicto detectado:', change.table_name, 'ID:', change.record_id);
                        
                        // Resolver conflicto según estrategia
                        self.resolveConflict(conflict, function(err, resolution) {
                            if (err) {
                                console.error('Error resolviendo conflicto:', err);
                                applyCallback(err);
                                return;
                            }

                            // Aplicar según resolución
                            if (resolution.action === 'skip_server') {
                                // No aplicar cambio del servidor
                                applyCallback(null);
                            } else if (resolution.action === 'apply_server' || 
                                       resolution.action === 'apply_merged' || 
                                       resolution.action === 'apply_custom') {
                                // Aplicar el cambio resuelto
                                var resolvedChange = resolution.data;
                                self.applyChangeToDatabase(resolvedChange, applyCallback);
                            } else {
                                applyCallback(null);
                            }
                        });
                        return;
                    }

                    // No hay conflicto, aplicar cambio normal
                    self.applyChangeToDatabase(change, applyCallback);
                });
            });
        },

        /**
         * Aplicar un cambio a la base de datos SQLite
         * @param {object} change - Cambio a aplicar
         * @param {function} callback - callback(error)
         */
        applyChangeToDatabase: function(change, callback) {
            // Aplicar cambio según tipo de operación
            if (change.operation_type === 'insert' || change.operation_type === 'update') {
                // Para insert/update, usar INSERT OR REPLACE
                var data = change.data;
                data.id = change.record_id; // Asegurar que tiene el ID del servidor

                var sql = 'INSERT OR REPLACE INTO ' + change.table_name + ' (';
                var columns = [];
                var placeholders = [];
                var values = [];

                for (var key in data) {
                    columns.push(key);
                    placeholders.push('?');
                    values.push(data[key]);
                }

                sql += columns.join(', ') + ') VALUES (' + placeholders.join(', ') + ')';

                SQLite.query(sql, values, callback);

            } else if (change.operation_type === 'delete') {
                SQLite.delete(change.table_name, {id: change.record_id}, callback);
            } else {
                callback(new Error('Tipo de operación desconocido: ' + change.operation_type));
            }
        },

        /**
         * Verificar si un cambio del servidor genera conflicto
         * @param {object} change - Cambio del servidor
         * @param {function} callback - callback(conflict) - conflict = {hasConflict, localOperation, serverChange}
         */
        checkConflict: function(change, callback) {
            var where = {
                table_name: change.table_name,
                record_id: change.record_id,
                status: 'pending'
            };

            SQLite.select('sync_queue', where, function(err, rows) {
                if (err) {
                    console.error('Error verificando conflicto:', err);
                    if (callback) callback({hasConflict: false});
                    return;
                }

                if (rows.length > 0) {
                    // Hay conflicto
                    var localOperation = rows[0];
                    localOperation.data = JSON.parse(localOperation.data || '{}');
                    
                    if (callback) callback({
                        hasConflict: true,
                        localOperation: localOperation,
                        serverChange: change
                    });
                } else {
                    if (callback) callback({hasConflict: false});
                }
            });
        },

        /**
         * Resolver conflicto según estrategia configurada
         * @param {object} conflict - {localOperation, serverChange}
         * @param {function} callback - callback(error, resolution)
         */
        resolveConflict: function(conflict, callback) {
            var self = this;
            var strategy = self.config.conflictResolution;

            console.log('🔀 Resolviendo conflicto con estrategia:', strategy);

            switch (strategy) {
                case 'server-wins':
                    self.resolveServerWins(conflict, callback);
                    break;

                case 'client-wins':
                    self.resolveClientWins(conflict, callback);
                    break;

                case 'merge':
                    self.resolveMerge(conflict, callback);
                    break;

                case 'merge-smart':
                    self.resolveMergeSmart(conflict, callback);
                    break;

                case 'manual':
                    self.resolveManual(conflict, callback);
                    break;

                default:
                    // Por defecto: server-wins
                    self.resolveServerWins(conflict, callback);
            }
        },

        /**
         * Estrategia: El servidor gana
         * Aplica cambio del servidor y descarta operación local
         */
        resolveServerWins: function(conflict, callback) {
            var self = this;
            
            console.log('✅ Server-wins: Aplicando cambio del servidor');

            // Marcar operación local como error (descartada por conflicto)
            self.markAsError(
                conflict.localOperation.id,
                'Conflicto resuelto: server-wins',
                function(err) {
                    if (err) {
                        console.error('Error marcando conflicto:', err);
                    }

                    // Retornar cambio del servidor para aplicar
                    if (callback) callback(null, {
                        action: 'apply_server',
                        data: conflict.serverChange
                    });
                }
            );
        },

        /**
         * Estrategia: El cliente gana
         * Mantiene operación local y descarta cambio del servidor
         */
        resolveClientWins: function(conflict, callback) {
            console.log('✅ Client-wins: Manteniendo cambio local');

            // No aplicar cambio del servidor, mantener operación local en cola
            if (callback) callback(null, {
                action: 'skip_server',
                data: null
            });
        },

        /**
         * Estrategia: Merge inteligente
         * Combina cambios del servidor y locales (campo por campo)
         */
        resolveMerge: function(conflict, callback) {
            console.log('✅ Merge: Combinando cambios');

            var localData = conflict.localOperation.data;
            var serverData = conflict.serverChange.data;
            var mergedData = {};

            // Priorizar campos del servidor si son más recientes
            // o si el campo local está vacío
            for (var key in serverData) {
                if (localData.hasOwnProperty(key)) {
                    // Si el valor local es diferente y no está vacío, mantenerlo
                    if (localData[key] && localData[key] !== serverData[key]) {
                        console.log('Conflicto en campo:', key, 'Local:', localData[key], 'Server:', serverData[key]);
                        // Priorizar servidor en caso de duda
                        mergedData[key] = serverData[key];
                    } else {
                        mergedData[key] = serverData[key];
                    }
                } else {
                    mergedData[key] = serverData[key];
                }
            }

            // Agregar campos que solo existen localmente
            for (var key in localData) {
                if (!mergedData.hasOwnProperty(key)) {
                    mergedData[key] = localData[key];
                }
            }

            // Crear cambio combinado
            var mergedChange = {
                table_name: conflict.serverChange.table_name,
                operation_type: conflict.serverChange.operation_type,
                record_id: conflict.serverChange.record_id,
                data: mergedData
            };

            if (callback) callback(null, {
                action: 'apply_merged',
                data: mergedChange
            });
        },

        /**
         * Estrategia: Merge Inteligente con Reglas de Negocio
         * Aplica reglas personalizadas para cada campo
         */
        resolveMergeSmart: function(conflict, callback) {
            console.log('✅ Merge-smart: Aplicando reglas de negocio');

            var localData = conflict.localOperation.data;
            var serverData = conflict.serverChange.data;
            var mergedData = {};
            var rules = this.config.mergeRules[conflict.serverChange.table_name] || {};

            // Obtener datos originales del registro (antes de cualquier cambio)
            var recordId = conflict.serverChange.record_id;
            var tableName = conflict.serverChange.table_name;

            SQLite.select(tableName, {id: recordId}, function(err, rows) {
                var originalData = (rows && rows.length > 0) ? rows[0] : {};

                // Procesar cada campo
                for (var key in serverData) {
                    var rule = rules[key];

                    if (rule === 'accumulate') {
                        // ACUMULACIÓN: Sumar diferencias
                        var originalValue = parseFloat(originalData[key]) || 0;
                        var localValue = parseFloat(localData[key]) || originalValue;
                        var serverValue = parseFloat(serverData[key]) || originalValue;

                        var localDelta = localValue - originalValue;
                        var serverDelta = serverValue - originalValue;

                        mergedData[key] = originalValue + localDelta + serverDelta;

                        console.log('Campo acumulativo:', key);
                        console.log('  Original:', originalValue);
                        console.log('  Delta local:', localDelta);
                        console.log('  Delta servidor:', serverDelta);
                        console.log('  Resultado:', mergedData[key]);

                    } else if (rule === 'server-priority') {
                        // Servidor tiene prioridad
                        mergedData[key] = serverData[key];

                    } else if (rule === 'client-priority') {
                        // Cliente tiene prioridad
                        mergedData[key] = localData[key] || serverData[key];

                    } else if (rule === 'newest') {
                        // Usar el cambio más reciente (por timestamp)
                        var localTimestamp = new Date(conflict.localOperation.timestamp).getTime();
                        var serverTimestamp = new Date(conflict.serverChange.timestamp).getTime();

                        if (localTimestamp > serverTimestamp) {
                            mergedData[key] = localData[key] || serverData[key];
                        } else {
                            mergedData[key] = serverData[key];
                        }

                    } else {
                        // Sin regla: priorizar servidor por defecto
                        mergedData[key] = serverData[key];
                    }
                }

                // Agregar campos que solo existen localmente
                for (var key in localData) {
                    if (!mergedData.hasOwnProperty(key)) {
                        mergedData[key] = localData[key];
                    }
                }

                // Crear cambio combinado
                var mergedChange = {
                    table_name: conflict.serverChange.table_name,
                    operation_type: conflict.serverChange.operation_type,
                    record_id: conflict.serverChange.record_id,
                    data: mergedData
                };

                if (callback) callback(null, {
                    action: 'apply_merged',
                    data: mergedChange
                });
            });
        },

        /**
         * Configurar reglas de merge inteligente
         * @param {string} tableName - Nombre de la tabla
         * @param {object} rules - {campo: 'accumulate'|'server-priority'|'client-priority'|'newest'}
         */
        setMergeRules: function(tableName, rules) {
            this.config.mergeRules[tableName] = rules;
            console.log('Reglas de merge configuradas para', tableName, ':', rules);
        },

        /**
         * Estrategia: Resolución manual
         * Encolar conflicto y llamar callback del usuario
         */
        resolveManual: function(conflict, callback) {
            var self = this;

            console.log('⚠️ Manual: Esperando decisión del usuario');

            // Agregar a cola de conflictos
            self.conflictQueue.push(conflict);

            // Si hay callback registrado, llamarlo
            if (self.onConflictDetected) {
                self.onConflictDetected(conflict, function(userDecision) {
                    // userDecision: 'server', 'client', 'merge', {customData}
                    
                    if (userDecision === 'server') {
                        self.resolveServerWins(conflict, callback);
                    } else if (userDecision === 'client') {
                        self.resolveClientWins(conflict, callback);
                    } else if (userDecision === 'merge') {
                        self.resolveMerge(conflict, callback);
                    } else if (typeof userDecision === 'object') {
                        // Usuario proporcionó datos personalizados
                        var customChange = {
                            table_name: conflict.serverChange.table_name,
                            operation_type: conflict.serverChange.operation_type,
                            record_id: conflict.serverChange.record_id,
                            data: userDecision
                        };
                        
                        if (callback) callback(null, {
                            action: 'apply_custom',
                            data: customChange
                        });
                    } else {
                        // Por defecto: server-wins
                        self.resolveServerWins(conflict, callback);
                    }
                });
            } else {
                // No hay callback, usar server-wins por defecto
                console.warn('No hay callback de resolución manual, usando server-wins');
                self.resolveServerWins(conflict, callback);
            }
        },

        /**
         * Obtener conflictos pendientes de resolución manual
         * @param {function} callback - callback(error, conflicts)
         */
        getPendingConflicts: function(callback) {
            if (callback) callback(null, this.conflictQueue);
        },

        /**
         * Limpiar cola de conflictos
         */
        clearConflictQueue: function() {
            this.conflictQueue = [];
            console.log('Cola de conflictos limpiada');
        },

        /**
         * Configurar estrategia de resolución de conflictos
         * @param {string} strategy - 'server-wins', 'client-wins', 'merge', 'manual'
         * @param {function} onConflict - callback para resolución manual
         */
        setConflictResolution: function(strategy, onConflict) {
            this.config.conflictResolution = strategy;
            
            if (onConflict) {
                this.onConflictDetected = onConflict;
            }
            
            console.log('Estrategia de conflictos configurada:', strategy);
        }
    };

    // Exponer globalmente
    window.SyncManager = SyncManager;

})(window);
