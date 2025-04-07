const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
require('dotenv').config();

async function optimizeOperatorsQueries() {
  console.log('🚀 Iniciando optimización de consultas de operadores...');
  
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
    
    // 1. Verificar índices específicos para operadores
    console.log('\n📊 Verificando índices para operadores...');
    const indexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'operators'
      ORDER BY indexname
    `;
    const indexesResult = await pgClient.query(indexesQuery);
    
    console.log('Índices encontrados:');
    indexesResult.rows.forEach(idx => {
      console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // 2. Crear índices adicionales si es necesario
    console.log('\n📊 Creando índices adicionales para operadores...');
    
    // Índice para búsqueda por nombre completo (combinación de first_name y last_name)
    try {
      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_operators_full_name 
        ON operators ((first_name || ' ' || last_name))
      `);
      console.log('✅ Índice para nombre completo creado o ya existente');
    } catch (error) {
      console.error('❌ Error al crear índice para nombre completo:', error.message);
    }
    
    // 3. Analizar consultas comunes de operadores
    console.log('\n📊 Analizando consultas comunes de operadores...');
    
    // Consulta de listado de operadores con filtros
    console.log('Probando consulta de listado de operadores con filtros...');
    const listStartTime = Date.now();
    const operatorsList = await prisma.operators.findMany({
      where: {
        status: 'active',
        role: 'staff'
      },
      include: {
        branches: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });
    console.log(`✅ Consulta de listado completada en ${Date.now() - listStartTime}ms`);
    console.log(`Operadores recuperados: ${operatorsList.length}`);
    
    // Consulta de búsqueda de operadores
    console.log('Probando consulta de búsqueda de operadores...');
    const searchStartTime = Date.now();
    const searchResults = await prisma.operators.findMany({
      where: {
        OR: [
          { first_name: { contains: 'a', mode: 'insensitive' } },
          { last_name: { contains: 'a', mode: 'insensitive' } },
          { email: { contains: 'a', mode: 'insensitive' } }
        ]
      },
      take: 10
    });
    console.log(`✅ Consulta de búsqueda completada en ${Date.now() - searchStartTime}ms`);
    console.log(`Operadores encontrados: ${searchResults.length}`);
    
    // 4. Analizar plan de ejecución para consultas lentas
    console.log('\n📊 Analizando plan de ejecución para consultas lentas...');
    
    const explainQuery = `
      EXPLAIN ANALYZE
      SELECT o.id, o.email, o.first_name, o.last_name, o.phone, 
        o.role, o.status, o.photo, o.branch_id, o.type_operator_id,
        o.created_at, o.updated_at, o.last_login_at,
        b.name as branch_name
      FROM operators o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE (o.first_name ILIKE '%a%' OR o.last_name ILIKE '%a%' OR o.email ILIKE '%a%')
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    
    const explainResult = await pgClient.query(explainQuery);
    console.log('Plan de ejecución:');
    explainResult.rows.forEach(row => {
      console.log(row['QUERY PLAN']);
    });
    
    // 5. Sugerencias de optimización específicas para operadores
    console.log('\n📊 Sugerencias de optimización para consultas de operadores:');
    console.log('1. Utiliza select en lugar de include cuando sea posible para reducir datos transferidos');
    console.log('2. Evita usar OR con múltiples condiciones ILIKE, usa índices de texto completo si es posible');
    console.log('3. Considera implementar paginación del lado del cliente para reducir consultas');
    console.log('4. Utiliza consultas en caché para datos que no cambian frecuentemente');
    console.log('5. Considera usar vistas materializadas para consultas complejas y frecuentes');
    
    console.log('\n🎉 Optimización de consultas de operadores completada');
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
  } finally {
    await prisma.$disconnect();
    await pgClient.end();
    console.log('Conexiones cerradas');
  }
}

optimizeOperatorsQueries(); 