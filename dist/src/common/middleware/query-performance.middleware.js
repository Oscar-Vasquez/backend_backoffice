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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPerformanceMiddleware = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let QueryPerformanceMiddleware = class QueryPerformanceMiddleware {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger('QueryPerformance');
        this.SLOW_QUERY_THRESHOLD = this.configService.get('PRISMA_SLOW_QUERY_THRESHOLD', 500);
        this.enablePerformanceMonitoring = this.configService.get('ENABLE_PERFORMANCE_MONITORING', true);
        this.logger.log(`Middleware de monitoreo de consultas inicializado. Umbral: ${this.SLOW_QUERY_THRESHOLD}ms`);
    }
    use(req, res, next) {
        if (!this.enablePerformanceMonitoring) {
            return next();
        }
        const startTime = process.hrtime();
        const { method, originalUrl, query, body } = req;
        const endpoint = `${method} ${originalUrl}`;
        const measureQueryPerformance = async () => {
            try {
            }
            catch (error) {
                this.logger.error(`Error al medir rendimiento: ${error.message}`);
            }
        };
        measureQueryPerformance().catch(err => {
            this.logger.error(`Error en medición de rendimiento: ${err.message}`);
        });
        const logResponseTime = () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
            if (totalTimeMs > this.SLOW_QUERY_THRESHOLD * 2) {
                this.logger.warn(`Solicitud lenta (${totalTimeMs.toFixed(2)}ms): ${endpoint}`, {
                    queryParams: JSON.stringify(query),
                    bodyParams: method !== 'GET' ? JSON.stringify(body) : undefined,
                });
            }
            res.removeListener('finish', logResponseTime);
            res.removeListener('close', logResponseTime);
        };
        res.on('finish', logResponseTime);
        res.on('close', logResponseTime);
        next();
    }
};
exports.QueryPerformanceMiddleware = QueryPerformanceMiddleware;
exports.QueryPerformanceMiddleware = QueryPerformanceMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], QueryPerformanceMiddleware);
//# sourceMappingURL=query-performance.middleware.js.map