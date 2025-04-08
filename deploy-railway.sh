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

echo "===== Configurando variables de entorno para Railway ====="
# Asegurarse de que las variables de entorno estén configuradas
railway env | grep DATABASE_URL > /dev/null || echo "ADVERTENCIA: No se encontró DATABASE_URL en Railway. Asegúrate de configurarla."

echo "===== Iniciando despliegue ====="
# Ejecutar despliegue
railway up --detach

echo "===== Despliegue iniciado ====="
echo "El despliegue se está ejecutando en segundo plano."
echo "Para ver el estado del despliegue: railway status"
echo "Para ver los logs: railway logs"
echo "Para abrir el panel de proyecto: railway open" 