import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {
    console.log('🚀 DashboardController inicializado');
  }

  @Get('package-metrics')
  @ApiOperation({ summary: 'Obtener métricas de paquetes por peso y cantidad' })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mes: { type: 'string' },
          cantidad: { type: 'number' },
          pesoTotal: { type: 'number' }
        }
      }
    }
  })
  async getPackageMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.dashboardService.getPackageMetrics(start, end);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas del dashboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        paquetes: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            incremento: { type: 'number' },
            desglose: {
              type: 'object',
              properties: {
                entregados: { type: 'number' },
                enProceso: { type: 'number' }
              }
            }
          }
        },
        facturas: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            incremento: { type: 'number' },
            montoTotal: { type: 'number' },
            pendientes: { type: 'number' }
          }
        },
        usuarios: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            incremento: { type: 'number' },
            nuevos: { type: 'number' },
            activos: { type: 'number' }
          }
        }
      }
    }
  })
  async getMetrics() {
    console.log('📊 Obteniendo métricas del dashboard...');
    const metrics = await this.dashboardService.getMetrics();
    console.log('✅ Métricas obtenidas:', metrics);
    return metrics;
  }

  @Get('branch-metrics')
  @ApiOperation({ summary: 'Obtener métricas por sucursal' })
  @ApiResponse({
    status: 200,
    description: 'Métricas por sucursal obtenidas exitosamente'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async getBranchMetrics() {
    try {
      this.logger.log('📊 Obteniendo métricas por sucursal...');
      const metrics = await this.dashboardService.getBranchMetrics();
      
      if (!metrics || metrics.length === 0) {
        this.logger.warn('⚠️ No se encontraron métricas por sucursal');
        return [];
      }
      
      this.logger.log(`✅ Métricas obtenidas para ${metrics.length} sucursales`);
      return metrics;
    } catch (error) {
      this.logger.error('❌ Error al obtener métricas por sucursal:', error);
      throw new HttpException(
        error.message || 'Error al obtener métricas por sucursal',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('operator-activity')
  @ApiOperation({ summary: 'Obtener actividad de operadores por sucursal' })
  @ApiResponse({
    status: 200,
    description: 'Actividad de operadores obtenida exitosamente'
  })
  async getOperatorActivity() {
    try {
      this.logger.log('📊 Obteniendo actividad de operadores...');
      const activity = await this.dashboardService.getOperatorActivity();
      
      if (!activity || activity.length === 0) {
        this.logger.warn('⚠️ No se encontró actividad de operadores');
        return [];
      }
      
      this.logger.log(`✅ Actividad obtenida para ${activity.length} sucursales`);
      return activity;
    } catch (error) {
      this.logger.error('❌ Error al obtener actividad de operadores:', error);
      throw new HttpException(
        error.message || 'Error al obtener actividad de operadores',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 