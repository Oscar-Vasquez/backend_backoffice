const { Client } = require('pg');
require('dotenv').config();

async function optimizeConnection() {
  console.log('🚀 Iniciando optimización de la conexión a la base de datos...');
  
  // Crear una conexión directa a PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    
    // 1. Verificar y optimizar la configuración de la conexión
    console.log('\n📊 Verificando configuración de la conexión...');
    
    // Verificar el número máximo de conexiones
    const maxConnectionsResult = await client.query('SHOW max_connections');
    console.log(`Max connections: ${maxConnectionsResult.rows[0].max_connections}`);
    
    // Verificar la memoria de trabajo
    const workMemResult = await client.query('SHOW work_mem');
    console.log(`Work memory: ${workMemResult.rows[0].work_mem}`);
    
    // Verificar los búferes compartidos
    const sharedBuffersResult = await client.query('SHOW shared_buffers');
    console.log(`Shared buffers: ${sharedBuffersResult.rows[0].shared_buffers}`);
    
    // 2. Verificar y optimizar las estadísticas de la base de datos
    console.log('\n📊 Actualizando estadísticas de la base de datos...');
    
    // Actualizar estadísticas de la tabla de operadores
    await client.query('ANALYZE operators');
    console.log('✅ Estadísticas de la tabla de operadores actualizadas');
    
    // Actualizar estadísticas de la tabla de actividades
    await client.query('ANALYZE activities');
    console.log('✅ Estadísticas de la tabla de actividades actualizadas');
    
    // 3. Verificar y optimizar los índices
    console.log('\n📊 Verificando índices...');
    
    // Verificar los índices de la tabla de operadores
    const operatorsIndexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'operators'
    `;
    const operatorsIndexesResult = await client.query(operatorsIndexesQuery);
    console.log('Índices de la tabla de operadores:');
    operatorsIndexesResult.rows.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // Verificar los índices de la tabla de actividades
    const activitiesIndexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'activities'
    `;
    const activitiesIndexesResult = await client.query(activitiesIndexesQuery);
    console.log('\nÍndices de la tabla de actividades:');
    activitiesIndexesResult.rows.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // 4. Verificar y optimizar el rendimiento de las consultas
    console.log('\n📊 Verificando rendimiento de las consultas...');
    
    // Ejecutar una consulta de prueba
    console.log('Ejecutando consulta de prueba...');
    const startTime = Date.now();
    const testQuery = `
      SELECT o.id, o.email, o.first_name, o.last_name, o.phone, 
        o.role, o.status, o.photo, o.branch_id, o.type_operator_id,
        o.created_at, o.updated_at, o.last_login_at,
        b.id as branch_id, b.name as branch_name
      FROM operators o
      LEFT JOIN branches b ON o.branch_id = b.id
      LIMIT 5
    `;
    const testQueryResult = await client.query(testQuery);
    console.log(`✅ Consulta de prueba completada en ${Date.now() - startTime}ms`);
    console.log(`Operadores recuperados: ${testQueryResult.rows.length}`);
    
    console.log('\n🎉 Optimización de la conexión completada');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

optimizeConnection(); 