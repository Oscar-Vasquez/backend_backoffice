"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OperatorsCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorsCacheService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let OperatorsCacheService = OperatorsCacheService_1 = class OperatorsCacheService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OperatorsCacheService_1.name);
        this.cache = new Map();
        this.DEFAULT_TTL = 30 * 60 * 1000;
        this.PRELOAD_TTL = 2 * 60 * 60 * 1000;
        this.MAX_CACHE_SIZE = 5000;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0,
            size: 0,
            lastCleanup: Date.now(),
            lastPreload: 0
        };
        setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
        setInterval(() => this.logCacheStats(), 15 * 60 * 1000);
        setInterval(() => this.preloadOperators(), 30 * 60 * 1000);
        this.logger.log('Servicio de caché de operadores inicializado con configuración optimizada');
    }
    async onModuleInit() {
        this.logger.log('Servicio de caché de operadores inicializado');
        this.cleanExpiredCache();
        try {
            await this.preloadOperators();
        }
        catch (error) {
            this.logger.error('Error al precargar operadores:', error);
        }
    }
    async preloadOperators() {
        try {
            this.logger.log('Precargando operadores en caché...');
            const startTime = Date.now();
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
                take: 100
            });
            for (const operator of activeOperators) {
                const mappedOperator = this.mapOperatorFromPrisma(operator);
                const key = this.getOperatorCacheKey(operator.id);
                this.set(key, mappedOperator, this.PRELOAD_TTL);
            }
            const commonQueries = [
                { page: 1, limit: 20, filters: { status: 'active' } },
                { page: 1, limit: 20, filters: { status: 'inactive' } },
                { page: 1, limit: 20, filters: { role: 'admin' } },
                { page: 1, limit: 20, filters: { role: 'staff' } },
                { page: 1, limit: 50, filters: {} }
            ];
            for (const query of commonQueries) {
                const { page, limit, filters } = query;
                const cacheKey = this.getOperatorsListCacheKey(page, limit, filters);
                const where = {};
                if (filters?.status)
                    where.status = filters.status;
                if (filters?.role)
                    where.role = filters.role;
                if (filters?.branch_id)
                    where.branch_id = filters.branch_id;
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
            for (const operator of activeOperators.slice(0, 10)) {
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
        }
        catch (error) {
            this.logger.error('Error al precargar operadores:', error);
        }
    }
    mapOperatorFromPrisma(operator) {
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
    appendToListCache(key, item) {
        const list = this.get(key) || [];
        const exists = list.some(existing => existing.operatorId === item.operatorId);
        if (!exists) {
            list.push(item);
            this.set(key, list, this.PRELOAD_TTL);
        }
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
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
    set(key, data, ttl = this.DEFAULT_TTL) {
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            this.evictOldEntries(Math.floor(this.MAX_CACHE_SIZE * 0.1));
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
    invalidate(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.invalidations++;
            this.stats.size = this.cache.size;
        }
        this.logger.debug(`Caché invalidada: ${key}`);
    }
    invalidateAll() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.invalidations += size;
        this.stats.size = 0;
        this.logger.log('Caché completamente invalidada');
    }
    invalidatePattern(pattern) {
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
    getOperatorsListCacheKey(page, limit, filters) {
        return `operators:list:${page}:${limit}:${JSON.stringify(filters || {})}`;
    }
    getOperatorCacheKey(operatorId) {
        return `operator:${operatorId}`;
    }
    getOperatorActivitiesCacheKey(operatorId, page, limit) {
        return `operator:${operatorId}:activities:${page}:${limit}`;
    }
    getCacheStats() {
        return { ...this.stats };
    }
    verifyAndRenewOperatorCache(operatorId) {
        const key = this.getOperatorCacheKey(operatorId);
        const entry = this.cache.get(key);
        if (!entry) {
            this.logger.debug(`No existe caché para el operador ${operatorId}`);
            return false;
        }
        const now = Date.now();
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.size = this.cache.size;
            this.logger.debug(`Caché del operador ${operatorId} ha expirado y fue eliminada`);
            return false;
        }
        const fiveMinutes = 5 * 60 * 1000;
        if (entry.expiresAt - now < fiveMinutes) {
            const updatedEntry = {
                ...entry,
                expiresAt: now + this.DEFAULT_TTL
            };
            this.cache.set(key, updatedEntry);
            this.logger.debug(`Caché del operador ${operatorId} renovada por ${this.DEFAULT_TTL / 60000} minutos`);
        }
        return true;
    }
    cleanExpiredCache() {
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
        }
        else {
            this.logger.debug('No se encontraron entradas de caché expiradas para limpiar');
        }
    }
    evictOldEntries(count) {
        if (count <= 0 || this.cache.size === 0)
            return;
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = Math.min(count, entries.length);
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        this.logger.debug(`Eliminadas ${toRemove} entradas antiguas de la caché`);
    }
    logCacheStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : '0';
        this.logger.log(`📊 Estadísticas de caché: ${this.stats.size} entradas, ${hitRate}% hit rate, ${this.stats.sets} sets, ${this.stats.invalidations} invalidaciones`);
    }
};
exports.OperatorsCacheService = OperatorsCacheService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OperatorsCacheService.prototype, "cleanExpiredCache", null);
exports.OperatorsCacheService = OperatorsCacheService = OperatorsCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OperatorsCacheService);
//# sourceMappingURL=operators-cache.service.js.map