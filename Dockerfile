FROM node:18-alpine

WORKDIR /app

# Instalar dependencias para compilación nativa
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración primero para aprovechar el caché de capas
COPY package.json yarn.lock* package-lock.json* ./

# Instalar dependencias
RUN yarn install --frozen-lockfile || npm install

# Reconstruir bcrypt específicamente
RUN npm rebuild bcrypt --build-from-source

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar la aplicación
RUN yarn build || npm run build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["yarn", "start:prod"] 