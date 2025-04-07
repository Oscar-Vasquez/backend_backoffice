/**
 * Script para comparar la latencia entre conexión directa y conexión a través de PgBouncer
 */

const { Client, Pool } = require('pg');
require('dotenv').config();

async function compareConnectionTypes() {
  console.log('🔍 Comparando tipos de conexión a la base de datos...');
  
  // Obtener las URLs de conexión
  const pgBouncerUrl = process.env.DATABASE_URL; // PgBouncer
  const directUrl = process.env.DIRECT_URL; // Conexión directa
  
  console.log(`Host PgBouncer: ${pgBouncerUrl.match(/aws-[^:]*\.supabase\.com/)[0]}`);
  console.log(`Host Directo: ${directUrl.match(/aws-[^:]*\.supabase\.com/)[0]}`);
  
  // Número de pruebas a realizar
  const NUM_TESTS = 3;
  
  // Resultados para conexión PgBouncer
  let pgBouncerConnectionTimes = [];
  let pgBouncerQueryTimes = [];
  let pgBouncerDisconnectTimes = [];
  
  // Resultados para conexión directa
  let directConnectionTimes = [];
  let directQueryTimes = [];
  let directDisconnectTimes = [];
  
  // Pruebas con PgBouncer
  console.log('\n📊 Probando conexión a través de PgBouncer...');
  for (let i = 1; i <= NUM_TESTS; i++) {
    console.log(`\n🔄 Prueba ${i} de ${NUM_TESTS}:`);
    
    const client = new Client({
      connectionString: pgBouncerUrl,
    });
    
    try {
      // Medir tiempo de conexión
      console.log('  Conectando a la base de datos...');
      const connectionStart = Date.now();
      await client.connect();
      const connectionTime = Date.now() - connectionStart;
      pgBouncerConnectionTimes.push(connectionTime);
      console.log(`  ✅ Conexión establecida en ${connectionTime}ms`);
      
      // Medir tiempo de consulta simple
      console.log('  Ejecutando consulta simple (SELECT 1)...');
      const queryStart = Date.now();
      await client.query('SELECT 1');
      const queryTime = Date.now() - queryStart;
      pgBouncerQueryTimes.push(queryTime);
      console.log(`  ✅ Consulta simple completada en ${queryTime}ms`);
      
      // Medir tiempo de desconexión
      console.log('  Cerrando conexión...');
      const disconnectStart = Date.now();
      await client.end();
      const disconnectTime = Date.now() - disconnectStart;
      pgBouncerDisconnectTimes.push(disconnectTime);
      console.log(`  ✅ Conexión cerrada en ${disconnectTime}ms`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      if (client) {
        try {
          await client.end();
        } catch (e) {
          // Ignorar errores al cerrar la conexión
        }
      }
    }
    
    // Esperar un segundo entre pruebas
    if (i < NUM_TESTS) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Pruebas con conexión directa
  console.log('\n📊 Probando conexión directa...');
  for (let i = 1; i <= NUM_TESTS; i++) {
    console.log(`\n🔄 Prueba ${i} de ${NUM_TESTS}:`);
    
    const client = new Client({
      connectionString: directUrl,
    });
    
    try {
      // Medir tiempo de conexión
      console.log('  Conectando a la base de datos...');
      const connectionStart = Date.now();
      await client.connect();
      const connectionTime = Date.now() - connectionStart;
      directConnectionTimes.push(connectionTime);
      console.log(`  ✅ Conexión establecida en ${connectionTime}ms`);
      
      // Medir tiempo de consulta simple
      console.log('  Ejecutando consulta simple (SELECT 1)...');
      const queryStart = Date.now();
      await client.query('SELECT 1');
      const queryTime = Date.now() - queryStart;
      directQueryTimes.push(queryTime);
      console.log(`  ✅ Consulta simple completada en ${queryTime}ms`);
      
      // Medir tiempo de desconexión
      console.log('  Cerrando conexión...');
      const disconnectStart = Date.now();
      await client.end();
      const disconnectTime = Date.now() - disconnectStart;
      directDisconnectTimes.push(disconnectTime);
      console.log(`  ✅ Conexión cerrada en ${disconnectTime}ms`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      if (client) {
        try {
          await client.end();
        } catch (e) {
          // Ignorar errores al cerrar la conexión
        }
      }
    }
    
    // Esperar un segundo entre pruebas
    if (i < NUM_TESTS) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Probar el rendimiento con un pool de conexiones
  console.log('\n📊 Probando pool de conexiones con PgBouncer...');
  
  // Crear pool de conexiones
  const pool = new Pool({
    connectionString: pgBouncerUrl,
    max: 10, // máximo 10 clientes
    idleTimeoutMillis: 30000, // tiempo de espera antes de cerrar clientes inactivos
    connectionTimeoutMillis: 5000, // tiempo de espera para conexión
  });
  
  let poolQueryTimes = [];
  
  try {
    // Precalentar el pool
    console.log('  Precalentando el pool...');
    await pool.query('SELECT 1');
    
    // Realizar consultas consecutivas
    for (let i = 1; i <= NUM_TESTS; i++) {
      console.log(`  Consulta ${i} de ${NUM_TESTS}...`);
      const queryStart = Date.now();
      await pool.query('SELECT 1');
      const queryTime = Date.now() - queryStart;
      poolQueryTimes.push(queryTime);
      console.log(`  ✅ Consulta completada en ${queryTime}ms`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  } finally {
    await pool.end();
  }
  
  // Calcular promedios
  const avgPgBouncerConnectionTime = Math.round(pgBouncerConnectionTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgPgBouncerQueryTime = Math.round(pgBouncerQueryTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgPgBouncerDisconnectTime = Math.round(pgBouncerDisconnectTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgPgBouncerTotalTime = avgPgBouncerConnectionTime + avgPgBouncerQueryTime + avgPgBouncerDisconnectTime;
  
  const avgDirectConnectionTime = Math.round(directConnectionTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgDirectQueryTime = Math.round(directQueryTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgDirectDisconnectTime = Math.round(directDisconnectTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  const avgDirectTotalTime = avgDirectConnectionTime + avgDirectQueryTime + avgDirectDisconnectTime;
  
  const avgPoolQueryTime = Math.round(poolQueryTimes.reduce((a, b) => a + b, 0) / NUM_TESTS);
  
  // Mostrar resultados
  console.log('\n📊 Resultados:');
  console.log('  PgBouncer:');
  console.log(`    - Tiempo promedio de conexión: ${avgPgBouncerConnectionTime}ms`);
  console.log(`    - Tiempo promedio de consulta simple: ${avgPgBouncerQueryTime}ms`);
  console.log(`    - Tiempo promedio de desconexión: ${avgPgBouncerDisconnectTime}ms`);
  console.log(`    - Tiempo total promedio: ${avgPgBouncerTotalTime}ms`);
  
  console.log('  Conexión directa:');
  console.log(`    - Tiempo promedio de conexión: ${avgDirectConnectionTime}ms`);
  console.log(`    - Tiempo promedio de consulta simple: ${avgDirectQueryTime}ms`);
  console.log(`    - Tiempo promedio de desconexión: ${avgDirectDisconnectTime}ms`);
  console.log(`    - Tiempo total promedio: ${avgDirectTotalTime}ms`);
  
  console.log('  Pool de conexiones:');
  console.log(`    - Tiempo promedio de consulta simple: ${avgPoolQueryTime}ms`);
  
  // Analizar resultados
  console.log('\n📝 Análisis:');
  if (avgPgBouncerConnectionTime > avgDirectConnectionTime * 1.2) {
    console.log('⚠️ La conexión a través de PgBouncer es significativamente más lenta que la conexión directa.');
    console.log('   Esto puede indicar una configuración subóptima de PgBouncer o problemas de red.');
  } else if (avgPgBouncerConnectionTime < avgDirectConnectionTime * 0.8) {
    console.log('✅ La conexión a través de PgBouncer es más rápida que la conexión directa.');
    console.log('   Esto indica que PgBouncer está funcionando correctamente.');
  } else {
    console.log('ℹ️ La conexión a través de PgBouncer y la conexión directa tienen tiempos similares.');
  }
  
  if (avgPoolQueryTime < avgPgBouncerQueryTime * 0.5) {
    console.log('✅ El pool de conexiones es significativamente más rápido para consultas consecutivas.');
    console.log('   Esto indica que un pool de conexiones sería beneficioso para la aplicación.');
  }
  
  // Recomendaciones
  console.log('\n📝 Recomendaciones:');
  console.log('1. Utiliza un pool de conexiones en la aplicación para reducir la latencia de conexión');
  console.log('2. Implementa caché para consultas frecuentes para reducir la cantidad de consultas a la base de datos');
  console.log('3. Considera utilizar la conexión directa para operaciones administrativas si es más rápida');
  console.log('4. Monitorea regularmente la latencia de conexión para detectar problemas de rendimiento');
}

compareConnectionTypes(); 