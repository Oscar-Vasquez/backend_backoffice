/**
 * Script para analizar y optimizar las consultas más comunes
 * Este script se enfoca en analizar las consultas utilizadas en operadores y actividades
 */

const { Client } = require('pg');
require('dotenv').config();

async function analyzeAndOptimizeQueries() {
  console.log('🔍 Iniciando análisis y optimización de consultas comunes...');
  const startTime = Date.now();

  // Crear cliente PostgreSQL directo
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    await pgClient.connect();

    // 1. Explicar consultas comunes de operadores
    console.log('\n📊 Analizando consultas de operadores...');
    
    // Consulta común 1: Buscar operadores con filtros
    console.log('\n🔹 Consulta: Obtener operadores con filtros');
    const operatorQuery = `
      EXPLAIN ANALYZE 
      SELECT o.* 
      FROM operators o
      WHERE o.status = 'active' 
      AND o.branch_id = '123e4567-e89b-12d3-a456-426614174000'
      ORDER BY o.created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    const operatorQueryResult = await pgClient.query(operatorQuery);
    console.log(operatorQueryResult.rows.map(row => row['QUERY PLAN']).join('\n'));
    
    // Consulta común 2: Buscar operadores por texto
    console.log('\n🔹 Consulta: Buscar operadores por texto');
    const searchQuery = `
      EXPLAIN ANALYZE
      SELECT o.*
      FROM operators o
      WHERE (o.first_name ILIKE $1 OR o.last_name ILIKE $1 OR o.email ILIKE $1)
      ORDER BY o.created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    const searchParams = ['%test%'];
    const searchQueryResult = await pgClient.query(searchQuery, searchParams);
    console.log(searchQueryResult.rows.map(row => row['QUERY PLAN']).join('\n'));
    
    // 2. Explicar consultas comunes de actividades
    console.log('\n📊 Analizando consultas de actividades...');
    
    // Consulta de actividades por operador
    console.log('\n🔹 Consulta: Obtener actividades de un operador');
    const activitiesQuery = `
      EXPLAIN ANALYZE
      SELECT a.*
      FROM activities a
      WHERE a.operator_id = '123e4567-e89b-12d3-a456-426614174000'
      ORDER BY a.created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    const activitiesQueryResult = await pgClient.query(activitiesQuery);
    console.log(activitiesQueryResult.rows.map(row => row['QUERY PLAN']).join('\n'));
    
    // 3. Sugerir optimizaciones
    console.log('\n📊 Generando sugerencias de optimización...');
    
    // Índices de texto para mejorar búsquedas
    console.log('\n🔹 Verificando índices de búsqueda por texto...');
    const textSearchIndexes = await pgClient.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE tablename = 'operators' AND
      (indexdef LIKE '%first_name%' OR indexdef LIKE '%last_name%' OR indexdef LIKE '%email%')
    `);
    
    if (textSearchIndexes.rows.length === 0) {
      console.log('⚠️ No se encontraron índices para búsqueda de texto en operadores');
      console.log('Sugerencia: Crear índice GIN para búsqueda de texto:');
      console.log(`
        CREATE INDEX idx_operators_text_search 
        ON operators USING gin((
          to_tsvector('simple', coalesce(first_name, '')) || 
          to_tsvector('simple', coalesce(last_name, '')) || 
          to_tsvector('simple', coalesce(email, ''))
        ));
      `);
    } else {
      console.log('✅ Se encontraron índices para búsqueda de texto:');
      textSearchIndexes.rows.forEach(row => {
        console.log(`- ${row.indexname}: ${row.indexdef}`);
      });
    }
    
    // Verificar índice para consultas de actividades por operador
    console.log('\n🔹 Verificando índice para actividades por operador...');
    const activitiesIndex = await pgClient.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE tablename = 'activities' AND indexdef LIKE '%operator_id%'
    `);
    
    if (activitiesIndex.rows.length === 0) {
      console.log('⚠️ No se encontró índice para actividades por operador');
      console.log('Sugerencia: Crear índice para actividades por operador:');
      console.log(`
        CREATE INDEX idx_activities_operator_id 
        ON activities(operator_id, created_at DESC);
      `);
    } else {
      console.log('✅ Se encontraron índices para actividades por operador:');
      activitiesIndex.rows.forEach(row => {
        console.log(`- ${row.indexname}: ${row.indexdef}`);
      });
    }
    
    // 4. Ejecutar vacuum y analyze
    console.log('\n📊 Actualizando estadísticas para optimizador de consultas...');
    await pgClient.query('ANALYZE operators');
    await pgClient.query('ANALYZE activities');
    
    // 5. Recomendaciones generales
    console.log('\n📝 Recomendaciones generales:');
    console.log('1. Utilizar caché para resultados de consultas frecuentes');
    console.log('2. Implementar paginación eficiente con cursor en lugar de offset para conjuntos grandes');
    console.log('3. Considerar materializar vistas para informes complejos o consultas frecuentes');
    console.log('4. Monitorear y ajustar índices según patrones reales de consulta');
    console.log('5. Agregar índices para las consultas con ORDER BY más comunes');
    
    console.log(`\n✨ Análisis completado en ${(Date.now() - startTime) / 1000} segundos`);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await pgClient.end();
    console.log('Conexión cerrada');
  }
}

analyzeAndOptimizeQueries(); 