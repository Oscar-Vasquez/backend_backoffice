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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("./transactions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
        console.log('🚀 TransactionsController inicializado');
    }
    async createTransaction(data, req) {
        console.log('🔄 Creando transacción en controlador:', {
            ...data,
            createdBy: req.user.id
        });
        const metadata = {
            ...data.metadata,
            createdBy: {
                id: req.user.id,
                email: req.user.email
            }
        };
        const transaction = await this.transactionsService.createTransaction({
            ...data,
            metadata
        });
        return {
            success: true,
            message: 'Transacción creada correctamente',
            transaction
        };
    }
    async getTransactionTypes() {
        const types = await this.transactionsService.getTransactionTypes();
        return {
            success: true,
            types
        };
    }
    async getTransactionsByEntity(entityType, entityId) {
        const transactions = await this.transactionsService.getTransactionsByEntity(entityType, entityId);
        return {
            success: true,
            count: transactions.length,
            transactions
        };
    }
    async getTodayTransactions(page, limit) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 50;
        console.log(`📊 Solicitando transacciones del día - Página ${pageNumber}, Límite ${limitNumber}`);
        const result = await this.transactionsService.getTodayTransactions({
            page: pageNumber,
            limit: limitNumber
        });
        return {
            success: true,
            message: `Transacciones del día ${result.meta.date}`,
            ...result
        };
    }
    async getTransactionsByCategory(categoryId, page, limit, transactionType) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 50;
        console.log(`📊 Solicitando transacciones para la categoría ${categoryId} - Página ${pageNumber}, Límite ${limitNumber}`);
        if (transactionType) {
            console.log(`📊 Filtrando por tipo de transacción: ${transactionType}`);
        }
        const result = await this.transactionsService.getTransactionsByCategory(categoryId, {
            page: pageNumber,
            limit: limitNumber,
            transactionType
        });
        return {
            success: true,
            message: `Transacciones para la categoría: ${result.meta.category}`,
            ...result
        };
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionTypes", null);
__decorate([
    (0, common_1.Get)('entity/:type/:id'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionsByEntity", null);
__decorate([
    (0, common_1.Get)('today'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTodayTransactions", null);
__decorate([
    (0, common_1.Get)('category/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionsByCategory", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map