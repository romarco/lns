#!/usr/bin/env node

/**
 * Hook de Cordova para eliminar permisos duplicados en AndroidManifest.xml
 * Se ejecuta antes de compilar para asegurar que el manifest esté limpio
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
    
    console.log('Checking for duplicate permissions in AndroidManifest.xml...');
    
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let modified = false;
    
    // Remover TODAS las líneas de WRITE_EXTERNAL_STORAGE excepto la primera
    const lines = manifestContent.split('\n');
    const writeStorageLines = [];
    
    lines.forEach((line, index) => {
        if (line.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
            writeStorageLines.push(index);
        }
    });
    
    if (writeStorageLines.length > 1) {
        console.log(`Found ${writeStorageLines.length} WRITE_EXTERNAL_STORAGE permissions. Keeping only the first one...`);
        
        // Remover todas excepto la primera (en orden inverso para no afectar los índices)
        for (let i = writeStorageLines.length - 1; i > 0; i--) {
            lines.splice(writeStorageLines[i], 1);
            modified = true;
        }
        
        manifestContent = lines.join('\n');
    }
    
    if (modified) {
        fs.writeFileSync(manifestPath, manifestContent, 'utf8');
        console.log('✓ AndroidManifest.xml cleaned successfully');
    } else {
        console.log('✓ No duplicate permissions found');
    }
};
