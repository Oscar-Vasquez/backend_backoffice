/**
 * Script para programar la optimización automática de la base de datos
 * Utiliza node-cron para ejecutar mantenimiento en horarios de bajo tráfico
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

// Definir rutas de scripts
const SCRIPTS_DIR = path.join(__dirname);
const DB_OPTIMIZE_SCRIPT = path.join(SCRIPTS_DIR, 'optimize-db-performance.js');
const ANALYZE_QUERIES_SCRIPT = path.join(SCRIPTS_DIR, 'optimize-common-queries.js');

// Guardar logs
const LOG_DIR = process.env.LOG_DIRECTORY || path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const OPTIMIZATION_LOG = path.join(LOG_DIR, 'db-optimization.log');
const ANALYZE_LOG = path.join(LOG_DIR, 'query-analysis.log');

console.log('🕒 Iniciando servicio de optimización programada de base de datos...');
console.log(`Logs disponibles en: ${LOG_DIR}`);

/**
 * Ejecuta el script de optimización de base de datos
 */
function runDatabaseOptimization() {
  console.log('Ejecutando optimización de base de datos...');
  
  // Crear un stream para el log
  const logStream = fs.createWriteStream(OPTIMIZATION_LOG, { flags: 'a' });
  const timestamp = new Date().toISOString();
  
  logStream.write(`\n[${timestamp}] Iniciando optimización de base de datos\n`);
  
  // Ejecutar script de optimización
  const optimize = exec(`node ${DB_OPTIMIZE_SCRIPT}`);
  
  optimize.stdout.on('data', (data) => {
    logStream.write(data);
  });
  
  optimize.stderr.on('data', (data) => {
    logStream.write(`ERROR: ${data}`);
  });
  
  optimize.on('close', (code) => {
    logStream.write(`[${new Date().toISOString()}] Optimización finalizada con código: ${code}\n`);
    logStream.end();
    
    // Notificar resultado
    if (code === 0) {
      console.log('✅ Optimización de base de datos completada exitosamente');
    } else {
      console.error(`❌ Optimización de base de datos falló con código: ${code}`);
    }
  });
}

/**
 * Ejecuta el script de análisis de consultas
 */
function runQueryAnalysis() {
  console.log('Ejecutando análisis de consultas...');
  
  // Crear un stream para el log
  const logStream = fs.createWriteStream(ANALYZE_LOG, { flags: 'a' });
  const timestamp = new Date().toISOString();
  
  logStream.write(`\n[${timestamp}] Iniciando análisis de consultas\n`);
  
  // Ejecutar script de análisis
  const analyze = exec(`node ${ANALYZE_QUERIES_SCRIPT}`);
  
  analyze.stdout.on('data', (data) => {
    logStream.write(data);
  });
  
  analyze.stderr.on('data', (data) => {
    logStream.write(`ERROR: ${data}`);
  });
  
  analyze.on('close', (code) => {
    logStream.write(`[${new Date().toISOString()}] Análisis finalizado con código: ${code}\n`);
    logStream.end();
    
    // Notificar resultado
    if (code === 0) {
      console.log('✅ Análisis de consultas completado exitosamente');
    } else {
      console.error(`❌ Análisis de consultas falló con código: ${code}`);
    }
  });
}

/**
 * Verifica la conexión a la base de datos
 */
async function checkDatabaseConnection() {
  console.log('Verificando conexión a la base de datos...');
  
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    await pgClient.connect();
    const result = await pgClient.query('SELECT 1');
    await pgClient.end();
    
    if (result.rows.length > 0) {
      console.log('✅ Conexión a base de datos exitosa');
      return true;
    }
    
    console.error('❌ Conexión a base de datos fallida: sin resultados');
    return false;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    return false;
  }
}

// Programar tareas usando node-cron

// 1. Optimización diaria (ejecutar a las 3:00 AM)
cron.schedule('0 3 * * *', async () => {
  console.log('⏰ Ejecutando tarea programada: optimización diaria');
  
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    runDatabaseOptimization();
  } else {
    console.error('No se puede ejecutar la optimización: base de datos no disponible');
  }
}, {
  scheduled: true,
  timezone: "America/Mexico_City" // Ajustar a zona horaria deseada
});

// 2. Actualización de estadísticas cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Ejecutando tarea programada: actualización de estadísticas');
  
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await pgClient.connect();
    
    // Actualizar estadísticas para tablas principales
    await pgClient.query('ANALYZE operators');
    await pgClient.query('ANALYZE activities');
    await pgClient.query('ANALYZE branches');
    
    console.log('✅ Estadísticas actualizadas correctamente');
  } catch (error) {
    console.error('❌ Error al actualizar estadísticas:', error.message);
  } finally {
    await pgClient.end();
  }
}, {
  scheduled: true,
  timezone: "America/Mexico_City"
});

// 3. Análisis de consultas semanal (domingo a las 4:00 AM)
cron.schedule('0 4 * * 0', async () => {
  console.log('⏰ Ejecutando tarea programada: análisis semanal de consultas');
  
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    runQueryAnalysis();
  } else {
    console.error('No se puede ejecutar el análisis: base de datos no disponible');
  }
}, {
  scheduled: true,
  timezone: "America/Mexico_City"
});

// Ejecutar optimización inmediata al iniciar (solo si es hora de bajo tráfico)
const currentHour = new Date().getHours();
if (currentHour >= 1 && currentHour <= 5) {
  console.log('Ejecutando optimización inicial (hora de bajo tráfico)');
  checkDatabaseConnection().then(isConnected => {
    if (isConnected) {
      runDatabaseOptimization();
    }
  });
}

console.log('✅ Servicio de optimización programada iniciado');
console.log('Optimización diaria: 3:00 AM');
console.log('Actualización de estadísticas: cada 6 horas');
console.log('Análisis de consultas: domingo 4:00 AM');

// Mantener el proceso vivo
process.stdin.resume(); 