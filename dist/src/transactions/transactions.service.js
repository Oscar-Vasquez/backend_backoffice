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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
        console.log('🚀 TransactionsService inicializado');
    }
    async createTransaction(data) {
        try {
            console.log('🔄 Creando nueva transacción:', data);
            const transaction = await this.prisma.transactions.create({
                data: {
                    description: data.description,
                    status: data.status,
                    transaction_type: data.transactionType,
                    entity_type: data.entityType,
                    entity_id: data.entityId,
                    reference_id: data.referenceId,
                    payment_method_id: data.paymentMethodId,
                    metadata: data.metadata || {},
                    amount: data.amount !== undefined ? data.amount : null,
                    category_id: data.categoryId,
                    transaction_type_id: data.transactionTypeId,
                    transaction_date: new Date()
                },
            });
            console.log('✅ Transacción creada:', transaction.id);
            return {
                ...transaction,
                amount: transaction.amount !== null ? Number(transaction.amount) : null
            };
        }
        catch (error) {
            console.error('❌ Error al crear transacción:', error);
            throw error;
        }
    }
    async getTransactionTypes() {
        try {
            const types = await this.prisma.transaction_types.findMany({
                where: {
                    is_active: true
                }
            });
            return types;
        }
        catch (error) {
            console.error('❌ Error al obtener tipos de transacción:', error);
            throw error;
        }
    }
    async updateTransactionStatus(transactionId, status) {
        try {
            const transaction = await this.prisma.transactions.update({
                where: { id: transactionId },
                data: { status }
            });
            return transaction;
        }
        catch (error) {
            console.error(`❌ Error al actualizar estado de transacción ${transactionId}:`, error);
            throw error;
        }
    }
    async getTransactionsByEntity(entityType, entityId) {
        try {
            const transactions = await this.prisma.transactions.findMany({
                where: {
                    entity_type: entityType,
                    entity_id: entityId
                },
                orderBy: {
                    transaction_date: 'desc'
                },
                include: {
                    payment_methods: true,
                    transaction_categories: true,
                    transaction_types: true,
                }
            });
            return transactions.map(tx => ({
                ...tx,
                amount: tx.amount !== null ? Number(tx.amount) : null
            }));
        }
        catch (error) {
            console.error(`❌ Error al obtener transacciones para ${entityType} ${entityId}:`, error);
            throw error;
        }
    }
    async getTodayTransactions(params = {}) {
        try {
            console.log('🔍 Obteniendo transacciones del período actual del cierre');
            const page = params.page || 1;
            const limit = params.limit || 50;
            const skip = (page - 1) * limit;
            const CUTOFF_HOUR = 18;
            const CUTOFF_MINUTE = 0;
            const CUTOFF_SECOND = 0;
            const TIMEZONE = 'America/Panama';
            const nowUTC = new Date();
            console.log(`⏰ Hora actual en UTC: ${nowUTC.toISOString()}`);
            const panamaOffsetHours = -5;
            const panamaOffsetMs = panamaOffsetHours * 60 * 60 * 1000;
            const nowPanama = new Date(nowUTC.getTime() + panamaOffsetMs);
            console.log(`⏰ Hora actual en ${TIMEZONE} (aproximada): ${nowPanama.toISOString()}`);
            const currentHourPanama = nowPanama.getHours();
            const currentMinutePanama = nowPanama.getMinutes();
            const isAfterCutoff = currentHourPanama > CUTOFF_HOUR ||
                (currentHourPanama === CUTOFF_HOUR && currentMinutePanama >= CUTOFF_MINUTE);
            console.log(`🕒 La hora actual en ${TIMEZONE} es ${isAfterCutoff ? 'posterior' : 'anterior'} a la hora de corte (${CUTOFF_HOUR}:${CUTOFF_MINUTE})`);
            console.log(`🕒 Hora en Panamá: ${currentHourPanama}:${currentMinutePanama}`);
            const todayUTC = new Date(nowUTC);
            todayUTC.setUTCHours(0, 0, 0, 0);
            const yesterdayUTC = new Date(todayUTC);
            yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
            const tomorrowUTC = new Date(todayUTC);
            tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
            const cutoffTimeUTC = 23;
            let startDateUTC;
            let endDateUTC;
            if (isAfterCutoff) {
                startDateUTC = new Date(todayUTC);
                startDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
                endDateUTC = new Date(tomorrowUTC);
                endDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
            }
            else {
                startDateUTC = new Date(yesterdayUTC);
                startDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
                endDateUTC = new Date(todayUTC);
                endDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
            }
            console.log(`🗓️ Buscando transacciones entre ${startDateUTC.toISOString()} y ${endDateUTC.toISOString()}`);
            console.log(`⏰ Hora de corte configurada: ${CUTOFF_HOUR}:${CUTOFF_MINUTE.toString().padStart(2, '0')} ${TIMEZONE}`);
            console.log(`⏰ Hora de corte en UTC: ${cutoffTimeUTC}:00`);
            const testTransaction = '2025-03-27T23:31:08.903Z';
            const testDate = new Date(testTransaction);
            console.log(`📅 Fecha de prueba (UTC): ${testDate.toISOString()}`);
            console.log(`📅 Fecha de prueba (${TIMEZONE} aprox): ${new Date(testDate.getTime() + panamaOffsetMs).toISOString()}`);
            console.log(`🔍 Fecha de prueba ${startDateUTC <= testDate && testDate < endDateUTC ? 'ESTÁ' : 'NO está'} en el rango actual`);
            const total = await this.prisma.transactions.count({
                where: {
                    transaction_date: {
                        gte: startDateUTC,
                        lt: endDateUTC
                    }
                }
            });
            const transactions = await this.prisma.transactions.findMany({
                where: {
                    transaction_date: {
                        gte: startDateUTC,
                        lt: endDateUTC
                    }
                },
                orderBy: {
                    transaction_date: 'desc'
                },
                skip,
                take: limit,
                include: {
                    payment_methods: true,
                    transaction_categories: true,
                    transaction_types: true,
                }
            });
            console.log(`✅ Encontradas ${transactions.length} transacciones en el período actual (total: ${total})`);
            if (transactions.length === 0 || true) {
                console.log('🔍 Realizando búsqueda más amplia para depuración...');
                const allRecentTx = await this.prisma.transactions.findMany({
                    where: {
                        transaction_date: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 7))
                        }
                    },
                    orderBy: {
                        transaction_date: 'desc'
                    },
                    take: 5
                });
                if (allRecentTx.length > 0) {
                    console.log('🔍 Encontradas algunas transacciones recientes:');
                    allRecentTx.forEach(tx => {
                        const txUTC = tx.transaction_date?.toISOString() || 'N/A';
                        const txPanama = tx.transaction_date ?
                            new Date(tx.transaction_date.getTime() + panamaOffsetMs).toISOString() : 'N/A';
                        const formatDateLocale = (date) => {
                            return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}, ${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
                        };
                        const panamaTxDate = tx.transaction_date ?
                            formatDateLocale(new Date(tx.transaction_date.getTime() + panamaOffsetMs)) : 'N/A';
                        console.log(`- ID: ${tx.id}, Fecha (UTC): ${txUTC}, Fecha (${TIMEZONE}): ${panamaTxDate}, Descripción: ${tx.description}`);
                        console.log(`  ¿En rango de cierre?: ${startDateUTC <= tx.transaction_date && tx.transaction_date < endDateUTC ? 'SÍ' : 'NO'}`);
                    });
                }
                else {
                    console.log('❌ No se encontraron transacciones recientes');
                }
            }
            const formattedTransactions = transactions.map(tx => {
                const txDate = tx.transaction_date;
                const txDatePanama = new Date(txDate.getTime() + panamaOffsetMs);
                const formatDateForDisplay = (date) => {
                    return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
                };
                const txDateLocalFormatted = formatDateForDisplay(txDatePanama);
                return {
                    id: tx.id,
                    description: tx.description,
                    status: tx.status,
                    transactionDate: txDate,
                    transactionDateLocal: txDateLocalFormatted,
                    transactionType: tx.transaction_type,
                    entityType: tx.entity_type,
                    entityId: tx.entity_id,
                    amount: tx.amount !== null ? Number(tx.amount) : undefined,
                    paymentMethod: tx.payment_methods ? {
                        id: tx.payment_methods.id,
                        name: tx.payment_methods.name
                    } : null,
                    category: tx.transaction_categories ? {
                        id: tx.transaction_categories.id,
                        name: tx.transaction_categories.name
                    } : null,
                    transactionTypeDetails: tx.transaction_types ? {
                        id: tx.transaction_types.id,
                        name: tx.transaction_types.name,
                        affectsBalance: tx.transaction_types.affects_balance
                    } : null,
                    metadata: tx.metadata
                };
            });
            const summary = {
                totalCredit: formattedTransactions
                    .filter(tx => (tx.amount !== undefined && tx.amount > 0) ||
                    (tx.transactionTypeDetails && tx.transactionTypeDetails.affectsBalance === 'credit'))
                    .reduce((sum, tx) => sum + (tx.amount !== undefined ? tx.amount : 0), 0),
                totalDebit: formattedTransactions
                    .filter(tx => (tx.amount !== undefined && tx.amount < 0) ||
                    (tx.transactionTypeDetails && tx.transactionTypeDetails.affectsBalance === 'debit'))
                    .reduce((sum, tx) => sum + (tx.amount !== undefined ? Math.abs(tx.amount) : 0), 0),
            };
            const formatPeriodDate = (date) => {
                const localDate = new Date(date.getTime() + panamaOffsetMs);
                return `${localDate.getUTCMonth() + 1}/${localDate.getUTCDate()}/${localDate.getUTCFullYear()} ${localDate.getUTCHours()}:${localDate.getUTCMinutes().toString().padStart(2, '0')}`;
            };
            const startDateFormatted = formatPeriodDate(startDateUTC);
            const endDateFormatted = formatPeriodDate(endDateUTC);
            const periodLabel = `${startDateFormatted} - ${endDateFormatted}`;
            const today = new Date(nowUTC.getTime() + panamaOffsetMs);
            const formattedToday = `${today.getUTCFullYear()}-${(today.getUTCMonth() + 1).toString().padStart(2, '0')}-${today.getUTCDate().toString().padStart(2, '0')}`;
            return {
                data: formattedTransactions,
                meta: {
                    total,
                    page,
                    limit,
                    date: formattedToday,
                    period: periodLabel,
                    cutoffTime: `${CUTOFF_HOUR}:${CUTOFF_MINUTE.toString().padStart(2, '0')}`,
                    timezone: TIMEZONE,
                    summary
                }
            };
        }
        catch (error) {
            console.error('❌ Error al obtener transacciones del período:', error);
            throw error;
        }
    }
    async getTransactionsByCategory(categoryId, options = {}) {
        try {
            console.log(`🔍 Buscando transacciones con categoría: ${categoryId}`);
            const page = options.page || 1;
            const limit = options.limit || 50;
            const skip = (page - 1) * limit;
            const filter = {
                category_id: categoryId
            };
            if (options.transactionType) {
                filter.transaction_type = options.transactionType;
                console.log(`🔍 Filtrando por tipo de transacción: ${options.transactionType}`);
            }
            const total = await this.prisma.transactions.count({
                where: filter
            });
            const transactions = await this.prisma.transactions.findMany({
                where: filter,
                orderBy: {
                    transaction_date: 'desc'
                },
                skip,
                take: limit,
                include: {
                    payment_methods: true,
                    transaction_categories: true,
                    transaction_types: true,
                }
            });
            console.log(`✅ Encontradas ${transactions.length} transacciones con la categoría ${categoryId} (total: ${total})`);
            const formattedTransactions = transactions.map(tx => ({
                ...tx,
                amount: tx.amount !== null ? Number(tx.amount) : null
            }));
            return {
                data: formattedTransactions,
                meta: {
                    total,
                    page,
                    limit,
                    category: transactions.length > 0 ? transactions[0].transaction_categories?.name || 'Desconocida' : 'Desconocida'
                }
            };
        }
        catch (error) {
            console.error(`❌ Error al obtener transacciones por categoría ${categoryId}:`, error);
            throw error;
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map