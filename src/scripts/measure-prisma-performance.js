const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function measurePrismaPerformance() {
  console.log('🔍 Iniciando medición de rendimiento de Prisma con Supabase...');
  
  // Medir tiempo de creación del cliente
  console.log('\n📊 Midiendo tiempo de creación del cliente Prisma...');
  const clientStartTime = Date.now();
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  const clientCreationTime = Date.now() - clientStartTime;
  console.log(`✅ Cliente Prisma creado en ${clientCreationTime}ms`);
  
  try {
    // Medir tiempo de conexión
    console.log('\n📊 Midiendo tiempo de conexión a Supabase...');
    const connectionStartTime = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - connectionStartTime;
    console.log(`✅ Conexión establecida en ${connectionTime}ms`);
    
    // Medir tiempo de consulta simple
    console.log('\n📊 Midiendo tiempo de consulta simple...');
    const simpleQueryStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const simpleQueryTime = Date.now() - simpleQueryStartTime;
    console.log(`✅ Consulta simple completada en ${simpleQueryTime}ms`);
    
    // Medir tiempo de consulta de conteo
    console.log('\n📊 Midiendo tiempo de consulta de conteo...');
    const countQueryStartTime = Date.now();
    const operatorsCount = await prisma.operators.count();
    const countQueryTime = Date.now() - countQueryStartTime;
    console.log(`✅ Consulta de conteo completada en ${countQueryTime}ms (${operatorsCount} operadores)`);
    
    // Medir tiempo de consulta con filtros
    console.log('\n📊 Midiendo tiempo de consulta con filtros...');
    const filteredQueryStartTime = Date.now();
    const activeOperators = await prisma.operators.count({
      where: { status: 'active' }
    });
    const filteredQueryTime = Date.now() - filteredQueryStartTime;
    console.log(`✅ Consulta con filtros completada en ${filteredQueryTime}ms (${activeOperators} operadores activos)`);
    
    // Medir tiempo de consulta con relaciones
    console.log('\n📊 Midiendo tiempo de consulta con relaciones...');
    const relationalQueryStartTime = Date.now();
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
    const relationalQueryTime = Date.now() - relationalQueryStartTime;
    console.log(`✅ Consulta con relaciones completada en ${relationalQueryTime}ms (${operators.length} operadores)`);
    
    // Medir tiempo de consulta con búsqueda
    console.log('\n📊 Midiendo tiempo de consulta con búsqueda...');
    const searchQueryStartTime = Date.now();
    const searchResults = await prisma.operators.findMany({
      where: {
        OR: [
          { first_name: { contains: 'a', mode: 'insensitive' } },
          { last_name: { contains: 'a', mode: 'insensitive' } },
          { email: { contains: 'a', mode: 'insensitive' } }
        ]
      },
      take: 5
    });
    const searchQueryTime = Date.now() - searchQueryStartTime;
    console.log(`✅ Consulta con búsqueda completada en ${searchQueryTime}ms (${searchResults.length} resultados)`);
    
    // Medir tiempo de consulta paginada
    console.log('\n📊 Midiendo tiempo de consulta paginada...');
    const paginatedQueryStartTime = Date.now();
    const page1 = await prisma.operators.findMany({
      skip: 0,
      take: 10,
      orderBy: {
        created_at: 'desc'
      }
    });
    const paginatedQueryTime = Date.now() - paginatedQueryStartTime;
    console.log(`✅ Consulta paginada completada en ${paginatedQueryTime}ms (${page1.length} resultados)`);
    
    // Medir tiempo de consulta compleja (similar a findAll en el servicio)
    console.log('\n📊 Midiendo tiempo de consulta compleja (similar a findAll)...');
    const complexQueryStartTime = Date.now();
    const result = await prisma.operators.findMany({
      where: {
        status: 'active',
        OR: [
          { first_name: { contains: 'a', mode: 'insensitive' } },
          { last_name: { contains: 'a', mode: 'insensitive' } },
          { email: { contains: 'a', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        photo: true,
        branch_id: true,
        type_operator_id: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
        branches: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: 0,
      take: 20
    });
    const complexQueryTime = Date.now() - complexQueryStartTime;
    console.log(`✅ Consulta compleja completada en ${complexQueryTime}ms (${result.length} resultados)`);
    
    // Resumen
    console.log('\n📊 Resumen de tiempos:');
    console.log(`- Creación del cliente: ${clientCreationTime}ms`);
    console.log(`- Conexión a Supabase: ${connectionTime}ms`);
    console.log(`- Consulta simple: ${simpleQueryTime}ms`);
    console.log(`- Consulta de conteo: ${countQueryTime}ms`);
    console.log(`- Consulta con filtros: ${filteredQueryTime}ms`);
    console.log(`- Consulta con relaciones: ${relationalQueryTime}ms`);
    console.log(`- Consulta con búsqueda: ${searchQueryTime}ms`);
    console.log(`- Consulta paginada: ${paginatedQueryTime}ms`);
    console.log(`- Consulta compleja: ${complexQueryTime}ms`);
    
    console.log('\n🎉 Medición de rendimiento completada');
    
  } catch (error) {
    console.error('❌ Error durante la medición:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Conexión cerrada');
  }
}

measurePrismaPerformance(); 