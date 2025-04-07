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
var PlansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let PlansService = PlansService_1 = class PlansService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PlansService_1.name);
    }
    async create(createPlanDto) {
        try {
            this.logger.log('Creando nuevo plan con datos:', JSON.stringify(createPlanDto, null, 2));
            const branchId = this.extractBranchId(createPlanDto.branchReference);
            if (!branchId) {
                throw new Error('ID de sucursal inválido');
            }
            const plan = await this.prisma.plans.create({
                data: {
                    name: createPlanDto.planName,
                    description: createPlanDto.description,
                    price: new library_1.Decimal(createPlanDto.price),
                    branch_id: branchId,
                    is_active: true
                },
                include: {
                    branches: true
                }
            });
            this.logger.log('Plan creado exitosamente:', plan.id);
            return this.mapPlanToDto(plan);
        }
        catch (error) {
            this.logger.error(`Error al crear el plan: ${error.message}`, error.stack);
            throw new Error(`Error al crear el plan: ${error.message}`);
        }
    }
    async findAll() {
        try {
            this.logger.log('📊 Iniciando búsqueda de planes...');
            const plans = await this.prisma.plans.findMany({
                include: {
                    branches: true
                }
            });
            this.logger.log(`📦 Total de planes encontrados: ${plans.length}`);
            const transformedPlans = plans.map(plan => {
                const transformedPlan = this.mapPlanToDto(plan);
                this.logger.log('📄 Plan encontrado:', {
                    id: plan.id,
                    isActive: plan.is_active,
                    planName: plan.name,
                    branchName: plan.branches?.province || 'Sucursal no encontrada'
                });
                return transformedPlan;
            });
            this.logger.log(`✅ Total de planes procesados: ${transformedPlans.length}`);
            return transformedPlans;
        }
        catch (error) {
            this.logger.error('❌ Error en findAll:', error);
            throw new Error(`Error al obtener los planes: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            this.logger.log('🔍 Buscando plan con ID:', id);
            const plan = await this.prisma.plans.findUnique({
                where: { id },
                include: {
                    branches: true
                }
            });
            if (!plan) {
                this.logger.log('❌ Plan no encontrado');
                throw new common_1.NotFoundException(`Plan con ID ${id} no encontrado`);
            }
            this.logger.log('📄 Datos del plan encontrados:', {
                id: plan.id,
                name: plan.name
            });
            this.logger.log('🏢 Información de la sucursal:', plan.branches);
            return this.mapPlanToDto(plan);
        }
        catch (error) {
            this.logger.error('❌ Error al obtener el plan:', error);
            throw new Error(`Error al obtener el plan: ${error.message}`);
        }
    }
    async update(id, updatePlanDto) {
        try {
            const existingPlan = await this.prisma.plans.findUnique({
                where: { id }
            });
            if (!existingPlan) {
                throw new common_1.NotFoundException(`Plan con ID ${id} no encontrado`);
            }
            const updateData = {};
            if (updatePlanDto.planName !== undefined) {
                updateData.name = updatePlanDto.planName;
            }
            if (updatePlanDto.description !== undefined) {
                updateData.description = updatePlanDto.description;
            }
            if (updatePlanDto.price !== undefined) {
                updateData.price = new library_1.Decimal(updatePlanDto.price);
            }
            if (updatePlanDto.branchReference !== undefined) {
                const branchId = this.extractBranchId(updatePlanDto.branchReference);
                if (branchId) {
                    updateData.branch_id = branchId;
                }
            }
            const updatedPlan = await this.prisma.plans.update({
                where: { id },
                data: {
                    ...updateData,
                    updated_at: new Date()
                },
                include: {
                    branches: true
                }
            });
            return this.mapPlanToDto(updatedPlan);
        }
        catch (error) {
            this.logger.error(`Error al actualizar el plan ${id}:`, error);
            throw new Error(`Error al actualizar el plan: ${error.message}`);
        }
    }
    async remove(id) {
        try {
            const plan = await this.prisma.plans.findUnique({
                where: { id }
            });
            if (!plan) {
                throw new common_1.NotFoundException(`Plan con ID ${id} no encontrado`);
            }
            await this.prisma.plans.delete({
                where: { id }
            });
            return { message: 'Plan eliminado correctamente' };
        }
        catch (error) {
            this.logger.error(`Error al eliminar el plan ${id}:`, error);
            throw new Error(`Error al eliminar el plan: ${error.message}`);
        }
    }
    async findByBranch(branchReference) {
        try {
            if (!branchReference) {
                this.logger.warn('⚠️ branchReference es undefined o null');
                return [];
            }
            const branchId = this.extractBranchId(branchReference);
            if (!branchId) {
                this.logger.warn('⚠️ No se pudo extraer un ID de sucursal válido');
                return [];
            }
            this.logger.log('🔍 Buscando planes para la sucursal:', {
                id_extraido: branchId
            });
            const plans = await this.prisma.plans.findMany({
                where: {
                    branch_id: branchId
                },
                include: {
                    branches: true
                }
            });
            this.logger.log('📊 Total de planes encontrados:', plans.length);
            const transformedPlans = plans.map(plan => this.mapPlanToDto(plan));
            this.logger.log('📋 Planes encontrados para la sucursal:', {
                total: transformedPlans.length,
                planes: transformedPlans.map(p => ({ id: p.id, planName: p.planName }))
            });
            return transformedPlans;
        }
        catch (error) {
            this.logger.error('❌ Error al obtener planes:', error);
            throw new Error(`Error al obtener los planes de la sucursal: ${error.message}`);
        }
    }
    extractBranchId(branchReference) {
        if (!branchReference) {
            return null;
        }
        let branchId = null;
        if (typeof branchReference === 'string') {
            branchId = branchReference.replace('/branches/', '');
            this.logger.log('🔍 branchReference es una cadena, ID extraído:', branchId);
        }
        else if (typeof branchReference === 'object') {
            this.logger.log('🔍 branchReference es un objeto:', JSON.stringify(branchReference, null, 2));
            if (branchReference.id) {
                branchId = branchReference.id;
            }
            else if (branchReference.branchId) {
                branchId = branchReference.branchId;
            }
            else if (branchReference.path) {
                const pathParts = branchReference.path.split('/');
                branchId = pathParts[pathParts.length - 1];
            }
            else if (branchReference.ref) {
                if (typeof branchReference.ref === 'string') {
                    const refParts = branchReference.ref.split('/');
                    branchId = refParts[refParts.length - 1];
                }
                else if (typeof branchReference.ref === 'object') {
                    if (branchReference.ref.id) {
                        branchId = branchReference.ref.id;
                    }
                    else if (branchReference.ref.path) {
                        const refPathParts = branchReference.ref.path.split('/');
                        branchId = refPathParts[refPathParts.length - 1];
                    }
                }
            }
        }
        return branchId;
    }
    mapPlanToDto(plan) {
        const branchInfo = plan.branches ? {
            id: plan.branches.id,
            province: plan.branches.province
        } : null;
        return {
            id: plan.id,
            planName: plan.name,
            description: plan.description || '',
            price: parseFloat(plan.price.toString()),
            isActive: plan.is_active || false,
            branchReference: plan.branch_id ? `/branches/${plan.branch_id}` : '',
            branch: branchInfo,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at
        };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = PlansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansService);
//# sourceMappingURL=plans.service.js.map