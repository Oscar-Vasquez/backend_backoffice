import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  // Configuración para optimizar el rendimiento
  // Estas variables se pueden configurar en el archivo .env
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '30', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10),
  transactionTimeout: parseInt(process.env.DB_TRANSACTION_TIMEOUT || '15000', 10),
})); 