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
exports.PaymentTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentTypesService = class PaymentTypesService {
    constructor(prisma) {
        this.prisma = prisma;
        console.log('🚀 PaymentTypesService inicializado');
    }
    generateCodeFromName(name) {
        return name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    mapDatabaseToApiFormat(paymentType) {
        return {
            id: paymentType.id.toString(),
            name: paymentType.name,
            code: this.generateCodeFromName(paymentType.name),
            icon: paymentType.icon || null,
            description: paymentType.description || null,
            is_active: paymentType.is_active ?? true,
            processing_fee_percentage: paymentType.processing_fee_percentage?.toString() || '0',
            processing_fee_fixed: paymentType.processing_fee_fixed?.toString() || '0',
            requires_approval: paymentType.requires_approval ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
    async getAllPaymentTypes(includeInactive = false) {
        try {
            console.log(`🔍 Obteniendo métodos de pago (incluye inactivos: ${includeInactive})`);
            const paymentTypes = await this.prisma.payment_types.findMany({
                where: includeInactive ? {} : { is_active: true },
                orderBy: { name: 'asc' }
            });
            console.log(`✅ ${paymentTypes.length} métodos de pago encontrados`);
            return paymentTypes.map(type => this.mapDatabaseToApiFormat(type));
        }
        catch (error) {
            console.error('❌ Error al obtener métodos de pago:', error);
            throw new common_1.HttpException('Error al obtener métodos de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPaymentTypeById(id) {
        try {
            console.log(`🔍 Buscando método de pago con ID: ${id}`);
            const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
            const paymentType = await this.prisma.payment_types.findUnique({
                where: { id: numericId }
            });
            if (!paymentType) {
                console.log(`⚠️ Método de pago con ID ${id} no encontrado`);
                throw new common_1.HttpException(`Método de pago con ID ${id} no encontrado`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
            return this.mapDatabaseToApiFormat(paymentType);
        }
        catch (error) {
            console.error(`❌ Error al obtener método de pago con ID ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener método de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPaymentTypeByCode(code) {
        try {
            console.log(`🔍 Buscando método de pago con código: ${code}`);
            const paymentTypes = await this.prisma.payment_types.findMany({
                where: { is_active: true }
            });
            const mappedTypes = paymentTypes.map(type => this.mapDatabaseToApiFormat(type));
            const paymentType = mappedTypes.find(type => type.code === code);
            if (!paymentType) {
                console.log(`⚠️ Método de pago con código ${code} no encontrado o inactivo`);
                throw new common_1.HttpException(`Método de pago con código ${code} no encontrado o inactivo`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log(`✅ Método de pago encontrado: ${paymentType.name}`);
            return paymentType;
        }
        catch (error) {
            console.error(`❌ Error al obtener método de pago con código ${code}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener método de pago', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PaymentTypesService = PaymentTypesService;
exports.PaymentTypesService = PaymentTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentTypesService);
//# sourceMappingURL=payment-types.service.js.map