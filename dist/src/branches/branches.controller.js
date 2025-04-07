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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const branches_service_1 = require("./branches.service");
const branch_dto_1 = require("./dto/branch.dto");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let BranchesController = class BranchesController {
    constructor(branchesService) {
        this.branchesService = branchesService;
    }
    async create(createBranchDto) {
        console.log('🎯 POST /api/branches');
        console.log('📦 Datos recibidos:', JSON.stringify(createBranchDto, null, 2));
        try {
            const result = await this.branchesService.create(createBranchDto);
            console.log('✅ Sucursal creada:', result.id);
            return result;
        }
        catch (error) {
            console.error('❌ Error al crear sucursal:', error);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al crear la sucursal',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(active) {
        console.log('🎯 GET /api/branches');
        try {
            const result = await this.branchesService.findAll();
            console.log('✅ Sucursales obtenidas:', result.length);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener sucursales:', error);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al cargar las sucursales',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        console.log(`🎯 GET /api/branches/${id}`);
        try {
            const result = await this.branchesService.findOne(id);
            console.log('✅ Sucursal encontrada:', result.id);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener sucursal:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.NOT_FOUND,
                error: 'Sucursal no encontrada',
                message: error.message
            }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateBranchDto) {
        console.log(`🎯 PATCH /api/branches/${id}`);
        console.log('📦 Datos actualizados:', JSON.stringify(updateBranchDto, null, 2));
        try {
            const result = await this.branchesService.update(id, updateBranchDto);
            console.log('✅ Sucursal actualizada:', result.id);
            return result;
        }
        catch (error) {
            console.error('❌ Error al actualizar sucursal:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al actualizar la sucursal',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        console.log(`🎯 DELETE /api/branches/${id}`);
        try {
            const result = await this.branchesService.remove(id);
            console.log('✅ Sucursal eliminada correctamente');
            return result;
        }
        catch (error) {
            console.error('❌ Error al eliminar sucursal:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error al eliminar la sucursal',
                message: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [branch_dto_1.CreateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, branch_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "remove", null);
exports.BranchesController = BranchesController = __decorate([
    (0, common_1.Controller)('branches'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [branches_service_1.BranchesService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map