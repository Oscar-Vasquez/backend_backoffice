import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    try {
      console.log('📊 Creando sucursal con Prisma...');
      
      // Extraer los campos que no están en el modelo de Prisma
      const { vehicles, products, ...branchData } = createBranchDto;
      
      // Crear la sucursal en la base de datos
      const branch = await this.prisma.branches.create({
        data: {
          ...branchData,
          // Si no se proporciona company_id, usar un valor por defecto o lanzar un error
          company_id: "ea4af179-bfe1-4c6d-ad21-1c836377ff84",
        },
      });
      
      console.log('✅ Sucursal creada con éxito:', branch.id);
      return branch;
    } catch (error) {
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
    } catch (error) {
      console.error('❌ Error al obtener sucursales:', error);
      throw new Error(`Error al obtener las sucursales: ${error.message}`);
    }
  }

  async findOne(id: string) {
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
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }
      
      console.log('✅ Sucursal encontrada');
      return branch;
    } catch (error) {
      console.error('❌ Error al obtener la sucursal:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al obtener la sucursal: ${error.message}`);
    }
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    try {
      console.log(`📊 Actualizando sucursal con ID: ${id}`);
      
      // Verificar si la sucursal existe
      const existingBranch = await this.prisma.branches.findUnique({
        where: { id },
      });
      
      if (!existingBranch) {
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }
      
      // Extraer los campos que no están en el modelo de Prisma
      const { vehicles, products, ...branchData } = updateBranchDto;
      
      // Actualizar la sucursal
      const updatedBranch = await this.prisma.branches.update({
        where: { id },
        data: {
          ...branchData,
          updated_at: new Date(),
        },
      });
      
      console.log('✅ Sucursal actualizada con éxito');
      return updatedBranch;
    } catch (error) {
      console.error('❌ Error al actualizar la sucursal:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al actualizar la sucursal: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      console.log(`📊 Eliminando sucursal con ID: ${id}`);
      
      // Verificar si la sucursal existe
      const existingBranch = await this.prisma.branches.findUnique({
        where: { id },
      });
      
      if (!existingBranch) {
        throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
      }
      
      // Eliminar la sucursal
      await this.prisma.branches.delete({
        where: { id },
      });
      
      console.log('✅ Sucursal eliminada con éxito');
      return { message: 'Sucursal eliminada correctamente' };
    } catch (error) {
      console.error('❌ Error al eliminar la sucursal:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al eliminar la sucursal: ${error.message}`);
    }
  }
} 