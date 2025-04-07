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
exports.InvoiceController = void 0;
const common_1 = require("@nestjs/common");
const invoice_service_1 = require("./invoice.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const platform_express_1 = require("@nestjs/platform-express");
const email_service_1 = require("../email/email.service");
let InvoiceController = class InvoiceController {
    constructor(invoiceService, emailService) {
        this.invoiceService = invoiceService;
        this.emailService = emailService;
    }
    async create(createInvoiceDto) {
        console.log('🎯 POST /api/invoices');
        console.log('📦 Datos recibidos:', JSON.stringify(createInvoiceDto, null, 2));
        const result = await this.invoiceService.create(createInvoiceDto);
        console.log('✅ Factura creada con éxito:', JSON.stringify(result, null, 2));
        return result;
    }
    async findAll() {
        console.log('⚡ Intentando obtener todas las facturas');
        try {
            const result = await this.invoiceService.findAll();
            console.log('✅ Facturas obtenidas:', result.length);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw error;
        }
    }
    async findOne(id) {
        console.log(`🎯 GET /api/invoices/${id}`);
        const result = await this.invoiceService.findOne(id);
        console.log('✅ Factura encontrada:', JSON.stringify(result, null, 2));
        return result;
    }
    async updateStatus(id, updateData) {
        try {
            console.log('📦 Actualizando estado:', id, updateData.status);
            const result = await this.invoiceService.updateStatus(id, updateData.status);
            console.log('✅ Estado actualizado:', result);
            return result;
        }
        catch (error) {
            console.error('❌ Error al actualizar estado:', error);
            throw new common_1.HttpException(error.message || 'Error al actualizar el estado', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async remove(id) {
        console.log(`🎯 DELETE /api/invoices/${id}`);
        await this.invoiceService.remove(id);
        return { message: 'Factura eliminada correctamente' };
    }
    async sendInvoiceEmail(id, file, email) {
        console.log(`🎯 POST /api/invoices/${id}/send-email`);
        const invoice = await this.invoiceService.findOne(id);
        await this.emailService.sendInvoiceEmail(email, invoice.invoiceId, file.buffer);
        return { message: 'Email enviado exitosamente' };
    }
};
exports.InvoiceController = InvoiceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/send-email'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('pdf')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "sendInvoiceEmail", null);
exports.InvoiceController = InvoiceController = __decorate([
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService,
        email_service_1.EmailService])
], InvoiceController);
//# sourceMappingURL=invoice.controller.js.map