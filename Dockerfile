FROM node:18-alpine

WORKDIR /app

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración primero para aprovechar el caché de capas
COPY package.json package-lock.json* .npmrc nest-cli.json ./
COPY prisma ./prisma/
COPY compile.sh ./

# Hacemos el script ejecutable
RUN chmod +x compile.sh

# Instalar dependencias con --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source

# Copiar resto del código fuente
COPY src ./src/
COPY tsconfig.json tsconfig.build.json ./

# Ejecutar el script de compilación
RUN ./compile.sh

# Copiar archivos restantes
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"] 