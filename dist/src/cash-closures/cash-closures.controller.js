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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosuresController = void 0;
const common_1 = require("@nestjs/common");
const cash_closures_service_1 = require("./cash-closures.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cash_closures_cron_1 = require("./cash-closures.cron");
let CashClosuresController = class CashClosuresController {
    constructor(cashClosuresService, cashClosuresCronService) {
        this.cashClosuresService = cashClosuresService;
        this.cashClosuresCronService = cashClosuresCronService;
        console.log('🚀 CashClosuresController inicializado');
    }
    async getCurrentCashClosure() {
        const current = await this.cashClosuresService.getCurrentCashClosure();
        return {
            success: true,
            data: current
        };
    }
    async getCashClosureHistory(page, limit, startDate, endDate, status) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        const history = await this.cashClosuresService.getCashClosureHistory({
            page: pageNumber,
            limit: limitNumber,
            startDate,
            endDate,
            status
        });
        return {
            success: true,
            ...history
        };
    }
    async closeCashClosure(req) {
        const userId = req.user.id;
        const closedCashClosure = await this.cashClosuresService.closeCashClosure(userId);
        return {
            success: true,
            message: 'Cierre de caja completado exitosamente',
            data: closedCashClosure
        };
    }
    async getTransactionsForCashClosure(id, page, limit) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 20;
        const transactions = await this.cashClosuresService.getTransactionsForCashClosure(id, pageNumber, limitNumber);
        return {
            success: true,
            ...transactions
        };
    }
    async testAutomaticClose(req) {
        console.log('🧪 Prueba de cierre automático de caja');
        const result = await this.cashClosuresService.automaticCloseCashClosure();
        return {
            success: !!result,
            message: result ? 'Cierre automático de caja ejecutado correctamente' : 'No se pudo ejecutar el cierre automático',
            data: result
        };
    }
    async testAutomaticOpen(req) {
        console.log('🧪 Prueba de apertura automática de caja');
        const result = await this.cashClosuresService.automaticOpenCashClosure();
        return {
            success: !!result,
            message: result ? 'Apertura automática de caja ejecutada correctamente' : 'No se pudo ejecutar la apertura automática',
            data: result
        };
    }
    async getAutomaticStatus() {
        console.log('🔍 Verificando estado de tareas automáticas');
        const result = await this.cashClosuresService.checkAndProcessAutomaticCashClosure();
        return {
            success: true,
            message: 'Estado de las tareas automáticas',
            data: {
                ...result,
                currentServerTime: new Date().toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                localTime: new Date().toLocaleString('es-PA', { timeZone: 'America/Panama' })
            }
        };
    }
    async getScheduleInfo() {
        console.log('🔍 Consultando información de las tareas programadas');
        const scheduleInfo = this.cashClosuresCronService.getNextScheduledExecutions();
        return {
            success: true,
            message: 'Información de las tareas programadas',
            data: scheduleInfo
        };
    }
};
exports.CashClosuresController = CashClosuresController;
__decorate([
    (0, common_1.Get)('current'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "getCurrentCashClosure", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "getCashClosureHistory", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "closeCashClosure", null);
__decorate([
    (0, common_1.Get)(':id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "getTransactionsForCashClosure", null);
__decorate([
    (0, common_1.Post)('test-auto-close'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "testAutomaticClose", null);
__decorate([
    (0, common_1.Post)('test-auto-open'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "testAutomaticOpen", null);
__decorate([
    (0, common_1.Get)('auto-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "getAutomaticStatus", null);
__decorate([
    (0, common_1.Get)('schedule-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresController.prototype, "getScheduleInfo", null);
exports.CashClosuresController = CashClosuresController = __decorate([
    (0, common_1.Controller)('cash-closures'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cash_closures_service_1.CashClosuresService,
        cash_closures_cron_1.CashClosuresCronService])
], CashClosuresController);
//# sourceMappingURL=cash-closures.controller.js.map