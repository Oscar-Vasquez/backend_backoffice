const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runAllOptimizations() {
  console.log('🚀 Iniciando optimizaciones de la base de datos...');
  const startTime = Date.now();
  const prisma = new PrismaClient();
  
  // Crear una conexión directa a PostgreSQL para comandos que no pueden ejecutarse en transacciones
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    await prisma.$connect();
    await pgClient.connect();
    
    // 1. Aplicar índices
    console.log('\n📊 Paso 1: Aplicando índices...');
    
    // Ejecutar cada comando SQL por separado
    console.log('Creando índice idx_operators_branch_role_status...');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_operators_branch_role_status" ON "operators" ("branch_id", "role", "status")');
    
    console.log('Creando índice idx_operators_name...');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_operators_name" ON "operators" ("first_name", "last_name")');
    
    console.log('Creando índice idx_operators_created_at...');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_operators_created_at" ON "operators" ("created_at")');
    
    console.log('Creando índice idx_activities_operator_created...');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_activities_operator_created" ON "activities" ("operator_id", "created_at")');
    
    // Intentar crear índices de texto si la extensión pg_trgm está disponible
    try {
      console.log('Habilitando extensión pg_trgm...');
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      
      console.log('Creando índice idx_operators_first_name_trigram...');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_operators_first_name_trigram" ON "operators" USING gin (first_name gin_trgm_ops)');
      
      console.log('Creando índice idx_operators_last_name_trigram...');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_operators_last_name_trigram" ON "operators" USING gin (last_name gin_trgm_ops)');
    } catch (error) {
      console.warn('⚠️ No se pudieron crear los índices de texto:', error.message);
    }
    
    console.log('✅ Índices aplicados correctamente');
    
    // 2. Optimizar tablas
    console.log('\n📊 Paso 2: Optimizando tablas...');
    
    // Analizar tablas
    console.log('Analizando tabla de operadores...');
    await pgClient.query('ANALYZE operators');
    
    console.log('Analizando tabla de actividades...');
    await pgClient.query('ANALYZE activities');
    
    // Vaciar (vacuum) las tablas
    console.log('Ejecutando VACUUM en tabla de operadores...');
    await pgClient.query('VACUUM ANALYZE operators');
    
    console.log('Ejecutando VACUUM en tabla de actividades...');
    await pgClient.query('VACUUM ANALYZE activities');
    
    console.log('✅ Tablas optimizadas correctamente');
    
    // 3. Verificar configuración de la base de datos
    console.log('\n📊 Paso 3: Verificando configuración de la base de datos...');
    
    // Verificar max_connections
    const maxConnectionsResult = await pgClient.query('SHOW max_connections');
    console.log(`Max connections: ${maxConnectionsResult.rows[0].max_connections}`);
    
    // Verificar work_mem
    const workMemResult = await pgClient.query('SHOW work_mem');
    console.log(`Work memory: ${workMemResult.rows[0].work_mem}`);
    
    // Verificar shared_buffers
    const sharedBuffersResult = await pgClient.query('SHOW shared_buffers');
    console.log(`Shared buffers: ${sharedBuffersResult.rows[0].shared_buffers}`);
    
    console.log('✅ Verificación de configuración completada');
    
    // 4. Verificar índices
    console.log('\n📊 Paso 4: Verificando índices...');
    const indexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'operators'
    `;
    const indexesResult = await pgClient.query(indexesQuery);
    console.log('Índices encontrados:');
    indexesResult.rows.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    console.log('✅ Verificación de índices completada');
    
    // 5. Actualizar estadísticas
    console.log('\n📊 Paso 5: Actualizando estadísticas...');
    await pgClient.query('ANALYZE');
    console.log('✅ Estadísticas actualizadas correctamente');
    
    console.log(`\n🎉 Todas las optimizaciones completadas en ${(Date.now() - startTime) / 1000} segundos`);
    
  } catch (error) {
    console.error('❌ Error durante las optimizaciones:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

runAllOptimizations(); 