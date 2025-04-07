import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto) {
    try {
      console.log('🎯 POST /api/plans');
      console.log('📦 Datos recibidos:', JSON.stringify(createPlanDto, null, 2));
      
      if (!createPlanDto.branchReference) {
        throw new Error('branchReference es requerido');
      }
      
      const result = await this.plansService.create(createPlanDto);
      console.log('✅ Plan creado con éxito:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ Error al crear plan:', error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    console.log('🎯 GET /api/plans');
    try {
      const result = await this.plansService.findAll();
      console.log('✅ Planes obtenidos:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener planes:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`🎯 GET /api/plans/${id}`);
    const result = await this.plansService.findOne(id);
    console.log('✅ Plan encontrado:', JSON.stringify(result, null, 2));
    return result;
  }

  @Get('branch/:branchReference')
  async findByBranch(@Param('branchReference') branchReference: string) {
    try {
      console.log('🎯 GET /plans/branch/:branchReference', {
        parametro_recibido: branchReference
      });

      const plans = await this.plansService.findByBranch(branchReference);
      
      console.log(`✅ Se encontraron ${plans.length} planes para la sucursal`);
      return plans;
    } catch (error) {
      console.error('❌ Error al obtener planes de la sucursal:', error);
      throw error;
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    console.log(`🎯 PATCH /api/plans/${id}`);
    console.log('📦 Datos actualizados:', JSON.stringify(updatePlanDto, null, 2));
    const result = await this.plansService.update(id, updatePlanDto);
    console.log('✅ Plan actualizado:', JSON.stringify(result, null, 2));
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log(`🎯 DELETE /api/plans/${id}`);
    await this.plansService.remove(id);
    return { message: 'Plan eliminado correctamente' };
  }
} 