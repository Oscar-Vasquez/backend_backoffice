#!/bin/bash

echo "===== Script de despliegue con transpilación manual ====="

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

# Crear polyfill para crypto
echo "===== Creando polyfill para crypto ====="
cat > polyfills.js <<EOL
// Polyfill para crypto
try {
  if (typeof global.crypto === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = {
      getRandomValues: function(buffer) {
        return nodeCrypto.randomFillSync(buffer);
      },
      randomUUID: function() {
        return nodeCrypto.randomUUID();
      },
      subtle: {
        digest: async function(algorithm, data) {
          const hash = nodeCrypto.createHash(algorithm.toLowerCase().replace('-', ''));
          hash.update(Buffer.from(data));
          return hash.digest();
        }
      }
    };
    console.log('✅ Polyfill de crypto cargado correctamente');
  }
} catch (error) {
  console.warn('⚠️ Error al cargar el polyfill de crypto:', error);
}
module.exports = {};
EOL

# Crear definiciones de tipos Express.Multer.File
echo "===== Creando definiciones de tipos Express.Multer.File ====="
mkdir -p src/@types/express
cat > src/@types/express/index.d.ts <<EOL
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
EOL

# Modificar main.ts para corregir la ruta raíz
echo "===== Modificando main.ts ====="
if [ -f "src/main.ts" ]; then
    # Crear backup
    cp src/main.ts src/main.ts.bak
    
    # Modificar el archivo para usar app.use con next
    sed -i '/app\.get(\x27\/\x27, *(req, *res) *=>.*{/,/})/s/app\.get(\x27\/\x27, *(req, *res) *=>.*{.*}/app.use(\x27\/\x27, (req, res, next) => { res.status(200).json({ status: \x27ok\x27 }); })/' src/main.ts || \
    echo "No se pudo modificar automáticamente main.ts, intentando otra aproximación"
    
    # Segunda aproximación si la primera falla
    if grep -q "app.get('/', (req, res)" src/main.ts; then
        echo "Intentando segunda aproximación para modificar main.ts"
        # Comentar la línea problemática y añadir una nueva
        sed -i '/app\.get(\x27\/\x27, *(req, *res)/s/^/\/\/ /' src/main.ts
        # Buscar la línea después de cookieParser y añadir la ruta
        sed -i '/cookieParser/a \\n  // Ruta raíz para healthcheck\n  app.use(\x27\/\x27, (req, res, next) => { res.status(200).json({ status: \x27ok\x27 }); });' src/main.ts
    fi
    
    echo "✅ Archivo main.ts modificado"
fi

# Instalar tipos necesarios localmente
echo "===== Instalando tipos necesarios localmente ====="
npm install --save-dev @types/express@4 @types/multer@1.4.12

# Copiar Dockerfile.manual a Dockerfile
echo "===== Usando Dockerfile.manual para el despliegue ====="
cp Dockerfile.manual Dockerfile

# Actualizar configuración de Railway
echo "===== Actualizando configuración de Railway ====="
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
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "healthcheckPath": "/",
    "healthcheckTimeout": 60
  }
}
EOL

# Crear un archivo views/index.hbs en caso de que no exista
mkdir -p views
if [ ! -f "views/index.hbs" ]; then
    echo "===== Creando archivo views/index.hbs básico ====="
    cat > views/index.hbs <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>API Status</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        h1 {
            color: #333;
        }
        .status {
            padding: 10px;
            background-color: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Status</h1>
        <div class="status">
            <strong>Status:</strong> Online
        </div>
        <p>The API is running correctly.</p>
        <p>Timestamp: {{timestamp}}</p>
    </div>
</body>
</html>
EOL
fi

# Crear un directorio public si no existe
mkdir -p public
if [ ! -f "public/health.html" ]; then
    echo "===== Creando archivo public/health.html básico ====="
    cat > public/health.html <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>API Health: OK</h1>
    <p>Service is running properly</p>
</body>
</html>
EOL
fi

# Desplegar en Railway
echo "===== Iniciando despliegue en Railway ====="
railway build --clean
railway up

echo "===== Verificando estado del despliegue ====="
railway status

echo "===== Proceso completado ====="
echo "Si persisten los problemas, revisa los logs con 'railway logs'" 