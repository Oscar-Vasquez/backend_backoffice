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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const perf_hooks_1 = require("perf_hooks");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        const prismaConfig = configService.get('prisma');
        const dbConfig = configService.get('database');
        const directUrl = configService.get('database.directUrl');
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
            });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.connectionEstablished = false;
        this.lastQueryTime = Date.now();
        this.queryCount = 0;
        this.slowQueryCount = 0;
        this.queryMetrics = {};
        this.$use(async (params, next) => {
            this.queryCount++;
            this.lastQueryTime = Date.now();
            const queryKey = `${params.model}.${params.action}`;
            if (!this.queryMetrics[queryKey]) {
                this.queryMetrics[queryKey] = { count: 0, totalTime: 0, maxTime: 0 };
            }
            const startTime = perf_hooks_1.performance.now();
            const result = await next(params);
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - startTime;
            this.queryMetrics[queryKey].count++;
            this.queryMetrics[queryKey].totalTime += duration;
            this.queryMetrics[queryKey].maxTime = Math.max(this.queryMetrics[queryKey].maxTime, duration);
            const slowQueryThreshold = prismaConfig?.slowQueryThreshold || 500;
            if (duration > slowQueryThreshold) {
                this.slowQueryCount++;
                this.logger.warn(`Consulta lenta (${duration.toFixed(2)}ms): ${queryKey}`);
                if (duration > slowQueryThreshold * 2) {
                    this.logger.warn(`Detalles de consulta lenta: ${JSON.stringify({
                        model: params.model,
                        action: params.action,
                        args: params.args ? JSON.stringify(params.args).substring(0, 200) : 'none',
                        duration: `${duration.toFixed(2)}ms`,
                        threshold: `${slowQueryThreshold}ms`,
                        timestamp: new Date().toISOString()
                    })}`);
                }
            }
            return result;
        });
        this.$use(async (params, next) => {
            if (params.action === 'findMany' && params.args?.where) {
                if (prismaConfig?.queryLogging === 'debug') {
                    this.logger.debug(`Optimizando consulta: ${params.model}.${params.action}`);
                }
            }
            return next(params);
        });
    }
    async onModuleInit() {
        this.logger.log('Conectando a la base de datos...');
        const startTime = perf_hooks_1.performance.now();
        try {
            process.on('beforeExit', () => {
                this.$disconnect();
            });
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
            const connectionTime = perf_hooks_1.performance.now() - startTime;
            this.logger.log(`Conexión a la base de datos establecida en ${connectionTime.toFixed(2)}ms`);
            await this.optimizeDatabase();
            this.scheduleConnectionHealthCheck();
        }
        catch (error) {
            this.logger.error('Error al conectar a la base de datos:', error);
            throw error;
        }
    }
    async optimizeDatabase() {
        try {
            const lastAnalyze = this.configService.get('database.lastAnalyze') || 0;
            const analyzeInterval = 24 * 60 * 60 * 1000;
            if (Date.now() - lastAnalyze > analyzeInterval) {
                await this.$executeRawUnsafe('ANALYZE operators');
                await this.$executeRawUnsafe('ANALYZE activities');
                this.logger.log('Estadísticas de la base de datos actualizadas');
                await this.$executeRawUnsafe('DISCARD PLANS');
                await this.$executeRawUnsafe('DISCARD ALL');
                this.logger.log('Caché de consultas limpiado');
            }
        }
        catch (error) {
            this.logger.error('Error al optimizar la base de datos:', error);
        }
    }
    scheduleConnectionHealthCheck() {
        setInterval(async () => {
            const inactiveTime = Date.now() - this.lastQueryTime;
            if (inactiveTime > 15 * 60 * 1000) {
                const isConnected = await this.checkConnection();
                if (isConnected) {
                    this.logger.debug('Conexión a la base de datos verificada y activa');
                }
                else {
                    this.logger.warn('Conexión a la base de datos perdida, intentando reconectar...');
                    try {
                        await this.$disconnect();
                        await this.$connect();
                        this.connectionEstablished = true;
                        this.logger.log('Reconexión a la base de datos exitosa');
                    }
                    catch (error) {
                        this.logger.error('Error al reconectar a la base de datos:', error);
                    }
                }
            }
            this.logger.log(`Estadísticas de consultas: Total: ${this.queryCount}, Lentas: ${this.slowQueryCount}`);
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
        }, 15 * 60 * 1000);
    }
    async onModuleDestroy() {
        this.logger.log('Desconectando de la base de datos...');
        await this.$disconnect();
        this.logger.log('Desconexión de la base de datos completada');
    }
    async checkConnection() {
        if (!this.connectionEstablished) {
            try {
                await this.$connect();
                this.connectionEstablished = true;
                return true;
            }
            catch (error) {
                this.logger.error('Error al reconectar a la base de datos:', error);
                return false;
            }
        }
        try {
            const startTime = perf_hooks_1.performance.now();
            await this.$queryRaw `SELECT 1`;
            const duration = perf_hooks_1.performance.now() - startTime;
            if (duration > 500) {
                this.logger.warn(`Conexión a la base de datos lenta: ${duration.toFixed(2)}ms`);
            }
            return true;
        }
        catch (error) {
            this.logger.error('Error en la conexión a la base de datos:', error);
            this.connectionEstablished = false;
            return false;
        }
    }
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map