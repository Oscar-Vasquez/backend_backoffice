import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto) {
    try {
      this.logger.log('Creando nuevo plan con datos:', JSON.stringify(createPlanDto, null, 2));
      
      // Extraer ID de sucursal del branchReference
      const branchId = this.extractBranchId(createPlanDto.branchReference);
      if (!branchId) {
        throw new Error('ID de sucursal inválido');
      }
      
      // Crear plan usando Prisma
      const plan = await this.prisma.plans.create({
        data: {
          name: createPlanDto.planName,
          description: createPlanDto.description,
          price: new Decimal(createPlanDto.price),
          branch_id: branchId,
          is_active: true
        },
        include: {
          branches: true // Incluir información de la sucursal
        }
      });
      
      this.logger.log('Plan creado exitosamente:', plan.id);
      
      // Transformar a formato esperado por el frontend
      return this.mapPlanToDto(plan);
    } catch (error) {
      this.logger.error(`Error al crear el plan: ${error.message}`, error.stack);
      throw new Error(`Error al crear el plan: ${error.message}`);
    }
  }

  async findAll() {
    try {
      this.logger.log('📊 Iniciando búsqueda de planes...');
      
      // Obtener planes con sus sucursales
      const plans = await this.prisma.plans.findMany({
        include: {
          branches: true // Incluir la relación con branches
        }
      });
      
      this.logger.log(`📦 Total de planes encontrados: ${plans.length}`);
      
      // Transformar los planes al formato esperado por el frontend
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
    } catch (error) {
      this.logger.error('❌ Error en findAll:', error);
      throw new Error(`Error al obtener los planes: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      this.logger.log('🔍 Buscando plan con ID:', id);
      
      // Buscar plan por ID incluyendo la sucursal
      const plan = await this.prisma.plans.findUnique({
        where: { id },
        include: {
          branches: true
        }
      });
      
      if (!plan) {
        this.logger.log('❌ Plan no encontrado');
        throw new NotFoundException(`Plan con ID ${id} no encontrado`);
      }
      
      this.logger.log('📄 Datos del plan encontrados:', {
        id: plan.id,
        name: plan.name
      });
      
      this.logger.log('🏢 Información de la sucursal:', plan.branches);
      
      // Transformar al formato esperado
      return this.mapPlanToDto(plan);
    } catch (error) {
      this.logger.error('❌ Error al obtener el plan:', error);
      throw new Error(`Error al obtener el plan: ${error.message}`);
    }
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    try {
      // Verificar que el plan existe
      const existingPlan = await this.prisma.plans.findUnique({
        where: { id }
      });

      if (!existingPlan) {
        throw new NotFoundException(`Plan con ID ${id} no encontrado`);
      }

      // Preparar datos para actualización
      const updateData: any = {};
      
      if (updatePlanDto.planName !== undefined) {
        updateData.name = updatePlanDto.planName;
      }
      
      if (updatePlanDto.description !== undefined) {
        updateData.description = updatePlanDto.description;
      }
      
      if (updatePlanDto.price !== undefined) {
        updateData.price = new Decimal(updatePlanDto.price);
      }
      
      if (updatePlanDto.branchReference !== undefined) {
        const branchId = this.extractBranchId(updatePlanDto.branchReference);
        if (branchId) {
          updateData.branch_id = branchId;
        }
      }
      
      // Actualizar el plan
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
    } catch (error) {
      this.logger.error(`Error al actualizar el plan ${id}:`, error);
      throw new Error(`Error al actualizar el plan: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Verificar que el plan existe
      const plan = await this.prisma.plans.findUnique({
        where: { id }
      });

      if (!plan) {
        throw new NotFoundException(`Plan con ID ${id} no encontrado`);
      }

      // Eliminar el plan
      await this.prisma.plans.delete({
        where: { id }
      });
      
      return { message: 'Plan eliminado correctamente' };
    } catch (error) {
      this.logger.error(`Error al eliminar el plan ${id}:`, error);
      throw new Error(`Error al eliminar el plan: ${error.message}`);
    }
  }

  async findByBranch(branchReference: any) {
    try {
      // Validar que branchReference exista
      if (!branchReference) {
        this.logger.warn('⚠️ branchReference es undefined o null');
        return [];
      }

      // Extraer ID de sucursal
      const branchId = this.extractBranchId(branchReference);
      if (!branchId) {
        this.logger.warn('⚠️ No se pudo extraer un ID de sucursal válido');
        return [];
      }

      this.logger.log('🔍 Buscando planes para la sucursal:', {
        id_extraido: branchId
      });
      
      // Obtener planes por sucursal
      const plans = await this.prisma.plans.findMany({
        where: {
          branch_id: branchId
        },
        include: {
          branches: true
        }
      });

      this.logger.log('📊 Total de planes encontrados:', plans.length);

      // Transformar al formato esperado
      const transformedPlans = plans.map(plan => this.mapPlanToDto(plan));

      this.logger.log('📋 Planes encontrados para la sucursal:', {
        total: transformedPlans.length,
        planes: transformedPlans.map(p => ({ id: p.id, planName: p.planName }))
      });

      return transformedPlans;
    } catch (error) {
      this.logger.error('❌ Error al obtener planes:', error);
      throw new Error(`Error al obtener los planes de la sucursal: ${error.message}`);
    }
  }

  /**
   * Extrae el ID de sucursal de diferentes formatos de branchReference
   */
  private extractBranchId(branchReference: any): string | null {
    if (!branchReference) {
      return null;
    }
    
    let branchId: string | null = null;
    
    if (typeof branchReference === 'string') {
      // Si es una cadena, extraer ID
      branchId = branchReference.replace('/branches/', '');
      this.logger.log('🔍 branchReference es una cadena, ID extraído:', branchId);
    } 
    else if (typeof branchReference === 'object') {
      this.logger.log('🔍 branchReference es un objeto:', JSON.stringify(branchReference, null, 2));
      
      // Extraer ID de diferentes propiedades posibles
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

  /**
   * Transforma un plan de Prisma al formato DTO esperado por el frontend
   */
  private mapPlanToDto(plan: any) {
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
} 