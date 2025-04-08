#!/bin/bash

echo "===== Preparando despliegue en Railway ====="

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

echo "===== Verificando estructura del proyecto ====="
# Verificar que el esquema de Prisma existe
if [ ! -f "./prisma/schema.prisma" ]; then
    echo "ERROR: No se encontró el archivo prisma/schema.prisma"
    exit 1
fi

# Verificar que el Dockerfile existe
if [ ! -f "./Dockerfile" ]; then
    echo "ERROR: No se encontró el archivo Dockerfile"
    exit 1
fi

# Crear .npmrc si no existe
if [ ! -f "./.npmrc" ]; then
    echo "Creando archivo .npmrc..."
    echo "legacy-peer-deps=true" > .npmrc
    echo "engine-strict=false" >> .npmrc
    echo "node-linker=hoisted" >> .npmrc
    git add .npmrc
    git commit -m "chore: add .npmrc for Railway deployment"
fi

echo "===== Limpiando caché de Railway ====="
# Forzar una reconstrucción limpia
railway build --clean

echo "===== Iniciando despliegue ====="
# Ejecutar despliegue
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Verificando logs ====="
railway logs

echo "===== Despliegue completado ====="
echo "Si persisten problemas, considera eliminar y recrear el servicio en Railway." 