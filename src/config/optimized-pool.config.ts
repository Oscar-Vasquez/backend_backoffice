import { Pool, PoolConfig } from 'pg';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuración optimizada de pool para entornos con alta latencia
 */
@Injectable()
export class OptimizedPoolService {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const poolConfig: PoolConfig = {
      connectionString: this.configService.get<string>('DATABASE_URL'),
      max: this.configService.get<number>('DB_MAX_CONNECTIONS', 30),
      idleTimeoutMillis: this.configService.get<number>('DB_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: this.configService.get<number>('DB_CONNECTION_TIMEOUT', 10000),
    };

    // Configuración adicional para Supabase con alta latencia
    const additionalConfig = {
      statement_timeout: this.configService.get<number>('DB_STATEMENT_TIMEOUT', 20000),
      query_timeout: this.configService.get<number>('DB_QUERY_TIMEOUT', 10000),
      application_name: 'workexpress_optimized',
    };

    this.pool = new Pool({
      ...poolConfig,
      ...additionalConfig,
    });

    // Manejar errores a nivel del pool
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Obtiene el pool de conexiones
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Obtiene una conexión del pool
   */
  async getClient() {
    return this.pool.connect();
  }

  /**
   * Ejecuta una consulta usando el pool
   */
  async query(text: string, params: any[] = []) {
    return this.pool.query(text, params);
  }

  /**
   * Ejecuta una transacción
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Cierra el pool al apagar la aplicación
   */
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
