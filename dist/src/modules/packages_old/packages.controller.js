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
exports.PackagesController = void 0;
const common_1 = require("@nestjs/common");
const packages_service_1 = require("./packages.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cargo_service_1 = require("../../cargo/cargo.service");
let PackagesController = class PackagesController {
    constructor(packagesService, cargoService) {
        this.packagesService = packagesService;
        this.cargoService = cargoService;
    }
    async findByTracking(trackingNumber, req) {
        console.log('🔍 Buscando paquete por tracking:', trackingNumber);
        const operatorData = {
            id: req.user.sub || req.user.id,
            email: req.user.email
        };
        try {
            const existingPackage = await this.packagesService.findByTracking(trackingNumber);
            if (existingPackage) {
                console.log('✅ Paquete encontrado en la base de datos local');
                return existingPackage;
            }
            console.log('🔄 Buscando en servicio de cargo...');
            const cargoResponse = await this.cargoService.findByTracking(trackingNumber);
            if (!cargoResponse || !cargoResponse.data) {
                console.log('❌ Paquete no encontrado en ningún servicio');
                return null;
            }
            const cargoPackage = cargoResponse.data;
            const packageData = {
                trackingNumber: cargoPackage.tracking,
                packageStatus: cargoPackage.status || 'pending',
                weight: parseFloat(cargoPackage.totalWeight) || 0,
                volumetricWeight: parseFloat(cargoPackage.volWeight) || 0,
                length: parseFloat(cargoPackage.dimensions?.length) || 0,
                width: parseFloat(cargoPackage.dimensions?.width) || 0,
                height: parseFloat(cargoPackage.dimensions?.height) || 0,
                insurance: false,
                shippingStages: [{
                        location: "Miami Warehouse 1",
                        photo: "",
                        stage: "Miami",
                        status: cargoPackage.status || "in transit",
                        updatedTimestamp: new Date().toISOString()
                    }]
            };
            console.log('📦 Creando nuevo paquete en la base de datos');
            const newPackage = await this.packagesService.createPackage(packageData, operatorData);
            console.log('✅ Paquete creado exitosamente');
            return newPackage;
        }
        catch (error) {
            console.error('❌ Error en findByTracking:', error);
            throw error;
        }
    }
    async createPackage(packageData, req) {
        const operatorData = {
            id: req.user.sub || req.user.id,
            email: req.user.email
        };
        return this.packagesService.createPackage(packageData, operatorData);
    }
    async assignUserToPackage(packageId, { userId }, req) {
        console.log('🔄 Recibida solicitud de asignación de usuario a paquete:', {
            packageId,
            userId,
            operador: {
                id: req.user?.sub || req.user?.id,
                email: req.user?.email,
                role: req.user?.role
            }
        });
        if (!packageId?.trim() || !userId?.trim()) {
            const error = new Error('Se requieren IDs válidos de paquete y usuario');
            console.error('❌ Error de validación:', error, { packageId, userId });
            throw error;
        }
        if (!req.user?.sub && !req.user?.id) {
            const error = new Error('Información del operador incompleta o inválida');
            console.error('❌ Error de validación:', error, { user: req.user });
            throw error;
        }
        const operatorData = {
            id: req.user.sub || req.user.id,
            email: req.user.email
        };
        console.log('👤 Datos del operador validados:', operatorData);
        try {
            console.log('🔄 Iniciando proceso de asignación con datos validados:', {
                packageId: packageId.trim(),
                userId: userId.trim(),
                operador: operatorData
            });
            const result = await this.packagesService.assignUserToPackage(packageId.trim(), userId.trim(), operatorData);
            console.log('✅ Asignación completada exitosamente:', result);
            return result;
        }
        catch (error) {
            console.error('❌ Error en el controlador:', error);
            throw error;
        }
    }
    async updatePackageStatus(packageId, { status }, req) {
        const operatorData = {
            id: req.user.sub || req.user.id,
            email: req.user.email
        };
        return this.packagesService.updatePackageStatus(packageId, status, operatorData);
    }
};
exports.PackagesController = PackagesController;
__decorate([
    (0, common_1.Get)('tracking/:trackingNumber'),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findByTracking", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "createPackage", null);
__decorate([
    (0, common_1.Put)(':packageId/assign-user'),
    __param(0, (0, common_1.Param)('packageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "assignUserToPackage", null);
__decorate([
    (0, common_1.Put)(':packageId/status'),
    __param(0, (0, common_1.Param)('packageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "updatePackageStatus", null);
exports.PackagesController = PackagesController = __decorate([
    (0, common_1.Controller)('packages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => cargo_service_1.CargoService))),
    __metadata("design:paramtypes", [packages_service_1.PackagesService,
        cargo_service_1.CargoService])
], PackagesController);
//# sourceMappingURL=packages.controller.js.map