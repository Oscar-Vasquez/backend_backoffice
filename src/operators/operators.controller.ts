import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Req, Logger, HttpException, InternalServerErrorException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OperatorActivityDto, ActivityType, ActivityAction, ActivityStatus } from './dto/operator-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Operators')
@Controller('operators')
export class OperatorsController {
  private readonly logger = new Logger(OperatorsController.name);

  constructor(private readonly operatorsService: OperatorsService) {}

  @Post('init')
  @ApiOperation({ summary: 'Crear el primer operador administrador' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Operador creado exitosamente' })
  async createFirstAdmin(@Body() createOperatorDto: CreateOperatorDto) {
    try {
      this.logger.log('🔧 Intentando crear el primer operador administrador...');
      
      // Verificar si ya existe algún operador
      const result = await this.operatorsService.findAll();
      if (result.operators.length > 0) {
        this.logger.warn('❌ Ya existe al menos un operador');
        throw new HttpException('Ya existe al menos un operador', HttpStatus.CONFLICT);
      }

      // Forzar rol de admin y status activo
      createOperatorDto.role = 'admin';
      createOperatorDto.status = 'active';

      const operator = await this.operatorsService.create(createOperatorDto);
      this.logger.log('✅ Primer operador administrador creado exitosamente');
      return operator;
    } catch (error) {
      this.logger.error('❌ Error al crear el primer operador:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear un nuevo operador' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Operador creado exitosamente' })
  async create(@Body() createOperatorDto: CreateOperatorDto, @Req() req: any) {
    try {
      this.logger.log('📝 Creando nuevo operador...');
      const operator = await this.operatorsService.create(createOperatorDto);
      
      await this.operatorsService.logActivity(
        operator.operatorId,
        ActivityType.CREATE,
        ActivityAction.CREATE,
        `Creación de nuevo operador: ${operator.firstName} ${operator.lastName}`,
        { userId: operator.operatorId },
        ActivityStatus.COMPLETED,
        operator.branchReference,
        req
      );

      this.logger.log('✅ Operador creado exitosamente');
      return operator;
    } catch (error) {
      this.logger.error('❌ Error al crear operador:', error);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todos los operadores' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de operadores obtenida exitosamente' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string
  ) {
    try {
      const startTime = Date.now();
      this.logger.debug('Iniciando consulta de operadores...');
      
      const pageNum = page ? parseInt(page.toString()) : 1;
      const limitNum = limit ? parseInt(limit.toString()) : 20;
      
      const filters = {
        status,
        role,
        branchId: branchId || req.user.branchReference,
        search
      };
      
      // Ejecutar consulta
      const result = await this.operatorsService.findAll(pageNum, limitNum, filters);
      
      // Registrar actividad de forma asíncrona sin esperar el resultado
      this.logActivityAsync(
        req.user.id,
        ActivityType.VIEW,
        ActivityAction.VIEW,
        'Consulta de lista de operadores',
        null,
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      const responseTime = Date.now() - startTime;
      this.logger.debug(`Consulta completada en ${responseTime}ms: ${result.operators.length} operadores de ${result.total}`);
      
      return {
        data: result.operators,
        meta: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.total / limitNum)
        }
      };
    } catch (error) {
      this.logger.error(`Error al obtener operadores: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener la lista de operadores');
    }
  }

  // Método auxiliar para registrar actividades de forma asíncrona
  private logActivityAsync(
    operatorId: string,
    type: ActivityType,
    action: ActivityAction,
    description: string,
    details: any = null,
    status: ActivityStatus = ActivityStatus.COMPLETED,
    branchId?: string,
    req?: any
  ): void {
    // Ejecutar sin await para no bloquear la respuesta
    this.operatorsService.logActivity(
      operatorId,
      type,
      action,
      description,
      details,
      status,
      branchId,
      req
    ).catch(error => {
      this.logger.error('❌ Error al registrar actividad de forma asíncrona:', error);
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener un operador por ID' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Operador encontrado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Operador no encontrado' })
  async findOne(
    @Param('id') id: string, 
    @Req() req: any,
    @Query('refresh') refresh?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando operador con ID: ${id}`);
      // Convertir el parámetro refresh a booleano
      const forceRefresh = refresh === 'true' || refresh === '1';
      
      if (forceRefresh) {
        this.logger.log(`⚡ Forzando recarga desde base de datos para operador ${id}`);
      }
      
      const operator = await this.operatorsService.findOne(id, forceRefresh);
      
      // Registrar actividad de forma asíncrona
      this.logActivityAsync(
        req.user.operatorId,
        ActivityType.VIEW,
        ActivityAction.VIEW,
        `Consulta de detalles del operador: ${operator.firstName} ${operator.lastName}`,
        { targetOperatorId: id },
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      this.logger.log('✅ Operador encontrado exitosamente');
      return operator;
    } catch (error) {
      this.logger.error(`❌ Error al obtener operador ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/activities')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener actividades de un operador' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Actividades obtenidas exitosamente' })
  async getOperatorActivities(
    @Param('id') id: string, 
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    try {
      const startTime = Date.now();
      this.logger.debug(`Iniciando consulta de actividades para operador: ${id}`);
      
      const pageNum = page ? parseInt(page.toString()) : 1;
      const limitNum = limit ? parseInt(limit.toString()) : 20;
      
      // Ejecutar consulta
      const result = await this.operatorsService.getOperatorActivities(id, pageNum, limitNum);
      
      // Registrar actividad de forma asíncrona
      this.logActivityAsync(
        req.user.id,
        ActivityType.VIEW,
        ActivityAction.VIEW,
        `Consulta de actividades del operador ${id}`,
        null,
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      const responseTime = Date.now() - startTime;
      this.logger.debug(`Consulta completada en ${responseTime}ms: ${result.activities.length} actividades de ${result.total}`);
      
      return {
        data: result.activities,
        meta: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.total / limitNum)
        }
      };
    } catch (error) {
      this.logger.error(`Error al obtener actividades del operador ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar un operador' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Operador actualizado exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Operador no encontrado' })
  async update(
    @Param('id') id: string, 
    @Body() updateOperatorDto: UpdateOperatorDto,
    @Req() req: any
  ) {
    try {
      this.logger.log(`📝 Actualizando operador ${id}...`);
      const operator = await this.operatorsService.update(id, updateOperatorDto);
      
      await this.operatorsService.logActivity(
        req.user.operatorId,
        ActivityType.UPDATE,
        ActivityAction.UPDATE,
        `Actualización de operador: ${operator.firstName} ${operator.lastName}`,
        {
          targetOperatorId: id,
          changes: updateOperatorDto
        },
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      this.logger.log('✅ Operador actualizado exitosamente');
      return operator;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar operador ${id}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar un operador' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Operador eliminado exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Operador no encontrado' })
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      this.logger.log(`🗑️ Eliminando operador ${id}...`);
      const operator = await this.operatorsService.findOne(id, true);
      await this.operatorsService.remove(id);
      
      await this.operatorsService.logActivity(
        req.user.operatorId,
        ActivityType.DELETE,
        ActivityAction.DELETE,
        `Eliminación de operador: ${operator.firstName} ${operator.lastName}`,
        { deletedOperatorId: id },
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      this.logger.log('✅ Operador eliminado exitosamente');
    } catch (error) {
      this.logger.error(`❌ Error al eliminar operador ${id}:`, error);
      throw error;
    }
  }

  @Post(':id/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cambiar la contraseña de un operador' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Contraseña cambiada exitosamente' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos incorrectos o contraseña actual inválida' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Operador no encontrado' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any
  ) {
    try {
      this.logger.log(`🔐 Intentando cambiar contraseña del operador ${id}...`);
      
      // Eliminamos la validación de permisos para permitir cambiar cualquier contraseña
      // El único requisito es estar autenticado (garantizado por JwtAuthGuard)
      
      // Buscar el operador primero para verificar su existencia
      const operator = await this.operatorsService.findOne(id);
      
      // Verificar la contraseña actual
      const isPasswordValid = await this.operatorsService.verifyPassword(
        id, 
        changePasswordDto.currentPassword
      );
      
      if (!isPasswordValid) {
        this.logger.warn(`❌ Contraseña actual incorrecta para operador ${id}`);
        throw new HttpException('Contraseña actual incorrecta', HttpStatus.BAD_REQUEST);
      }
      
      // Cambiar la contraseña
      await this.operatorsService.updatePassword(id, changePasswordDto.password);
      
      // Registrar actividad
      await this.operatorsService.logActivity(
        req.user.operatorId,
        ActivityType.UPDATE,
        ActivityAction.UPDATE,
        `Cambio de contraseña para operador: ${operator.firstName} ${operator.lastName}`,
        { targetOperatorId: id },
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );
      
      this.logger.log(`✅ Contraseña del operador ${id} cambiada exitosamente`);
      
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      this.logger.error(`❌ Error al cambiar contraseña del operador ${id}:`, error);
      throw error;
    }
  }

  @Post(':id/clear-cache')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Limpiar la caché de un operador específico' })
  @ApiParam({ name: 'id', description: 'ID del operador' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Caché limpiada exitosamente' })
  async clearCache(@Param('id') id: string, @Req() req: any) {
    try {
      this.logger.log(`🧹 Limpiando caché del operador ${id}...`);
      this.operatorsService.invalidateOperatorCache(id);
      
      // Registrar actividad de forma asíncrona
      this.logActivityAsync(
        req.user.operatorId,
        ActivityType.UPDATE,
        ActivityAction.UPDATE,
        `Limpieza de caché del operador: ${id}`,
        { targetOperatorId: id },
        ActivityStatus.COMPLETED,
        req.user.branchReference,
        req
      );

      this.logger.log('✅ Caché del operador limpiada exitosamente');
      return { success: true, message: 'Caché limpiada exitosamente' };
    } catch (error) {
      this.logger.error(`❌ Error al limpiar caché del operador ${id}:`, error);
      throw error;
    }
  }
} 