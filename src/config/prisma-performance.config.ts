import { registerAs } from '@nestjs/config';

export default registerAs('prisma', () => ({
  // Configuración para optimizar el rendimiento de Prisma
  queryLogging: process.env.PRISMA_QUERY_LOGGING === 'true',
  errorLogging: process.env.PRISMA_ERROR_LOGGING !== 'false',
  
  // Configuración de conexión
  connectionLimit: parseInt(process.env.PRISMA_CONNECTION_LIMIT || '10', 10),
  
  // Configuración de caché
  useQueryCache: process.env.PRISMA_USE_QUERY_CACHE !== 'false',
  
  // Configuración de timeout
  queryTimeout: parseInt(process.env.PRISMA_QUERY_TIMEOUT || '30000', 10),
  
  // Configuración de transacciones
  transactionTimeout: parseInt(process.env.PRISMA_TRANSACTION_TIMEOUT || '60000', 10),
  
  // Configuración de logging
  slowQueryThreshold: parseInt(process.env.PRISMA_SLOW_QUERY_THRESHOLD || '100', 10),
})); 