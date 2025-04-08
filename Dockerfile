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

# Compilar aplicación con reintentos
RUN npx nest build || \
    (echo "Falló la compilación, intentando nuevamente con --force" && \
     npm install @nestjs/cli --no-save && \
     npx nest build --force)

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