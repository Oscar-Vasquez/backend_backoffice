import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connectionEstablished = false;
  private lastQueryTime = Date.now();
  private queryCount = 0;
  private slowQueryCount = 0;
  public queryMetrics: { [key: string]: { count: number; totalTime: number; maxTime: number } } = {};
  
  constructor(private configService: ConfigService) {
    // Obtener configuración de rendimiento
    const prismaConfig = configService.get('prisma');
    const dbConfig = configService.get('database');
    const directUrl = configService.get('database.directUrl');
    
    // Inicializar Prisma con la configuración apropiada
    // Usando sólo una opción: o datasources o datasourceUrl, no ambas
    super(directUrl 
      ? {
          log: prismaConfig?.errorLogging ? ['error'] : [],
          datasourceUrl: directUrl,
        }
      : {
          log: prismaConfig?.errorLogging ? ['error'] : [],
          datasources: {
            db: {
              url: configService.get('database.url'),
            },
          },
        }
    );

    // Middleware para medir el tiempo de las consultas (compatible con Prisma v6+)
    this.$use(async (params, next) => {
      // Incrementar contador de consultas
      this.queryCount++;
      this.lastQueryTime = Date.now();
      
      // Para compatibilidad con el monitoreo, vamos a rastrear la consulta
      const queryKey = `${params.model}.${params.action}`;
      
      // Iniciar métricas si no existen
      if (!this.queryMetrics[queryKey]) {
        this.queryMetrics[queryKey] = { count: 0, totalTime: 0, maxTime: 0 };
      }
      
      const startTime = performance.now();
      const result = await next(params);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Actualizar métricas
      this.queryMetrics[queryKey].count++;
      this.queryMetrics[queryKey].totalTime += duration;
      this.queryMetrics[queryKey].maxTime = Math.max(this.queryMetrics[queryKey].maxTime, duration);
      
      // Solo registrar consultas muy lentas
      const slowQueryThreshold = prismaConfig?.slowQueryThreshold || 500;
      if (duration > slowQueryThreshold) {
        this.slowQueryCount++;
        this.logger.warn(
          `Consulta lenta (${duration.toFixed(2)}ms): ${queryKey}`
        );
        
        // Registrar detalles adicionales para diagnóstico si es muy lenta
        if (duration > slowQueryThreshold * 2) {
          this.logger.warn(
            `Detalles de consulta lenta: ${JSON.stringify({
              model: params.model,
              action: params.action,
              args: params.args ? JSON.stringify(params.args).substring(0, 200) : 'none',
              duration: `${duration.toFixed(2)}ms`,
              threshold: `${slowQueryThreshold}ms`,
              timestamp: new Date().toISOString()
            })}`
          );
        }
      }
      
      return result;
    });

    // Middleware para optimizar consultas de búsqueda - Simplificado
    this.$use(async (params, next) => {
      // Solo aplicar a consultas de búsqueda con filtros
      if (params.action === 'findMany' && params.args?.where) {
        // Registrar la consulta para depuración solo si está habilitado explícitamente
        if (prismaConfig?.queryLogging === 'debug') {
          this.logger.debug(`Optimizando consulta: ${params.model}.${params.action}`);
        }
      }
      
      return next(params);
    });
  }

  async onModuleInit() {
    this.logger.log('Conectando a la base de datos...');
    const startTime = performance.now();
    
    try {
      // Configurar opciones de conexión
      process.on('beforeExit', () => {
        this.$disconnect();
      });
      
      // Configurar manejo de errores de conexión
      process.on('SIGINT', () => {
        this.$disconnect();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        this.$disconnect();
        process.exit(0);
      });
      
      await this.$connect();
      this.connectionEstablished = true;
      
      const connectionTime = performance.now() - startTime;
      this.logger.log(`Conexión a la base de datos establecida en ${connectionTime.toFixed(2)}ms`);
      
      // Ejecutar optimizaciones iniciales
      await this.optimizeDatabase();
      
      // Programar monitoreo periódico de la salud de la conexión
      this.scheduleConnectionHealthCheck();
    } catch (error) {
      this.logger.error('Error al conectar a la base de datos:', error);
      throw error;
    }
  }

  private async optimizeDatabase() {
    try {
      // Actualizar estadísticas solo si es necesario (no en cada inicio)
      const lastAnalyze = this.configService.get('database.lastAnalyze') || 0;
      const analyzeInterval = 24 * 60 * 60 * 1000; // 24 horas
      
      if (Date.now() - lastAnalyze > analyzeInterval) {
        // Actualizar estadísticas de las tablas principales
        await this.$executeRawUnsafe('ANALYZE operators');
        await this.$executeRawUnsafe('ANALYZE activities');
        this.logger.log('Estadísticas de la base de datos actualizadas');
        
        // Limpiar el caché de consultas
        await this.$executeRawUnsafe('DISCARD PLANS');
        await this.$executeRawUnsafe('DISCARD ALL');
        this.logger.log('Caché de consultas limpiado');
      }
    } catch (error) {
      this.logger.error('Error al optimizar la base de datos:', error);
    }
  }

  private scheduleConnectionHealthCheck() {
    // Verificar la salud de la conexión cada 15 minutos
    setInterval(async () => {
      const inactiveTime = Date.now() - this.lastQueryTime;
      
      // Si no ha habido consultas en 15 minutos, verificar la conexión
      if (inactiveTime > 15 * 60 * 1000) {
        const isConnected = await this.checkConnection();
        
        if (isConnected) {
          this.logger.debug('Conexión a la base de datos verificada y activa');
        } else {
          this.logger.warn('Conexión a la base de datos perdida, intentando reconectar...');
          try {
            await this.$disconnect();
            await this.$connect();
            this.connectionEstablished = true;
            this.logger.log('Reconexión a la base de datos exitosa');
          } catch (error) {
            this.logger.error('Error al reconectar a la base de datos:', error);
          }
        }
      }
      
      // Registrar estadísticas de consultas
      this.logger.log(`Estadísticas de consultas: Total: ${this.queryCount}, Lentas: ${this.slowQueryCount}`);
      
      // Registrar métricas más detalladas (top 5 consultas más lentas)
      const queryMetricsSorted = Object.entries(this.queryMetrics)
        .sort((a, b) => b[1].maxTime - a[1].maxTime)
        .slice(0, 5);
      
      if (queryMetricsSorted.length > 0) {
        this.logger.log('Top 5 consultas más lentas:');
        queryMetricsSorted.forEach(([key, metrics]) => {
          const avgTime = metrics.count > 0 ? metrics.totalTime / metrics.count : 0;
          this.logger.log(`- ${key}: máx ${metrics.maxTime.toFixed(2)}ms, promedio ${avgTime.toFixed(2)}ms, count: ${metrics.count}`);
        });
      }
    }, 15 * 60 * 1000); // 15 minutos
  }

  async onModuleDestroy() {
    this.logger.log('Desconectando de la base de datos...');
    await this.$disconnect();
    this.logger.log('Desconexión de la base de datos completada');
  }
  
  // Método para verificar la conexión
  async checkConnection(): Promise<boolean> {
    if (!this.connectionEstablished) {
      try {
        await this.$connect();
        this.connectionEstablished = true;
        return true;
      } catch (error) {
        this.logger.error('Error al reconectar a la base de datos:', error);
        return false;
      }
    }
    
    try {
      const startTime = performance.now();
      await this.$queryRaw`SELECT 1`;
      const duration = performance.now() - startTime;
      
      if (duration > 500) {
        this.logger.warn(`Conexión a la base de datos lenta: ${duration.toFixed(2)}ms`);
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error en la conexión a la base de datos:', error);
      this.connectionEstablished = false;
      return false;
    }
  }
  
  // Método para obtener estadísticas actuales de consultas
  getQueryStats() {
    return {
      queryCount: this.queryCount,
      slowQueryCount: this.slowQueryCount,
      lastQueryTime: this.lastQueryTime,
      topSlowQueries: Object.entries(this.queryMetrics)
        .sort((a, b) => b[1].maxTime - a[1].maxTime)
        .slice(0, 10)
        .map(([key, metrics]) => ({
          query: key,
          maxTime: metrics.maxTime,
          avgTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
          count: metrics.count
        }))
    };
  }
} 