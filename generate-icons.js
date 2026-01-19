/**
 * Script para generar iconos PNG desde el SVG
 * Requiere: sharp (npm install sharp)
 * 
 * Ejecutar: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está instalado
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error('❌ Error: sharp no está instalado.');
    console.log('\n📦 Para instalar sharp, ejecuta:');
    console.log('   npm install sharp\n');
    console.log('💡 Alternativa: Puedes generar los iconos manualmente usando:');
    console.log('   - https://realfavicongenerator.net/');
    console.log('   - https://www.pwabuilder.com/imageGenerator');
    console.log('   - O cualquier herramienta online de conversión SVG a PNG\n');
    process.exit(1);
}

async function generateIcons() {
    const svgPath = path.join(__dirname, 'icon.svg');
    
    if (!fs.existsSync(svgPath)) {
        console.error('❌ No se encontró icon.svg');
        process.exit(1);
    }
    
    console.log('🎨 Generando iconos desde icon.svg...\n');
    
    try {
        // Generar icon-192.png
        await sharp(svgPath)
            .resize(192, 192)
            .png()
            .toFile(path.join(__dirname, 'icon-192.png'));
        console.log('✅ Generado: icon-192.png (192x192)');
        
        // Generar icon-512.png
        await sharp(svgPath)
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, 'icon-512.png'));
        console.log('✅ Generado: icon-512.png (512x512)');
        
        console.log('\n✨ ¡Iconos generados exitosamente!');
        console.log('📱 Tu PWA está lista para instalarse.\n');
        
    } catch (error) {
        console.error('❌ Error al generar iconos:', error.message);
        process.exit(1);
    }
}

generateIcons();
