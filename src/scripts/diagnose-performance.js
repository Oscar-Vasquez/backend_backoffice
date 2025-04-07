const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
require('dotenv').config();

async function diagnosePerformance() {
  console.log('🔍 Iniciando diagnóstico de rendimiento...');
  
  // Crear cliente Prisma con logging
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
    
    // 1. Verificar índices en la tabla de operadores
    console.log('\n📊 Verificando índices en la tabla de operadores...');
    const indexesResult = await pgClient.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'operators'
    `);
    
    console.log(`Índices encontrados: ${indexesResult.rows.length}`);
    indexesResult.rows.forEach(row => {
      console.log(`- ${row.indexname}: ${row.indexdef}`);
    });
    
    // 2. Analizar consultas lentas
    console.log('\n📊 Analizando consultas lentas...');
    const slowQueriesResult = await pgClient.query(`
      SELECT query, calls, total_time, mean_time, rows
      FROM pg_stat_statements
      WHERE query ILIKE '%operators%'
      ORDER BY mean_time DESC
      LIMIT 5;
    `).catch(err => {
      console.log('⚠️ No se pudo obtener estadísticas de consultas lentas. Es posible que la extensión pg_stat_statements no esté habilitada.');
      return { rows: [] };
    });
    
    if (slowQueriesResult.rows.length > 0) {
      console.log('Consultas lentas encontradas:');
      slowQueriesResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Tiempo medio: ${row.mean_time}ms, Llamadas: ${row.calls}`);
        console.log(`Query: ${row.query.substring(0, 200)}...`);
      });
    } else {
      console.log('No se encontraron consultas lentas o no hay suficientes datos estadísticos.');
    }
    
    // 3. Probar rendimiento de consultas específicas
    console.log('\n📊 Probando rendimiento de consultas específicas...');
    
    // 3.1 Consulta de listado de operadores
    console.log('\nPrueba 1: Listado de operadores');
    const operatorsListStartTime = Date.now();
    const operatorsResult = await prisma.operators.findMany({
      take: 20,
      include: {
        branches: {
          select: {
            name: true
          }
        }
      }
    });
    const operatorsListTime = Date.now() - operatorsListStartTime;
    console.log(`✅ Consulta completada en ${operatorsListTime}ms, ${operatorsResult.length} resultados`);
    
    // 3.2 Consulta de actividades de operadores
    console.log('\nPrueba 2: Actividades de operadores');
    if (operatorsResult.length > 0) {
      const operatorId = operatorsResult[0].id;
      const activitiesStartTime = Date.now();
      const activitiesResult = await prisma.activities.findMany({
        where: { operator_id: operatorId },
        take: 20,
        orderBy: { created_at: 'desc' }
      });
      const activitiesTime = Date.now() - activitiesStartTime;
      console.log(`✅ Consulta completada en ${activitiesTime}ms, ${activitiesResult.length} resultados`);
    } else {
      console.log('⚠️ No hay operadores para probar consulta de actividades');
    }
    
    // 4. Verificar configuración de conexión
    console.log('\n📊 Verificando configuración de conexión...');
    console.log(`DATABASE_URL tiene parámetros de optimización: ${process.env.DATABASE_URL.includes('connection_limit')}`);
    console.log(`PRISMA_CONNECTION_LIMIT: ${process.env.PRISMA_CONNECTION_LIMIT || 'no configurado'}`);
    console.log(`PRISMA_QUERY_TIMEOUT: ${process.env.PRISMA_QUERY_TIMEOUT || 'no configurado'}`);
    
    // 5. Verificar estadísticas de la base de datos
    console.log('\n📊 Verificando estadísticas de la base de datos...');
    const dbStatsResult = await pgClient.query(`
      SELECT relname as table_name, 
             n_live_tup as row_count,
             pg_size_pretty(pg_total_relation_size(relid)) as total_size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `);
    
    console.log('Estadísticas de tablas:');
    dbStatsResult.rows.forEach(row => {
      console.log(`- ${row.table_name}: ${row.row_count} filas, tamaño: ${row.total_size}`);
    });
    
    // 6. Aplicar optimizaciones inmediatas
    console.log('\n📊 Aplicando optimizaciones inmediatas...');
    
    // 6.1 Actualizar estadísticas
    console.log('Actualizando estadísticas de la base de datos...');
    await pgClient.query('ANALYZE operators');
    await pgClient.query('ANALYZE activities');
    console.log('✅ Estadísticas actualizadas');
    
    // 6.2 Limpiar caché de consultas
    console.log('Limpiando caché de consultas...');
    await pgClient.query('DISCARD ALL');
    console.log('✅ Caché de consultas limpiada');
    
    // 7. Recomendaciones
    console.log('\n📊 Recomendaciones de optimización:');
    console.log('1. Asegúrate de que el servicio de caché esté correctamente configurado y funcionando');
    console.log('2. Verifica que las variables de entorno de optimización estén configuradas en el archivo .env');
    console.log('3. Considera agregar índices adicionales para las consultas más frecuentes');
    console.log('4. Utiliza consultas con select específico en lugar de include cuando sea posible');
    console.log('5. Implementa paginación en todas las consultas que devuelven múltiples resultados');
    console.log('6. Considera utilizar consultas nativas para operaciones críticas de rendimiento');
    
    console.log('\n🎉 Diagnóstico de rendimiento completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

diagnosePerformance(); 