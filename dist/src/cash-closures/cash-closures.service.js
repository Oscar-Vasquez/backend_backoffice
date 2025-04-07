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
exports.CashClosuresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const transactions_service_1 = require("../transactions/transactions.service");
let CashClosuresService = class CashClosuresService {
    constructor(prisma, transactionsService) {
        this.prisma = prisma;
        this.transactionsService = transactionsService;
        console.log('🚀 CashClosuresService inicializado');
    }
    async getCurrentCashClosure() {
        try {
            console.log('🔍 Obteniendo cierre de caja actual');
            const currentClosure = await this.prisma.cash_closures.findFirst({
                where: {
                    status: 'OPEN'
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            if (currentClosure) {
                const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
                const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
                const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
                const totalAmount = totalCredit - totalDebit;
                return {
                    id: currentClosure.id,
                    createdAt: currentClosure.created_at.toISOString(),
                    status: currentClosure.status.toLowerCase(),
                    paymentMethods,
                    totalAmount,
                    totalCredit,
                    totalDebit
                };
            }
            const lastClosure = await this.prisma.cash_closures.findFirst({
                orderBy: {
                    cash_closures: 'desc'
                }
            });
            const now = new Date();
            const currentHour = now.getHours();
            const cutoffHour = 18;
            const isBeforeCutoff = currentHour < cutoffHour;
            if (lastClosure) {
                const lastClosureDate = lastClosure.cash_closures;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastClosureDay = new Date(lastClosureDate);
                lastClosureDay.setHours(0, 0, 0, 0);
                if (lastClosureDay.getTime() === today.getTime()) {
                    console.log('⚠️ Ya existe un cierre de caja para hoy. No se creará uno nuevo hasta mañana.');
                    const paymentMethods = await this.getPaymentMethodsForClosure(lastClosure.id);
                    const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
                    const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
                    const totalAmount = totalCredit - totalDebit;
                    return {
                        id: lastClosure.id,
                        createdAt: lastClosure.created_at.toISOString(),
                        closedAt: lastClosure.cash_closures.toISOString(),
                        status: 'closed',
                        paymentMethods,
                        totalAmount,
                        totalCredit,
                        totalDebit,
                        message: 'No se puede abrir una nueva caja hoy. La última caja ya fue cerrada.'
                    };
                }
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastClosureDay.getTime() === yesterday.getTime() && isBeforeCutoff) {
                    console.log('⚠️ Estamos antes de la hora de corte. La caja de ayer sigue vigente.');
                    const paymentMethods = await this.getPaymentMethodsForClosure(lastClosure.id);
                    const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
                    const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
                    const totalAmount = totalCredit - totalDebit;
                    return {
                        id: lastClosure.id,
                        createdAt: lastClosure.created_at.toISOString(),
                        closedAt: lastClosure.cash_closures.toISOString(),
                        status: 'closed',
                        paymentMethods,
                        totalAmount,
                        totalCredit,
                        totalDebit,
                        message: 'Estamos antes de la hora de corte. La caja de ayer sigue vigente.'
                    };
                }
            }
            console.log('🆕 No hay cierre abierto, creando uno nuevo');
            return this.createNewCashClosure();
        }
        catch (error) {
            console.error('❌ Error al obtener cierre de caja actual:', error);
            throw error;
        }
    }
    async createNewCashClosure() {
        try {
            const newClosure = await this.prisma.cash_closures.create({
                data: {
                    status: 'OPEN',
                    cash_closures: new Date(),
                    total_cash: 0,
                    total_yappy: 0,
                    total_card: 0,
                    total_bank_transfer: 0,
                    total_digital_wallet: 0,
                    total_internal_wallet: 0,
                    total_credits: 0,
                    total_debits: 0,
                    final_balance: 0
                }
            });
            return {
                id: newClosure.id,
                createdAt: newClosure.created_at.toISOString(),
                status: 'open',
                paymentMethods: [],
                totalAmount: 0,
                totalCredit: 0,
                totalDebit: 0
            };
        }
        catch (error) {
            console.error('❌ Error al crear nuevo cierre de caja:', error);
            throw error;
        }
    }
    async getCashClosureHistory(params) {
        try {
            console.log('🔍 Obteniendo historial de cierres de caja:', params);
            const page = params.page || 1;
            const limit = params.limit || 10;
            const skip = (page - 1) * limit;
            const where = {};
            if (params.startDate || params.endDate) {
                where.created_at = {};
                if (params.startDate) {
                    where.created_at.gte = new Date(params.startDate);
                }
                if (params.endDate) {
                    const endDate = new Date(params.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    where.created_at.lte = endDate;
                }
            }
            if (params.status) {
                where.status = params.status.toUpperCase();
            }
            const total = await this.prisma.cash_closures.count({ where });
            const closures = await this.prisma.cash_closures.findMany({
                where,
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: limit
            });
            const closureHistory = await Promise.all(closures.map(async (closure) => {
                let paymentMethodDetails = [
                    ...(closure.total_cash > 0 || closure.total_debits > 0 ? [{
                            id: 'efectivo',
                            name: 'Efectivo',
                            credit: closure.total_cash > 0 ? closure.total_cash : 0,
                            debit: closure.total_debits > 0 ? closure.total_debits : 0,
                            total: (closure.total_cash || 0) - (closure.total_debits || 0)
                        }] : []),
                    ...(closure.total_yappy > 0 ? [{
                            id: 'yappy',
                            name: 'Yappy',
                            credit: closure.total_yappy > 0 ? closure.total_yappy : 0,
                            debit: 0,
                            total: closure.total_yappy > 0 ? closure.total_yappy : 0
                        }] : []),
                    ...(closure.total_card > 0 ? [{
                            id: 'tarjeta',
                            name: 'Tarjeta',
                            credit: closure.total_card > 0 ? closure.total_card : 0,
                            debit: 0,
                            total: closure.total_card > 0 ? closure.total_card : 0
                        }] : []),
                    ...(closure.total_bank_transfer > 0 ? [{
                            id: 'transferencia',
                            name: 'Transferencia Bancaria',
                            credit: closure.total_bank_transfer > 0 ? closure.total_bank_transfer : 0,
                            debit: 0,
                            total: closure.total_bank_transfer > 0 ? closure.total_bank_transfer : 0
                        }] : []),
                    ...(closure.total_digital_wallet > 0 ? [{
                            id: 'billetera-digital',
                            name: 'Billetera Digital',
                            credit: closure.total_digital_wallet > 0 ? closure.total_digital_wallet : 0,
                            debit: 0,
                            total: closure.total_digital_wallet > 0 ? closure.total_digital_wallet : 0
                        }] : []),
                    ...(closure.total_internal_wallet > 0 ? [{
                            id: 'billetera-interna',
                            name: 'Billetera Interna',
                            credit: closure.total_internal_wallet > 0 ? closure.total_internal_wallet : 0,
                            debit: 0,
                            total: closure.total_internal_wallet > 0 ? closure.total_internal_wallet : 0
                        }] : [])
                ];
                return {
                    id: closure.id,
                    createdAt: closure.created_at.toISOString(),
                    closedAt: closure.cash_closures.toISOString(),
                    totalAmount: closure.final_balance || 0,
                    totalCredit: closure.total_credits || 0,
                    totalDebit: closure.total_debits || 0,
                    paymentMethodDetails,
                    closedBy: null
                };
            }));
            return {
                data: closureHistory,
                meta: {
                    total,
                    page,
                    limit
                }
            };
        }
        catch (error) {
            console.error('❌ Error al obtener historial de cierres de caja:', error);
            throw error;
        }
    }
    async closeCashClosure(userId) {
        try {
            console.log('🔒 Cerrando caja actual, usuario:', userId);
            const currentClosure = await this.prisma.cash_closures.findFirst({
                where: {
                    status: 'OPEN'
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            if (!currentClosure) {
                throw new Error('No hay un cierre de caja abierto para cerrar');
            }
            const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
            const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
            const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
            const totalAmount = totalCredit - totalDebit;
            const closedClosure = await this.prisma.cash_closures.update({
                where: {
                    id: currentClosure.id
                },
                data: {
                    status: 'CLOSED',
                    cash_closures: new Date(),
                    total_credits: totalCredit,
                    total_debits: totalDebit,
                    final_balance: totalAmount
                }
            });
            console.log('⚠️ No se pueden asociar transacciones al cierre de caja (se requiere migración)');
            return {
                id: closedClosure.id,
                createdAt: closedClosure.created_at.toISOString(),
                closedAt: closedClosure.cash_closures.toISOString(),
                status: 'closed',
                paymentMethods,
                totalAmount,
                totalCredit,
                totalDebit,
                closedBy: null
            };
        }
        catch (error) {
            console.error('❌ Error al cerrar la caja actual:', error);
            throw error;
        }
    }
    async automaticCloseCashClosure() {
        try {
            console.log('🔄 Ejecutando cierre automático de caja');
            const currentClosure = await this.prisma.cash_closures.findFirst({
                where: {
                    status: 'OPEN'
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            if (!currentClosure) {
                console.log('ℹ️ No hay un cierre de caja abierto para cerrar automáticamente');
                return null;
            }
            const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
            const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
            const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
            const totalAmount = totalCredit - totalDebit;
            const closedClosure = await this.prisma.cash_closures.update({
                where: {
                    id: currentClosure.id
                },
                data: {
                    status: 'CLOSED',
                    cash_closures: new Date(),
                    total_credits: totalCredit,
                    total_debits: totalDebit,
                    final_balance: totalAmount
                }
            });
            console.log(`✅ Cierre automático completado. ID: ${closedClosure.id}`);
            return {
                id: closedClosure.id,
                createdAt: closedClosure.created_at.toISOString(),
                closedAt: closedClosure.cash_closures.toISOString(),
                status: 'closed',
                paymentMethods,
                totalAmount,
                totalCredit,
                totalDebit,
                closedBy: null
            };
        }
        catch (error) {
            console.error('❌ Error en cierre automático de caja:', error);
            return null;
        }
    }
    async automaticOpenCashClosure() {
        try {
            console.log('🔄 Ejecutando apertura automática de caja');
            const openClosure = await this.prisma.cash_closures.findFirst({
                where: {
                    status: 'OPEN'
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            if (openClosure) {
                console.log('ℹ️ Ya existe una caja abierta. No se creará una nueva.');
                return null;
            }
            const newClosure = await this.createNewCashClosure();
            console.log(`✅ Apertura automática completada. ID: ${newClosure.id}`);
            return newClosure;
        }
        catch (error) {
            console.error('❌ Error en apertura automática de caja:', error);
            return null;
        }
    }
    async checkAndProcessAutomaticCashClosure() {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            if (currentHour === 18 && currentMinute >= 0 && currentMinute < 5) {
                console.log('⏰ Hora de cierre automático (6:00 PM)');
                await this.automaticCloseCashClosure();
                return { action: 'close', time: now.toISOString() };
            }
            if (currentHour === 9 && currentMinute >= 0 && currentMinute < 5) {
                console.log('⏰ Hora de apertura automática (9:00 AM)');
                await this.automaticOpenCashClosure();
                return { action: 'open', time: now.toISOString() };
            }
            return { action: 'none', time: now.toISOString() };
        }
        catch (error) {
            console.error('❌ Error en verificación de cierres automáticos:', error);
            return { action: 'error', time: new Date().toISOString(), error: error.message };
        }
    }
    async getTransactionsForCashClosure(cashClosureId, page = 1, limit = 20) {
        try {
            console.log(`🔍 Obteniendo transacciones para cierre: ${cashClosureId}`);
            console.log('⚠️ No se pueden obtener transacciones (se requiere migración)');
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit
                }
            };
        }
        catch (error) {
            console.error(`❌ Error al obtener transacciones para cierre ${cashClosureId}:`, error);
            throw error;
        }
    }
    async getPaymentMethodsForClosure(cashClosureId) {
        try {
            console.log(`🔍 Obteniendo métodos de pago para cierre: ${cashClosureId}`);
            const closure = cashClosureId
                ? await this.prisma.cash_closures.findUnique({ where: { id: cashClosureId } })
                : null;
            if (!closure || closure.status === 'OPEN') {
                console.log('📦 Usando servicio de transacciones para obtener datos del período actual');
                const result = await this.transactionsService.getTodayTransactions({
                    page: 1,
                    limit: 1000
                });
                const paymentMethods = await this.prisma.payment_methods.findMany({
                    where: {
                        is_active: true
                    }
                });
                const methodsMap = new Map();
                paymentMethods.forEach(method => {
                    methodsMap.set(method.id, {
                        id: method.id,
                        name: method.name,
                        credit: 0,
                        debit: 0,
                        total: 0
                    });
                });
                result.data.forEach(tx => {
                    let methodId = 'efectivo';
                    let methodName = 'Efectivo';
                    let nameFromMetadata = false;
                    if (tx.metadata && typeof tx.metadata === 'object') {
                        if ('paymentMethod' in tx.metadata && typeof tx.metadata.paymentMethod === 'string') {
                            nameFromMetadata = true;
                            const metaMethodName = tx.metadata.paymentMethod.toString().toLowerCase();
                            if (metaMethodName === 'efectivo') {
                                methodId = 'efectivo';
                                methodName = 'Efectivo';
                            }
                            else if (metaMethodName === 'tarjeta' || metaMethodName === 'tarjeta-credito' || metaMethodName === 'tarjeta-de-credito') {
                                methodName = 'Tarjeta de Crédito';
                            }
                            else if (metaMethodName === 'tarjeta-debito' || metaMethodName === 'tarjeta-de-debito') {
                                methodName = 'Tarjeta de Débito';
                            }
                            else if (metaMethodName === 'transferencia' || metaMethodName === 'transferencia-bancaria') {
                                methodName = 'Transferencia Bancaria';
                            }
                            else {
                                methodName = metaMethodName.split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                            }
                        }
                        if ('paymentMethodId' in tx.metadata && tx.metadata.paymentMethodId && methodId !== 'efectivo') {
                            methodId = tx.metadata.paymentMethodId.toString();
                        }
                    }
                    if (tx.paymentMethod) {
                        if (tx.paymentMethod.name === "Pago en Tienda") {
                            methodId = 'efectivo';
                            methodName = 'Efectivo';
                        }
                        else if (methodId !== 'efectivo' && tx.paymentMethod.id) {
                            methodId = tx.paymentMethod.id;
                        }
                        if (!nameFromMetadata && methodId !== 'efectivo' && methodName !== 'Efectivo' && tx.paymentMethod.name) {
                            methodName = tx.paymentMethod.name;
                        }
                    }
                    if (methodId === 'efectivo' && methodName !== 'Efectivo') {
                        methodId = `other-${methodName.toLowerCase().replace(/\s+/g, '-')}`;
                    }
                    let isCredit = false;
                    if (tx.transactionTypeDetails?.affectsBalance) {
                        isCredit = tx.transactionTypeDetails.affectsBalance === 'credit';
                    }
                    else if (tx.category?.name) {
                        const categoryName = tx.category.name.toLowerCase();
                        if (categoryName.includes('gasto') || categoryName.includes('egreso')) {
                            isCredit = false;
                        }
                        else if (categoryName.includes('ingreso')) {
                            isCredit = true;
                        }
                        else {
                            isCredit = (tx.amount !== null && Number(tx.amount) > 0);
                        }
                    }
                    else {
                        isCredit = (tx.amount !== null && Number(tx.amount) > 0);
                    }
                    const amount = tx.amount !== null ? Math.abs(Number(tx.amount)) : 0;
                    const methodData = methodsMap.get(methodId);
                    if (methodData) {
                        if (isCredit) {
                            methodData.credit += amount;
                        }
                        else {
                            methodData.debit += amount;
                        }
                        methodData.total = methodData.credit - methodData.debit;
                    }
                    else {
                        const newMethodData = {
                            id: methodId,
                            name: methodName,
                            credit: isCredit ? amount : 0,
                            debit: isCredit ? 0 : amount,
                            total: isCredit ? amount : -amount
                        };
                        methodsMap.set(methodId, newMethodData);
                    }
                });
                const methodTotals = Array.from(methodsMap.values())
                    .filter(method => method.credit > 0 || method.debit > 0);
                console.log(`✅ Resumen de métodos de pago generado: ${methodTotals.length} métodos con actividad`);
                return methodTotals;
            }
            const now = new Date();
            const CUTOFF_HOUR = 18;
            const cutoffTimeUTC = 23;
            const todayUTC = new Date(now);
            todayUTC.setUTCHours(0, 0, 0, 0);
            const yesterdayUTC = new Date(todayUTC);
            yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
            let startDateUTC = closure.created_at;
            let endDateUTC = closure.cash_closures || now;
            console.log(`🗓️ Buscando transacciones entre ${startDateUTC.toISOString()} y ${endDateUTC.toISOString()}`);
            const transactions = await this.prisma.transactions.findMany({
                where: {
                    transaction_date: {
                        gte: startDateUTC,
                        lt: endDateUTC
                    }
                },
                include: {
                    payment_methods: true,
                    transaction_types: true
                }
            });
            console.log(`🧾 Encontradas ${transactions.length} transacciones en el período`);
            const paymentMethods = await this.prisma.payment_methods.findMany({
                where: {
                    is_active: true
                }
            });
            const methodsMap = new Map();
            paymentMethods.forEach(method => {
                methodsMap.set(method.id, {
                    id: method.id,
                    name: method.name,
                    credit: 0,
                    debit: 0,
                    total: 0
                });
            });
            transactions.forEach(tx => {
                let methodId = 'efectivo';
                let methodName = 'Efectivo';
                let nameFromMetadata = false;
                if (tx.metadata && typeof tx.metadata === 'object') {
                    if ('paymentMethod' in tx.metadata && typeof tx.metadata.paymentMethod === 'string') {
                        nameFromMetadata = true;
                        const metaMethodName = tx.metadata.paymentMethod.toString().toLowerCase();
                        if (metaMethodName === 'efectivo') {
                            methodId = 'efectivo';
                            methodName = 'Efectivo';
                        }
                        else if (metaMethodName === 'tarjeta' || metaMethodName === 'tarjeta-credito' || metaMethodName === 'tarjeta-de-credito') {
                            methodName = 'Tarjeta de Crédito';
                        }
                        else if (metaMethodName === 'tarjeta-debito' || metaMethodName === 'tarjeta-de-debito') {
                            methodName = 'Tarjeta de Débito';
                        }
                        else if (metaMethodName === 'transferencia' || metaMethodName === 'transferencia-bancaria') {
                            methodName = 'Transferencia Bancaria';
                        }
                        else {
                            methodName = metaMethodName.split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                        }
                    }
                    if ('paymentMethodId' in tx.metadata && tx.metadata.paymentMethodId && methodId !== 'efectivo') {
                        methodId = tx.metadata.paymentMethodId.toString();
                    }
                }
                if (tx.payment_methods) {
                    if (tx.payment_methods.name === "Pago en Tienda") {
                        methodId = 'efectivo';
                        methodName = 'Efectivo';
                    }
                    else if (methodId !== 'efectivo' && tx.payment_methods.id) {
                        methodId = tx.payment_methods.id;
                    }
                    if (!nameFromMetadata && methodId !== 'efectivo' && methodName !== 'Efectivo' && tx.payment_methods.name) {
                        methodName = tx.payment_methods.name;
                    }
                }
                if (methodId === 'efectivo' && methodName !== 'Efectivo') {
                    methodId = `other-${methodName.toLowerCase().replace(/\s+/g, '-')}`;
                }
                let isCredit = false;
                if (tx.transaction_types?.affects_balance) {
                    isCredit = tx.transaction_types.affects_balance === 'credit';
                }
                else if (tx.metadata && typeof tx.metadata === 'object') {
                    if ('transactionType' in tx.metadata && typeof tx.metadata.transactionType === 'string') {
                        const txType = tx.metadata.transactionType.toLowerCase();
                        if (txType.includes('ingreso') || txType.includes('credit')) {
                            isCredit = true;
                        }
                        else if (txType.includes('egreso') || txType.includes('debit') || txType.includes('gasto')) {
                            isCredit = false;
                        }
                        else {
                            isCredit = (tx.amount !== null && Number(tx.amount) > 0);
                        }
                    }
                    else {
                        isCredit = (tx.amount !== null && Number(tx.amount) > 0);
                    }
                }
                else {
                    isCredit = (tx.amount !== null && Number(tx.amount) > 0);
                }
                const amount = tx.amount !== null ? Math.abs(Number(tx.amount)) : 0;
                const methodData = methodsMap.get(methodId);
                if (methodData) {
                    if (isCredit) {
                        methodData.credit += amount;
                    }
                    else {
                        methodData.debit += amount;
                    }
                    methodData.total = methodData.credit - methodData.debit;
                }
                else {
                    const newMethodData = {
                        id: methodId,
                        name: methodName,
                        credit: isCredit ? amount : 0,
                        debit: isCredit ? 0 : amount,
                        total: isCredit ? amount : -amount
                    };
                    methodsMap.set(methodId, newMethodData);
                }
            });
            const methodTotals = Array.from(methodsMap.values())
                .filter(method => method.credit > 0 || method.debit > 0);
            return methodTotals;
        }
        catch (error) {
            console.error('❌ Error al obtener métodos de pago para cierre:', error);
            return [];
        }
    }
};
exports.CashClosuresService = CashClosuresService;
exports.CashClosuresService = CashClosuresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transactions_service_1.TransactionsService])
], CashClosuresService);
//# sourceMappingURL=cash-closures.service.js.map