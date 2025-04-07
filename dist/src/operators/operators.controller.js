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
var OperatorsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const operators_service_1 = require("./operators.service");
const create_operator_dto_1 = require("./dto/create-operator.dto");
const update_operator_dto_1 = require("./dto/update-operator.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const operator_activity_dto_1 = require("./dto/operator-activity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let OperatorsController = OperatorsController_1 = class OperatorsController {
    constructor(operatorsService) {
        this.operatorsService = operatorsService;
        this.logger = new common_1.Logger(OperatorsController_1.name);
    }
    async createFirstAdmin(createOperatorDto) {
        try {
            this.logger.log('🔧 Intentando crear el primer operador administrador...');
            const result = await this.operatorsService.findAll();
            if (result.operators.length > 0) {
                this.logger.warn('❌ Ya existe al menos un operador');
                throw new common_1.HttpException('Ya existe al menos un operador', common_1.HttpStatus.CONFLICT);
            }
            createOperatorDto.role = 'admin';
            createOperatorDto.status = 'active';
            const operator = await this.operatorsService.create(createOperatorDto);
            this.logger.log('✅ Primer operador administrador creado exitosamente');
            return operator;
        }
        catch (error) {
            this.logger.error('❌ Error al crear el primer operador:', error);
            throw error;
        }
    }
    async create(createOperatorDto, req) {
        try {
            this.logger.log('📝 Creando nuevo operador...');
            const operator = await this.operatorsService.create(createOperatorDto);
            await this.operatorsService.logActivity(operator.operatorId, operator_activity_dto_1.ActivityType.CREATE, operator_activity_dto_1.ActivityAction.CREATE, `Creación de nuevo operador: ${operator.firstName} ${operator.lastName}`, { userId: operator.operatorId }, operator_activity_dto_1.ActivityStatus.COMPLETED, operator.branchReference, req);
            this.logger.log('✅ Operador creado exitosamente');
            return operator;
        }
        catch (error) {
            this.logger.error('❌ Error al crear operador:', error);
            throw error;
        }
    }
    async findAll(req, page, limit, status, role, branchId, search) {
        try {
            const startTime = Date.now();
            this.logger.debug('Iniciando consulta de operadores...');
            const pageNum = page ? parseInt(page.toString()) : 1;
            const limitNum = limit ? parseInt(limit.toString()) : 20;
            const filters = {
                status,
                role,
                branchId: branchId || req.user.branchReference,
                search
            };
            const result = await this.operatorsService.findAll(pageNum, limitNum, filters);
            this.logActivityAsync(req.user.id, operator_activity_dto_1.ActivityType.VIEW, operator_activity_dto_1.ActivityAction.VIEW, 'Consulta de lista de operadores', null, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            const responseTime = Date.now() - startTime;
            this.logger.debug(`Consulta completada en ${responseTime}ms: ${result.operators.length} operadores de ${result.total}`);
            return {
                data: result.operators,
                meta: {
                    total: result.total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(result.total / limitNum)
                }
            };
        }
        catch (error) {
            this.logger.error(`Error al obtener operadores: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al obtener la lista de operadores');
        }
    }
    logActivityAsync(operatorId, type, action, description, details = null, status = operator_activity_dto_1.ActivityStatus.COMPLETED, branchId, req) {
        this.operatorsService.logActivity(operatorId, type, action, description, details, status, branchId, req).catch(error => {
            this.logger.error('❌ Error al registrar actividad de forma asíncrona:', error);
        });
    }
    async findOne(id, req, refresh) {
        try {
            this.logger.log(`🔍 Buscando operador con ID: ${id}`);
            const forceRefresh = refresh === 'true' || refresh === '1';
            if (forceRefresh) {
                this.logger.log(`⚡ Forzando recarga desde base de datos para operador ${id}`);
            }
            const operator = await this.operatorsService.findOne(id, forceRefresh);
            this.logActivityAsync(req.user.operatorId, operator_activity_dto_1.ActivityType.VIEW, operator_activity_dto_1.ActivityAction.VIEW, `Consulta de detalles del operador: ${operator.firstName} ${operator.lastName}`, { targetOperatorId: id }, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            this.logger.log('✅ Operador encontrado exitosamente');
            return operator;
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener operador ${id}:`, error);
            throw error;
        }
    }
    async getOperatorActivities(id, req, page, limit) {
        try {
            const startTime = Date.now();
            this.logger.debug(`Iniciando consulta de actividades para operador: ${id}`);
            const pageNum = page ? parseInt(page.toString()) : 1;
            const limitNum = limit ? parseInt(limit.toString()) : 20;
            const result = await this.operatorsService.getOperatorActivities(id, pageNum, limitNum);
            this.logActivityAsync(req.user.id, operator_activity_dto_1.ActivityType.VIEW, operator_activity_dto_1.ActivityAction.VIEW, `Consulta de actividades del operador ${id}`, null, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            const responseTime = Date.now() - startTime;
            this.logger.debug(`Consulta completada en ${responseTime}ms: ${result.activities.length} actividades de ${result.total}`);
            return {
                data: result.activities,
                meta: {
                    total: result.total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(result.total / limitNum)
                }
            };
        }
        catch (error) {
            this.logger.error(`Error al obtener actividades del operador ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, updateOperatorDto, req) {
        try {
            this.logger.log(`📝 Actualizando operador ${id}...`);
            const operator = await this.operatorsService.update(id, updateOperatorDto);
            await this.operatorsService.logActivity(req.user.operatorId, operator_activity_dto_1.ActivityType.UPDATE, operator_activity_dto_1.ActivityAction.UPDATE, `Actualización de operador: ${operator.firstName} ${operator.lastName}`, {
                targetOperatorId: id,
                changes: updateOperatorDto
            }, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            this.logger.log('✅ Operador actualizado exitosamente');
            return operator;
        }
        catch (error) {
            this.logger.error(`❌ Error al actualizar operador ${id}:`, error);
            throw error;
        }
    }
    async remove(id, req) {
        try {
            this.logger.log(`🗑️ Eliminando operador ${id}...`);
            const operator = await this.operatorsService.findOne(id, true);
            await this.operatorsService.remove(id);
            await this.operatorsService.logActivity(req.user.operatorId, operator_activity_dto_1.ActivityType.DELETE, operator_activity_dto_1.ActivityAction.DELETE, `Eliminación de operador: ${operator.firstName} ${operator.lastName}`, { deletedOperatorId: id }, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            this.logger.log('✅ Operador eliminado exitosamente');
        }
        catch (error) {
            this.logger.error(`❌ Error al eliminar operador ${id}:`, error);
            throw error;
        }
    }
    async changePassword(id, changePasswordDto, req) {
        try {
            this.logger.log(`🔐 Intentando cambiar contraseña del operador ${id}...`);
            const operator = await this.operatorsService.findOne(id);
            const isPasswordValid = await this.operatorsService.verifyPassword(id, changePasswordDto.currentPassword);
            if (!isPasswordValid) {
                this.logger.warn(`❌ Contraseña actual incorrecta para operador ${id}`);
                throw new common_1.HttpException('Contraseña actual incorrecta', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.operatorsService.updatePassword(id, changePasswordDto.password);
            await this.operatorsService.logActivity(req.user.operatorId, operator_activity_dto_1.ActivityType.UPDATE, operator_activity_dto_1.ActivityAction.UPDATE, `Cambio de contraseña para operador: ${operator.firstName} ${operator.lastName}`, { targetOperatorId: id }, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            this.logger.log(`✅ Contraseña del operador ${id} cambiada exitosamente`);
            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al cambiar contraseña del operador ${id}:`, error);
            throw error;
        }
    }
    async clearCache(id, req) {
        try {
            this.logger.log(`🧹 Limpiando caché del operador ${id}...`);
            this.operatorsService.invalidateOperatorCache(id);
            this.logActivityAsync(req.user.operatorId, operator_activity_dto_1.ActivityType.UPDATE, operator_activity_dto_1.ActivityAction.UPDATE, `Limpieza de caché del operador: ${id}`, { targetOperatorId: id }, operator_activity_dto_1.ActivityStatus.COMPLETED, req.user.branchReference, req);
            this.logger.log('✅ Caché del operador limpiada exitosamente');
            return { success: true, message: 'Caché limpiada exitosamente' };
        }
        catch (error) {
            this.logger.error(`❌ Error al limpiar caché del operador ${id}:`, error);
            throw error;
        }
    }
};
exports.OperatorsController = OperatorsController;
__decorate([
    (0, common_1.Post)('init'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear el primer operador administrador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Operador creado exitosamente' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_operator_dto_1.CreateOperatorDto]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "createFirstAdmin", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Operador creado exitosamente' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_operator_dto_1.CreateOperatorDto, Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener todos los operadores' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Lista de operadores obtenida exitosamente' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('role')),
    __param(5, (0, common_1.Query)('branchId')),
    __param(6, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un operador por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Operador encontrado' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Operador no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/activities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener actividades de un operador' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Actividades obtenidas exitosamente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "getOperatorActivities", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar un operador' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Operador actualizado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Operador no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_operator_dto_1.UpdateOperatorDto, Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un operador' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Operador eliminado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Operador no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar la contraseña de un operador' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Contraseña cambiada exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Datos incorrectos o contraseña actual inválida' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Operador no encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)(':id/clear-cache'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Limpiar la caché de un operador específico' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID del operador' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.OK, description: 'Caché limpiada exitosamente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "clearCache", null);
exports.OperatorsController = OperatorsController = OperatorsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Operators'),
    (0, common_1.Controller)('operators'),
    __metadata("design:paramtypes", [operators_service_1.OperatorsService])
], OperatorsController);
//# sourceMappingURL=operators.controller.js.map