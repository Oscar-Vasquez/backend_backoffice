#!/bin/bash

echo "===== Solucionando problema con --experimental-crypto-policy ====="

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

# Actualizando railway.json sin la bandera experimental
echo "===== Actualizando railway.json ====="
cat > railway.json <<EOL
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "watchPatterns": [
      "src/**",
      "prisma/**",
      "package.json",
      "tsconfig.json"
    ]
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
EOL

# Actualizando railway.toml sin la bandera experimental
echo "===== Actualizando railway.toml ====="
cat > railway.toml <<EOL
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
watchPatterns = ["src/**", "prisma/**", "package.json", "tsconfig.json"]

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/"
healthcheckTimeout = 60
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
EOL

# Actualizando package.json para eliminar la bandera experimental
echo "===== Actualizando package.json ====="
if [ -f "package.json" ]; then
    # Crear una copia de respaldo
    cp package.json package.json.bak
    
    # Usar sed para reemplazar la línea que contiene start:prod
    sed -i 's/"start:prod": "node --experimental-crypto-policy=default dist\/main.js"/"start:prod": "node dist\/main.js"/' package.json || \
        echo "No se pudo actualizar package.json automáticamente"
fi

# Reiniciar el despliegue en Railway
echo "===== Reiniciando despliegue en Railway ====="
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Proceso completado ====="
echo "El despliegue se ha reiniciado sin la bandera experimental."
echo "Monitorea el progreso con 'railway logs'" 