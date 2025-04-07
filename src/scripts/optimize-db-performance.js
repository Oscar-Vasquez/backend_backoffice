/**
 * Script para optimizar el rendimiento de la base de datos
 * Este script enfoca las optimizaciones en las áreas más críticas
 */

const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
require('dotenv').config();

async function optimizeDatabasePerformance() {
  console.log('🚀 Iniciando optimización de rendimiento de la base de datos...');
  const startTime = Date.now();
  
  // Crear cliente PostgreSQL directo
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    await pgClient.connect();
    
    // 1. Mantener solo los índices críticos
    console.log('\n📊 Paso 1: Optimizando índices...');
    
    // Lista de índices críticos para mantener
    const criticalIndexes = [
      { table: 'operators', name: 'operators_pkey' },
      { table: 'operators', name: 'operators_email_key' },
      { table: 'operators', name: 'idx_operators_branch_role_status' },
      { table: 'activities', name: 'activities_pkey' },
      { table: 'activities', name: 'idx_activities_operator_created' }
    ];
    
    // Obtener todos los índices actuales
    const indexesQuery = `
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('operators', 'activities')
      AND schemaname = 'public'
    `;
    
    const indexesResult = await pgClient.query(indexesQuery);
    console.log(`Índices actuales: ${indexesResult.rows.length}`);
    
    // Crear solo los índices críticos que faltan
    for (const index of criticalIndexes) {
      // Verificar si el índice ya existe
      const exists = indexesResult.rows.some(row => 
        row.tablename === index.table && row.indexname === index.name
      );
      
      if (!exists) {
        // Crear índices específicos según su nombre
        if (index.name === 'idx_operators_branch_role_status') {
          console.log(`Creando índice ${index.name}...`);
          await pgClient.query(`
            CREATE INDEX IF NOT EXISTS "${index.name}" 
            ON "operators" ("branch_id", "role", "status")
          `);
        } else if (index.name === 'idx_activities_operator_created') {
          console.log(`Creando índice ${index.name}...`);
          await pgClient.query(`
            CREATE INDEX IF NOT EXISTS "${index.name}" 
            ON "activities" ("operator_id", "created_at")
          `);
        }
      } else {
        console.log(`Índice ${index.name} ya existe`);
      }
    }
    
    // 2. Optimizar tablas
    console.log('\n📊 Paso 2: Optimizando tablas...');
    
    // Actualizar estadísticas para el planificador de consultas
    console.log('Actualizando estadísticas para operadores...');
    await pgClient.query('ANALYZE operators');
    
    console.log('Actualizando estadísticas para actividades...');
    await pgClient.query('ANALYZE activities');
    
    // Vacuum analizar tablas para optimizar almacenamiento y rendimiento
    console.log('Ejecutando vacuum en operadores...');
    await pgClient.query('VACUUM ANALYZE operators');
    
    console.log('Ejecutando vacuum en actividades...');
    await pgClient.query('VACUUM ANALYZE activities');
    
    // 3. Optimizar caché de consultas
    console.log('\n📊 Paso 3: Optimizando caché de consultas...');
    await pgClient.query('DISCARD ALL');
    console.log('Caché de consultas limpiada');
    
    // 4. Verificar y configurar parámetros de conexión
    console.log('\n📊 Paso 4: Verificando configuración de conexión...');
    
    // Verificar los parámetros actuales
    const connectionParams = [
      'work_mem', 
      'maintenance_work_mem', 
      'random_page_cost', 
      'effective_io_concurrency'
    ];
    
    for (const param of connectionParams) {
      const result = await pgClient.query(`SHOW ${param}`);
      console.log(`${param}: ${result.rows[0][param]}`);
    }
    
    // 5. Ejecutar consultas de precalentamiento
    console.log('\n📊 Paso 5: Ejecutando consultas de precalentamiento...');
    
    // Precalentar tabla de operadores
    console.log('Precalentando tabla de operadores...');
    await pgClient.query(`
      SELECT o.id, o.email, o.first_name, o.last_name, o.role, o.status, o.branch_id
      FROM operators o
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    
    // Precalentar tabla de actividades
    console.log('Precalentando tabla de actividades...');
    await pgClient.query(`
      SELECT a.id, a.operator_id, a.type, a.action, a.description, a.created_at
      FROM activities a
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    
    // Precalentar join común
    console.log('Precalentando consulta con join...');
    await pgClient.query(`
      SELECT o.id, o.email, o.first_name, o.last_name, b.name as branch_name
      FROM operators o
      LEFT JOIN branches b ON o.branch_id = b.id
      LIMIT 100
    `);
    
    console.log(`\n🎉 Optimización completada en ${(Date.now() - startTime) / 1000} segundos`);
    console.log('Recomendaciones:');
    console.log('1. Reinicia el servidor para aplicar todas las optimizaciones');
    console.log('2. Considera usar la caché para reduccir consultas a la base de datos');
    console.log('3. Implementa un monitoreo de consultas lentas para identificar y optimizar puntos críticos');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await pgClient.end();
    console.log('Conexión cerrada');
  }
}

optimizeDatabasePerformance(); 