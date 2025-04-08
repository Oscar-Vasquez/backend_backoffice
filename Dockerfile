FROM node:18-alpine

WORKDIR /app

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración primero para aprovechar el caché de capas
COPY package.json package-lock.json* .npmrc nest-cli.json ./
COPY prisma ./prisma/

# Instalar dependencias con --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source

# Generar cliente Prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY src ./src/
COPY tsconfig.json tsconfig.build.json ./

# Compilar la aplicación
RUN npx nest build

# Verificar que el archivo dist/main.js existe
RUN ls -la dist/ && \
    if [ ! -f "./dist/main.js" ]; then \
      echo "ERROR: No se encontró el archivo dist/main.js después de la compilación"; \
      exit 1; \
    fi

# Copiar archivos restantes
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"] 