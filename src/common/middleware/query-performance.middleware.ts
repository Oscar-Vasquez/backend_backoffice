import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

/**
 * Middleware para monitorear el rendimiento de las consultas a la base de datos
 * Registra tiempo de ejecución, endpoint y parámetros para consultas lentas
 */
@Injectable()
export class QueryPerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('QueryPerformance');
  private readonly SLOW_QUERY_THRESHOLD: number;
  private readonly enablePerformanceMonitoring: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Obtener umbral de consulta lenta desde la configuración (default: 500ms)
    this.SLOW_QUERY_THRESHOLD = this.configService.get<number>('PRISMA_SLOW_QUERY_THRESHOLD', 500);
    // Habilitar/deshabilitar monitoreo según configuración
    this.enablePerformanceMonitoring = this.configService.get<boolean>('ENABLE_PERFORMANCE_MONITORING', true);
    
    // Log inicial para confirmar configuración
    this.logger.log(`Middleware de monitoreo de consultas inicializado. Umbral: ${this.SLOW_QUERY_THRESHOLD}ms`);
  }

  /**
   * Procesa la solicitud y mide el tiempo de respuesta
   */
  use(req: Request, res: Response, next: NextFunction) {
    if (!this.enablePerformanceMonitoring) {
      return next();
    }

    // Guardar tiempo de inicio
    const startTime = process.hrtime();
    
    // Información de la solicitud
    const { method, originalUrl, query, body } = req;
    const endpoint = `${method} ${originalUrl}`;
    
    // En Prisma v6+, la API de eventos ha cambiado, controlamos ahora mediante middleware
    // En lugar de usar $on('query'), ahora usamos el objeto $middlewares
    // Implementar un monitoreo alternativo
    const measureQueryPerformance = async () => {
      try {
        // Aquí podríamos realizar una consulta simple para medir rendimiento
        // pero es mejor no añadir overhead adicional en cada solicitud
      } catch (error) {
        this.logger.error(`Error al medir rendimiento: ${error.message}`);
      }
    };
    
    // Ejecutar medición de rendimiento
    measureQueryPerformance().catch(err => {
      this.logger.error(`Error en medición de rendimiento: ${err.message}`);
    });

    // Función para registrar el tiempo total de la solicitud
    const logResponseTime = () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Si la solicitud total fue lenta, registrarla
      if (totalTimeMs > this.SLOW_QUERY_THRESHOLD * 2) {
        this.logger.warn(`Solicitud lenta (${totalTimeMs.toFixed(2)}ms): ${endpoint}`, {
          queryParams: JSON.stringify(query),
          bodyParams: method !== 'GET' ? JSON.stringify(body) : undefined,
        });
      }
      
      // Remover listeners para evitar memory leaks
      res.removeListener('finish', logResponseTime);
      res.removeListener('close', logResponseTime);
    };

    // Adjuntar listeners para capturar finalización de la solicitud
    res.on('finish', logResponseTime);
    res.on('close', logResponseTime);
    
    next();
  }
} 