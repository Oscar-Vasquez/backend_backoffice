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
exports.PaymentTypesController = void 0;
const common_1 = require("@nestjs/common");
const payment_types_service_1 = require("./payment-types.service");
let PaymentTypesController = class PaymentTypesController {
    constructor(paymentTypesService) {
        this.paymentTypesService = paymentTypesService;
        console.log('🚀 PaymentTypesController inicializado');
    }
    async getAllPaymentTypes(includeInactive) {
        try {
            const showInactive = includeInactive === 'true';
            console.log(`📋 Listando todos los métodos de pago (incluye inactivos: ${showInactive})`);
            const paymentTypes = await this.paymentTypesService.getAllPaymentTypes(showInactive);
            console.log(`✅ ${paymentTypes.length} métodos de pago listados exitosamente`);
            return paymentTypes;
        }
        catch (error) {
            console.error('❌ Error al listar métodos de pago:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener la lista de métodos de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPaymentTypeById(id) {
        try {
            console.log(`🔍 Buscando método de pago por ID: ${id}`);
            const paymentType = await this.paymentTypesService.getPaymentTypeById(id);
            console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
            return paymentType;
        }
        catch (error) {
            console.error(`❌ Error al buscar método de pago con ID ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener el método de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPaymentTypeByCode(code) {
        try {
            console.log(`🔍 Buscando método de pago por código: ${code}`);
            const paymentType = await this.paymentTypesService.getPaymentTypeByCode(code);
            console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
            return paymentType;
        }
        catch (error) {
            console.error(`❌ Error al buscar método de pago con código ${code}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener el método de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PaymentTypesController = PaymentTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentTypesController.prototype, "getAllPaymentTypes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentTypesController.prototype, "getPaymentTypeById", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentTypesController.prototype, "getPaymentTypeByCode", null);
exports.PaymentTypesController = PaymentTypesController = __decorate([
    (0, common_1.Controller)('payment-types'),
    __metadata("design:paramtypes", [payment_types_service_1.PaymentTypesService])
], PaymentTypesController);
//# sourceMappingURL=payment-types.controller.js.map