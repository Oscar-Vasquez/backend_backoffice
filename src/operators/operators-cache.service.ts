import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Operator } from './types';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  size: number;
  lastCleanup: number;
  lastPreload: number;
}

interface OperatorFilters {
  status?: string;
  role?: string;
  branch_id?: string;
  search?: string;
}

@Injectable()
export class OperatorsCacheService implements OnModuleInit {
  private readonly logger = new Logger(OperatorsCacheService.name);
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Tiempo de expiración predeterminado: 30 minutos (en ms)
  private readonly DEFAULT_TTL = 30 * 60 * 1000;
  
  // Tiempo de expiración para datos precargados: 2 horas
  private readonly PRELOAD_TTL = 2 * 60 * 60 * 1000;
  
  // Tamaño máximo de caché (número de entradas) - Aumentado para mejor rendimiento
  private readonly MAX_CACHE_SIZE = 5000;
  
  // Estadísticas de caché
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    size: 0,
    lastCleanup: Date.now(),
    lastPreload: 0
  };

  constructor(private readonly prisma: PrismaService) {
    // Limpiar caché expirada cada 5 minutos (reducido de cada minuto)
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
    
    // Registrar estadísticas cada 15 minutos (reducido de cada 5 minutos)
    setInterval(() => this.logCacheStats(), 15 * 60 * 1000);
    
    // Precargar datos cada 30 minutos (reducido de cada 15 minutos)
    setInterval(() => this.preloadOperators(), 30 * 60 * 1000);
    
    this.logger.log('Servicio de caché de operadores inicializado con configuración optimizada');
  }

  /**
   * Se ejecuta al iniciar el módulo
   */
  async onModuleInit() {
    this.logger.log('Servicio de caché de operadores inicializado');
    
    // Hacer una limpieza inicial
    this.cleanExpiredCache();
    
    // Precargar operadores al iniciar la aplicación
    try {
      await this.preloadOperators();
    } catch (error) {
      this.logger.error('Error al precargar operadores:', error);
    }
  }

  /**
   * Precarga todos los operadores en la caché
   */
  async preloadOperators(): Promise<void> {
    try {
      this.logger.log('Precargando operadores en caché...');
      const startTime = Date.now();
      
      // Obtener operadores activos primero (los más utilizados)
      const activeOperators = await this.prisma.operators.findMany({
        where: { status: 'active' },
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              address: true,
              province: true,
              city: true,
            }
          }
        },
        orderBy: { last_login_at: 'desc' },
        take: 100 // Aumentar de 50 a 100 para precargar más operadores
      });
      
      // Mapear y almacenar en caché con TTL extendido
      for (const operator of activeOperators) {
        const mappedOperator = this.mapOperatorFromPrisma(operator);
        const key = this.getOperatorCacheKey(operator.id);
        this.set(key, mappedOperator, this.PRELOAD_TTL);
      }
      
      // Precargar listas comunes (primeras páginas de consultas frecuentes)
      const commonQueries = [
        { page: 1, limit: 20, filters: { status: 'active' } as OperatorFilters },
        { page: 1, limit: 20, filters: { status: 'inactive' } as OperatorFilters },
        { page: 1, limit: 20, filters: { role: 'admin' } as OperatorFilters },
        { page: 1, limit: 20, filters: { role: 'staff' } as OperatorFilters },
        { page: 1, limit: 50, filters: {} as OperatorFilters } // Lista completa para selects
      ];
      
      for (const query of commonQueries) {
        const { page, limit, filters } = query;
        const cacheKey = this.getOperatorsListCacheKey(page, limit, filters);
        
        // Ejecutar la consulta y almacenar en caché
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.role) where.role = filters.role;
        if (filters?.branch_id) where.branch_id = filters.branch_id;
        
        const [operators, total] = await Promise.all([
          this.prisma.operators.findMany({
            where,
            include: {
              branches: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  province: true,
                  city: true,
                }
              }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' }
          }),
          this.prisma.operators.count({ where })
        ]);
        
        const mappedOperators = operators.map(op => this.mapOperatorFromPrisma(op));
        this.set(cacheKey, { operators: mappedOperators, total }, this.PRELOAD_TTL);
      }
      
      // Precargar actividades recientes para operadores activos
      for (const operator of activeOperators.slice(0, 10)) { // Solo los 10 más recientes
        const activitiesCacheKey = this.getOperatorActivitiesCacheKey(operator.id, 1, 20);
        
        const [activities, total] = await Promise.all([
          this.prisma.activities.findMany({
            where: { operator_id: operator.id },
            orderBy: { created_at: 'desc' },
            take: 20
          }),
          this.prisma.activities.count({ where: { operator_id: operator.id } })
        ]);
        
        this.set(activitiesCacheKey, { activities, total }, this.PRELOAD_TTL);
      }
      
      this.stats.lastPreload = Date.now();
      this.logger.log(`Precarga completada en ${Date.now() - startTime}ms. ${activeOperators.length} operadores en caché.`);
    } catch (error) {
      this.logger.error('Error al precargar operadores:', error);
    }
  }

  // Añadir método para mapear operadores desde Prisma
  private mapOperatorFromPrisma(operator: any): any {
    return {
      operatorId: operator.id,
      email: operator.email,
      firstName: operator.first_name,
      lastName: operator.last_name,
      phone: operator.phone,
      role: operator.role,
      status: operator.status,
      photo: operator.photo || '',
      branchReference: operator.branch_id,
      branchName: operator.branches?.name,
      branchAddress: operator.branches?.address,
      branchProvince: operator.branches?.province,
      branchCity: operator.branches?.city,
      type_operator_id: operator.type_operator_id,
      createdAt: operator.created_at,
      updatedAt: operator.updated_at,
      lastLoginAt: operator.last_login_at
    };
  }

  /**
   * Añade un elemento a una lista en caché
   */
  private appendToListCache(key: string, item: any): void {
    const list = this.get<any[]>(key) || [];
    
    // Verificar si el elemento ya existe en la lista
    const exists = list.some(existing => existing.operatorId === item.operatorId);
    
    if (!exists) {
      list.push(item);
      this.set(key, list, this.PRELOAD_TTL);
    }
  }

  /**
   * Obtiene un valor de la caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verificar si la entrada ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }
    
    this.stats.hits++;
    this.logger.debug(`Caché hit: ${key}`);
    return entry.data;
  }

  /**
   * Almacena un valor en la caché
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Si la caché está llena, eliminar las entradas más antiguas
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldEntries(Math.floor(this.MAX_CACHE_SIZE * 0.1)); // Eliminar el 10% más antiguo
    }
    
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
    
    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.logger.debug(`Caché set: ${key}`);
  }

  /**
   * Invalida una entrada específica de la caché
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.invalidations++;
      this.stats.size = this.cache.size;
    }
    this.logger.debug(`Caché invalidada: ${key}`);
  }

  /**
   * Invalida todas las entradas de la caché
   */
  invalidateAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
    this.stats.size = 0;
    this.logger.log('Caché completamente invalidada');
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
        this.logger.debug(`Caché invalidada por patrón: ${key}`);
      }
    }
    
    if (invalidatedCount > 0) {
      this.stats.invalidations += invalidatedCount;
      this.stats.size = this.cache.size;
      this.logger.debug(`Invalidadas ${invalidatedCount} entradas con patrón: ${pattern}`);
    }
  }

  /**
   * Obtiene una clave de caché para una consulta de operadores
   */
  getOperatorsListCacheKey(page: number, limit: number, filters?: OperatorFilters): string {
    return `operators:list:${page}:${limit}:${JSON.stringify(filters || {})}`;
  }

  /**
   * Obtiene una clave de caché para un operador específico
   */
  getOperatorCacheKey(operatorId: string): string {
    return `operator:${operatorId}`;
  }

  /**
   * Obtiene una clave de caché para actividades de un operador
   */
  getOperatorActivitiesCacheKey(operatorId: string, page: number, limit: number): string {
    return `operator:${operatorId}:activities:${page}:${limit}`;
  }

  /**
   * Obtiene estadísticas actuales de la caché
   */
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Verifica si una entrada de caché para un operador específico existe y no ha expirado
   * Si existe pero está a punto de expirar, renueva su tiempo de vida
   */
  verifyAndRenewOperatorCache(operatorId: string): boolean {
    const key = this.getOperatorCacheKey(operatorId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.logger.debug(`No existe caché para el operador ${operatorId}`);
      return false;
    }
    
    const now = Date.now();
    
    // Verificar si la entrada ha expirado
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.logger.debug(`Caché del operador ${operatorId} ha expirado y fue eliminada`);
      return false;
    }
    
    // Si la entrada está a menos de 5 minutos de expirar, renovarla
    const fiveMinutes = 5 * 60 * 1000;
    if (entry.expiresAt - now < fiveMinutes) {
      // Actualizar el tiempo de expiración
      const updatedEntry = { 
        ...entry, 
        expiresAt: now + this.DEFAULT_TTL
      };
      
      // Actualizar la entrada en el Map
      this.cache.set(key, updatedEntry);
      
      this.logger.debug(`Caché del operador ${operatorId} renovada por ${this.DEFAULT_TTL / 60000} minutos`);
    }
    
    return true;
  }

  /**
   * Limpia las entradas de caché expiradas
   * Esta función se ejecuta automáticamente cada 10 minutos
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  private cleanExpiredCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.stats.size = this.cache.size;
      this.stats.lastCleanup = now;
      this.logger.log(`Limpiadas ${expiredCount} entradas de caché expiradas`);
    } else {
      this.logger.debug('No se encontraron entradas de caché expiradas para limpiar');
    }
  }

  /**
   * Elimina las entradas más antiguas de la caché
   */
  private evictOldEntries(count: number): void {
    if (count <= 0 || this.cache.size === 0) return;
    
    // Obtener todas las entradas y ordenarlas por timestamp
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Eliminar las entradas más antiguas
    const toRemove = Math.min(count, entries.length);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    this.logger.debug(`Eliminadas ${toRemove} entradas antiguas de la caché`);
  }

  /**
   * Registra estadísticas de la caché
   */
  private logCacheStats(): void {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) 
      : '0';
    
    this.logger.log(`📊 Estadísticas de caché: ${this.stats.size} entradas, ${hitRate}% hit rate, ${this.stats.sets} sets, ${this.stats.invalidations} invalidaciones`);
  }
} 