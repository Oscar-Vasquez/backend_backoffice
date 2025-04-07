/**
 * Script para programar tareas de mantenimiento de la base de datos
 * Este script se ejecuta como un servicio en segundo plano y programa
 * tareas de mantenimiento según la configuración en .env
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Inicializar cliente Prisma
const prisma = new PrismaClient();

// Configuración de cron
const timezone = process.env.DB_MAINTENANCE_TIMEZONE || 'America/Mexico_City';
const scheduleOptimize = process.env.DB_MAINTENANCE_SCHEDULE_OPTIMIZE || '0 3 * * *';
const scheduleStats = process.env.DB_MAINTENANCE_SCHEDULE_STATS || '0 */6 * * *';
const scheduleAnalyze = process.env.DB_MAINTENANCE_SCHEDULE_ANALYZE || '0 4 * * 0';

// Directorio de logs
const logDir = process.env.LOG_DIRECTORY || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Función para log con timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(formattedMessage);
  
  // Escribir en archivo de log
  const logFile = path.join(logDir, `db-maintenance-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, formattedMessage + '\n');
}

// Función para obtener cliente PostgreSQL
async function getPgClient() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

// Tarea 1: Optimización de tablas
async function optimizeTables() {
  log('Iniciando optimización de tablas');
  
  let pgClient = null;
  
  try {
    pgClient = await getPgClient();
    
    // Lista de tablas a optimizar (principales, con más uso)
    const mainTables = ['operators', 'activities', 'branches'];
    
    // Obtener todas las tablas si es necesario
    const allTablesResult = await pgClient.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const allTables = allTablesResult.rows.map(row => row.tablename);
    
    // Primero optimizar tablas principales
    for (const table of mainTables) {
      if (allTables.includes(table)) {
        log(`Optimizando tabla ${table}...`);
        
        // VACUUM ANALYZE para optimizar espacio y actualizar estadísticas
        await pgClient.query(`VACUUM ANALYZE ${table}`);
        log(`✅ Tabla ${table} optimizada`);
      }
    }
    
    // Registrar estadísticas de tablas
    const statsQuery = `
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;
    
    const statsResult = await pgClient.query(statsQuery);
    
    log('Estadísticas actuales de las tablas:');
    statsResult.rows.forEach(row => {
      log(`- ${row.table_name}: ${row.row_count} filas, ${row.dead_rows} filas muertas, último VACUUM: ${row.last_vacuum}, último ANALYZE: ${row.last_analyze}`);
    });
    
    log('Optimización de tablas completada');
  } catch (error) {
    log(`Error al optimizar tablas: ${error.message}`, 'error');
  } finally {
    if (pgClient) await pgClient.end();
  }
}

// Tarea 2: Actualización de estadísticas
async function updateStats() {
  log('Iniciando actualización de estadísticas');
  
  let pgClient = null;
  
  try {
    pgClient = await getPgClient();
    
    // Actualizar estadísticas de todas las tablas
    await pgClient.query('ANALYZE');
    log('✅ Estadísticas actualizadas para todas las tablas');
    
    // Limpiar caché de consultas
    await pgClient.query('DISCARD ALL');
    log('✅ Caché de consultas limpiada');
    
  } catch (error) {
    log(`Error al actualizar estadísticas: ${error.message}`, 'error');
  } finally {
    if (pgClient) await pgClient.end();
  }
}

