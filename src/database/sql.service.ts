import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import { createPgPool } from '../config/pg-pool.config';
import { performance } from 'perf_hooks';

@Injectable()
export class SqlService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqlService.name);
  private pool: Pool;
  private queryStats = {
    total: 0,
    slow: 0,
    errors: 0,
    lastSlowQuery: '',
    lastQueryTime: Date.now()
  };
  
  // Umbral para considerar una consulta como lenta (en ms)
  private readonly SLOW_QUERY_THRESHOLD = 500;

  constructor(private configService: ConfigService) {
    this.pool = createPgPool(configService);
    
    // Manejar errores a nivel del pool
    this.pool.on('error', (err) => {
      this.logger.error(`Error inesperado en cliente inactivo: ${err.message}`, err.stack);
      this.queryStats.errors++;
    });
  }

  async onModuleInit() {
    this.logger.log('Inicializando servicio SQL');
    // Test connection
    try {
      const startTime = performance.now();
      const client = await this.pool.connect();
      const connectionTime = performance.now() - startTime;
      
      // Verificar latencia de conexión
      if (connectionTime > 1000) {
        this.logger.warn(`Alta latencia detectada en la conexión: ${connectionTime.toFixed(2)}ms. Considere usar un DirectUrl o una conexión más cercana.`);
      } else {
        this.logger.log(`Conexión establecida en ${connectionTime.toFixed(2)}ms`);
      }
      
      // Verificar capacidad de consultas
      const queryStartTime = performance.now();
      await client.query('SELECT 1');
      const queryTime = performance.now() - queryStartTime;
      
      if (queryTime > 200) {
        this.logger.warn(`Alta latencia detectada en consultas: ${queryTime.toFixed(2)}ms`);
      } else {
        this.logger.log(`Tiempo de consulta: ${queryTime.toFixed(2)}ms`);
      }
      
      client.release();
      this.logger.log('Conexión a la base de datos establecida correctamente');
      
      // Programar monitoreo periódico
      this.scheduleHealthCheck();
    } catch (error) {
      this.logger.error(`Error al conectar a la base de datos: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Pool de base de datos cerrado');
  }

  /**
   * Ejecuta una consulta SQL optimizada para alta latencia
   */
  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = performance.now();
    this.queryStats.total++;
    this.queryStats.lastQueryTime = Date.now();
    
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = performance.now() - startTime;
      
      // Registrar consultas lentas
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        this.queryStats.slow++;
        this.queryStats.lastSlowQuery = this.truncateQuery(text);
        
        this.logger.warn(`Consulta lenta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`);
        
        // Si es extremadamente lenta, registrar detalles completos
        if (duration > this.SLOW_QUERY_THRESHOLD * 3) {
          this.logger.warn(`Consulta muy lenta (${duration.toFixed(2)}ms): ${text}\nParámetros: ${JSON.stringify(params)}`);
        }
      } else if (process.env.NODE_ENV === 'development') {
        // Solo registrar consultas normales en desarrollo
        this.logger.debug(`Consulta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.queryStats.errors++;
      
      // Mejorar el mensaje de error con información contextual
      this.logger.error(
        `Error en consulta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`,
        `Error: ${error.message}\nDetalles: ${JSON.stringify({
          code: error.code,
          params: params ? JSON.stringify(params).substring(0, 100) : 'none',
          constraint: error.constraint,
          detail: error.detail,
          table: error.table
        })}`
      );
      
      throw error;
    }
  }

  /**
   * Obtiene un cliente de conexión del pool
   */
  async getClient(): Promise<PoolClient> {
    try {
      const startTime = performance.now();
      const client = await this.pool.connect();
      const duration = performance.now() - startTime;
      
      if (duration > 1000) {
        this.logger.warn(`Obtención de cliente lenta (${duration.toFixed(2)}ms)`);
      }
      
      return client;
    } catch (error) {
      this.logger.error(`Error al obtener cliente del pool: ${error.message}`, error.stack);
      this.queryStats.errors++;
      throw error;
    }
  }

  /**
   * Ejecuta una transacción con reintentos automáticos para errores transitorios
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>, maxRetries = 3): Promise<T> {
    let retries = 0;
    
    while (true) {
      const client = await this.getClient();
      const startTime = performance.now();
      
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        
        const duration = performance.now() - startTime;
        if (duration > this.SLOW_QUERY_THRESHOLD) {
          this.logger.warn(`Transacción lenta (${duration.toFixed(2)}ms)`);
        }
        
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        this.queryStats.errors++;
        
        // Verificar si el error es transitorio y podemos reintentar
        const isTransient = this.isTransientError(error);
        
        if (isTransient && retries < maxRetries) {
          retries++;
          this.logger.warn(`Error transitorio en transacción, reintentando (${retries}/${maxRetries}): ${error.message}`);
          // Esperar antes de reintentar (backoff exponencial)
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
          continue;
        }
        
        this.logger.error(`Error en transacción: ${error.message}`, error.stack);
        throw error;
      } finally {
        client.release();
      }
    }
  }
  
  /**
   * Determina si un error es transitorio y se puede reintentar
   */
  private isTransientError(error: any): boolean {
    // Códigos de error de PostgreSQL que son transitorios
    const transientErrorCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '08006', // connection_failure
      '08003', // connection_does_not_exist
      '08004', // connection_rejected
      '08007', // transaction_resolution_unknown
      '57P03', // cannot_connect_now
      'XX000'  // internal_error (algunas veces puede ser transitorio)
    ];
    
    return error.code && transientErrorCodes.includes(error.code);
  }
  
  /**
   * Programa verificaciones periódicas de salud
   */
  private scheduleHealthCheck() {
    // Verificar cada 5 minutos
    setInterval(async () => {
      try {
        // Verificar conexión
        const client = await this.pool.connect();
        const startTime = performance.now();
        await client.query('SELECT 1');
        const duration = performance.now() - startTime;
        client.release();
        
        // Registrar estadísticas
        this.logger.log(
          `Estado de conexión: Activa (${duration.toFixed(2)}ms). ` +
          `Estadísticas: ${this.queryStats.total} consultas, ` +
          `${this.queryStats.slow} lentas, ${this.queryStats.errors} errores`
        );
        
        if (duration > 500) {
          this.logger.warn(`Alta latencia detectada: ${duration.toFixed(2)}ms`);
        }
        
        // Reiniciar estadísticas parciales
        if (this.queryStats.total > 10000) {
          this.logger.log(`Reiniciando contador de estadísticas (total: ${this.queryStats.total})`);
          this.queryStats.total = 0;
          this.queryStats.slow = 0;
          this.queryStats.errors = 0;
        }
      } catch (error) {
        this.logger.error(`Error en verificación de salud: ${error.message}`);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }
  
  /**
   * Trunca una consulta para logging
   */
  private truncateQuery(query: string): string {
    return query.length > 100 ? `${query.substring(0, 100)}...` : query;
  }
} 