#!/bin/bash

echo "===== Iniciando despliegue mínimo en Railway ====="

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

# Crear el polyfill de crypto
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
      }
    };
    console.log('✅ Polyfill de crypto cargado correctamente');
  }
} catch (error) {
  console.warn('⚠️ Error al cargar el polyfill de crypto:', error);
}
module.exports = {};
EOL

echo "===== Creando Dockerfile mínimo ====="
cat > Dockerfile.minimal <<EOL
FROM node:16-alpine

WORKDIR /app

# Copiar polyfill primero
COPY polyfills.js ./

# Copiar archivos de proyecto
COPY . .

# Instalar dependencias
RUN npm install --legacy-peer-deps --force && \\
    npm rebuild bcrypt --build-from-source && \\
    npx prisma generate

# Compilar la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Iniciar la aplicación (sin flags experimentales)
CMD ["node", "dist/main.js"]
EOL

echo "===== Reemplazando Dockerfile ====="
cp Dockerfile.minimal Dockerfile

echo "===== Actualizando configuración de Railway ====="
cat > railway.json <<EOL
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE"
  }
}
EOL

echo "===== Limpiando caché e iniciando despliegue ====="
railway build --clean
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Despliegue completado =====" 