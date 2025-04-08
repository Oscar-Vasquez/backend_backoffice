// Polyfills para Node.js
try {
  // Si crypto no está definido, intentamos importarlo
  if (typeof crypto === 'undefined') {
    global.crypto = require('crypto');
  }
} catch (error) {
  console.warn('Error al cargar el polyfill de crypto:', error);
}

// Exportamos un objeto vacío para que se pueda importar como módulo
module.exports = {}; 