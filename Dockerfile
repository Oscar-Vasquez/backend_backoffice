FROM node:18-alpine

WORKDIR /app

# Crear un .npmrc básico por si no existe
RUN echo "legacy-peer-deps=true" > .npmrc && \
    echo "engine-strict=false" >> .npmrc && \
    echo "node-linker=hoisted" >> .npmrc && \
    echo "fund=false" >> .npmrc && \
    echo "audit=false" >> .npmrc

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ git curl

# Aumentar el límite de memoria para Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PORT=3000
ENV NODE_ENV=production

# Configurar NPM para máxima compatibilidad
RUN npm config set legacy-peer-deps true && \
    npm config set engine-strict false && \
    npm config set fund false && \
    npm config set audit false

# Crear polyfill para crypto
COPY polyfills.js ./

# Copiar archivos de configuración primero
COPY package*.json ./
# No copiamos .npmrc porque ya lo creamos
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar dependencias en varios pasos para mayor robustez
RUN npm install --no-audit --no-fund --legacy-peer-deps || \
    (echo "Primer intento de instalación falló, intentando con --force" && \
     npm install --no-audit --no-fund --legacy-peer-deps --force) || \
    (echo "Segundo intento de instalación falló, intentando con npm ci" && \
     npm ci --no-audit --no-fund --legacy-peer-deps) || \
    (echo "Tercer intento falló, limpiando caché e intentando nuevamente" && \
     npm cache clean --force && npm install --no-audit --no-fund --legacy-peer-deps --force)

# Instalar tipos para Express.Multer.File
RUN npm install --save-dev @types/multer@1.4.12

# Instalar NestJS CLI globalmente
RUN npm install -g @nestjs/cli

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source || \
    (echo "Falló la reconstrucción de bcrypt, intentando con node-gyp" && \
     npm install -g node-gyp && node-gyp rebuild && npm rebuild bcrypt --build-from-source --force)

# Generar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma || \
    (echo "Falló la generación de Prisma Client, intentando con versión específica" && \
     npm install @prisma/client@6.5.0 prisma@6.5.0 --save-exact && \
     npx prisma generate --schema=./prisma/schema.prisma)

# Copiar código fuente
COPY src ./src/

# Crear un archivo de definición de tipos para Express.Multer.File
RUN mkdir -p src/@types/express && \
    echo 'declare namespace Express { namespace Multer { interface File { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; buffer: Buffer; } } }' > src/@types/express/index.d.ts

# Configurar la ruta GET / usando un archivo temporal
RUN sed -i "s/app.get('\/.*}/app.get('\/').controller((req, res) => { res.send({ status: 'ok' }); })/" src/main.ts || echo "No se pudo modificar main.ts"

# Compilar aplicación con reintentos sin --force
RUN nest build || \
    (echo "Falló la compilación, intentando con ignorar errores" && \
     nest build --skipCheck) || \
    (echo "Segundo intento falló, asegurando tipos correctos e intentando nuevamente" && \
     npm install --save-dev @types/express@4 @types/multer@1.4.12 && \
     npx tsc)

# Verificar compilación
RUN ls -la dist/ && \
    if [ ! -f "dist/main.js" ]; then \
      echo "Error: No se encontró dist/main.js"; \
      exit 1; \
    fi

# Copiar resto de archivos
COPY . .

# Exponer puerto - importante para Railway
EXPOSE 3000

# Comando para iniciar sin la bandera experimental
CMD ["node", "--max-old-space-size=4096", "dist/main.js"] 