// Tarea 3: Análisis completo de base de datos
async function analyzeDatabase() {
  log('Iniciando análisis completo de la base de datos');
  
  let pgClient = null;
  
  try {
    pgClient = await getPgClient();
    
    // Verificar y actualizar índices si es necesario
    if (process.env.DB_MAINTENANCE_AUTO_INDEX === 'true') {
      log('Verificando índices necesarios...');
      
      // Verificar índice para búsqueda de operadores
      const operatorsSearchIndex = await pgClient.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'operators' AND indexdef LIKE '%gin%'
      `);
      
      if (operatorsSearchIndex.rows.length === 0) {
        log('Creando índice para búsqueda de texto en operadores...');
        try {
          // Verificar si la extensión está disponible
          await pgClient.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
          
          // Crear índices para búsqueda de texto
          await pgClient.query('CREATE INDEX IF NOT EXISTS idx_operators_first_name_trigram ON operators USING gin (first_name gin_trgm_ops)');
          await pgClient.query('CREATE INDEX IF NOT EXISTS idx_operators_last_name_trigram ON operators USING gin (last_name gin_trgm_ops)');
          await pgClient.query('CREATE INDEX IF NOT EXISTS idx_operators_email_trigram ON operators USING gin (email gin_trgm_ops)');
          
          log('✅ Índices de búsqueda creados');
        } catch (error) {
          log(`No se pudieron crear índices de texto: ${error.message}`, 'error');
        }
      }
      
      // Verificar índice para actividades por operador
      const activitiesOperatorIndex = await pgClient.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'activities' AND indexdef LIKE '%operator_id%'
      `);
      
      if (activitiesOperatorIndex.rows.length === 0) {
        log('Creando índice para actividades por operador...');
        await pgClient.query('CREATE INDEX IF NOT EXISTS idx_activities_operator_id ON activities(operator_id, created_at DESC)');
        log('✅ Índice de actividades por operador creado');
      }
    }
    
    // Analizar consultas lentas
    const slowQueriesResult = await pgClient.query(`
      SELECT query, calls, total_time, mean_time
      FROM pg_stat_statements
      WHERE mean_time > 1000
      ORDER BY mean_time DESC
      LIMIT 10
    `).catch(() => ({ rows: [] }));
    
    if (slowQueriesResult.rows.length > 0) {
      log(`Se encontraron ${slowQueriesResult.rows.length} consultas lentas:`);
      slowQueriesResult.rows.forEach((row, index) => {
        log(`${index + 1}. Tiempo medio: ${row.mean_time}ms, Llamadas: ${row.calls}`);
        log(`Query: ${row.query.substring(0, 100)}...`);
      });
    } else {
      log('No se encontraron consultas lentas o pg_stat_statements no está habilitado');
    }
    
    log('Análisis completo de la base de datos finalizado');
  } catch (error) {
    log(`Error al analizar la base de datos: ${error.message}`, 'error');
  } finally {
    if (pgClient) await pgClient.end();
  }
}

// Verificar conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    log('Verificando conexión a la base de datos...');
    
    // Usar Prisma para verificar conexión
    await prisma.$queryRaw`SELECT 1`;
    
    log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    log(`❌ Error al conectar a la base de datos: ${error.message}`, 'error');
    return false;
  }
}

// Función principal
async function main() {
  log('Iniciando servicio de mantenimiento de base de datos');
  
  // Verificar conexión
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    log('No se pudo establecer conexión a la base de datos. Saliendo...', 'error');
    process.exit(1);
  }
  
  // Programar tareas
  log(`Programando tareas con timezone: ${timezone}`);
  
  // Tarea 1: Optimización de tablas (por defecto: 3am todos los días)
  log(`Programando optimización de tablas: ${scheduleOptimize}`);
  cron.schedule(scheduleOptimize, async () => {
    log('Ejecutando tarea programada: Optimización de tablas');
    await optimizeTables();
  }, { timezone });
  
  // Tarea 2: Actualización de estadísticas (por defecto: cada 6 horas)
  log(`Programando actualización de estadísticas: ${scheduleStats}`);
  cron.schedule(scheduleStats, async () => {
    log('Ejecutando tarea programada: Actualización de estadísticas');
    await updateStats();
  }, { timezone });
  
  // Tarea 3: Análisis completo (por defecto: 4am los domingos)
  log(`Programando análisis completo: ${scheduleAnalyze}`);
  cron.schedule(scheduleAnalyze, async () => {
    log('Ejecutando tarea programada: Análisis completo');
    await analyzeDatabase();
  }, { timezone });
  
  // Ejecutar inicialmente para verificar todo
  log('Ejecutando tareas iniciales para verificar configuración...');
  await updateStats();
  
  log('Servicio de mantenimiento de base de datos iniciado y ejecutándose');
}

// Iniciar el programa
main().catch(error => {
  log(`Error al iniciar el servicio: ${error.message}`, 'error');
  process.exit(1);
}); 