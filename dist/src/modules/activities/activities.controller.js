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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const activities_service_1 = require("./activities.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ActivitiesController = class ActivitiesController {
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async createActivity(createActivityDto) {
        return this.activitiesService.createActivity(createActivityDto);
    }
    async getOperatorActivities(operatorId, limit) {
        console.log('🔍 Buscando actividades para el operador:', operatorId);
        const activities = await this.activitiesService.getOperatorActivities(operatorId, limit ? parseInt(limit) : undefined);
        console.log(`📊 Se encontraron ${activities.length} actividades`);
        return activities;
    }
    async getRecentActivities(limit, days) {
        return this.activitiesService.getRecentActivities(limit ? parseInt(limit) : undefined, days ? parseInt(days) : undefined);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear una nueva actividad' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Actividad creada exitosamente',
        type: create_activity_dto_1.CreateActivityDto
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_activity_dto_1.CreateActivityDto]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "createActivity", null);
__decorate([
    (0, common_1.Get)('operator/:operatorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener actividades de un operador específico' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de actividades del operador',
        type: [create_activity_dto_1.CreateActivityDto]
    }),
    __param(0, (0, common_1.Param)('operatorId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "getOperatorActivities", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener actividades recientes' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de actividades recientes',
        type: [create_activity_dto_1.CreateActivityDto]
    }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "getRecentActivities", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, swagger_1.ApiTags)('actividades'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('activities'),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map