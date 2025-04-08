#!/bin/bash

echo "===== Script de despliegue con solución para errores de compilación ====="

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
echo "===== Verificando polyfill de crypto ====="
cat > polyfills.js <<EOL
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
EOL

# Crear definiciones de tipos Multer
echo "===== Creando archivo de tipos para Express.Multer.File ====="
cat > multer.d.ts <<EOL
// Definición de tipos para Express.Multer.File
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

# Crear directorio para definiciones de tipos
mkdir -p src/@types/express
cp multer.d.ts src/@types/express/index.d.ts

# Modificar archivo main.ts para solucionar problema de ruta
echo "===== Modificando main.ts para corregir errores ====="
if [ -f "src/main.ts" ]; then
    # Hacer backup
    cp src/main.ts src/main.ts.bak
    
    # Reemplazar app.get('/', ...) con app.use('/', ...)
    sed -i 's/app\.get(\x27\/\x27, *(req, *res) *=> *{/app\.use(\x27\/\x27, (req, res) => {/' src/main.ts || \
        echo "No se pudo modificar main.ts automáticamente"
    
    echo "✅ Archivo main.ts modificado"
fi

# Instalar dependencias de tipos
echo "===== Instalando tipos necesarios ====="
npm install --save-dev @types/express@4 @types/multer@1.4.12

# Crear Dockerfile optimizado para resolver problema de compilación
echo "===== Creando Dockerfile optimizado ====="
cat > Dockerfile <<EOL
FROM node:18-alpine

WORKDIR /app

# Configurar variables de entorno
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PORT=3000
ENV NODE_ENV=production

# Crear archivos de configuración básicos
RUN echo "legacy-peer-deps=true" > .npmrc

# Copiar archivos esenciales
COPY package.json .
COPY multer.d.ts .
COPY polyfills.js .
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN apk add --no-cache python3 make g++ git && \\
    npm install --legacy-peer-deps --force

# Instalar tipos necesarios
RUN npm install --save-dev @types/express@4 @types/multer@1.4.12

# Configurar tipos de Express.Multer.File
RUN mkdir -p src/@types/express
COPY multer.d.ts src/@types/express/index.d.ts

# Reconstruir bcrypt y generar Prisma Client
RUN npm rebuild bcrypt --build-from-source && \\
    npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY src ./src/

# Asegurar que main.ts use app.use en lugar de app.get para la ruta raíz
RUN sed -i 's/app\.get(\x27\/\x27, *(req, *res) *=> *{/app\.use(\x27\/\x27, (req, res) => {/' src/main.ts || echo "No se pudo modificar main.ts"

# Compilar usando npm run build
RUN npm run build || \\
    (echo "La compilación falló, intentando con NODE_OPTIONS adicionales" && \\
     NODE_OPTIONS="--max-old-space-size=4096 --no-warnings" npm run build)

# Verificar que se haya generado main.js
RUN ls -la dist/ && \\
    if [ ! -f "dist/main.js" ]; then \\
        echo "Error: No se ha generado dist/main.js" && \\
        exit 1; \\
    fi

# Copiar resto de archivos
COPY . .

# Exponer puerto 3000
EXPOSE 3000

# Comando para iniciar
CMD ["node", "dist/main.js"]
EOL

# Actualizar la configuración de Railway
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

echo "===== Iniciando despliegue en Railway ====="
railway build --clean
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Proceso completado ====="
echo "Si persisten los problemas, revisa los logs con 'railway logs'" 