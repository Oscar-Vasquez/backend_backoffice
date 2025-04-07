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
var OperatorTypesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OperatorTypesService = OperatorTypesService_1 = class OperatorTypesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OperatorTypesService_1.name);
    }
    async create(createOperatorTypeDto) {
        try {
            this.logger.log('Creating new operator type');
            const existingType = await this.prisma.operator_types.findFirst({
                where: { name: createOperatorTypeDto.name }
            });
            if (existingType) {
                throw new common_1.ConflictException(`Operator type with name "${createOperatorTypeDto.name}" already exists`);
            }
            const operatorType = await this.prisma.operator_types.create({
                data: {
                    name: createOperatorTypeDto.name,
                    description: createOperatorTypeDto.description,
                    permissions: createOperatorTypeDto.permissions,
                }
            });
            this.logger.log(`Operator type created with ID: ${operatorType.id}`);
            return operatorType;
        }
        catch (error) {
            this.logger.error(`Error creating operator type: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll() {
        try {
            this.logger.log('Fetching all operator types');
            const operatorTypes = await this.prisma.operator_types.findMany({
                orderBy: { name: 'asc' },
            });
            this.logger.log(`Found ${operatorTypes.length} operator types`);
            return operatorTypes;
        }
        catch (error) {
            this.logger.error(`Error fetching operator types: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        try {
            this.logger.log(`Fetching operator type with ID: ${id}`);
            const operatorType = await this.prisma.operator_types.findUnique({
                where: { id },
                include: {
                    operators: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            role: true,
                            status: true,
                        }
                    }
                }
            });
            if (!operatorType) {
                throw new common_1.NotFoundException(`Operator type with ID "${id}" not found`);
            }
            this.logger.log(`Found operator type: ${operatorType.name}`);
            return operatorType;
        }
        catch (error) {
            this.logger.error(`Error fetching operator type: ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, updateOperatorTypeDto) {
        try {
            this.logger.log(`Updating operator type with ID: ${id}`);
            const existingType = await this.prisma.operator_types.findUnique({
                where: { id }
            });
            if (!existingType) {
                throw new common_1.NotFoundException(`Operator type with ID "${id}" not found`);
            }
            if (updateOperatorTypeDto.name && updateOperatorTypeDto.name !== existingType.name) {
                const nameConflict = await this.prisma.operator_types.findFirst({
                    where: {
                        name: updateOperatorTypeDto.name,
                        id: { not: id }
                    }
                });
                if (nameConflict) {
                    throw new common_1.ConflictException(`Operator type with name "${updateOperatorTypeDto.name}" already exists`);
                }
            }
            const updatedOperatorType = await this.prisma.operator_types.update({
                where: { id },
                data: {
                    name: updateOperatorTypeDto.name,
                    description: updateOperatorTypeDto.description,
                    permissions: updateOperatorTypeDto.permissions,
                    updated_at: new Date(),
                }
            });
            this.logger.log(`Operator type updated: ${updatedOperatorType.name}`);
            return updatedOperatorType;
        }
        catch (error) {
            this.logger.error(`Error updating operator type: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`Removing operator type with ID: ${id}`);
            const existingType = await this.prisma.operator_types.findUnique({
                where: { id },
                include: { operators: true }
            });
            if (!existingType) {
                throw new common_1.NotFoundException(`Operator type with ID "${id}" not found`);
            }
            if (existingType.operators && existingType.operators.length > 0) {
                throw new common_1.ConflictException(`Cannot delete operator type "${existingType.name}" because it is assigned to ${existingType.operators.length} operators`);
            }
            await this.prisma.operator_types.delete({
                where: { id }
            });
            this.logger.log(`Operator type deleted: ${existingType.name}`);
            return { message: `Operator type "${existingType.name}" has been deleted` };
        }
        catch (error) {
            this.logger.error(`Error removing operator type: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.OperatorTypesService = OperatorTypesService;
exports.OperatorTypesService = OperatorTypesService = OperatorTypesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OperatorTypesService);
//# sourceMappingURL=operator-types.service.js.map