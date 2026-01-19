#!/usr/bin/env node

/**
 * Hook de Cordova para eliminar permisos duplicados en AndroidManifest.xml
 * Se ejecuta automáticamente después de 'cordova prepare'
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
    
    // Encontrar todos los permisos
    const permissionRegex = /<uses-permission[^>]+>/g;
    const permissions = manifestContent.match(permissionRegex) || [];
    
    // Detectar duplicados
    const seen = new Set();
    const duplicates = [];
    
    permissions.forEach(perm => {
        // Extraer el nombre del permiso
        const nameMatch = perm.match(/android:name="([^"]+)"/);
        if (nameMatch) {
            const permName = nameMatch[1];
            if (seen.has(permName)) {
                duplicates.push(perm);
            } else {
                seen.add(permName);
            }
        }
    });
    
    if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate permission(s). Removing...`);
        
        // Remover duplicados (mantener solo la primera ocurrencia)
        duplicates.forEach(dupPerm => {
            // Escapar caracteres especiales para regex
            const escapedPerm = dupPerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedPerm);
            
            // Encontrar la primera ocurrencia
            const firstIndex = manifestContent.search(regex);
            if (firstIndex !== -1) {
                // Buscar la segunda ocurrencia
                const afterFirst = manifestContent.substring(firstIndex + dupPerm.length);
                const secondIndex = afterFirst.search(regex);
                
                if (secondIndex !== -1) {
                    // Remover la segunda ocurrencia
                    const absoluteSecondIndex = firstIndex + dupPerm.length + secondIndex;
                    manifestContent = manifestContent.substring(0, absoluteSecondIndex) + 
                                     manifestContent.substring(absoluteSecondIndex + dupPerm.length);
                    console.log(`  ✓ Removed duplicate: ${dupPerm}`);
                }
            }
        });
        
        // Guardar el archivo modificado
        fs.writeFileSync(manifestPath, manifestContent, 'utf8');
        console.log('✓ AndroidManifest.xml cleaned successfully');
    } else {
        console.log('✓ No duplicate permissions found');
    }
};
