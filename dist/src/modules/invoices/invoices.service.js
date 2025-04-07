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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../firebase/firebase.service");
const activities_service_1 = require("../activities/activities.service");
const packages_service_1 = require("../../packages/packages.service");
const operator_activity_interface_1 = require("../activities/interfaces/operator-activity.interface");
let InvoicesService = class InvoicesService {
    constructor(firebaseService, activitiesService, packagesService) {
        this.firebaseService = firebaseService;
        this.activitiesService = activitiesService;
        this.packagesService = packagesService;
        this.COLLECTION = 'invoices';
    }
    async createInvoice(invoiceData, operatorData) {
        try {
            console.log('👤 Operador que crea la factura:', {
                operadorId: operatorData.id,
                email: operatorData.email
            });
            const operatorDoc = await this.firebaseService.findOne('operators', operatorData.id);
            if (!operatorDoc) {
                console.error('❌ Error: Operador no encontrado en la base de datos');
                throw new Error('Operador no encontrado');
            }
            console.log('ℹ️ Información del operador:', {
                id: operatorDoc.id,
                nombre: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                email: operatorDoc.email
            });
            const invoiceId = await this.firebaseService.create(this.COLLECTION, {
                ...invoiceData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: operatorData.id
            });
            console.log('📄 Factura creada:', {
                id: invoiceId,
                numero: invoiceData.invoice_number,
                cliente: invoiceData.customer_id,
                total: invoiceData.total_amount,
                createdBy: operatorData.id
            });
            const invoiceActivity = {
                operatorId: operatorData.id,
                operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                action: operator_activity_interface_1.ActivityAction.INVOICE_CREATED,
                description: `Factura ${invoiceData.invoice_number} creada para el cliente ${invoiceData.customer_id}`,
                entityType: 'invoice',
                entityId: invoiceId,
                metadata: {
                    invoiceId,
                    invoiceNumber: invoiceData.invoice_number,
                    customerId: invoiceData.customer_id,
                    totalAmount: invoiceData.total_amount,
                    itemsCount: invoiceData.invoice_items.length,
                    operatorEmail: operatorData.email
                },
                status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                timestamp: new Date().toISOString()
            };
            await this.activitiesService.createActivity(invoiceActivity);
            console.log('✅ Actividad de factura registrada:', invoiceActivity);
            console.log('📦 Actualizando estado de paquetes...');
            for (const item of invoiceData.invoice_items) {
                const trackingNumber = item.name.split(' - ')[1];
                if (trackingNumber) {
                    console.log(`🔄 Actualizando paquete ${trackingNumber} a INVOICED`);
                    await this.packagesService.updatePackageStatus(trackingNumber, 'INVOICED', operatorData);
                }
            }
            return { id: invoiceId, ...invoiceData };
        }
        catch (error) {
            console.error('❌ Error al crear la factura:', error);
            throw error;
        }
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        activities_service_1.ActivitiesService,
        packages_service_1.PackagesService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map