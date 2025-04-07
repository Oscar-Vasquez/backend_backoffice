import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const createPgPool = (configService: ConfigService) => {
  // Configuración base
  const config = {
    connectionString: configService.get('database.url'),
    max: configService.get('database.maxConnections') || 30,
    idleTimeoutMillis: configService.get('database.idleTimeout') || 30000, // Reducido a 30 segundos
    connectionTimeoutMillis: configService.get('database.connectionTimeout') || 10000,
    statement_timeout: configService.get('database.queryTimeout') || 20000, // Aumentado a 20 segundos
    query_timeout: configService.get('database.queryTimeout') || 10000,
    // Parámetros adicionales para optimización
    application_name: 'workexpress_optimized',
    keepAlive: true, // Mantener conexiones activas
    keepAliveInitialDelayMillis: 10000, // Retraso inicial para keepAlive
  };

  // Añadir parámetros de conexión para optimizar en alta latencia
  const connectionParams = new URLSearchParams();
  connectionParams.append('statement_timeout', String(config.statement_timeout));
  connectionParams.append('lock_timeout', '10000');
  connectionParams.append('idle_in_transaction_session_timeout', '30000');
  
  // Verificar si el connection string ya tiene parámetros
  const url = config.connectionString;
  if (url) {
    if (url.includes('?')) {
      config.connectionString = `${url}&${connectionParams.toString()}`;
    } else {
      config.connectionString = `${url}?${connectionParams.toString()}`;
    }
  }

  return new Pool(config);
}; 