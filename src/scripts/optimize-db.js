const { PrismaClient } = require('@prisma/client');

async function optimizeDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Conectando a la base de datos...');
    
    // Analizar la tabla de operadores
    console.log('Analizando tabla de operadores...');
    await prisma.$executeRawUnsafe('ANALYZE operators');
    
    // Analizar la tabla de actividades
    console.log('Analizando tabla de actividades...');
    await prisma.$executeRawUnsafe('ANALYZE activities');
    
    // Vaciar (vacuum) las tablas para optimizar el espacio y rendimiento
    console.log('Optimizando tablas...');
    await prisma.$executeRawUnsafe('VACUUM ANALYZE operators');
    await prisma.$executeRawUnsafe('VACUUM ANALYZE activities');
    
    // Actualizar estadísticas para el planificador de consultas
    console.log('Actualizando estadísticas...');
    await prisma.$executeRawUnsafe('ANALYZE');
    
    console.log('Optimización completada exitosamente');
  } catch (error) {
    console.error('Error al optimizar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase(); 