FROM node:18-alpine

WORKDIR /app

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración primero para aprovechar el caché de capas
COPY package.json package-lock.json* .npmrc ./
COPY prisma ./prisma/

# Instalar dependencias con --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source

# Generar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar resto del código
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"] 