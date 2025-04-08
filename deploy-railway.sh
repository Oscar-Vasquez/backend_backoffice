#!/bin/bash

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

# Ejecutar despliegue
echo "Desplegando en Railway..."
railway up

echo "Despliegue completado. Abriendo el panel de proyecto..."
railway open

echo "Puedes verificar los logs con: railway logs" 