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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activities_service_1 = require("../modules/activities/activities.service");
const transactions_service_1 = require("../transactions/transactions.service");
const types_1 = require("./types");
const operator_activity_interface_1 = require("../modules/activities/interfaces/operator-activity.interface");
const client_1 = require("@prisma/client");
let PaymentsService = class PaymentsService {
    constructor(prisma, activitiesService, transactionsService) {
        this.prisma = prisma;
        this.activitiesService = activitiesService;
        this.transactionsService = transactionsService;
        console.log('🚀 PaymentsService inicializado');
    }
    async onModuleInit() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            console.log('✅ Conexión a la base de datos verificada');
            const invoicesCount = await this.prisma.invoices.count();
            const paymentsCount = await this.prisma.payments.count();
            console.log('📁 Tabla invoices accesible. Registros:', invoicesCount);
            console.log('📁 Tabla payments accesible. Registros:', paymentsCount);
        }
        catch (error) {
            console.error('❌ Error al verificar tablas en la base de datos:', error);
        }
    }
    async processPayment(invoiceId, amount, paymentDetails, operatorData) {
        const requestId = paymentDetails.requestId || 'no-id';
        console.log(`🔄 [${requestId}] Procesando pago:`, {
            invoiceId,
            amount,
            paymentDetails: {
                method: paymentDetails.method,
                amountReceived: paymentDetails.amountReceived,
                paymentMethodId: paymentDetails.paymentMethodId,
                isPartialPayment: paymentDetails.isPartialPayment
            },
            operador: {
                id: operatorData.id,
                email: operatorData.email
            }
        });
        try {
            const invoiceData = await this.prisma.invoices.findUnique({
                where: { id: invoiceId },
                include: {
                    payments: true
                }
            });
            if (!invoiceData) {
                throw new Error('Factura no encontrada');
            }
            console.log(`🔍 [${requestId}] DATOS DE PAGOS RECIBIDOS:`, {
                invoice_id: invoiceId,
                total_payments: invoiceData.payments.length,
                all_payments: invoiceData.payments.map(p => ({
                    id: p.id,
                    amount: Number(p.amount),
                    status: p.status,
                    date: p.payment_date
                }))
            });
            const operatorInfo = await this.prisma.operators.findUnique({
                where: { id: operatorData.id },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            });
            if (!operatorInfo) {
                throw new common_1.HttpException({
                    message: 'Operador no encontrado',
                    details: 'No se encontró el operador que intenta procesar el pago'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            if (invoiceData.status === client_1.invoice_status_enum.paid || invoiceData.is_paid === true) {
                console.log('❌ La factura ya está pagada:', {
                    status: invoiceData.status,
                    isPaid: invoiceData.is_paid,
                    invoiceId: invoiceId
                });
                throw new common_1.HttpException({
                    message: 'Factura ya pagada',
                    details: 'Esta factura ya ha sido pagada anteriormente'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const invoiceAmount = Number(invoiceData.total_amount);
            const previousPaidAmount = invoiceData.payments
                .filter(payment => payment.status === client_1.payment_status_enum.completed)
                .reduce((total, payment) => {
                console.log(`📊 [${requestId}] Pago previo:`, {
                    id: payment.id,
                    amount: Number(payment.amount),
                    status: payment.status,
                    date: payment.payment_date
                });
                return total + Number(payment.amount);
            }, 0);
            const remainingAmount = invoiceAmount - previousPaidAmount;
            console.log(`💰 [${requestId}] Montos:`, {
                amountToPayNow: amount,
                totalInvoiceAmount: invoiceAmount,
                pagosPrevios: invoiceData.payments.length,
                pagosPreviosCompletados: invoiceData.payments.filter(p => p.status === client_1.payment_status_enum.completed).length,
                previousPaidAmount: previousPaidAmount,
                remainingAmount: remainingAmount,
                isPartialPayment: paymentDetails.isPartialPayment
            });
            if (amount > remainingAmount) {
                throw new common_1.HttpException({
                    message: '¡Monto excede lo pendiente! 🚫',
                    details: `El monto del pago ($${amount}) es mayor que el monto restante por pagar ($${remainingAmount})`
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const paymentMethod = this.convertToPaymentMethodEnum(paymentDetails.method);
            const FIXED_PAYMENT_METHOD_ID = '3e7a40e3-307d-4846-8f65-f4f1668bbfb3';
            const paymentMethodId = paymentDetails.paymentMethodId || FIXED_PAYMENT_METHOD_ID;
            return await this.prisma.$transaction(async (tx) => {
                const payment = await tx.payments.create({
                    data: {
                        invoice_id: invoiceId,
                        amount: amount,
                        payment_method: paymentMethod,
                        payment_method_id: paymentMethodId,
                        status: client_1.payment_status_enum.completed,
                        payment_date: new Date(),
                        payer_details: {
                            method: paymentDetails.method,
                            amountReceived: paymentDetails.amountReceived,
                            processedBy: operatorData.id,
                            paymentMethodId: paymentMethodId,
                            isPartialPayment: paymentDetails.isPartialPayment
                        }
                    }
                });
                const FIXED_CATEGORY_ID = '1828014d-5e86-4007-b92d-1ee75828dbce';
                const FIXED_TRANSACTION_TYPE_ID = '0d0d364e-f554-4d08-937d-61c499936b1d';
                const transaction = await this.transactionsService.createTransaction({
                    description: `${paymentDetails.isPartialPayment ? 'Pago parcial' : 'Pago'} de factura #${invoiceData.invoice_number || invoiceId.substring(0, 8)}`,
                    status: 'completed',
                    transactionType: 'payment',
                    entityType: 'invoice',
                    entityId: invoiceId,
                    referenceId: payment.id,
                    metadata: {
                        invoiceId,
                        invoiceNumber: invoiceData.invoice_number,
                        amount,
                        paymentMethod: paymentDetails.method,
                        paymentMethodId: paymentMethodId,
                        paymentId: payment.id,
                        amountReceived: paymentDetails.amountReceived,
                        isPartialPayment: paymentDetails.isPartialPayment,
                        previousPaidAmount: previousPaidAmount,
                        totalPaidAmount: previousPaidAmount + amount,
                        remainingAmount: remainingAmount - amount,
                        totalInvoiceAmount: invoiceAmount,
                        processedBy: {
                            id: operatorData.id,
                            name: `${operatorInfo.first_name} ${operatorInfo.last_name}`,
                            email: operatorInfo.email
                        },
                        changeAmount: paymentDetails.amountReceived - amount,
                        paymentDate: new Date().toISOString()
                    },
                    amount: amount,
                    paymentMethodId: paymentMethodId,
                    categoryId: FIXED_CATEGORY_ID,
                    transactionTypeId: FIXED_TRANSACTION_TYPE_ID
                });
                console.log('✅ Transacción creada:', transaction.id);
                await tx.payments.update({
                    where: { id: payment.id },
                    data: {
                        transaction_id: transaction.id
                    }
                });
                const totalPaidAmount = previousPaidAmount + amount;
                const isAmountFullyPaid = Math.abs(totalPaidAmount - invoiceAmount) < 0.01;
                let isFullyPaid = false;
                if (isAmountFullyPaid) {
                    isFullyPaid = true;
                }
                else if (paymentDetails.isPartialPayment === true) {
                    isFullyPaid = false;
                }
                else {
                    isFullyPaid = Math.abs(totalPaidAmount - invoiceAmount) < 0.01;
                }
                console.log('💳 Detalles de pago:', {
                    isPartialPayment: paymentDetails.isPartialPayment,
                    calculatedIsFullyPaid: Math.abs(totalPaidAmount - invoiceAmount) < 0.01,
                    isAmountFullyPaid,
                    finalIsFullyPaid: isFullyPaid,
                    totalPaidAmount,
                    invoiceAmount,
                    previousPaidAmount,
                    currentAmount: amount,
                    remainingAmount: invoiceAmount - totalPaidAmount
                });
                const updatedInvoice = await tx.invoices.update({
                    where: { id: invoiceId },
                    data: {
                        status: isFullyPaid ? client_1.invoice_status_enum.paid : client_1.invoice_status_enum.partial,
                        is_paid: isFullyPaid,
                        paid_amount: totalPaidAmount,
                        remaining_amount: invoiceAmount - totalPaidAmount,
                        last_payment_date: new Date()
                    }
                });
                const activity = {
                    operatorId: operatorData.id,
                    operatorName: `${operatorInfo.first_name} ${operatorInfo.last_name}`,
                    action: operator_activity_interface_1.ActivityAction.PAYMENT_PROCESSED,
                    description: `${isFullyPaid ? 'Pago completo' : 'Pago parcial'} procesado para factura ${invoiceId} por ${amount} (${paymentDetails.method})`,
                    entityType: 'invoice',
                    entityId: invoiceId,
                    metadata: {
                        invoiceId,
                        amount,
                        paymentMethod: paymentDetails.method,
                        transactionId: transaction.id,
                        isPartialPayment: !isFullyPaid,
                        paidAmount: totalPaidAmount,
                        remainingAmount: invoiceAmount - totalPaidAmount,
                        processedBy: {
                            id: operatorData.id,
                            name: `${operatorInfo.first_name} ${operatorInfo.last_name}`
                        }
                    },
                    status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                    timestamp: new Date().toISOString()
                };
                console.log('📝 Intentando crear actividad:', activity);
                try {
                    await this.activitiesService.createActivity(activity);
                    console.log('✅ Actividad creada exitosamente');
                }
                catch (activityError) {
                    console.error('⚠️ Error al crear actividad:', activityError);
                }
                return {
                    success: true,
                    transactionId: transaction.id,
                    paymentId: payment.id,
                    message: isFullyPaid ? 'Pago completo procesado correctamente' : 'Pago parcial procesado correctamente',
                    isPartialPayment: !isFullyPaid,
                    paidAmount: totalPaidAmount,
                    remainingAmount: invoiceAmount - totalPaidAmount
                };
            });
        }
        catch (error) {
            console.error('❌ Error al procesar pago:', error);
            throw error instanceof common_1.HttpException
                ? error
                : new common_1.HttpException({ message: error instanceof Error ? error.message : 'Error al procesar el pago' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserInvoices(userId) {
        try {
            console.log('🔍 Buscando facturas del usuario:', userId);
            if (!userId?.trim()) {
                throw new common_1.HttpException({
                    message: 'ID de usuario inválido',
                    details: 'El ID del usuario es requerido'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true
                }
            });
            if (!user) {
                console.log('❌ Usuario no encontrado:', userId);
                return [];
            }
            console.log('👤 Usuario encontrado:', {
                id: userId,
                nombre: `${user.first_name} ${user.last_name}`,
                email: user.email
            });
            const partialsWithNoRemaining = await this.prisma.invoices.findMany({
                where: {
                    user_id: userId,
                    status: client_1.invoice_status_enum.partial,
                    remaining_amount: {
                        lte: 0.01
                    }
                },
                select: { id: true }
            });
            if (partialsWithNoRemaining.length > 0) {
                console.log(`🔄 Actualizando ${partialsWithNoRemaining.length} facturas del usuario que estaban en estado PARCIAL pero ya no tienen saldo pendiente`);
                const ids = partialsWithNoRemaining.map(inv => inv.id);
                await this.prisma.invoices.updateMany({
                    where: { id: { in: ids } },
                    data: {
                        status: client_1.invoice_status_enum.paid,
                        is_paid: true
                    }
                });
                console.log(`✅ ${partialsWithNoRemaining.length} facturas del usuario actualizadas a estado PAGADO`);
            }
            const invoices = await this.prisma.invoices.findMany({
                where: { user_id: userId },
                include: {
                    invoice_packages: {
                        include: {
                            packages: {
                                select: {
                                    id: true,
                                    tracking_number: true,
                                    package_status: true,
                                    shipping_stages: true,
                                    position: true
                                }
                            }
                        }
                    },
                    payments: true
                },
                orderBy: {
                    issue_date: 'desc'
                }
            });
            console.log('📊 Total de facturas encontradas:', invoices.length);
            if (invoices.length === 0) {
                console.log('ℹ️ No se encontraron facturas para el usuario');
                return [];
            }
            return invoices.map(invoice => {
                let invoiceStatus = types_1.INVOICE_STATUS.PENDING;
                if (invoice.is_paid || invoice.status === client_1.invoice_status_enum.paid) {
                    invoiceStatus = types_1.INVOICE_STATUS.PAID;
                }
                else if (invoice.status === client_1.invoice_status_enum.partial ||
                    (invoice.paid_amount && Number(invoice.paid_amount) > 0)) {
                    invoiceStatus = types_1.INVOICE_STATUS.PARTIAL;
                }
                return {
                    id: invoice.id,
                    userId: invoice.user_id,
                    amount: Number(invoice.total_amount),
                    status: invoiceStatus,
                    date: invoice.issue_date.toISOString(),
                    description: invoice.notes || '',
                    paymentDate: invoice.payments && invoice.payments.length > 0
                        ? invoice.payments[0].payment_date.toISOString()
                        : undefined,
                    transactionId: invoice.payments && invoice.payments.length > 0
                        ? invoice.payments[0].id
                        : undefined,
                    userName: `${user.first_name} ${user.last_name}`,
                    userEmail: user.email,
                    invoiceNumber: invoice.invoice_number,
                    dueDate: invoice.due_date.toISOString(),
                    totalAmount: Number(invoice.total_amount),
                    taxAmount: Number(invoice.tax_amount || 0),
                    discountAmount: Number(invoice.discount_amount || 0),
                    currency: invoice.currency || 'USD',
                    packages: invoice.invoice_packages.map(ip => {
                        return {
                            id: ip.packages.id,
                            trackingNumber: ip.packages.tracking_number || '',
                            status: ip.packages.package_status,
                            position: this.getPackagePosition(ip.packages)
                        };
                    })
                };
            });
        }
        catch (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw error instanceof common_1.HttpException
                ? error
                : new common_1.HttpException({ message: error instanceof Error ? error.message : 'Error al obtener facturas' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPendingInvoices(search) {
        try {
            console.log('🔍 Buscando facturas pendientes:', search ? `con filtro: ${search}` : 'sin filtro');
            const partialsWithNoRemaining = await this.prisma.invoices.findMany({
                where: {
                    status: client_1.invoice_status_enum.partial,
                    remaining_amount: {
                        lte: 0.01
                    }
                },
                select: { id: true }
            });
            if (partialsWithNoRemaining.length > 0) {
                console.log(`🔄 Actualizando ${partialsWithNoRemaining.length} facturas que estaban en estado PARCIAL pero ya no tienen saldo pendiente`);
                const ids = partialsWithNoRemaining.map(inv => inv.id);
                await this.prisma.invoices.updateMany({
                    where: { id: { in: ids } },
                    data: {
                        status: client_1.invoice_status_enum.paid,
                        is_paid: true
                    }
                });
                console.log(`✅ ${partialsWithNoRemaining.length} facturas actualizadas a estado PAGADO`);
            }
            const whereClause = {
                is_paid: false,
                status: {
                    not: client_1.invoice_status_enum.paid
                }
            };
            if (search) {
                whereClause.OR = [
                    { invoice_number: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                    {
                        users: {
                            OR: [
                                { first_name: { contains: search, mode: 'insensitive' } },
                                { last_name: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } }
                            ]
                        }
                    }
                ];
            }
            const invoices = await this.prisma.invoices.findMany({
                where: whereClause,
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    },
                    invoice_packages: {
                        include: {
                            packages: {
                                select: {
                                    id: true,
                                    tracking_number: true,
                                    package_status: true,
                                    shipping_stages: true,
                                    position: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    issue_date: 'desc'
                },
                take: 100
            });
            console.log('📊 Total de facturas pendientes encontradas:', invoices.length);
            return invoices.map(invoice => {
                let invoiceStatus = types_1.INVOICE_STATUS.PENDING;
                if (invoice.is_paid || invoice.status === client_1.invoice_status_enum.paid) {
                    invoiceStatus = types_1.INVOICE_STATUS.PAID;
                }
                else if (invoice.status === client_1.invoice_status_enum.partial ||
                    (invoice.paid_amount && Number(invoice.paid_amount) > 0)) {
                    invoiceStatus = types_1.INVOICE_STATUS.PARTIAL;
                    console.log(`📝 Factura ${invoice.id} detectada como PARCIAL:`, {
                        estado: invoice.status,
                        pagado: Number(invoice.paid_amount || 0),
                        restante: Number(invoice.remaining_amount || 0),
                        total: Number(invoice.total_amount)
                    });
                }
                return {
                    id: invoice.id,
                    userId: invoice.user_id,
                    amount: Number(invoice.total_amount),
                    status: invoiceStatus,
                    date: invoice.issue_date.toISOString(),
                    description: invoice.notes || '',
                    userName: invoice.users
                        ? `${invoice.users.first_name || ''} ${invoice.users.last_name || ''}`.trim()
                        : 'Usuario desconocido',
                    userEmail: invoice.users?.email || 'Sin email',
                    invoiceNumber: invoice.invoice_number,
                    dueDate: invoice.due_date.toISOString(),
                    totalAmount: Number(invoice.total_amount),
                    paid_amount: invoice.paid_amount ? Number(invoice.paid_amount) : undefined,
                    remaining_amount: invoice.remaining_amount ? Number(invoice.remaining_amount) : undefined,
                    taxAmount: Number(invoice.tax_amount || 0),
                    discountAmount: Number(invoice.discount_amount || 0),
                    currency: invoice.currency || 'USD',
                    packages: invoice.invoice_packages.map(ip => {
                        return {
                            id: ip.packages.id,
                            trackingNumber: ip.packages.tracking_number || '',
                            status: ip.packages.package_status,
                            position: this.getPackagePosition(ip.packages)
                        };
                    })
                };
            });
        }
        catch (error) {
            console.error('❌ Error al obtener facturas pendientes:', error);
            throw error instanceof common_1.HttpException
                ? error
                : new common_1.HttpException({ message: error instanceof Error ? error.message : 'Error al obtener facturas pendientes' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    convertToPaymentMethodEnum(method) {
        const methodMap = {
            'efectivo': client_1.payment_method_enum.cash,
            'cash': client_1.payment_method_enum.cash,
            'tarjeta_credito': client_1.payment_method_enum.credit_card,
            'credit_card': client_1.payment_method_enum.credit_card,
            'tarjeta_debito': client_1.payment_method_enum.debit_card,
            'debit_card': client_1.payment_method_enum.debit_card,
            'transferencia': client_1.payment_method_enum.bank_transfer,
            'bank_transfer': client_1.payment_method_enum.bank_transfer,
            'paypal': client_1.payment_method_enum.paypal,
            'crypto': client_1.payment_method_enum.crypto,
            'gift_card': client_1.payment_method_enum.gift_card,
            'store_credit': client_1.payment_method_enum.store_credit
        };
        return methodMap[method.toLowerCase()] || client_1.payment_method_enum.cash;
    }
    getPackagePosition(packageData) {
        if (!packageData)
            return null;
        let position = packageData.position || null;
        if (!position && packageData.shipping_stages && Array.isArray(packageData.shipping_stages)) {
            try {
                if (packageData.shipping_stages.length === 0)
                    return null;
                const stages = packageData.shipping_stages.map(stage => {
                    if (typeof stage !== 'object' || stage === null) {
                        return {};
                    }
                    return stage;
                });
                const latestStageWithPosition = [...stages]
                    .reverse()
                    .find(stage => (stage.position && typeof stage.position === 'string') ||
                    (stage.ubicacion && typeof stage.ubicacion === 'string') ||
                    (stage.location && typeof stage.location === 'string'));
                if (latestStageWithPosition) {
                    position = latestStageWithPosition.position ||
                        latestStageWithPosition.ubicacion ||
                        latestStageWithPosition.location || null;
                }
            }
            catch (error) {
                console.error('Error al procesar shipping_stages:', error);
            }
        }
        return typeof position === 'string' ? position : null;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activities_service_1.ActivitiesService,
        transactions_service_1.TransactionsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map