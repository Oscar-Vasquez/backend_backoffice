import { Controller, Get, Put, Param, Body, UseGuards, Query, Patch, Request, HttpException, HttpStatus, NotFoundException, UnauthorizedException, Post } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageNotificationService } from './services/package-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDimensionsDto } from './dto/update-dimensions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateWeightsDto } from './dto/update-weights.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: {
    id?: string;
    sub?: string;
    email: string;
    role: string;
    branchReference?: string;
  };
}

@ApiTags('packages')
@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly prisma: PrismaService,
    private readonly packageNotificationService: PackageNotificationService
  ) {}

  @Get('tracking/:trackingNumber')
  @ApiOperation({ summary: 'Find package by tracking number' })
  @ApiResponse({ status: 200, description: 'Return the package if found' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number to search for' })
  async findByTracking(
    @Param('trackingNumber') trackingNumber: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      console.log('==================================');
      console.log(`🛃 GET /api/v1/packages/tracking/${trackingNumber}`);
      console.log('🔍 Buscando paquete por tracking number con Prisma:', trackingNumber);
      console.log('👤 Usuario autenticado:', {
        id: req.user?.sub || req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      });
      
      // Datos del operador
      const operatorData = {
        id: req.user.sub || req.user.id,
        email: req.user.email
      };
      
      // Buscar paquete en la base de datos
      console.log('🔍 Llamando a packagesService.findByTracking...');
      const packageData = await this.packagesService.findByTracking(trackingNumber);
      
      if (packageData) {
        console.log('✅ Paquete encontrado en la base de datos:', {
          id: packageData.id,
          status: packageData.packageStatus,
          tracking: packageData.trackingNumber
        });
        return packageData;
      }
      
      // Si no se encuentra, devolver un objeto con estado not_found pero sin error
      console.log('⚠️ No se encontró paquete localmente, se debe buscar en servicio externo');
      console.log(`💡 Sugerencia: Llame a la ruta /api/v1/cargo/external-tracking/${trackingNumber} o /api/v1/shipments/track/${trackingNumber}`);
      throw new HttpException({
        message: `No se encontró paquete con tracking: ${trackingNumber}`,
        statusCode: HttpStatus.NOT_FOUND
      }, HttpStatus.NOT_FOUND);
    } catch (error) {
      console.error('❌ Error en findByTracking:', error.message || error);
      throw new HttpException(
        error.message || 'Error buscando paquete por tracking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all packages with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all packages' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_transit', 'delivered', 'returned', 'lost', 'canceled'] })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'branch_id', required: false })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('user_id') userId?: string,
    @Query('branch_id') branchId?: string,
  ) {
    const where: any = {};
    
    if (status) {
      where.package_status = status;
    }
    
    if (userId) {
      where.user_reference = userId;
    }
    
    if (branchId) {
      where.branch_id = branchId;
    }
    
    return this.packagesService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a package by ID' })
  @ApiResponse({ status: 200, description: 'Return the package' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  async findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update package status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.packagesService.updateStatus(id, updateStatusDto.status);
  }

  @Put(':id/dimensions')
  @ApiOperation({ summary: 'Update package dimensions' })
  @ApiResponse({ status: 200, description: 'Dimensions updated successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @UseGuards(JwtAuthGuard)
  async updateDimensions(
    @Param('id') id: string,
    @Body() updateDimensionsDto: UpdateDimensionsDto,
    @Request() req: RequestWithUser,
  ) {
    return this.packagesService.updateDimensions(id, updateDimensionsDto);
  }

  @Put(':id/weights')
  @ApiOperation({ summary: 'Update package weights' })
  @ApiResponse({ status: 200, description: 'Weights updated successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  async updateWeights(
    @Param('id') id: string,
    @Body() updateWeightsDto: UpdateWeightsDto,
  ) {
    return this.packagesService.updateWeights(id, updateWeightsDto);
  }

  @Put(':packageId/assign-user')
  @ApiOperation({ summary: 'Assign a user to a package' })
  @ApiResponse({ status: 200, description: 'User successfully assigned to package' })
  @ApiResponse({ status: 404, description: 'Package or user not found' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @UseGuards(JwtAuthGuard)
  async assignUserToPackage(
    @Param('packageId') packageId: string,
    @Body() { userId }: { userId: string },
    @Request() req: RequestWithUser,
  ) {
    console.log('🔄 Recibida solicitud de asignación de usuario a paquete:', {
      packageId,
      userId,
      operador: {
        id: req.user?.sub || req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      }
    });

    if (!packageId?.trim() || !userId?.trim()) {
      console.error('❌ Error de validación: IDs inválidos', { packageId, userId });
      throw new HttpException(
        'Se requieren IDs válidos de paquete y usuario',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!req.user?.sub && !req.user?.id) {
      console.error('❌ Error de validación: Información del operador incompleta', { user: req.user });
      throw new HttpException(
        'Información del operador incompleta o inválida',
        HttpStatus.UNAUTHORIZED
      );
    }

    const operatorData = {
      id: req.user.sub || req.user.id,
      email: req.user.email
    };
    
    console.log('👤 Datos del operador validados:', operatorData);
    
    try {
      console.log('🔄 Iniciando proceso de asignación con datos validados:', {
        packageId: packageId.trim(),
        userId: userId.trim(),
        operador: operatorData
      });
      
      const result = await this.packagesService.assignUserToPackage(
        packageId.trim(), 
        userId.trim(), 
        operatorData
      );
      
      console.log('✅ Asignación completada exitosamente');
      console.log('📊 Respuesta del servicio:', {
        success: result.success,
        package_id: result.package?.id,
        tracking_number: result.package?.tracking_number,
        user_reference: result.package?.user_reference,
        user_id: result.user?.id,
        user_email: result.user?.email
      });
      
      // Verificar el paquete después de la asignación
      let verifyPackage;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId.trim());
      
      if (isUUID) {
        // Si es un UUID, verificar directamente
        verifyPackage = await this.prisma.packages.findUnique({
          where: { id: packageId.trim() },
        });
      } else {
        // Si es un tracking number, buscar por tracking
        verifyPackage = await this.prisma.packages.findFirst({
          where: { tracking_number: packageId.trim() },
        });
      }
      
      console.log('🔍 Verificación final del paquete:', {
        id: verifyPackage?.id,
        tracking_number: verifyPackage?.tracking_number,
        user_reference: verifyPackage?.user_reference,
        matches_expected: verifyPackage?.user_reference === userId.trim()
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error al asignar usuario a paquete:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Error al asignar usuario al paquete',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':packageId/client')
  @ApiOperation({ summary: 'Get client assigned to a package' })
  @ApiResponse({ status: 200, description: 'Returns client information if assigned' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  async getPackageClient(@Param('packageId') packageId: string) {
    try {
      console.log('🔍 Solicitud para obtener cliente de paquete:', packageId);
      return await this.packagesService.getPackageClient(packageId);
    } catch (error) {
      console.error('❌ Error al obtener cliente de paquete:', error);
      if (error instanceof NotFoundException) {
        throw new HttpException(
          `No se encontró el paquete con ID: ${packageId}`,
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        'Error al obtener el cliente del paquete',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/unassigned-percentage/:branchId')
  async getUnassignedPercentage(
    @Param('branchId') branchId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      console.log('📊 [Controller] Recibida petición de estadísticas para sucursal:', branchId);
      console.log('👤 Usuario que solicita la información:', JSON.stringify({
        id: req.user?.id || req.user?.sub,
        email: req.user?.email,
        role: req.user?.role,
        branchReference: req.user?.branchReference
      }, null, 2));

      // Verificar autorización
      if (!req.user) {
        console.log('❌ Usuario no autenticado, acceso rechazado');
        throw new UnauthorizedException('Usuario no autenticado');
      }

      // Obtener estadísticas de la sucursal específica
      console.log('🔍 Enviando solicitud al servicio para branchId:', branchId);
      const branchStats = await this.packagesService.getAssignedNotInvoicedPercentage(branchId);
      
      console.log('✅ [Controller] Estadísticas recibidas del servicio:', branchStats);
      return {
        success: true,
        data: branchStats,
      };
    } catch (error) {
      console.error('❌ [Controller] Error:', error.message);
      return {
        success: false,
        message: error.message || 'Error al obtener estadísticas de paquetes',
      };
    }
  }

  /**
   * Envía una notificación al cliente indicando que su paquete ha llegado
   * @param packageId ID del paquete
   * @param useSupabase Si se debe usar Supabase para el envío del correo
   * @param req Datos del request que incluye la información del operador
   * @returns Resultado de la notificación
   */
  @Post('notify-arrival/:packageId')
  @UseGuards(JwtAuthGuard)
  async notifyPackageArrival(
    @Param('packageId') packageId: string,
    @Query('useSupabase') useSupabase: boolean = false,
    @Request() req
  ) {
    console.log(`🔔 Solicitud para notificar llegada del paquete ${packageId} por operador ${req.user.sub}`);
    
    const result = await this.packageNotificationService.notifyPackageArrival(packageId, useSupabase);
    
    return {
      success: result.success,
      message: result.success 
        ? 'Notificación enviada correctamente' 
        : `Error al enviar notificación: ${result.error}`,
      data: result
    };
  }

  /**
   * Envía notificaciones a múltiples clientes indicando que sus paquetes han llegado
   * @param data Array de IDs de paquetes a notificar
   * @param useSupabase Si se debe usar Supabase para el envío de correos
   * @param req Datos del request que incluye la información del operador
   * @returns Resultados de las notificaciones
   */
  @Post('notify-bulk-arrival')
  @UseGuards(JwtAuthGuard)
  async notifyBulkPackageArrival(
    @Body() data: { packageIds: string[] },
    @Query('useSupabase') useSupabase: boolean = false,
    @Request() req
  ) {
    console.log(`🔔 Solicitud para notificar llegada masiva de ${data.packageIds.length} paquetes por operador ${req.user.sub}`);
    
    if (!data.packageIds || !Array.isArray(data.packageIds) || data.packageIds.length === 0) {
      return {
        success: false,
        message: 'No se proporcionaron IDs de paquetes válidos'
      };
    }
    
    const result = await this.packageNotificationService.notifyBulkPackageArrival(data.packageIds, useSupabase);
    
    return {
      success: result.successful > 0,
      message: `Notificaciones enviadas: ${result.successful}/${result.total}`,
      data: result
    };
  }
} 