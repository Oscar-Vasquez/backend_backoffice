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
var CashClosuresCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosuresCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cash_closures_service_1 = require("./cash-closures.service");
let CashClosuresCronService = CashClosuresCronService_1 = class CashClosuresCronService {
    constructor(cashClosuresService, schedulerRegistry) {
        this.cashClosuresService = cashClosuresService;
        this.schedulerRegistry = schedulerRegistry;
        this.logger = new common_1.Logger(CashClosuresCronService_1.name);
        this.logger.log('🚀 Servicio de cierres de caja automáticos inicializado');
    }
    async checkAndProcessAutomaticCashClosures() {
        this.logger.debug('Verificando si es momento de ejecutar operaciones automáticas de caja');
        try {
            const result = await this.cashClosuresService.checkAndProcessAutomaticCashClosure();
            if (result.action === 'close') {
                this.logger.log(`✅ Cierre de caja automático completado a las ${new Date().toLocaleTimeString()}`);
            }
            else if (result.action === 'open') {
                this.logger.log(`✅ Apertura de caja automática completada a las ${new Date().toLocaleTimeString()}`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Error en la verificación de operaciones automáticas de caja: ${error.message}`);
        }
    }
    async automaticCashClosure() {
        this.logger.log('⏰ Ejecutando cierre automático de caja (6:00 PM)');
        try {
            const result = await this.cashClosuresService.automaticCloseCashClosure();
            if (result) {
                this.logger.log(`✅ Cierre de caja automático completado correctamente. ID: ${result.id}`);
            }
            else {
                this.logger.warn('⚠️ No se pudo completar el cierre automático de caja');
            }
        }
        catch (error) {
            this.logger.error(`❌ Error en el cierre automático de caja: ${error.message}`);
        }
    }
    async automaticCashOpening() {
        this.logger.log('⏰ Ejecutando apertura automática de caja (9:00 AM)');
        try {
            const result = await this.cashClosuresService.automaticOpenCashClosure();
            if (result) {
                this.logger.log(`✅ Apertura de caja automática completada correctamente. ID: ${result.id}`);
            }
            else {
                this.logger.warn('⚠️ No se pudo completar la apertura automática de caja');
            }
        }
        catch (error) {
            this.logger.error(`❌ Error en la apertura automática de caja: ${error.message}`);
        }
    }
    getNextScheduledExecutions() {
        try {
            const cronJobs = this.schedulerRegistry.getCronJobs();
            const nextExecutions = {};
            for (const [name, job] of cronJobs.entries()) {
                if (name.includes('CashClosuresCronService')) {
                    const nextExecution = job.nextDate().toJSDate();
                    nextExecutions[name] = {
                        nextExecution,
                        nextExecutionLocal: nextExecution.toLocaleString('es-PA', { timeZone: 'America/Panama' }),
                        expression: job.cronTime.source
                    };
                }
            }
            return {
                success: true,
                currentTime: new Date().toISOString(),
                currentTimeLocal: new Date().toLocaleString('es-PA', { timeZone: 'America/Panama' }),
                timeZone: 'America/Panama',
                jobs: nextExecutions
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener información de las tareas programadas: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
};
exports.CashClosuresCronService = CashClosuresCronService;
__decorate([
    (0, schedule_1.Cron)('0 */5 * * * *', {
        timeZone: 'America/Panama'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresCronService.prototype, "checkAndProcessAutomaticCashClosures", null);
__decorate([
    (0, schedule_1.Cron)('0 0 18 * * *', {
        timeZone: 'America/Panama'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresCronService.prototype, "automaticCashClosure", null);
__decorate([
    (0, schedule_1.Cron)('0 0 9 * * *', {
        timeZone: 'America/Panama'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CashClosuresCronService.prototype, "automaticCashOpening", null);
exports.CashClosuresCronService = CashClosuresCronService = CashClosuresCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cash_closures_service_1.CashClosuresService,
        schedule_1.SchedulerRegistry])
], CashClosuresCronService);
//# sourceMappingURL=cash-closures.cron.js.map