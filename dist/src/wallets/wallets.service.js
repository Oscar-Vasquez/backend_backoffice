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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
let WalletsService = class WalletsService {
    constructor(configService) {
        this.configService = configService;
        console.log('🚀 WalletsService inicializado');
        this.db = admin.firestore();
    }
    async createWallet(userId, name = 'Billetera Estándar') {
        try {
            const walletData = {
                name,
                type: 'standard',
                balance: 0,
                status: 'active',
                userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const walletRef = await this.db.collection('wallets').add(walletData);
            const walletDoc = await walletRef.get();
            const wallet = walletDoc.data();
            return {
                id: walletDoc.id,
                name: wallet.walletName,
                type: wallet.type,
                balance: wallet.balance,
                status: wallet.status,
                userId: wallet.userId,
                createdAt: wallet.createdAt.toDate(),
                updatedAt: wallet.updatedAt.toDate()
            };
        }
        catch (error) {
            console.error('Error al crear billetera:', error);
            throw new Error('Error al crear billetera');
        }
    }
    async getWallet(id) {
        try {
            const walletsQuery = await this.db
                .collection('wallets')
                .where('userId', '==', id)
                .limit(1)
                .get();
            if (!walletsQuery.empty) {
                const wallet = walletsQuery.docs[0];
                const data = wallet.data();
                return {
                    id: wallet.id,
                    name: data.name || 'Mi Billetera',
                    type: data.type || 'standard',
                    balance: data.balance || 0,
                    status: data.status || 'active',
                    userId: data.userId,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                };
            }
            const walletData = {
                name: 'Mi Billetera',
                type: 'standard',
                balance: 0,
                status: 'active',
                userId: id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const walletRef = await this.db.collection('wallets').add(walletData);
            const newWalletDoc = await walletRef.get();
            const newWallet = newWalletDoc.data();
            return {
                id: newWalletDoc.id,
                name: newWallet.name || 'Mi Billetera',
                type: newWallet.type || 'standard',
                balance: newWallet.balance || 0,
                status: newWallet.status || 'active',
                userId: newWallet.userId,
                createdAt: newWallet.createdAt?.toDate() || new Date(),
                updatedAt: newWallet.updatedAt?.toDate() || new Date()
            };
        }
        catch (error) {
            console.error('Error al obtener/crear billetera:', error);
            throw new Error('Error al obtener/crear billetera');
        }
    }
    async getBalance(id) {
        try {
            const wallet = await this.getWallet(id);
            return { balance: wallet.balance };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            console.error('Error al obtener saldo:', error);
            throw new Error('Error al obtener saldo de la billetera');
        }
    }
    async updateStatus(id, status) {
        try {
            const walletRef = this.db
                .collection('wallets')
                .doc(id);
            const walletDoc = await walletRef.get();
            if (!walletDoc.exists) {
                throw new common_1.NotFoundException(`Billetera con ID ${id} no encontrada`);
            }
            await walletRef.update({
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            const updatedWallet = await walletRef.get();
            const data = updatedWallet.data();
            return {
                id: updatedWallet.id,
                name: data.walletName,
                type: data.type,
                balance: data.balance,
                status: data.status,
                userId: data.userId,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            console.error('Error al actualizar estado:', error);
            throw new Error('Error al actualizar estado de la billetera');
        }
    }
    async getTransactions(id, page = 1, limit = 10) {
        try {
            const wallet = await this.getWallet(id);
            const skip = (page - 1) * limit;
            const transactionsQuery = await this.db
                .collection('wallets')
                .doc(wallet.id)
                .collection('transactions')
                .orderBy('createdAt', 'desc')
                .offset(skip)
                .limit(limit)
                .get();
            const totalQuery = await this.db
                .collection('wallets')
                .doc(wallet.id)
                .collection('transactions')
                .count()
                .get();
            const transactions = transactionsQuery.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate()
            }));
            const total = totalQuery.data().count;
            return {
                data: transactions,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error al obtener transacciones:', error);
            throw new Error('Error al obtener transacciones de la billetera');
        }
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map