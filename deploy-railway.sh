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

echo "===== Configurando variables de entorno para Railway ====="
# Asegurarse de que las variables de entorno estén configuradas
railway env | grep DATABASE_URL > /dev/null || echo "ADVERTENCIA: No se encontró DATABASE_URL en Railway. Asegúrate de configurarla."

echo "===== Forzando reconstrucción limpia ====="
# Forzar una reconstrucción limpia
railway build --clean

echo "===== Iniciando despliegue ====="
# Ejecutar despliegue
railway up

echo "===== Verificando despliegue ====="
railway status

echo "===== Logs de la aplicación ====="
railway logs 