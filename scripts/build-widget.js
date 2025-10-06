const fs = require('fs');
const path = require('path');

// Paths
const srcPath = path.join(__dirname, '..', 'public', 'widget-loader.js');
const destPath = path.join(__dirname, '..', '..', 'Api', 'wwwroot', 'widget.js');

// Ensure wwwroot directory exists
const wwwrootPath = path.dirname(destPath);
if (!fs.existsSync(wwwrootPath)) {
    fs.mkdirSync(wwwrootPath, { recursive: true });
}

// Copy widget-loader.js to Api/wwwroot/widget.js
fs.copyFileSync(srcPath, destPath);

console.log('✅ Widget script copiado exitosamente a', destPath);