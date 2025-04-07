import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  HttpException, 
  HttpStatus,
  Logger,
  Query
} from '@nestjs/common';
import { OperatorTypesService } from './operator-types.service';
import { CreateOperatorTypeDto, UpdateOperatorTypeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('operator-types')
@UseGuards(JwtAuthGuard)
export class OperatorTypesController {
  private readonly logger = new Logger(OperatorTypesController.name);

  constructor(private readonly operatorTypesService: OperatorTypesService) {}

  @Post()
  async create(@Body() createOperatorTypeDto: CreateOperatorTypeDto) {
    try {
      this.logger.log('🎯 POST /api/operator-types');
      this.logger.log('📦 Datos recibidos:', JSON.stringify(createOperatorTypeDto, null, 2));
      
      const result = await this.operatorTypesService.create(createOperatorTypeDto);
      this.logger.log(`✅ Tipo de operador creado: ${result.id}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Error al crear tipo de operador: ${error.message}`, error.stack);
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al crear el tipo de operador',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(@Query('name') name?: string) {
    try {
      this.logger.log('🎯 GET /api/operator-types');
      
      const result = await this.operatorTypesService.findAll();
      this.logger.log(`✅ Tipos de operador obtenidos: ${result.length}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Error al obtener tipos de operador: ${error.message}`, error.stack);
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al cargar los tipos de operador',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`🎯 GET /api/operator-types/${id}`);
      
      const result = await this.operatorTypesService.findOne(id);
      this.logger.log(`✅ Tipo de operador encontrado: ${result.id}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Error al obtener tipo de operador: ${error.message}`, error.stack);
      
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al obtener el tipo de operador',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOperatorTypeDto: UpdateOperatorTypeDto) {
    try {
      this.logger.log(`🎯 PATCH /api/operator-types/${id}`);
      this.logger.log('📦 Datos actualizados:', JSON.stringify(updateOperatorTypeDto, null, 2));
      
      const result = await this.operatorTypesService.update(id, updateOperatorTypeDto);
      this.logger.log(`✅ Tipo de operador actualizado: ${result.id}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar tipo de operador: ${error.message}`, error.stack);
      
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al actualizar el tipo de operador',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`🎯 DELETE /api/operator-types/${id}`);
      
      const result = await this.operatorTypesService.remove(id);
      this.logger.log('✅ Tipo de operador eliminado correctamente');
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Error al eliminar tipo de operador: ${error.message}`, error.stack);
      
      if (error.status === HttpStatus.NOT_FOUND || error.status === HttpStatus.CONFLICT) {
        throw error;
      }
      
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al eliminar el tipo de operador',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 