const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function optimizePrismaConnection() {
  console.log('🚀 Iniciando optimización de la conexión de Prisma...');
  
  // Crear cliente Prisma con configuración optimizada
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Crear cliente PostgreSQL directo
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    const startTime = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Conexión establecida en ${connectionTime}ms`);
    
    await pgClient.connect();
    
    // 1. Verificar y optimizar la configuración de PostgreSQL
    console.log('\n📊 Verificando configuración de PostgreSQL...');
    
    // Verificar parámetros críticos
    const pgParams = [
      'max_connections',
      'shared_buffers',
      'work_mem',
      'maintenance_work_mem',
      'effective_cache_size',
      'max_worker_processes',
      'max_parallel_workers',
      'max_parallel_workers_per_gather',
      'random_page_cost',
      'effective_io_concurrency',
      'idle_in_transaction_session_timeout',
      'statement_timeout'
    ];
    
    console.log('Parámetros actuales:');
    for (const param of pgParams) {
      try {
        const result = await pgClient.query(`SHOW ${param}`);
        console.log(`${param}: ${result.rows[0][param]}`);
      } catch (error) {
        console.log(`${param}: No disponible`);
      }
    }
    
    // 2. Verificar la configuración de la URL de conexión
    console.log('\n📊 Verificando URL de conexión...');
    const dbUrl = process.env.DATABASE_URL || '';
    const hasConnectionParams = dbUrl.includes('connection_limit') || 
                               dbUrl.includes('pool_timeout') || 
                               dbUrl.includes('socket_timeout');
    
    if (!hasConnectionParams) {
      console.log('⚠️ La URL de conexión no tiene parámetros de optimización. Considera añadir:');
      console.log('  - connection_limit: Limita el número de conexiones por cliente');
      console.log('  - pool_timeout: Tiempo máximo de espera para obtener una conexión del pool');
      console.log('  - socket_timeout: Tiempo máximo de inactividad para una conexión');
      console.log('Ejemplo: postgresql://user:password@host:port/database?connection_limit=30&pool_timeout=20&socket_timeout=10');
    } else {
      console.log('✅ La URL de conexión tiene parámetros de optimización');
    }
    
    // 3. Verificar la configuración de Prisma
    console.log('\n📊 Verificando configuración de Prisma...');
    
    // Verificar si existe el archivo schema.prisma
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Verificar si tiene previewFeatures
      const hasPreviewFeatures = schemaContent.includes('previewFeatures');
      if (!hasPreviewFeatures) {
        console.log('⚠️ No se encontraron previewFeatures en schema.prisma. Considera añadir:');
        console.log('generator client {');
        console.log('  provider = "prisma-client-js"');
        console.log('  previewFeatures = ["interactiveTransactions"]');
        console.log('}');
      } else {
        console.log('✅ schema.prisma tiene previewFeatures configuradas');
      }
      
      // Verificar configuración del datasource
      const hasDirectUrl = schemaContent.includes('directUrl');
      if (!hasDirectUrl) {
        console.log('⚠️ No se encontró directUrl en schema.prisma. Considera añadir:');
        console.log('datasource db {');
        console.log('  provider = "postgresql"');
        console.log('  url      = env("DATABASE_URL")');
        console.log('  directUrl = env("DIRECT_URL")');
        console.log('}');
      } else {
        console.log('✅ schema.prisma tiene directUrl configurada');
      }
    } else {
      console.log('⚠️ No se encontró el archivo schema.prisma');
    }
    
    // 4. Probar rendimiento de consultas básicas
    console.log('\n📊 Probando rendimiento de consultas básicas...');
    
    // Consulta simple
    console.log('Ejecutando consulta simple...');
    const simpleStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Consulta simple completada en ${Date.now() - simpleStartTime}ms`);
    
    // Consulta con JOIN
    console.log('Ejecutando consulta con JOIN...');
    const joinStartTime = Date.now();
    const operatorsQuery = await prisma.operators.findMany({
      take: 5,
      include: {
        branches: {
          select: {
            name: true
          }
        }
      }
    });
    console.log(`✅ Consulta con JOIN completada en ${Date.now() - joinStartTime}ms`);
    
    // 5. Sugerencias de optimización
    console.log('\n📊 Sugerencias de optimización para Prisma:');
    console.log('1. Usa select en lugar de include cuando sea posible para reducir datos transferidos');
    console.log('2. Implementa caché para consultas frecuentes');
    console.log('3. Usa transacciones interactivas para operaciones complejas');
    console.log('4. Considera usar consultas nativas ($queryRaw) para operaciones críticas de rendimiento');
    console.log('5. Asegúrate de que los índices necesarios estén creados para tus consultas más frecuentes');
    
    // 6. Aplicar optimizaciones inmediatas
    console.log('\n📊 Aplicando optimizaciones inmediatas...');
    
    // Actualizar estadísticas
    console.log('Actualizando estadísticas de la base de datos...');
    await pgClient.query('ANALYZE');
    console.log('✅ Estadísticas actualizadas');
    
    // Limpiar caché de consultas
    console.log('Limpiando caché de consultas...');
    await pgClient.query('DISCARD ALL');
    console.log('✅ Caché de consultas limpiada');
    
    console.log('\n🎉 Optimización de la conexión de Prisma completada');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

optimizePrismaConnection(); 