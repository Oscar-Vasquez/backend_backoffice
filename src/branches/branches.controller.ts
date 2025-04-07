import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  async create(@Body() createBranchDto: CreateBranchDto) {
    console.log('🎯 POST /api/branches');
    console.log('📦 Datos recibidos:', JSON.stringify(createBranchDto, null, 2));
    try {
      const result = await this.branchesService.create(createBranchDto);
      console.log('✅ Sucursal creada:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error al crear sucursal:', error);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al crear la sucursal',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(@Query('active') active?: string) {
    console.log('🎯 GET /api/branches');
    try {
      const result = await this.branchesService.findAll();
      console.log('✅ Sucursales obtenidas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener sucursales:', error);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al cargar las sucursales',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`🎯 GET /api/branches/${id}`);
    try {
      const result = await this.branchesService.findOne(id);
      console.log('✅ Sucursal encontrada:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener sucursal:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        error: 'Sucursal no encontrada',
        message: error.message
      }, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    console.log(`🎯 PATCH /api/branches/${id}`);
    console.log('📦 Datos actualizados:', JSON.stringify(updateBranchDto, null, 2));
    try {
      const result = await this.branchesService.update(id, updateBranchDto);
      console.log('✅ Sucursal actualizada:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error al actualizar sucursal:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al actualizar la sucursal',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log(`🎯 DELETE /api/branches/${id}`);
    try {
      const result = await this.branchesService.remove(id);
      console.log('✅ Sucursal eliminada correctamente');
      return result;
    } catch (error) {
      console.error('❌ Error al eliminar sucursal:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al eliminar la sucursal',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 