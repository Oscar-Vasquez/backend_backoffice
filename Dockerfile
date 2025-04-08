FROM node:16-alpine

WORKDIR /app

# Crear un .npmrc básico por si no existe
RUN echo "legacy-peer-deps=true" > .npmrc && \
    echo "engine-strict=false" >> .npmrc && \
    echo "node-linker=hoisted" >> .npmrc

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración primero
COPY package*.json ./
# No copiamos .npmrc porque ya lo creamos
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source

# Generar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY src ./src/

# Compilar aplicación
RUN npx nest build

# Verificar compilación
RUN ls -la dist/ && \
    if [ ! -f "dist/main.js" ]; then \
      echo "Error: No se encontró dist/main.js"; \
      exit 1; \
    fi

# Copiar resto de archivos
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para iniciar con soporte para crypto
CMD ["node", "--experimental-crypto-policy=default", "dist/main.js"] 