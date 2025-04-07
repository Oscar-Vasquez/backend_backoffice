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
const package_notification_service_1 = require("./services/package-notification.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const update_dimensions_dto_1 = require("./dto/update-dimensions.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const update_weights_dto_1 = require("./dto/update-weights.dto");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
let PackagesController = class PackagesController {
    constructor(packagesService, prisma, packageNotificationService) {
        this.packagesService = packagesService;
        this.prisma = prisma;
        this.packageNotificationService = packageNotificationService;
    }
    async findByTracking(trackingNumber, req) {
        try {
            console.log('==================================');
            console.log(`🛃 GET /api/v1/packages/tracking/${trackingNumber}`);
            console.log('🔍 Buscando paquete por tracking number con Prisma:', trackingNumber);
            console.log('👤 Usuario autenticado:', {
                id: req.user?.sub || req.user?.id,
                email: req.user?.email,
                role: req.user?.role
            });
            const operatorData = {
                id: req.user.sub || req.user.id,
                email: req.user.email
            };
            console.log('🔍 Llamando a packagesService.findByTracking...');
            const packageData = await this.packagesService.findByTracking(trackingNumber);
            if (packageData) {
                console.log('✅ Paquete encontrado en la base de datos:', {
                    id: packageData.id,
                    status: packageData.packageStatus,
                    tracking: packageData.trackingNumber
                });
                return packageData;
            }
            console.log('⚠️ No se encontró paquete localmente, se debe buscar en servicio externo');
            console.log(`💡 Sugerencia: Llame a la ruta /api/v1/cargo/external-tracking/${trackingNumber} o /api/v1/shipments/track/${trackingNumber}`);
            throw new common_1.HttpException({
                message: `No se encontró paquete con tracking: ${trackingNumber}`,
                statusCode: common_1.HttpStatus.NOT_FOUND
            }, common_1.HttpStatus.NOT_FOUND);
        }
        catch (error) {
            console.error('❌ Error en findByTracking:', error.message || error);
            throw new common_1.HttpException(error.message || 'Error buscando paquete por tracking', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(skip, take, status, userId, branchId) {
        const where = {};
        if (status) {
            where.package_status = status;
        }
        if (userId) {
            where.user_reference = userId;
        }
        if (branchId) {
            where.branch_id = branchId;
        }
        return this.packagesService.findAll({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            where,
            orderBy: {
                created_at: 'desc',
            },
        });
    }
    async findOne(id) {
        return this.packagesService.findOne(id);
    }
    async updateStatus(id, updateStatusDto) {
        return this.packagesService.updateStatus(id, updateStatusDto.status);
    }
    async updateDimensions(id, updateDimensionsDto, req) {
        return this.packagesService.updateDimensions(id, updateDimensionsDto);
    }
    async updateWeights(id, updateWeightsDto) {
        return this.packagesService.updateWeights(id, updateWeightsDto);
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
            console.error('❌ Error de validación: IDs inválidos', { packageId, userId });
            throw new common_1.HttpException('Se requieren IDs válidos de paquete y usuario', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!req.user?.sub && !req.user?.id) {
            console.error('❌ Error de validación: Información del operador incompleta', { user: req.user });
            throw new common_1.HttpException('Información del operador incompleta o inválida', common_1.HttpStatus.UNAUTHORIZED);
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
            console.log('✅ Asignación completada exitosamente');
            console.log('📊 Respuesta del servicio:', {
                success: result.success,
                package_id: result.package?.id,
                tracking_number: result.package?.tracking_number,
                user_reference: result.package?.user_reference,
                user_id: result.user?.id,
                user_email: result.user?.email
            });
            let verifyPackage;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId.trim());
            if (isUUID) {
                verifyPackage = await this.prisma.packages.findUnique({
                    where: { id: packageId.trim() },
                });
            }
            else {
                verifyPackage = await this.prisma.packages.findFirst({
                    where: { tracking_number: packageId.trim() },
                });
            }
            console.log('🔍 Verificación final del paquete:', {
                id: verifyPackage?.id,
                tracking_number: verifyPackage?.tracking_number,
                user_reference: verifyPackage?.user_reference,
                matches_expected: verifyPackage?.user_reference === userId.trim()
            });
            return result;
        }
        catch (error) {
            console.error('❌ Error al asignar usuario a paquete:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Error al asignar usuario al paquete', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPackageClient(packageId) {
        try {
            console.log('🔍 Solicitud para obtener cliente de paquete:', packageId);
            return await this.packagesService.getPackageClient(packageId);
        }
        catch (error) {
            console.error('❌ Error al obtener cliente de paquete:', error);
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.HttpException(`No se encontró el paquete con ID: ${packageId}`, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Error al obtener el cliente del paquete', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUnassignedPercentage(branchId, req) {
        try {
            console.log('📊 [Controller] Recibida petición de estadísticas para sucursal:', branchId);
            console.log('👤 Usuario que solicita la información:', JSON.stringify({
                id: req.user?.id || req.user?.sub,
                email: req.user?.email,
                role: req.user?.role,
                branchReference: req.user?.branchReference
            }, null, 2));
            if (!req.user) {
                console.log('❌ Usuario no autenticado, acceso rechazado');
                throw new common_1.UnauthorizedException('Usuario no autenticado');
            }
            console.log('🔍 Enviando solicitud al servicio para branchId:', branchId);
            const branchStats = await this.packagesService.getAssignedNotInvoicedPercentage(branchId);
            console.log('✅ [Controller] Estadísticas recibidas del servicio:', branchStats);
            return {
                success: true,
                data: branchStats,
            };
        }
        catch (error) {
            console.error('❌ [Controller] Error:', error.message);
            return {
                success: false,
                message: error.message || 'Error al obtener estadísticas de paquetes',
            };
        }
    }
    async notifyPackageArrival(packageId, useSupabase = false, req) {
        console.log(`🔔 Solicitud para notificar llegada del paquete ${packageId} por operador ${req.user.sub}`);
        const result = await this.packageNotificationService.notifyPackageArrival(packageId, useSupabase);
        return {
            success: result.success,
            message: result.success
                ? 'Notificación enviada correctamente'
                : `Error al enviar notificación: ${result.error}`,
            data: result
        };
    }
    async notifyBulkPackageArrival(data, useSupabase = false, req) {
        console.log(`🔔 Solicitud para notificar llegada masiva de ${data.packageIds.length} paquetes por operador ${req.user.sub}`);
        if (!data.packageIds || !Array.isArray(data.packageIds) || data.packageIds.length === 0) {
            return {
                success: false,
                message: 'No se proporcionaron IDs de paquetes válidos'
            };
        }
        const result = await this.packageNotificationService.notifyBulkPackageArrival(data.packageIds, useSupabase);
        return {
            success: result.successful > 0,
            message: `Notificaciones enviadas: ${result.successful}/${result.total}`,
            data: result
        };
    }
};
exports.PackagesController = PackagesController;
__decorate([
    (0, common_1.Get)('tracking/:trackingNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Find package by tracking number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the package if found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'trackingNumber', description: 'Tracking number to search for' }),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findByTracking", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all packages with optional filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all packages' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'in_transit', 'delivered', 'returned', 'lost', 'canceled'] }),
    (0, swagger_1.ApiQuery)({ name: 'user_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'branch_id', required: false }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('user_id')),
    __param(4, (0, common_1.Query)('branch_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a package by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the package' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Package ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update package status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Package ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/dimensions'),
    (0, swagger_1.ApiOperation)({ summary: 'Update package dimensions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dimensions updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Package ID' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dimensions_dto_1.UpdateDimensionsDto, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "updateDimensions", null);
__decorate([
    (0, common_1.Put)(':id/weights'),
    (0, swagger_1.ApiOperation)({ summary: 'Update package weights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Weights updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Package ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_weights_dto_1.UpdateWeightsDto]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "updateWeights", null);
__decorate([
    (0, common_1.Put)(':packageId/assign-user'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a user to a package' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User successfully assigned to package' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package or user not found' }),
    (0, swagger_1.ApiParam)({ name: 'packageId', description: 'Package ID' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('packageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "assignUserToPackage", null);
__decorate([
    (0, common_1.Get)(':packageId/client'),
    (0, swagger_1.ApiOperation)({ summary: 'Get client assigned to a package' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns client information if assigned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Package not found' }),
    (0, swagger_1.ApiParam)({ name: 'packageId', description: 'Package ID' }),
    __param(0, (0, common_1.Param)('packageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "getPackageClient", null);
__decorate([
    (0, common_1.Get)('stats/unassigned-percentage/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "getUnassignedPercentage", null);
__decorate([
    (0, common_1.Post)('notify-arrival/:packageId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('packageId')),
    __param(1, (0, common_1.Query)('useSupabase')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "notifyPackageArrival", null);
__decorate([
    (0, common_1.Post)('notify-bulk-arrival'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('useSupabase')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean, Object]),
    __metadata("design:returntype", Promise)
], PackagesController.prototype, "notifyBulkPackageArrival", null);
exports.PackagesController = PackagesController = __decorate([
    (0, swagger_1.ApiTags)('packages'),
    (0, common_1.Controller)('packages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [packages_service_1.PackagesService,
        prisma_service_1.PrismaService,
        package_notification_service_1.PackageNotificationService])
], PackagesController);
//# sourceMappingURL=packages.controller.js.map