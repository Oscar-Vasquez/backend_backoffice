#!/bin/bash

echo "===== Intentando despliegue con Dockerfile alternativo ====="

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

echo "===== Usando Dockerfile alternativo ====="
cp Dockerfile.simple Dockerfile

echo "===== Actualizando configuración de Railway ====="
cat > railway.json <<EOL
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "args": {
      "NODE_VERSION": "18"
    }
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "node --experimental-crypto-policy=default --max-old-space-size=2048 dist/main.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
EOL

echo "===== Limpiando caché e iniciando despliegue ====="
railway build --clean
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Despliegue completado ====="
echo "Si continúan los problemas, considera contactar al soporte de Railway." 