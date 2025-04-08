FROM node:18-alpine as builder

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias nativas
RUN apk add --no-cache python3 make g++ 

# Copiar archivos de configuración
COPY package*.json ./
COPY .npmrc ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --legacy-peer-deps
RUN npm rebuild bcrypt --build-from-source

# Generar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY src ./src/

# Compilar aplicación
RUN npm run build && ls -la dist/

# Verificar que la compilación fue exitosa
RUN test -f dist/main.js || (echo "Compilación fallida: No se encontró dist/main.js" && exit 1)

# Segunda etapa: imagen de producción
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario desde la etapa de compilación
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/prisma /app/prisma

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["node", "dist/main.js"] 