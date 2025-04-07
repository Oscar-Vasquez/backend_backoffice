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
exports.InvoicesModule = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const invoices_controller_1 = require("./invoices.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const activities_module_1 = require("../modules/activities/activities.module");
const packages_module_1 = require("../packages/packages.module");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
let InvoicesModule = class InvoicesModule {
    constructor() {
        console.log('🚀 InvoicesModule inicializado con soporte Prisma');
    }
};
exports.InvoicesModule = InvoicesModule;
exports.InvoicesModule = InvoicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            notifications_module_1.NotificationsModule,
            activities_module_1.ActivitiesModule,
            packages_module_1.PackagesModule,
            email_module_1.EmailModule
        ],
        controllers: [invoices_controller_1.InvoicesController],
        providers: [invoices_service_1.InvoicesService],
        exports: [invoices_service_1.InvoicesService]
    }),
    __metadata("design:paramtypes", [])
], InvoicesModule);
//# sourceMappingURL=invoices.module.js.map