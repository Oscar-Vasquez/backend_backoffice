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
const notifications_service_1 = require("../notifications/notifications.service");
const activities_service_1 = require("../modules/activities/activities.service");
const operator_activity_interface_1 = require("../modules/activities/interfaces/operator-activity.interface");
const packages_service_1 = require("../packages/packages.service");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let InvoicesService = class InvoicesService {
    constructor(prisma, notificationsService, activitiesService, packagesService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.activitiesService = activitiesService;
        this.packagesService = packagesService;
    }
    async isPackageAlreadyInvoiced(trackingNumber) {
        try {
            console.log('🔍 Verificando si el paquete está facturado:', trackingNumber);
            const pkg = await this.prisma.packages.findFirst({
                where: {
                    tracking_number: trackingNumber
                }
            });
            if (!pkg) {
                console.log('⚠️ Paquete no encontrado:', trackingNumber);
                return { isInvoiced: false };
            }
            const invoicePackage = await this.prisma.invoice_packages.findFirst({
                where: {
                    package_id: pkg.id
                },
                include: {
                    invoices: true
                }
            });
            if (!invoicePackage) {
                console.log('✅ Paquete no facturado:', trackingNumber);
                return { isInvoiced: false };
            }
            console.log('🧾 Paquete ya facturado:', trackingNumber, 'Factura:', invoicePackage.invoice_id);
            return {
                isInvoiced: true,
                invoiceDetails: {
                    invoice_id: invoicePackage.invoice_id,
                    invoice_number: invoicePackage.invoices.invoice_number,
                    issue_date: invoicePackage.invoices.issue_date,
                    status: invoicePackage.invoices.status
                }
            };
        }
        catch (error) {
            console.error('❌ Error al verificar paquete facturado:', error);
            return { isInvoiced: false };
        }
    }
    async verifyPackageStatus(trackingNumber) {
        return this.isPackageAlreadyInvoiced(trackingNumber);
    }
    async createInvoice(createInvoiceDto, operatorData) {
        try {
            console.log('📝 Creando nueva factura...', {
                items: createInvoiceDto.invoice_items,
                total: createInvoiceDto.total_amount
            });
            const operator = await this.prisma.operators.findUnique({
                where: { id: operatorData.id }
            });
            if (!operator) {
                throw new common_1.BadRequestException('Operador no encontrado');
            }
            let user = await this.prisma.users.findUnique({
                where: { id: createInvoiceDto.customer_id },
                include: {
                    branches: true
                }
            });
            if (!user && createInvoiceDto.customer_id.length === 32) {
                try {
                    console.log('⚠️ Usuario no encontrado con ID alfanumérico, intentando convertir a formato UUID...');
                    const formattedUuid = `${createInvoiceDto.customer_id.slice(0, 8)}-${createInvoiceDto.customer_id.slice(8, 12)}-${createInvoiceDto.customer_id.slice(12, 16)}-${createInvoiceDto.customer_id.slice(16, 20)}-${createInvoiceDto.customer_id.slice(20)}`;
                    console.log('🔄 ID convertido a formato UUID:', formattedUuid);
                    user = await this.prisma.users.findUnique({
                        where: { id: formattedUuid },
                        include: {
                            branches: true
                        }
                    });
                    if (user) {
                        console.log('✅ Usuario encontrado con ID formateado a UUID:', user.id);
                    }
                    else {
                        console.log('❌ Usuario no encontrado ni con ID original ni con ID formateado');
                    }
                }
                catch (formatError) {
                    console.error('❌ Error al formatear ID como UUID:', formatError);
                }
            }
            if (!user) {
                throw new common_1.BadRequestException('Cliente no encontrado');
            }
            let prefix = 'INV';
            if (user.branch_id && user.branches) {
                if (user.branches.prefix) {
                    prefix = user.branches.prefix;
                }
            }
            let invoice_number = '';
            let isInvoiceNumberUnique = false;
            let attempts = 0;
            const maxAttempts = 5;
            while (!isInvoiceNumberUnique && attempts < maxAttempts) {
                attempts++;
                const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
                invoice_number = `${prefix}-${randomDigits}`;
                const existingInvoice = await this.prisma.invoices.findUnique({
                    where: {
                        invoice_number
                    }
                });
                if (!existingInvoice) {
                    isInvoiceNumberUnique = true;
                    console.log(`📄 Generando número de factura único: ${invoice_number} (Prefijo: ${prefix}, Intento: ${attempts})`);
                }
                else {
                    console.log(`⚠️ Número de factura ${invoice_number} ya existe, intentando nuevamente...`);
                }
            }
            if (!isInvoiceNumberUnique) {
                console.warn(`❌ No se pudo generar un número de factura único después de ${maxAttempts} intentos`);
                const timestamp = Date.now();
                invoice_number = `${prefix}-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
                console.log(`📄 Usando número de factura con timestamp: ${invoice_number}`);
            }
            const processedItems = createInvoiceDto.invoice_items.map(item => {
                const trackingNumber = item.name.split(' - ')[1]?.trim();
                const weightMatch = item.description.match(/Weight: ([\d.]+)lb/i);
                const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
                const rateMatch = item.description.match(/Rate: \$([\d.]+)/i);
                const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
                return {
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: parseFloat(item.price.toFixed(2)),
                    totalPrice: parseFloat((item.quantity * item.price).toFixed(2)),
                    trackingNumber,
                    weight,
                    rate
                };
            });
            const firstTrackingNumber = processedItems[0]?.trackingNumber || '';
            const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
            let invoiceStatus;
            const statusUpper = createInvoiceDto.status.toUpperCase();
            switch (statusUpper) {
                case 'DRAFT':
                    invoiceStatus = 'draft';
                    break;
                case 'SENT':
                    invoiceStatus = 'sent';
                    break;
                case 'PAID':
                    invoiceStatus = 'paid';
                    break;
                case 'PARTIAL':
                    invoiceStatus = 'partial';
                    break;
                case 'OVERDUE':
                    invoiceStatus = 'overdue';
                    break;
                case 'CANCELLED':
                case 'CANCELED':
                    invoiceStatus = 'cancelled';
                    break;
                default:
                    invoiceStatus = 'sent';
                    break;
            }
            console.log('📌 Valores originales de los campos:', {
                price_plan_raw: createInvoiceDto.price_plan,
                price_plan_type: typeof createInvoiceDto.price_plan,
                shipping_insurance_raw: createInvoiceDto.shipping_insurance,
                shipping_insurance_type: typeof createInvoiceDto.shipping_insurance
            });
            let pricePlan = 0;
            if (createInvoiceDto.price_plan !== undefined && createInvoiceDto.price_plan !== null) {
                try {
                    const numValue = Number(createInvoiceDto.price_plan);
                    pricePlan = !isNaN(numValue) ? numValue : 0;
                }
                catch (error) {
                    console.warn('⚠️ Error al convertir price_plan a número:', error);
                    pricePlan = 0;
                }
            }
            const hasShippingInsurance = createInvoiceDto.shipping_insurance === true;
            console.log('📊 Valores procesados para guardado:', {
                price_plan_raw: createInvoiceDto.price_plan,
                price_plan_processed: pricePlan,
                shipping_insurance_raw: createInvoiceDto.shipping_insurance,
                shipping_insurance_processed: hasShippingInsurance
            });
            const newInvoice = await this.prisma.$transaction(async (prisma) => {
                const invoice = await prisma.invoices.create({
                    data: {
                        invoice_number,
                        issue_date: new Date(createInvoiceDto.issue_date),
                        due_date: new Date(createInvoiceDto.due_date),
                        status: invoiceStatus,
                        is_paid: invoiceStatus === 'paid',
                        total_amount: new library_1.Decimal(totalAmount),
                        user_id: user.id,
                        branch_id: user.branch_id,
                        operator_id: operatorData.id,
                        notes: `Factura creada automáticamente para ${processedItems.length} paquete(s)`,
                        tracking_number: firstTrackingNumber,
                        invoice_type: 'package',
                        price_plan: new library_1.Decimal(pricePlan),
                        shipping_insurance: hasShippingInsurance
                    }
                });
                console.log('💾 Factura creada con datos adicionales:', {
                    price_plan: invoice.price_plan,
                    shipping_insurance: invoice.shipping_insurance
                });
                const invoicePackages = await Promise.all(processedItems.map(async (item) => {
                    if (item.trackingNumber) {
                        const pkg = await prisma.packages.findFirst({
                            where: { tracking_number: item.trackingNumber }
                        });
                        if (pkg) {
                            const invoicePackage = await prisma.invoice_packages.create({
                                data: {
                                    invoice_id: invoice.id,
                                    package_id: pkg.id
                                }
                            });
                            await prisma.packages.update({
                                where: { id: pkg.id },
                                data: { package_status: 'delivered' }
                            });
                            return invoicePackage;
                        }
                    }
                    return null;
                }));
                return { invoice, invoicePackages: invoicePackages.filter(Boolean) };
            });
            await this.activitiesService.createActivity({
                operatorId: operatorData.id,
                operatorName: `${operator.first_name || ''} ${operator.last_name || ''}`.trim(),
                action: operator_activity_interface_1.ActivityAction.INVOICE_CREATED,
                description: `Factura ${invoice_number} creada para el cliente ${user.first_name} ${user.last_name}`,
                entityType: 'invoice',
                entityId: newInvoice.invoice.id,
                metadata: {
                    invoiceId: newInvoice.invoice.id,
                    invoiceNumber: invoice_number,
                    customerId: user.id,
                    customerName: `${user.first_name} ${user.last_name}`,
                    totalAmount: totalAmount.toFixed(2),
                    itemsCount: processedItems.length,
                    items: processedItems.map(item => ({
                        tracking: item.trackingNumber,
                        price: item.price,
                        total: item.totalPrice
                    }))
                },
                status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                timestamp: new Date().toISOString()
            });
            try {
                if (user.email) {
                    await this.notificationsService.sendNotification(user.id, {
                        type: 'invoice_created',
                        title: `Nueva factura #${invoice_number} generada`,
                        message: `Se ha generado una nueva factura por ${totalAmount.toFixed(2)} USD`,
                        data: {
                            invoiceId: newInvoice.invoice.id,
                            invoiceNumber: invoice_number,
                            amount: totalAmount.toFixed(2),
                            dueDate: createInvoiceDto.due_date
                        }
                    });
                }
            }
            catch (notifyError) {
                console.error('⚠️ Error al notificar al cliente:', notifyError);
            }
            return {
                id: newInvoice.invoice.id,
                invoice_number: newInvoice.invoice.invoice_number,
                issue_date: newInvoice.invoice.issue_date,
                due_date: newInvoice.invoice.due_date,
                status: newInvoice.invoice.status,
                total_amount: newInvoice.invoice.total_amount,
                price_plan: newInvoice.invoice.price_plan ? Number(newInvoice.invoice.price_plan) : undefined,
                shipping_insurance: newInvoice.invoice.shipping_insurance || false,
                items: processedItems,
                customer: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email
                },
                packageIds: newInvoice.invoicePackages.map(ip => ip.package_id),
                invoiceNotification: { sent: false }
            };
        }
        catch (error) {
            console.error('❌ Error al crear la factura:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Error al crear la factura: ${error.message}`);
        }
    }
    async findAll() {
        try {
            const invoices = await this.prisma.invoices.findMany({
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            photo_url: true
                        }
                    },
                    invoice_packages: {
                        include: {
                            packages: {
                                select: {
                                    id: true,
                                    tracking_number: true,
                                    package_status: true,
                                    weight: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            return invoices.map(invoice => ({
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                status: invoice.status,
                total_amount: invoice.total_amount,
                is_paid: invoice.is_paid,
                price_plan: invoice.price_plan,
                shipping_insurance: invoice.shipping_insurance,
                customer: invoice.users ? {
                    id: invoice.users.id,
                    name: `${invoice.users.first_name} ${invoice.users.last_name}`,
                    email: invoice.users.email,
                    photo: invoice.users.photo_url
                } : null,
                packages: invoice.invoice_packages.map(ip => ({
                    id: ip.packages.id,
                    tracking_number: ip.packages.tracking_number,
                    status: ip.packages.package_status,
                    weight: ip.packages.weight
                }))
            }));
        }
        catch (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw new common_1.InternalServerErrorException(`Error al obtener facturas: ${error.message}`);
        }
    }
    async updateStatus(invoiceId, newStatus) {
        try {
            const validStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
            let status;
            switch (newStatus.toUpperCase()) {
                case 'DRAFT':
                    status = 'draft';
                    break;
                case 'SENT':
                    status = 'sent';
                    break;
                case 'PAID':
                    status = 'paid';
                    break;
                case 'PARTIAL':
                    status = 'partial';
                    break;
                case 'OVERDUE':
                    status = 'overdue';
                    break;
                case 'CANCELLED':
                case 'CANCELED':
                    status = 'cancelled';
                    break;
                default:
                    status = 'draft';
                    break;
            }
            if (!validStatuses.includes(status)) {
                throw new common_1.BadRequestException(`Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`);
            }
            const invoice = await this.prisma.invoices.findUnique({
                where: { id: invoiceId }
            });
            if (!invoice) {
                throw new common_1.NotFoundException(`Factura con ID ${invoiceId} no encontrada`);
            }
            const updateData = {
                status,
                updated_at: new Date()
            };
            if (status === 'paid') {
                updateData.is_paid = true;
            }
            else if (status === 'cancelled' || status === 'draft') {
                updateData.is_paid = false;
            }
            const updatedInvoice = await this.prisma.invoices.update({
                where: { id: invoiceId },
                data: updateData
            });
            return {
                id: updatedInvoice.id,
                status: updatedInvoice.status,
                is_paid: updatedInvoice.is_paid,
                updated_at: updatedInvoice.updated_at
            };
        }
        catch (error) {
            console.error('❌ Error al actualizar estado de factura:', error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Error al actualizar estado: ${error.message}`);
        }
    }
    async findById(id) {
        try {
            const invoice = await this.prisma.invoices.findUnique({
                where: { id },
                include: {
                    users: {
                        select: {
                            first_name: true,
                            last_name: true,
                            email: true,
                            photo_url: true
                        }
                    },
                    invoice_packages: {
                        include: {
                            packages: true
                        }
                    }
                }
            });
            if (!invoice) {
                throw new common_1.NotFoundException(`Factura con ID ${id} no encontrada`);
            }
            return {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                customer: invoice.users ? {
                    name: `${invoice.users.first_name} ${invoice.users.last_name}`,
                    email: invoice.users.email,
                    photo: invoice.users.photo_url
                } : undefined,
                issue_date: invoice.issue_date.toISOString(),
                due_date: invoice.due_date.toISOString(),
                total_amount: Number(invoice.total_amount),
                status: invoice.status,
                price_plan: invoice.price_plan ? Number(invoice.price_plan) : undefined,
                shipping_insurance: invoice.shipping_insurance || false
            };
        }
        catch (error) {
            console.error('❌ Error al buscar factura por ID:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Error al buscar factura: ${error.message}`);
        }
    }
    async findInvoiceWithDetails(id) {
        try {
            console.log(`🔍 Buscando factura con detalles para ID: ${id}`);
            const invoice = await this.prisma.invoices.findUnique({
                where: { id },
                include: {
                    invoice_items: true,
                    invoice_packages: {
                        include: {
                            packages: true
                        }
                    },
                    users: true
                }
            });
            if (invoice) {
                console.log('✅ Factura encontrada en Prisma');
                return {
                    id: invoice.id,
                    invoiceNumber: invoice.invoice_number,
                    amount: parseFloat(invoice.total_amount.toString()),
                    status: invoice.status,
                    date: invoice.issue_date.toISOString(),
                    dueDate: invoice.due_date?.toISOString(),
                    totalPackages: invoice.invoice_packages.length,
                    packages: invoice.invoice_packages.map(ip => ({
                        id: ip.packages.id,
                        trackingNumber: ip.packages.tracking_number,
                        status: ip.packages.package_status,
                        weight: parseFloat(ip.packages.weight?.toString() || '0')
                    })),
                    customer: {
                        id: invoice.users.id,
                        firstName: invoice.users.first_name,
                        lastName: invoice.users.last_name,
                        email: invoice.users.email,
                        photo: invoice.users.photo_url
                    }
                };
            }
            throw new common_1.NotFoundException(`Factura con ID ${id} no encontrada`);
        }
        catch (error) {
            console.error('❌ Error al buscar factura con detalles:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Error al buscar factura: ${error.message}`);
        }
    }
    async logReminderSent(invoiceId, operatorId, success) {
        try {
            console.log(`📝 Registrando envío de recordatorio para factura ${invoiceId} por operador ${operatorId}`);
            const action = operator_activity_interface_1.ActivityAction.INVOICE_CREATED;
            await this.activitiesService.createActivity({
                operatorId,
                operatorName: 'Operador',
                action,
                description: `Recordatorio de factura ${invoiceId} enviado al cliente`,
                entityType: 'invoice',
                entityId: invoiceId,
                metadata: {
                    invoiceId,
                    sentAt: new Date().toISOString(),
                    success
                },
                status: success ? operator_activity_interface_1.ActivityStatus.COMPLETED : operator_activity_interface_1.ActivityStatus.FAILED,
                timestamp: new Date().toISOString()
            });
            console.log('✅ Recordatorio registrado correctamente');
        }
        catch (error) {
            console.error('❌ Error al registrar recordatorio:', error);
        }
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        activities_service_1.ActivitiesService,
        packages_service_1.PackagesService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map