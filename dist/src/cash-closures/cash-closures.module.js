"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosuresModule = void 0;
const common_1 = require("@nestjs/common");
const cash_closures_service_1 = require("./cash-closures.service");
const cash_closures_controller_1 = require("./cash-closures.controller");
const prisma_service_1 = require("../prisma/prisma.service");
const transactions_module_1 = require("../transactions/transactions.module");
const cash_closures_cron_1 = require("./cash-closures.cron");
let CashClosuresModule = class CashClosuresModule {
};
exports.CashClosuresModule = CashClosuresModule;
exports.CashClosuresModule = CashClosuresModule = __decorate([
    (0, common_1.Module)({
        imports: [transactions_module_1.TransactionsModule],
        controllers: [cash_closures_controller_1.CashClosuresController],
        providers: [cash_closures_service_1.CashClosuresService, prisma_service_1.PrismaService, cash_closures_cron_1.CashClosuresCronService],
        exports: [cash_closures_service_1.CashClosuresService]
    })
], CashClosuresModule);
//# sourceMappingURL=cash-closures.module.js.map