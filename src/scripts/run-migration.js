const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Conectando a la base de datos...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add_operator_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Ejecutando migración SQL...');
    
    // Ejecutar el SQL directamente
    await prisma.$executeRawUnsafe(sql);
    
    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error al ejecutar la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration(); 