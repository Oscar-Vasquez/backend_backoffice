// Polyfill para crypto y otras funcionalidades críticas
try {
  // Definir crypto de manera segura si no existe
  if (typeof global.crypto === 'undefined') {
    const nodeCrypto = require('crypto');
    
    // Implementar un polyfill básico para crypto
    global.crypto = {
      getRandomValues: function(buffer) {
        return nodeCrypto.randomFillSync(buffer);
      },
      randomUUID: function() {
        return nodeCrypto.randomUUID();
      },
      subtle: {
        // Implementar métodos mínimos si se necesitan
        digest: async function(algorithm, data) {
          const hash = nodeCrypto.createHash(algorithm.toLowerCase().replace('-', ''));
          hash.update(Buffer.from(data));
          return hash.digest();
        }
      }
    };
    
    console.log('✅ Polyfill de crypto cargado correctamente');
  }
} catch (error) {
  console.warn('⚠️ Error al cargar el polyfill de crypto:', error);
}

// Exportamos un objeto vacío para que se pueda importar como módulo
module.exports = {}; 