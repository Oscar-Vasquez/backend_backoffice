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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchesService = class BranchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBranchDto) {
        try {
            console.log('📊 Creando sucursal con Prisma...');
            const { vehicles, products, ...branchData } = createBranchDto;
            const branch = await this.prisma.branches.create({
                data: {
                    ...branchData,
                    company_id: "ea4af179-bfe1-4c6d-ad21-1c836377ff84",
                },
            });
            console.log('✅ Sucursal creada con éxito:', branch.id);
            return branch;
        }
        catch (error) {
            console.error('❌ Error al crear la sucursal:', error);
            throw new Error(`Error al crear la sucursal: ${error.message}`);
        }
    }
    async findAll() {
        try {
            console.log('📊 Obteniendo todas las sucursales con Prisma...');
            const branches = await this.prisma.branches.findMany({
                orderBy: {
                    created_at: 'desc',
                },
            });
            console.log(`📦 Total de sucursales encontradas: ${branches.length}`);
            return branches;
        }
        catch (error) {
            console.error('❌ Error al obtener sucursales:', error);
            throw new Error(`Error al obtener las sucursales: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            console.log(`📊 Buscando sucursal con ID: ${id}`);
            const branch = await this.prisma.branches.findUnique({
                where: { id },
                include: {
                    operators: true,
                    vehicles: true,
                },
            });
            if (!branch) {
                throw new common_1.NotFoundException(`Sucursal con ID ${id} no encontrada`);
            }
            console.log('✅ Sucursal encontrada');
            return branch;
        }
        catch (error) {
            console.error('❌ Error al obtener la sucursal:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Error al obtener la sucursal: ${error.message}`);
        }
    }
    async update(id, updateBranchDto) {
        try {
            console.log(`📊 Actualizando sucursal con ID: ${id}`);
            const existingBranch = await this.prisma.branches.findUnique({
                where: { id },
            });
            if (!existingBranch) {
                throw new common_1.NotFoundException(`Sucursal con ID ${id} no encontrada`);
            }
            const { vehicles, products, ...branchData } = updateBranchDto;
            const updatedBranch = await this.prisma.branches.update({
                where: { id },
                data: {
                    ...branchData,
                    updated_at: new Date(),
                },
            });
            console.log('✅ Sucursal actualizada con éxito');
            return updatedBranch;
        }
        catch (error) {
            console.error('❌ Error al actualizar la sucursal:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Error al actualizar la sucursal: ${error.message}`);
        }
    }
    async remove(id) {
        try {
            console.log(`📊 Eliminando sucursal con ID: ${id}`);
            const existingBranch = await this.prisma.branches.findUnique({
                where: { id },
            });
            if (!existingBranch) {
                throw new common_1.NotFoundException(`Sucursal con ID ${id} no encontrada`);
            }
            await this.prisma.branches.delete({
                where: { id },
            });
            console.log('✅ Sucursal eliminada con éxito');
            return { message: 'Sucursal eliminada correctamente' };
        }
        catch (error) {
            console.error('❌ Error al eliminar la sucursal:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Error al eliminar la sucursal: ${error.message}`);
        }
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map