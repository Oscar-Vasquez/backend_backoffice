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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const types_1 = require("./types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
        console.log('🚀 PaymentsController inicializado');
    }
    async processPayment(invoiceId, paymentData, req) {
        const requestId = Date.now().toString();
        console.log(`🔄 [${requestId}] Procesando pago en controlador:`, {
            invoiceId,
            amount: paymentData.amount,
            method: paymentData.method,
            amountReceived: paymentData.amountReceived,
            paymentMethodId: paymentData.paymentMethodId || '3e7a40e3-307d-4846-8f65-f4f1668bbfb3',
            isPartialPayment: paymentData.isPartialPayment,
            operador: {
                id: req.user.id,
                email: req.user.email
            }
        });
        try {
            const result = await this.paymentsService.processPayment(invoiceId, paymentData.amount, {
                method: paymentData.method,
                amountReceived: paymentData.amountReceived,
                paymentMethodId: paymentData.paymentMethodId || '3e7a40e3-307d-4846-8f65-f4f1668bbfb3',
                isPartialPayment: paymentData.isPartialPayment,
                requestId: requestId
            }, {
                id: req.user.id,
                email: req.user.email
            });
            console.log(`✅ [${requestId}] Pago procesado exitosamente:`, result);
            return result;
        }
        catch (error) {
            console.error(`❌ [${requestId}] Error al procesar pago:`, error);
            throw error;
        }
    }
    async getUserInvoices(userId) {
        try {
            console.log('🔍 Obteniendo facturas para usuario:', userId);
            const invoices = await this.paymentsService.getUserInvoices(userId);
            console.log('✅ Facturas obtenidas en controlador:', invoices.length);
            return {
                success: true,
                message: invoices.length > 0 ? 'Facturas encontradas' : 'No hay facturas para este usuario',
                invoices: invoices
            };
        }
        catch (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw error instanceof common_1.HttpException
                ? error
                : new common_1.HttpException({ message: 'Error al obtener las facturas', error: error instanceof Error ? error.message : 'Error desconocido' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPendingInvoices(search) {
        try {
            console.log('🔍 Buscando facturas pendientes:', search ? `con filtro: ${search}` : 'sin filtro');
            const invoices = await this.paymentsService.getPendingInvoices(search);
            console.log('✅ Facturas pendientes encontradas:', invoices.length);
            return {
                success: true,
                count: invoices.length,
                invoices
            };
        }
        catch (error) {
            console.error('Error al obtener facturas pendientes:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Error al obtener las facturas pendientes',
                details: error instanceof Error ? error.message : 'Error desconocido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEnums() {
        return {
            invoice_status_enum: client_1.invoice_status_enum,
            payment_method_enum: client_1.payment_method_enum,
            payment_status_enum: client_1.payment_status_enum,
            INVOICE_STATUS: types_1.INVOICE_STATUS
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(':invoiceId/process'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Get)('invoices/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getUserInvoices", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPendingInvoices", null);
__decorate([
    (0, common_1.Get)('enums'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getEnums", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map