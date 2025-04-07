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
var SqlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_pool_config_1 = require("../config/pg-pool.config");
const perf_hooks_1 = require("perf_hooks");
let SqlService = SqlService_1 = class SqlService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SqlService_1.name);
        this.queryStats = {
            total: 0,
            slow: 0,
            errors: 0,
            lastSlowQuery: '',
            lastQueryTime: Date.now()
        };
        this.SLOW_QUERY_THRESHOLD = 500;
        this.pool = (0, pg_pool_config_1.createPgPool)(configService);
        this.pool.on('error', (err) => {
            this.logger.error(`Error inesperado en cliente inactivo: ${err.message}`, err.stack);
            this.queryStats.errors++;
        });
    }
    async onModuleInit() {
        this.logger.log('Inicializando servicio SQL');
        try {
            const startTime = perf_hooks_1.performance.now();
            const client = await this.pool.connect();
            const connectionTime = perf_hooks_1.performance.now() - startTime;
            if (connectionTime > 1000) {
                this.logger.warn(`Alta latencia detectada en la conexión: ${connectionTime.toFixed(2)}ms. Considere usar un DirectUrl o una conexión más cercana.`);
            }
            else {
                this.logger.log(`Conexión establecida en ${connectionTime.toFixed(2)}ms`);
            }
            const queryStartTime = perf_hooks_1.performance.now();
            await client.query('SELECT 1');
            const queryTime = perf_hooks_1.performance.now() - queryStartTime;
            if (queryTime > 200) {
                this.logger.warn(`Alta latencia detectada en consultas: ${queryTime.toFixed(2)}ms`);
            }
            else {
                this.logger.log(`Tiempo de consulta: ${queryTime.toFixed(2)}ms`);
            }
            client.release();
            this.logger.log('Conexión a la base de datos establecida correctamente');
            this.scheduleHealthCheck();
        }
        catch (error) {
            this.logger.error(`Error al conectar a la base de datos: ${error.message}`, error.stack);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log('Pool de base de datos cerrado');
    }
    async query(text, params = []) {
        const startTime = perf_hooks_1.performance.now();
        this.queryStats.total++;
        this.queryStats.lastQueryTime = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = perf_hooks_1.performance.now() - startTime;
            if (duration > this.SLOW_QUERY_THRESHOLD) {
                this.queryStats.slow++;
                this.queryStats.lastSlowQuery = this.truncateQuery(text);
                this.logger.warn(`Consulta lenta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`);
                if (duration > this.SLOW_QUERY_THRESHOLD * 3) {
                    this.logger.warn(`Consulta muy lenta (${duration.toFixed(2)}ms): ${text}\nParámetros: ${JSON.stringify(params)}`);
                }
            }
            else if (process.env.NODE_ENV === 'development') {
                this.logger.debug(`Consulta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`);
            }
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - startTime;
            this.queryStats.errors++;
            this.logger.error(`Error en consulta (${duration.toFixed(2)}ms): ${this.truncateQuery(text)}`, `Error: ${error.message}\nDetalles: ${JSON.stringify({
                code: error.code,
                params: params ? JSON.stringify(params).substring(0, 100) : 'none',
                constraint: error.constraint,
                detail: error.detail,
                table: error.table
            })}`);
            throw error;
        }
    }
    async getClient() {
        try {
            const startTime = perf_hooks_1.performance.now();
            const client = await this.pool.connect();
            const duration = perf_hooks_1.performance.now() - startTime;
            if (duration > 1000) {
                this.logger.warn(`Obtención de cliente lenta (${duration.toFixed(2)}ms)`);
            }
            return client;
        }
        catch (error) {
            this.logger.error(`Error al obtener cliente del pool: ${error.message}`, error.stack);
            this.queryStats.errors++;
            throw error;
        }
    }
    async transaction(callback, maxRetries = 3) {
        let retries = 0;
        while (true) {
            const client = await this.getClient();
            const startTime = perf_hooks_1.performance.now();
            try {
                await client.query('BEGIN');
                const result = await callback(client);
                await client.query('COMMIT');
                const duration = perf_hooks_1.performance.now() - startTime;
                if (duration > this.SLOW_QUERY_THRESHOLD) {
                    this.logger.warn(`Transacción lenta (${duration.toFixed(2)}ms)`);
                }
                return result;
            }
            catch (error) {
                await client.query('ROLLBACK');
                this.queryStats.errors++;
                const isTransient = this.isTransientError(error);
                if (isTransient && retries < maxRetries) {
                    retries++;
                    this.logger.warn(`Error transitorio en transacción, reintentando (${retries}/${maxRetries}): ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
                    continue;
                }
                this.logger.error(`Error en transacción: ${error.message}`, error.stack);
                throw error;
            }
            finally {
                client.release();
            }
        }
    }
    isTransientError(error) {
        const transientErrorCodes = [
            '40001',
            '40P01',
            '08006',
            '08003',
            '08004',
            '08007',
            '57P03',
            'XX000'
        ];
        return error.code && transientErrorCodes.includes(error.code);
    }
    scheduleHealthCheck() {
        setInterval(async () => {
            try {
                const client = await this.pool.connect();
                const startTime = perf_hooks_1.performance.now();
                await client.query('SELECT 1');
                const duration = perf_hooks_1.performance.now() - startTime;
                client.release();
                this.logger.log(`Estado de conexión: Activa (${duration.toFixed(2)}ms). ` +
                    `Estadísticas: ${this.queryStats.total} consultas, ` +
                    `${this.queryStats.slow} lentas, ${this.queryStats.errors} errores`);
                if (duration > 500) {
                    this.logger.warn(`Alta latencia detectada: ${duration.toFixed(2)}ms`);
                }
                if (this.queryStats.total > 10000) {
                    this.logger.log(`Reiniciando contador de estadísticas (total: ${this.queryStats.total})`);
                    this.queryStats.total = 0;
                    this.queryStats.slow = 0;
                    this.queryStats.errors = 0;
                }
            }
            catch (error) {
                this.logger.error(`Error en verificación de salud: ${error.message}`);
            }
        }, 5 * 60 * 1000);
    }
    truncateQuery(query) {
        return query.length > 100 ? `${query.substring(0, 100)}...` : query;
    }
};
exports.SqlService = SqlService;
exports.SqlService = SqlService = SqlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SqlService);
//# sourceMappingURL=sql.service.js.map