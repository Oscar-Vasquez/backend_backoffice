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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DashboardController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@nestjs/common");
let DashboardController = DashboardController_1 = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
        this.logger = new common_2.Logger(DashboardController_1.name);
        console.log('🚀 DashboardController inicializado');
    }
    async getPackageMetrics(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();
        return this.dashboardService.getPackageMetrics(start, end);
    }
    async getMetrics() {
        console.log('📊 Obteniendo métricas del dashboard...');
        const metrics = await this.dashboardService.getMetrics();
        console.log('✅ Métricas obtenidas:', metrics);
        return metrics;
    }
    async getBranchMetrics() {
        try {
            this.logger.log('📊 Obteniendo métricas por sucursal...');
            const metrics = await this.dashboardService.getBranchMetrics();
            if (!metrics || metrics.length === 0) {
                this.logger.warn('⚠️ No se encontraron métricas por sucursal');
                return [];
            }
            this.logger.log(`✅ Métricas obtenidas para ${metrics.length} sucursales`);
            return metrics;
        }
        catch (error) {
            this.logger.error('❌ Error al obtener métricas por sucursal:', error);
            throw new common_1.HttpException(error.message || 'Error al obtener métricas por sucursal', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getOperatorActivity() {
        try {
            this.logger.log('📊 Obteniendo actividad de operadores...');
            const activity = await this.dashboardService.getOperatorActivity();
            if (!activity || activity.length === 0) {
                this.logger.warn('⚠️ No se encontró actividad de operadores');
                return [];
            }
            this.logger.log(`✅ Actividad obtenida para ${activity.length} sucursales`);
            return activity;
        }
        catch (error) {
            this.logger.error('❌ Error al obtener actividad de operadores:', error);
            throw new common_1.HttpException(error.message || 'Error al obtener actividad de operadores', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('package-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas de paquetes por peso y cantidad' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métricas obtenidas exitosamente',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    mes: { type: 'string' },
                    cantidad: { type: 'number' },
                    pesoTotal: { type: 'number' }
                }
            }
        }
    }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getPackageMetrics", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas del dashboard' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métricas obtenidas exitosamente',
        schema: {
            type: 'object',
            properties: {
                paquetes: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        incremento: { type: 'number' },
                        desglose: {
                            type: 'object',
                            properties: {
                                entregados: { type: 'number' },
                                enProceso: { type: 'number' }
                            }
                        }
                    }
                },
                facturas: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        incremento: { type: 'number' },
                        montoTotal: { type: 'number' },
                        pendientes: { type: 'number' }
                    }
                },
                usuarios: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        incremento: { type: 'number' },
                        nuevos: { type: 'number' },
                        activos: { type: 'number' }
                    }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('branch-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas por sucursal' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métricas por sucursal obtenidas exitosamente'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Error interno del servidor'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBranchMetrics", null);
__decorate([
    (0, common_1.Get)('operator-activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener actividad de operadores por sucursal' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Actividad de operadores obtenida exitosamente'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOperatorActivity", null);
exports.DashboardController = DashboardController = DashboardController_1 = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map