const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkDatabaseConnection() {
  console.log('Iniciando diagnóstico de conexión a la base de datos...');
  console.log(`URL de la base de datos: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  const startTime = Date.now();
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    console.log('Intentando conectar a la base de datos...');
    await prisma.$connect();
    console.log(`✅ Conexión establecida en ${Date.now() - startTime}ms`);
    
    // Verificar tiempo de respuesta para consultas simples
    console.log('Probando consulta simple...');
    const queryStartTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log(`✅ Consulta simple completada en ${Date.now() - queryStartTime}ms`);
    
    // Verificar tiempo de respuesta para consulta de operadores
    console.log('Probando consulta de operadores...');
    const operatorsStartTime = Date.now();
    const operatorsCount = await prisma.operators.count();
    console.log(`✅ Consulta de conteo de operadores completada en ${Date.now() - operatorsStartTime}ms`);
    console.log(`Total de operadores: ${operatorsCount}`);
    
    // Verificar tiempo de respuesta para consulta de operadores con JOIN
    console.log('Probando consulta de operadores con JOIN...');
    const joinStartTime = Date.now();
    const query = `
      SELECT o.id, o.email, b.name as branch_name
      FROM operators o
      LEFT JOIN branches b ON o.branch_id = b.id
      LIMIT 5
    `;
    const operators = await prisma.$queryRawUnsafe(query);
    console.log(`✅ Consulta JOIN completada en ${Date.now() - joinStartTime}ms`);
    console.log(`Operadores recuperados: ${operators.length}`);
    
    // Verificar índices
    console.log('Verificando índices en la tabla de operadores...');
    const indexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'operators'
    `;
    const indexes = await prisma.$queryRawUnsafe(indexesQuery);
    console.log('Índices encontrados:');
    indexes.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // Verificar estadísticas de la tabla
    console.log('Verificando estadísticas de la tabla de operadores...');
    const statsQuery = `
      SELECT relname, n_live_tup, n_dead_tup
      FROM pg_stat_user_tables
      WHERE relname = 'operators'
    `;
    const stats = await prisma.$queryRawUnsafe(statsQuery);
    if (stats.length > 0) {
      console.log(`Filas vivas: ${stats[0].n_live_tup}, Filas muertas: ${stats[0].n_dead_tup}`);
    }
    
    console.log('\n✅ Diagnóstico completado exitosamente');
    console.log(`Tiempo total: ${Date.now() - startTime}ms`);
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Conexión cerrada');
  }
}

checkDatabaseConnection(); 