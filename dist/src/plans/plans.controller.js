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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const plans_service_1 = require("./plans.service");
const create_plan_dto_1 = require("./dto/create-plan.dto");
const update_plan_dto_1 = require("./dto/update-plan.dto");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
let PlansController = class PlansController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    async create(createPlanDto) {
        try {
            console.log('🎯 POST /api/plans');
            console.log('📦 Datos recibidos:', JSON.stringify(createPlanDto, null, 2));
            if (!createPlanDto.branchReference) {
                throw new Error('branchReference es requerido');
            }
            const result = await this.plansService.create(createPlanDto);
            console.log('✅ Plan creado con éxito:', JSON.stringify(result, null, 2));
            return result;
        }
        catch (error) {
            console.error('❌ Error al crear plan:', error);
            throw error;
        }
    }
    async findAll() {
        console.log('🎯 GET /api/plans');
        try {
            const result = await this.plansService.findAll();
            console.log('✅ Planes obtenidos:', result.length);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener planes:', error);
            throw error;
        }
    }
    async findOne(id) {
        console.log(`🎯 GET /api/plans/${id}`);
        const result = await this.plansService.findOne(id);
        console.log('✅ Plan encontrado:', JSON.stringify(result, null, 2));
        return result;
    }
    async findByBranch(branchReference) {
        try {
            console.log('🎯 GET /plans/branch/:branchReference', {
                parametro_recibido: branchReference
            });
            const plans = await this.plansService.findByBranch(branchReference);
            console.log(`✅ Se encontraron ${plans.length} planes para la sucursal`);
            return plans;
        }
        catch (error) {
            console.error('❌ Error al obtener planes de la sucursal:', error);
            throw error;
        }
    }
    async update(id, updatePlanDto) {
        console.log(`🎯 PATCH /api/plans/${id}`);
        console.log('📦 Datos actualizados:', JSON.stringify(updatePlanDto, null, 2));
        const result = await this.plansService.update(id, updatePlanDto);
        console.log('✅ Plan actualizado:', JSON.stringify(result, null, 2));
        return result;
    }
    async remove(id) {
        console.log(`🎯 DELETE /api/plans/${id}`);
        await this.plansService.remove(id);
        return { message: 'Plan eliminado correctamente' };
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_plan_dto_1.CreatePlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('branch/:branchReference'),
    __param(0, (0, common_1.Param)('branchReference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "findByBranch", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_plan_dto_1.UpdatePlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "remove", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)('plans'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map