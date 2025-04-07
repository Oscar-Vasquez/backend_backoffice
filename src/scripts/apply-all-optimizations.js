const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyAllOptimizations() {
  console.log('🚀 Iniciando aplicación de todas las optimizaciones...');
  const startTime = Date.now();
  
  // Crear cliente Prisma
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Crear cliente PostgreSQL directo
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    await prisma.$connect();
    await pgClient.connect();
    
    // 1. Aplicar índices optimizados
    console.log('\n📊 Paso 1: Aplicando índices optimizados...');
    
    // Índices para operadores
    console.log('Creando índices para operadores...');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_branch_role_status" ON "operators" ("branch_id", "role", "status")');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_name" ON "operators" ("first_name", "last_name")');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_created_at" ON "operators" ("created_at")');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_email" ON "operators" ("email")');
    
    // Índices para actividades
    console.log('Creando índices para actividades...');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_activities_operator_created" ON "activities" ("operator_id", "created_at")');
    await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_activities_type_action" ON "activities" ("type", "action")');
    
    // Intentar crear índices de texto
    try {
      console.log('Habilitando extensión pg_trgm...');
      await pgClient.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      
      console.log('Creando índices de texto...');
      await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_first_name_trigram" ON "operators" USING gin (first_name gin_trgm_ops)');
      await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_last_name_trigram" ON "operators" USING gin (last_name gin_trgm_ops)');
      await pgClient.query('CREATE INDEX IF NOT EXISTS "idx_operators_email_trigram" ON "operators" USING gin (email gin_trgm_ops)');
    } catch (error) {
      console.warn('⚠️ No se pudieron crear los índices de texto:', error.message);
    }
    
    console.log('✅ Índices aplicados correctamente');
    
    // 2. Optimizar tablas
    console.log('\n📊 Paso 2: Optimizando tablas...');
    
    // Analizar tablas
    console.log('Analizando tablas...');
    await pgClient.query('ANALYZE operators');
    await pgClient.query('ANALYZE activities');
    
    // Vaciar (vacuum) las tablas
    console.log('Ejecutando VACUUM en tablas...');
    await pgClient.query('VACUUM ANALYZE operators');
    await pgClient.query('VACUUM ANALYZE activities');
    
    console.log('✅ Tablas optimizadas correctamente');
    
    // 3. Verificar y optimizar configuración
    console.log('\n📊 Paso 3: Verificando y optimizando configuración...');
    
    // Verificar parámetros críticos
    const params = [
      'max_connections',
      'shared_buffers',
      'work_mem',
      'maintenance_work_mem',
      'effective_cache_size',
      'random_page_cost',
      'statement_timeout'
    ];
    
    console.log('Parámetros actuales:');
    for (const param of params) {
      try {
        const result = await pgClient.query(`SHOW ${param}`);
        console.log(`${param}: ${result.rows[0][param]}`);
      } catch (error) {
        console.log(`${param}: No disponible`);
      }
    }
    
    // 4. Optimizar caché de consultas
    console.log('\n📊 Paso 4: Optimizando caché de consultas...');
    await pgClient.query('DISCARD ALL');
    console.log('✅ Caché de consultas limpiada');
    
    // 5. Verificar URL de conexión
    console.log('\n📊 Paso 5: Verificando URL de conexión...');
    const dbUrl = process.env.DATABASE_URL || '';
    const hasConnectionParams = dbUrl.includes('connection_limit') || 
                               dbUrl.includes('pool_timeout') || 
                               dbUrl.includes('socket_timeout');
    
    if (!hasConnectionParams) {
      console.log('⚠️ La URL de conexión no tiene parámetros de optimización. Considera añadir:');
      console.log('  - connection_limit: Limita el número de conexiones por cliente');
      console.log('  - pool_timeout: Tiempo máximo de espera para obtener una conexión del pool');
      console.log('  - socket_timeout: Tiempo máximo de inactividad para una conexión');
    } else {
      console.log('✅ La URL de conexión tiene parámetros de optimización');
    }
    
    // 6. Verificar variables de entorno
    console.log('\n📊 Paso 6: Verificando variables de entorno...');
    const requiredVars = [
      'PRISMA_CONNECTION_LIMIT',
      'PRISMA_QUERY_TIMEOUT',
      'PRISMA_TRANSACTION_TIMEOUT',
      'PRISMA_SLOW_QUERY_THRESHOLD',
      'DB_MAX_CONNECTIONS',
      'DB_IDLE_TIMEOUT',
      'DB_QUERY_TIMEOUT'
    ];
    
    let missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      console.log('⚠️ Faltan las siguientes variables de entorno recomendadas:');
      missingVars.forEach(v => console.log(`  - ${v}`));
    } else {
      console.log('✅ Todas las variables de entorno recomendadas están configuradas');
    }
    
    // 7. Ejecutar consultas de prueba
    console.log('\n📊 Paso 7: Ejecutando consultas de prueba...');
    
    // Consulta simple
    console.log('Ejecutando consulta simple...');
    const simpleStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Consulta simple completada en ${Date.now() - simpleStartTime}ms`);
    
    // Consulta de operadores
    console.log('Ejecutando consulta de operadores...');
    const operatorsStartTime = Date.now();
    const operators = await prisma.operators.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        branches: {
          select: {
            name: true
          }
        }
      }
    });
    console.log(`✅ Consulta de operadores completada en ${Date.now() - operatorsStartTime}ms (${operators.length} resultados)`);
    
    console.log(`\n🎉 Todas las optimizaciones aplicadas en ${(Date.now() - startTime) / 1000} segundos`);
    
    // 8. Reiniciar el servidor (opcional)
    console.log('\n📊 ¿Deseas reiniciar el servidor para aplicar todas las optimizaciones? (s/n)');
    console.log('Para reiniciar manualmente, ejecuta: npm run start:dev');
    
  } catch (error) {
    console.error('❌ Error durante las optimizaciones:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

applyAllOptimizations(); 