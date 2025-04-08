#!/bin/bash

echo "===== Limpiando directorio de compilación ====="
rm -rf dist/

echo "===== Instalando dependencias ====="
npm install --legacy-peer-deps

echo "===== Generando cliente Prisma ====="
npx prisma generate --schema=./prisma/schema.prisma

echo "===== Compilando aplicación ====="
npx nest build

echo "===== Verificando archivos generados ====="
if [ ! -f "./dist/main.js" ]; then
    echo "ERROR: No se encontró el archivo dist/main.js después de la compilación"
    exit 1
fi

ls -la dist/

echo "===== Compilación exitosa =====" 