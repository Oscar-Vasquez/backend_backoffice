import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorTypeDto, UpdateOperatorTypeDto } from './dto';

@Injectable()
export class OperatorTypesService {
  private readonly logger = new Logger(OperatorTypesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createOperatorTypeDto: CreateOperatorTypeDto) {
    try {
      this.logger.log('Creating new operator type');
      
      // Check if an operator type with the same name already exists
      const existingType = await this.prisma.operator_types.findFirst({
        where: { name: createOperatorTypeDto.name }
      });
      
      if (existingType) {
        throw new ConflictException(`Operator type with name "${createOperatorTypeDto.name}" already exists`);
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
    } catch (error) {
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
    } catch (error) {
      this.logger.error(`Error fetching operator types: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
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
        throw new NotFoundException(`Operator type with ID "${id}" not found`);
      }
      
      this.logger.log(`Found operator type: ${operatorType.name}`);
      return operatorType;
    } catch (error) {
      this.logger.error(`Error fetching operator type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateOperatorTypeDto: UpdateOperatorTypeDto) {
    try {
      this.logger.log(`Updating operator type with ID: ${id}`);
      
      // Check if the operator type exists
      const existingType = await this.prisma.operator_types.findUnique({
        where: { id }
      });
      
      if (!existingType) {
        throw new NotFoundException(`Operator type with ID "${id}" not found`);
      }
      
      // If name is being updated, check if it conflicts with another type
      if (updateOperatorTypeDto.name && updateOperatorTypeDto.name !== existingType.name) {
        const nameConflict = await this.prisma.operator_types.findFirst({
          where: { 
            name: updateOperatorTypeDto.name,
            id: { not: id }
          }
        });
        
        if (nameConflict) {
          throw new ConflictException(`Operator type with name "${updateOperatorTypeDto.name}" already exists`);
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
    } catch (error) {
      this.logger.error(`Error updating operator type: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Removing operator type with ID: ${id}`);
      
      // Check if the operator type exists
      const existingType = await this.prisma.operator_types.findUnique({
        where: { id },
        include: { operators: true }
      });
      
      if (!existingType) {
        throw new NotFoundException(`Operator type with ID "${id}" not found`);
      }
      
      // Check if there are operators using this type
      if (existingType.operators && existingType.operators.length > 0) {
        throw new ConflictException(
          `Cannot delete operator type "${existingType.name}" because it is assigned to ${existingType.operators.length} operators`
        );
      }
      
      await this.prisma.operator_types.delete({
        where: { id }
      });
      
      this.logger.log(`Operator type deleted: ${existingType.name}`);
      return { message: `Operator type "${existingType.name}" has been deleted` };
    } catch (error) {
      this.logger.error(`Error removing operator type: ${error.message}`, error.stack);
      throw error;
    }
  }
} 