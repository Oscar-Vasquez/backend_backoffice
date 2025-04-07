/**
 * Script para medir la latencia de conexión y consultas a la base de datos
 */

const { Client } = require('pg');
require('dotenv').config();

async function measureDatabaseLatency() {
  console.log('🔍 Iniciando medición de latencia de la base de datos...');
  console.log(`Host: ${process.env.DATABASE_URL.match(/aws-[^:]*\.supabase\.com/)[0]}`);
  
  // Número de pruebas a realizar
  const NUM_TESTS = 5;
  let totalConnectionTime = 0;
  let totalQueryTime = 0;
  let totalDisconnectTime = 0;
  
  for (let i = 1; i <= NUM_TESTS; i++) {
    console.log(`\n🔄 Prueba ${i} de ${NUM_TESTS}:`);
    
    // Crear cliente PostgreSQL
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    try {
      // Medir tiempo de conexión
      console.log('  Conectando a la base de datos...');
      const connectionStart = Date.now();
      await client.connect();
      const connectionTime = Date.now() - connectionStart;
      totalConnectionTime += connectionTime;
      console.log(`  ✅ Conexión establecida en ${connectionTime}ms`);
      
      // Medir tiempo de consulta simple
      console.log('  Ejecutando consulta simple (SELECT 1)...');
      const queryStart = Date.now();
      await client.query('SELECT 1');
      const queryTime = Date.now() - queryStart;
      totalQueryTime += queryTime;
      console.log(`  ✅ Consulta simple completada en ${queryTime}ms`);
      
      // Medir tiempo de desconexión
      console.log('  Cerrando conexión...');
      const disconnectStart = Date.now();
      await client.end();
      const disconnectTime = Date.now() - disconnectStart;
      totalDisconnectTime += disconnectTime;
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
  
  // Calcular promedios
  const avgConnectionTime = Math.round(totalConnectionTime / NUM_TESTS);
  const avgQueryTime = Math.round(totalQueryTime / NUM_TESTS);
  const avgDisconnectTime = Math.round(totalDisconnectTime / NUM_TESTS);
  const avgTotalTime = avgConnectionTime + avgQueryTime + avgDisconnectTime;
  
  console.log('\n📊 Resultados:');
  console.log(`Tiempo promedio de conexión: ${avgConnectionTime}ms`);
  console.log(`Tiempo promedio de consulta simple: ${avgQueryTime}ms`);
  console.log(`Tiempo promedio de desconexión: ${avgDisconnectTime}ms`);
  console.log(`Tiempo total promedio: ${avgTotalTime}ms`);
  
  // Evaluar la latencia
  console.log('\n📝 Análisis:');
  if (avgConnectionTime > 500) {
    console.log('⚠️ La latencia de conexión es alta (>500ms). Esto puede afectar el rendimiento de la aplicación.');
    console.log('   - Considera usar un pool de conexiones para reducir el impacto');
    console.log('   - Verifica si la región de Supabase está cercana a tu aplicación');
  } else if (avgConnectionTime > 200) {
    console.log('ℹ️ La latencia de conexión es moderada (>200ms).');
    console.log('   - Usar un pool de conexiones es recomendado');
  } else {
    console.log('✅ La latencia de conexión es buena (<200ms).');
  }
  
  if (avgQueryTime > 100) {
    console.log('⚠️ La latencia de consulta es alta (>100ms). Considera implementar caché.');
  } else {
    console.log('✅ La latencia de consulta es aceptable (<100ms).');
  }
  
  console.log('\n📝 Recomendaciones:');
  console.log('1. Implementa un pool de conexiones para reducir el impacto de la latencia de conexión');
  console.log('2. Utiliza caché para consultas frecuentes');
  console.log('3. Agrupa consultas relacionadas para reducir viajes de ida y vuelta a la base de datos');
  console.log('4. Considera utilizar la interfaz de conexión directa para migraciones y otras operaciones administrativas');
}

measureDatabaseLatency(); 