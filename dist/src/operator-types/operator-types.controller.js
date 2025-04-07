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
var OperatorTypesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorTypesController = void 0;
const common_1 = require("@nestjs/common");
const operator_types_service_1 = require("./operator-types.service");
const dto_1 = require("./dto");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let OperatorTypesController = OperatorTypesController_1 = class OperatorTypesController {
    constructor(operatorTypesService) {
        this.operatorTypesService = operatorTypesService;
        this.logger = new common_1.Logger(OperatorTypesController_1.name);
    }
    async create(createOperatorTypeDto) {
        try {
            this.logger.log('🎯 POST /api/operator-types');
            this.logger.log('📦 Datos recibidos:', JSON.stringify(createOperatorTypeDto, null, 2));
            const result = await this.operatorTypesService.create(createOperatorTypeDto);
            this.logger.log(`✅ Tipo de operador creado: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Error al crear tipo de operador: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al crear el tipo de operador',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(name) {
        try {
            this.logger.log('🎯 GET /api/operator-types');
            const result = await this.operatorTypesService.findAll();
            this.logger.log(`✅ Tipos de operador obtenidos: ${result.length}`);
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener tipos de operador: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al cargar los tipos de operador',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            this.logger.log(`🎯 GET /api/operator-types/${id}`);
            const result = await this.operatorTypesService.findOne(id);
            this.logger.log(`✅ Tipo de operador encontrado: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener tipo de operador: ${error.message}`, error.stack);
            if (error.status === common_1.HttpStatus.NOT_FOUND) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al obtener el tipo de operador',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async update(id, updateOperatorTypeDto) {
        try {
            this.logger.log(`🎯 PATCH /api/operator-types/${id}`);
            this.logger.log('📦 Datos actualizados:', JSON.stringify(updateOperatorTypeDto, null, 2));
            const result = await this.operatorTypesService.update(id, updateOperatorTypeDto);
            this.logger.log(`✅ Tipo de operador actualizado: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Error al actualizar tipo de operador: ${error.message}`, error.stack);
            if (error.status === common_1.HttpStatus.NOT_FOUND) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al actualizar el tipo de operador',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        try {
            this.logger.log(`🎯 DELETE /api/operator-types/${id}`);
            const result = await this.operatorTypesService.remove(id);
            this.logger.log('✅ Tipo de operador eliminado correctamente');
            return result;
        }
        catch (error) {
            this.logger.error(`❌ Error al eliminar tipo de operador: ${error.message}`, error.stack);
            if (error.status === common_1.HttpStatus.NOT_FOUND || error.status === common_1.HttpStatus.CONFLICT) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al eliminar el tipo de operador',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.OperatorTypesController = OperatorTypesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateOperatorTypeDto]),
    __metadata("design:returntype", Promise)
], OperatorTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OperatorTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OperatorTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateOperatorTypeDto]),
    __metadata("design:returntype", Promise)
], OperatorTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OperatorTypesController.prototype, "remove", null);
exports.OperatorTypesController = OperatorTypesController = OperatorTypesController_1 = __decorate([
    (0, common_1.Controller)('operator-types'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [operator_types_service_1.OperatorTypesService])
], OperatorTypesController);
//# sourceMappingURL=operator-types.controller.js.map