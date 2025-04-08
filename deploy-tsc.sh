#!/bin/bash

echo "===== Script de despliegue con TSC directo ====="

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "Railway CLI no está instalado. Instalando..."
    npm i -g @railway/cli
fi

# Verificar si el usuario está autenticado
if ! railway whoami &> /dev/null; then
    echo "No has iniciado sesión en Railway. Iniciando sesión..."
    railway login
fi

# Crear polyfill para crypto
echo "===== Creando polyfill para crypto ====="
cat > polyfills.js <<EOL
// Polyfill para crypto
try {
  if (typeof global.crypto === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = {
      getRandomValues: function(buffer) {
        return nodeCrypto.randomFillSync(buffer);
      },
      randomUUID: function() {
        return nodeCrypto.randomUUID();
      },
      subtle: {
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
module.exports = {};
EOL

# Crear definiciones de tipos Express.Multer.File
echo "===== Creando definiciones de tipos Express.Multer.File ====="
mkdir -p src/@types/express
cat > src/@types/express/index.d.ts <<EOL
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
EOL

# Modificar main.ts para corregir la ruta raíz
echo "===== Modificando main.ts ====="
if [ -f "src/main.ts" ]; then
    # Crear backup
    cp src/main.ts src/main.ts.bak
    
    # Intentar modificar app.get
    sed -i 's/app\.get(\x27\/\x27, *(req, *res) *=> *{/app\.use(\x27\/\x27, (req, res) => {/' src/main.ts || \
        echo "No se pudo modificar automáticamente main.ts"
fi

# Usar Dockerfile.tsc
echo "===== Usando Dockerfile.tsc para el despliegue ====="
cp Dockerfile.tsc Dockerfile

# Actualizar configuración de Railway
echo "===== Actualizando configuración de Railway ====="
cat > railway.json <<EOL
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "watchPatterns": [
      "src/**",
      "prisma/**",
      "package.json",
      "tsconfig.json"
    ]
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "healthcheckPath": "/",
    "healthcheckTimeout": 60
  }
}
EOL

# Instalar tipos necesarios localmente
echo "===== Instalando tipos necesarios localmente ====="
npm install --save-dev @types/express@4 @types/multer@1.4.12

# Desplegar en Railway
echo "===== Iniciando despliegue en Railway ====="
railway build --clean
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Proceso completado ====="
echo "Si persisten los problemas, revisa los logs con 'railway logs'" 