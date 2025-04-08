#!/bin/bash

echo "===== Solución para el problema de healthcheck de Railway ====="

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

echo "===== Asegurando que el polyfill está configurado correctamente ====="
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

echo "===== Creando punto de entrada para healthcheck ====="
mkdir -p public
cat > public/health.html <<EOL
<!DOCTYPE html>
<html>
<head>
  <title>API Status</title>
</head>
<body>
  <h1>API Status: OK</h1>
  <p>The API is running correctly.</p>
  <p>Timestamp: $(date)</p>
</body>
</html>
EOL

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
    "startCommand": "node --max-old-space-size=2048 dist/main.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "port": 3000
  }
}
EOL

echo "===== Creando Dockerfile simplificado ====="
cat > Dockerfile <<EOL
FROM node:18-alpine

WORKDIR /app

# Configurar variables de entorno
ENV PORT=3000
ENV NODE_ENV=production

# Copiar archivos esenciales
COPY package.json .
COPY polyfills.js .
COPY prisma ./prisma/
COPY tsconfig.json tsconfig.build.json ./
COPY public ./public/

# Instalar dependencias
RUN apk add --no-cache python3 make g++ && \\
    npm install --only=prod --legacy-peer-deps --force && \\
    npm rebuild bcrypt --build-from-source && \\
    npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY src ./src/

# Compilar
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Iniciar aplicación
CMD ["node", "dist/main.js"]
EOL

echo "===== Limpiando caché y desplegando ====="
railway build --clean
railway up

echo "===== Verificando estado del servicio ====="
railway status

echo "===== Despliegue completado =====" 