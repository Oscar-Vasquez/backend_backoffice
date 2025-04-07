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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const package_notification_service_1 = require("../packages/services/package-notification.service");
const supabase_email_service_1 = require("../email/supabase-email.service");
let InvoicesController = class InvoicesController {
    constructor(invoicesService, packageNotificationService, supabaseEmailService) {
        this.invoicesService = invoicesService;
        this.packageNotificationService = packageNotificationService;
        this.supabaseEmailService = supabaseEmailService;
    }
    async findAll() {
        try {
            console.log('🔍 Llegó petición GET a /invoices');
            const result = await this.invoicesService.findAll();
            console.log('✅ Facturas encontradas:', result.length);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw new common_1.HttpException({
                message: 'Error al obtener las facturas',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(data, req) {
        try {
            console.log('🔥 Llegó petición POST a /invoices');
            console.log('📦 Datos recibidos:', JSON.stringify(data, null, 2));
            console.log('📊 Campos específicos:', {
                price_plan: data.price_plan,
                price_plan_type: typeof data.price_plan,
                price_plan_value: data.price_plan !== undefined ? Number(data.price_plan) : undefined,
                shipping_insurance: data.shipping_insurance,
                shipping_insurance_type: typeof data.shipping_insurance,
                shipping_insurance_value: data.shipping_insurance === true,
            });
            if (!data.customer_id) {
                console.error('❌ Error: customer_id es requerido');
                throw new common_1.BadRequestException('El ID del cliente es requerido');
            }
            if (!data.invoice_items || data.invoice_items.length === 0) {
                console.error('❌ Error: se requiere al menos un item en la factura');
                throw new common_1.BadRequestException('Se requiere al menos un ítem en la factura');
            }
            for (const item of data.invoice_items) {
                if (!item.name || !item.quantity || !item.price) {
                    console.error('❌ Error: item inválido', item);
                    throw new common_1.BadRequestException('Todos los ítems deben tener nombre, cantidad y precio');
                }
            }
            const calculatedTotal = data.invoice_items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
                console.warn('⚠️ El total calculado no coincide con el total enviado');
                console.log(`Calculado: ${calculatedTotal}, Enviado: ${data.total_amount}`);
                data.total_amount = calculatedTotal;
            }
            const operatorData = {
                id: req.user.sub || req.user.id,
                email: req.user.email
            };
            console.log('👤 Operador:', operatorData);
            try {
                if (data.price_plan !== undefined) {
                    try {
                        data.price_plan = Number(data.price_plan);
                        if (isNaN(data.price_plan)) {
                            data.price_plan = 0;
                        }
                    }
                    catch (e) {
                        console.warn('Error al convertir price_plan a número, usando 0:', e);
                        data.price_plan = 0;
                    }
                }
                data.shipping_insurance = data.shipping_insurance === true;
                console.log('📊 Datos procesados antes de enviar al servicio:', {
                    price_plan: data.price_plan,
                    price_plan_type: typeof data.price_plan,
                    shipping_insurance: data.shipping_insurance,
                    shipping_insurance_type: typeof data.shipping_insurance,
                });
                const result = await this.invoicesService.createInvoice(data, operatorData);
                console.log('✅ Factura creada:', JSON.stringify(result, null, 2));
                console.log('📊 Campos específicos en la respuesta:', {
                    price_plan: result.price_plan,
                    price_plan_type: typeof result.price_plan,
                    shipping_insurance: result.shipping_insurance,
                    shipping_insurance_type: typeof result.shipping_insurance,
                });
                if (result && result.packageIds && result.packageIds.length > 0) {
                    console.log('📧 Enviando notificaciones de llegada para los paquetes:', result.packageIds);
                    try {
                        const notificationResult = await this.packageNotificationService.notifyBulkPackageArrival(result.packageIds, true);
                        console.log('📬 Resultado de las notificaciones de paquetes:', {
                            total: notificationResult.total,
                            successful: notificationResult.successful,
                            failed: notificationResult.failed
                        });
                        result.notifications = {
                            sent: notificationResult.successful,
                            total: notificationResult.total
                        };
                    }
                    catch (notificationError) {
                        console.error('⚠️ Error al enviar notificaciones de paquetes:', notificationError);
                        result.notifications = {
                            error: notificationError.message,
                            sent: 0,
                            total: result.packageIds.length
                        };
                    }
                }
                else {
                    console.log('⚠️ No hay paquetes asociados a la factura para notificar');
                    result.notifications = { sent: 0, total: 0 };
                }
                if (result && result.customer && result.customer.email) {
                    try {
                        console.log('📧 Enviando notificación de factura creada a:', result.customer.email);
                        const invoiceItems = result.items.map(item => ({
                            trackingNumber: item.trackingNumber,
                            description: item.description,
                            price: item.price,
                            quantity: item.quantity
                        }));
                        const emailResult = await this.supabaseEmailService.sendInvoiceCreationEmail(result.customer.email, {
                            firstName: result.customer.name.split(' ')[0],
                            lastName: result.customer.name.split(' ').slice(1).join(' ')
                        }, {
                            invoiceNumber: result.invoice_number,
                            totalAmount: parseFloat(result.total_amount.toString()),
                            issueDate: result.issue_date.toISOString(),
                            dueDate: result.due_date ? result.due_date.toISOString() : undefined,
                            items: invoiceItems
                        });
                        console.log('📬 Resultado de la notificación de factura:', {
                            success: emailResult.success,
                            method: emailResult.method,
                            fallback: emailResult.fallback,
                            simulated: emailResult.simulated
                        });
                        result.invoiceNotification = {
                            sent: emailResult.success,
                            method: emailResult.method,
                            fallback: emailResult.fallback || false,
                            simulated: emailResult.simulated || false
                        };
                    }
                    catch (invoiceEmailError) {
                        console.error('⚠️ Error al enviar notificación de factura:', invoiceEmailError);
                        result.invoiceNotification = {
                            sent: false,
                            error: invoiceEmailError.message
                        };
                    }
                }
                else {
                    console.warn('⚠️ No se puede enviar notificación de factura: falta email del cliente');
                    result.invoiceNotification = { sent: false, error: 'Cliente sin email' };
                }
                return result;
            }
            catch (serviceError) {
                console.error('❌ Error en el servicio de facturas:', serviceError);
                console.error('❌ Mensaje de error:', serviceError.message);
                console.error('❌ Detalles:', serviceError.stack);
                throw serviceError;
            }
        }
        catch (error) {
            console.error('❌ Error general en el controlador:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Error al crear la factura',
                error: error.message,
                details: error.response?.message || error.message
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async debugCreate(data, req) {
        console.log('🔬 DEPURACIÓN DE DATOS RECIBIDOS:');
        console.log('📦 Datos completos:', JSON.stringify(data, null, 2));
        console.log('🔎 Campos específicos:');
        console.log('  price_plan:', data.price_plan);
        console.log('  price_plan type:', typeof data.price_plan);
        console.log('  shipping_insurance:', data.shipping_insurance);
        console.log('  shipping_insurance type:', typeof data.shipping_insurance);
        console.log('🔑 Verificación de propiedades:');
        console.log('  price_plan en data:', 'price_plan' in data);
        console.log('  shipping_insurance en data:', 'shipping_insurance' in data);
        const serialized = JSON.stringify(data);
        console.log('📄 Datos serializados:', serialized);
        const deserialized = JSON.parse(serialized);
        console.log('📄 Datos deserializados:');
        console.log('  price_plan:', deserialized.price_plan);
        console.log('  price_plan type:', typeof deserialized.price_plan);
        console.log('  shipping_insurance:', deserialized.shipping_insurance);
        console.log('  shipping_insurance type:', typeof deserialized.shipping_insurance);
        return {
            success: true,
            message: 'Depuración completada',
            data: {
                received: {
                    price_plan: data.price_plan,
                    price_plan_type: typeof data.price_plan,
                    shipping_insurance: data.shipping_insurance,
                    shipping_insurance_type: typeof data.shipping_insurance
                },
                serialization_test: {
                    price_plan: deserialized.price_plan,
                    price_plan_type: typeof deserialized.price_plan,
                    shipping_insurance: deserialized.shipping_insurance,
                    shipping_insurance_type: typeof deserialized.shipping_insurance
                }
            }
        };
    }
    async updateStatus(id, status) {
        try {
            console.log('🔄 Actualizando estado de factura:', id, status);
            if (!status) {
                throw new common_1.BadRequestException('El estado es requerido');
            }
            const result = await this.invoicesService.updateStatus(id, status);
            console.log('✅ Estado actualizado:', result);
            return result;
        }
        catch (error) {
            console.error('❌ Error al actualizar estado:', error);
            throw new common_1.HttpException({
                message: 'Error al actualizar el estado de la factura',
                error: error.message
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async verifyPackage(tracking) {
        return this.invoicesService.verifyPackageStatus(tracking);
    }
    async sendInvoiceReminder(id, req) {
        try {
            console.log(`📧 Solicitud para enviar recordatorio de factura ${id} por operador ${req.user.sub}`);
            const invoice = await this.invoicesService.findInvoiceWithDetails(id);
            if (!invoice) {
                throw new common_1.BadRequestException(`Factura con ID ${id} no encontrada`);
            }
            if (!invoice.customer || !invoice.customer.email) {
                throw new common_1.BadRequestException('La factura no tiene un cliente válido con email');
            }
            const userData = {
                firstName: invoice.customer.firstName || invoice.customer.name?.split(' ')[0] || 'Cliente',
                lastName: invoice.customer.lastName || invoice.customer.name?.split(' ').slice(1).join(' ') || ''
            };
            const invoiceData = {
                invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || `INV-${id.slice(0, 8)}`,
                totalAmount: typeof invoice.amount === 'number' ? invoice.amount :
                    typeof invoice.totalAmount === 'number' ? invoice.totalAmount :
                        typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : 0,
                totalPackages: invoice.totalPackages || invoice.packages?.length || 0,
                issueDate: invoice.date || invoice.issue_date || new Date().toISOString()
            };
            const emailResult = await this.supabaseEmailService.sendInvoiceReminderEmail(invoice.customer.email, userData, invoiceData);
            await this.invoicesService.logReminderSent(id, req.user.sub, emailResult.success);
            return {
                success: true,
                message: 'Recordatorio enviado exitosamente',
                details: {
                    invoiceId: id,
                    sentTo: invoice.customer.email,
                    emailResult
                }
            };
        }
        catch (error) {
            console.error('❌ Error al enviar recordatorio de factura:', error);
            throw new common_1.HttpException({
                message: 'Error al enviar recordatorio',
                error: error.message,
                details: error.response?.message || error.message
            }, error instanceof common_1.BadRequestException ? common_1.HttpStatus.BAD_REQUEST : common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('debug'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "debugCreate", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('verify-package/:tracking'),
    __param(0, (0, common_1.Param)('tracking')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "verifyPackage", null);
__decorate([
    (0, common_1.Post)(':id/send-reminder'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "sendInvoiceReminder", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService,
        package_notification_service_1.PackageNotificationService,
        supabase_email_service_1.SupabaseEmailService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map