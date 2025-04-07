"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const firebase_module_1 = require("./firebase/firebase.module");
const operators_module_1 = require("./operators/operators.module");
const branches_module_1 = require("./branches/branches.module");
const plans_module_1 = require("./plans/plans.module");
const wallets_module_1 = require("./wallets/wallets.module");
const payments_module_1 = require("./payments/payments.module");
const invoices_module_1 = require("./invoices/invoices.module");
const notifications_module_1 = require("./notifications/notifications.module");
const cargo_module_1 = require("./cargo/cargo.module");
const users_module_1 = require("./users/users.module");
const email_module_1 = require("./email/email.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const packages_module_1 = require("./packages/packages.module");
const payment_types_module_1 = require("./payment-types/payment-types.module");
const transactions_module_1 = require("./transactions/transactions.module");
const cash_closures_module_1 = require("./cash-closures/cash-closures.module");
const prisma_module_1 = require("./prisma/prisma.module");
const operator_types_module_1 = require("./operator-types/operator-types.module");
const query_performance_middleware_1 = require("./common/middleware/query-performance.middleware");
const database_config_1 = require("./config/database.config");
const prisma_performance_config_1 = require("./config/prisma-performance.config");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(query_performance_middleware_1.QueryPerformanceMiddleware)
            .exclude({ path: 'health', method: common_1.RequestMethod.GET }, { path: 'metrics', method: common_1.RequestMethod.GET })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, prisma_performance_config_1.default],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            firebase_module_1.FirebaseModule,
            auth_module_1.AuthModule,
            operators_module_1.OperatorsModule,
            branches_module_1.BranchesModule,
            plans_module_1.PlansModule,
            wallets_module_1.WalletsModule,
            payments_module_1.PaymentsModule,
            invoices_module_1.InvoicesModule,
            notifications_module_1.NotificationsModule,
            cargo_module_1.CargoModule,
            users_module_1.UsersModule,
            email_module_1.EmailModule,
            dashboard_module_1.DashboardModule,
            packages_module_1.PackagesModule,
            payment_types_module_1.PaymentTypesModule,
            transactions_module_1.TransactionsModule,
            cash_closures_module_1.CashClosuresModule,
            operator_types_module_1.OperatorTypesModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map