const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
require('dotenv').config();

async function optimizePrisma() {
  console.log('🚀 Iniciando optimización de Prisma...');
  
  // Crear cliente Prisma
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Crear cliente PostgreSQL directo para operaciones que Prisma no puede hacer
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    await prisma.$connect();
    await pgClient.connect();
    
    // 1. Verificar y actualizar estadísticas
    console.log('\n📊 Actualizando estadísticas de la base de datos...');
    await pgClient.query('ANALYZE operators');
    await pgClient.query('ANALYZE activities');
    console.log('✅ Estadísticas actualizadas');
    
    // 2. Verificar índices
    console.log('\n📊 Verificando índices...');
    const indexesQuery = `
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('operators', 'activities')
      ORDER BY tablename, indexname
    `;
    const indexesResult = await pgClient.query(indexesQuery);
    
    console.log('Índices encontrados:');
    indexesResult.rows.forEach(idx => {
      console.log(`- ${idx.tablename}.${idx.indexname}: ${idx.indexdef}`);
    });
    
    // 3. Verificar rendimiento de consultas comunes
    console.log('\n📊 Verificando rendimiento de consultas comunes...');
    
    // Consulta de operadores
    console.log('Probando consulta de operadores...');
    const operatorsStartTime = Date.now();
    const operators = await prisma.operators.findMany({
      take: 5,
      include: {
        branches: {
          select: {
            name: true
          }
        }
      }
    });
    console.log(`✅ Consulta de operadores completada en ${Date.now() - operatorsStartTime}ms`);
    console.log(`Operadores recuperados: ${operators.length}`);
    
    // Consulta de actividades
    console.log('Probando consulta de actividades...');
    const activitiesStartTime = Date.now();
    const activities = await prisma.activities.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc'
      }
    });
    console.log(`✅ Consulta de actividades completada en ${Date.now() - activitiesStartTime}ms`);
    console.log(`Actividades recuperadas: ${activities.length}`);
    
    // 4. Optimizar la caché de consultas de PostgreSQL
    console.log('\n📊 Optimizando caché de consultas...');
    await pgClient.query('DISCARD ALL');
    console.log('✅ Caché de consultas limpiada');
    
    // 5. Verificar configuración de PostgreSQL
    console.log('\n📊 Verificando configuración de PostgreSQL...');
    const configQueries = [
      'shared_buffers',
      'work_mem',
      'maintenance_work_mem',
      'effective_cache_size',
      'max_connections'
    ];
    
    for (const param of configQueries) {
      const result = await pgClient.query(`SHOW ${param}`);
      console.log(`${param}: ${result.rows[0][param]}`);
    }
    
    // 6. Sugerencias de optimización
    console.log('\n📊 Sugerencias de optimización:');
    console.log('1. Asegúrate de que tu archivo .env tenga configurado DATABASE_URL y DIRECT_URL');
    console.log('2. Considera aumentar work_mem si tienes suficiente RAM disponible');
    console.log('3. Verifica que los índices necesarios estén creados para tus consultas más frecuentes');
    console.log('4. Utiliza includeSelect en lugar de include cuando sea posible para reducir datos transferidos');
    console.log('5. Considera implementar caché para consultas frecuentes que no cambian a menudo');
    
    console.log('\n🎉 Optimización de Prisma completada');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

optimizePrisma(); 