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
var PackageNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageNotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../email/email.service");
const supabase_email_service_1 = require("../../email/supabase-email.service");
const notifications_service_1 = require("../../notifications/notifications.service");
let PackageNotificationService = PackageNotificationService_1 = class PackageNotificationService {
    constructor(prisma, emailService, supabaseEmailService, notificationsService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.supabaseEmailService = supabaseEmailService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(PackageNotificationService_1.name);
    }
    async notifyPackageArrival(packageId, useSupabase = false) {
        try {
            this.logger.log(`🔔 Notificando llegada del paquete: ${packageId}`);
            const packageData = await this.prisma.packages.findUnique({
                where: { id: packageId },
                include: {
                    users: true
                }
            });
            if (!packageData) {
                throw new Error(`Paquete con ID ${packageId} no encontrado`);
            }
            if (!packageData.user_reference || !packageData.users) {
                throw new Error(`El paquete ${packageId} no tiene un usuario asignado`);
            }
            if (!packageData.users.email) {
                throw new Error(`El usuario asignado al paquete ${packageId} no tiene email`);
            }
            const userData = {
                firstName: packageData.users.first_name || 'Cliente',
                lastName: packageData.users.last_name
            };
            let price = 0;
            if (packageData.declared_value) {
                price = parseFloat(packageData.declared_value.toString());
            }
            else if (packageData.weight && packageData.users.plan_id) {
                const userPlan = await this.prisma.plans.findUnique({
                    where: { id: packageData.users.plan_id }
                });
                if (userPlan && userPlan.price) {
                    const rate = parseFloat(userPlan.price.toString());
                    const weight = parseFloat(packageData.weight.toString());
                    price = rate * weight;
                }
            }
            const notificationData = {
                trackingNumber: packageData.tracking_number,
                weight: packageData.weight ? parseFloat(packageData.weight.toString()) : undefined,
                price,
                packageStatus: packageData.package_status,
                estimatedDeliveryDate: packageData.estimated_delivery_date
                    ? new Date(packageData.estimated_delivery_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : undefined
            };
            let emailResult;
            if (useSupabase) {
                emailResult = await this.supabaseEmailService.sendPackageArrivalEmail(packageData.users.email, userData, notificationData);
                if (emailResult.simulated) {
                    this.logger.warn(`⚠️ Correo simulado para ${packageData.tracking_number}: ${emailResult.error}`);
                }
                else if (emailResult.fallback) {
                    this.logger.warn(`⚠️ Correo enviado por método alternativo para ${packageData.tracking_number}: ${emailResult.message}`);
                }
            }
            else {
                emailResult = await this.emailService.sendPackageArrivalNotification(packageData.users.email, userData, notificationData);
            }
            const isEmailSuccessful = emailResult && (emailResult.success === true);
            await this.notificationsService.sendNotification(packageData.users.id, {
                type: 'package_arrival',
                title: '¡Tu paquete ha llegado!',
                message: `Tu paquete ${packageData.tracking_number} ha llegado a nuestras instalaciones.`,
                data: {
                    packageId: packageData.id,
                    trackingNumber: packageData.tracking_number,
                    price: price.toFixed(2),
                    status: packageData.package_status,
                    emailSent: isEmailSuccessful
                }
            });
            const notesContent = isEmailSuccessful
                ? `Notificación de llegada enviada: ${new Date().toISOString()}`
                : `Notificación de llegada registrada, pero el correo ${emailResult.simulated ? 'fue simulado' : 'no fue enviado'}: ${new Date().toISOString()}`;
            await this.prisma.packages.update({
                where: { id: packageId },
                data: {
                    notes: notesContent
                }
            });
            this.logger.log(`✅ Notificación de llegada enviada correctamente para el paquete ${packageData.tracking_number}`);
            return {
                success: true,
                packageId,
                trackingNumber: packageData.tracking_number,
                emailResult
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al notificar llegada del paquete: ${error.message}`);
            return {
                success: false,
                packageId,
                error: error.message
            };
        }
    }
    async notifyBulkPackageArrival(packageIds, useSupabase = false) {
        this.logger.log(`🔔 Notificando llegada de ${packageIds.length} paquetes`);
        const results = [];
        for (const packageId of packageIds) {
            try {
                const result = await this.notifyPackageArrival(packageId, useSupabase);
                results.push(result);
            }
            catch (error) {
                this.logger.error(`❌ Error al notificar paquete ${packageId}: ${error.message}`);
                results.push({
                    success: false,
                    packageId,
                    error: error.message
                });
            }
        }
        this.logger.log(`✅ Proceso de notificación masiva completado: ${results.filter(r => r.success).length}/${packageIds.length} exitosos`);
        return {
            total: packageIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results
        };
    }
};
exports.PackageNotificationService = PackageNotificationService;
exports.PackageNotificationService = PackageNotificationService = PackageNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        supabase_email_service_1.SupabaseEmailService,
        notifications_service_1.NotificationsService])
], PackageNotificationService);
//# sourceMappingURL=package-notification.service.js.map