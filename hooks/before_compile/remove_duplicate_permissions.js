#!/usr/bin/env node

/**
 * Hook de Cordova para limpiar AndroidManifest.xml
 * - Elimina permisos duplicados
 * - Agrega android:exported a componentes FCM (requerido para Android 12+)
 */

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const manifestPath = path.join(platformRoot, 'app/src/main/AndroidManifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
        console.log('AndroidManifest.xml not found, skipping...');
        return;
    }
    
    console.log('🔧 Fixing AndroidManifest.xml for Android 12+ compatibility...');
    
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let modified = false;
    
    // 1. Remover permisos duplicados de WRITE_EXTERNAL_STORAGE
    const lines = manifestContent.split('\n');
    const writeStorageLines = [];
    
    lines.forEach((line, index) => {
        if (line.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
            writeStorageLines.push(index);
        }
    });
    
    if (writeStorageLines.length > 1) {
        console.log(`  ✓ Found ${writeStorageLines.length} WRITE_EXTERNAL_STORAGE permissions. Keeping only the first one...`);
        
        for (let i = writeStorageLines.length - 1; i > 0; i--) {
            lines.splice(writeStorageLines[i], 1);
            modified = true;
        }
        
        manifestContent = lines.join('\n');
    }
    
    // 2. Agregar android:exported a FCMPluginActivity si no lo tiene
    if (manifestContent.includes('com.gae.scaffolder.plugin.FCMPluginActivity')) {
        const activityRegex = /(<activity[^>]*android:name="com\.gae\.scaffolder\.plugin\.FCMPluginActivity"[^>]*)(>)/;
        if (activityRegex.test(manifestContent)) {
            const match = manifestContent.match(activityRegex);
            if (match && !match[0].includes('android:exported')) {
                manifestContent = manifestContent.replace(
                    activityRegex,
                    '$1 android:exported="true"$2'
                );
                console.log('  ✓ Added android:exported="true" to FCMPluginActivity');
                modified = true;
            }
        }
    }
    
    // 3. Agregar android:exported a MyFirebaseMessagingService si no lo tiene
    if (manifestContent.includes('com.gae.scaffolder.plugin.MyFirebaseMessagingService')) {
        const serviceRegex = /(<service[^>]*android:name="com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService"[^>]*)(>)/;
        if (serviceRegex.test(manifestContent)) {
            const match = manifestContent.match(serviceRegex);
            if (match && !match[0].includes('android:exported')) {
                manifestContent = manifestContent.replace(
                    serviceRegex,
                    '$1 android:exported="false"$2'
                );
                console.log('  ✓ Added android:exported="false" to MyFirebaseMessagingService');
                modified = true;
            }
        }
    }
    
    if (modified) {
        fs.writeFileSync(manifestPath, manifestContent, 'utf8');
        console.log('✅ AndroidManifest.xml fixed successfully');
    } else {
        console.log('✅ AndroidManifest.xml is already correct');
    }
};
