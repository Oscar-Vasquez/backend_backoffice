import { Controller, Get, Post, Query, Param, UseGuards, Request, Body } from '@nestjs/common';
import { CashClosuresService } from './cash-closures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashClosuresCronService } from './cash-closures.cron';

@Controller('cash-closures')
@UseGuards(JwtAuthGuard)
export class CashClosuresController {
  constructor(
    private readonly cashClosuresService: CashClosuresService,
    private readonly cashClosuresCronService: CashClosuresCronService
  ) {
    console.log('🚀 CashClosuresController inicializado');
  }

  /**
   * Obtener el cierre de caja actual
   */
  @Get('current')
  async getCurrentCashClosure() {
    const current = await this.cashClosuresService.getCurrentCashClosure();
    return {
      success: true,
      data: current
    };
  }

  /**
   * Obtener historial de cierres de caja
   */
  @Get('history')
  async getCashClosureHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    const history = await this.cashClosuresService.getCashClosureHistory({
      page: pageNumber,
      limit: limitNumber,
      startDate,
      endDate,
      status
    });

    return {
      success: true,
      ...history
    };
  }

  /**
   * Cerrar la caja actual
   */
  @Post('close')
  async closeCashClosure(@Request() req) {
    const userId = req.user.id;
    const closedCashClosure = await this.cashClosuresService.closeCashClosure(userId);
    
    return {
      success: true,
      message: 'Cierre de caja completado exitosamente',
      data: closedCashClosure
    };
  }

  /**
   * Obtener transacciones asociadas a un cierre de caja
   */
  @Get(':id/transactions')
  async getTransactionsForCashClosure(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 20;

    const transactions = await this.cashClosuresService.getTransactionsForCashClosure(
      id,
      pageNumber,
      limitNumber
    );

    return {
      success: true,
      ...transactions
    };
  }

  /**
   * Endpoint para probar el cierre automático de caja
   */
  @Post('test-auto-close')
  async testAutomaticClose(@Request() req) {
    console.log('🧪 Prueba de cierre automático de caja');
    const result = await this.cashClosuresService.automaticCloseCashClosure();
    
    return {
      success: !!result,
      message: result ? 'Cierre automático de caja ejecutado correctamente' : 'No se pudo ejecutar el cierre automático',
      data: result
    };
  }

  /**
   * Endpoint para probar la apertura automática de caja
   */
  @Post('test-auto-open')
  async testAutomaticOpen(@Request() req) {
    console.log('🧪 Prueba de apertura automática de caja');
    const result = await this.cashClosuresService.automaticOpenCashClosure();
    
    return {
      success: !!result,
      message: result ? 'Apertura automática de caja ejecutada correctamente' : 'No se pudo ejecutar la apertura automática',
      data: result
    };
  }

  /**
   * Endpoint para verificar el estado de las tareas automáticas
   */
  @Get('auto-status')
  async getAutomaticStatus() {
    console.log('🔍 Verificando estado de tareas automáticas');
    const result = await this.cashClosuresService.checkAndProcessAutomaticCashClosure();
    
    return {
      success: true,
      message: 'Estado de las tareas automáticas',
      data: {
        ...result,
        currentServerTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        localTime: new Date().toLocaleString('es-PA', { timeZone: 'America/Panama' })
      }
    };
  }

  /**
   * Endpoint para obtener información sobre las tareas programadas
   */
  @Get('schedule-info')
  async getScheduleInfo() {
    console.log('🔍 Consultando información de las tareas programadas');
    const scheduleInfo = this.cashClosuresCronService.getNextScheduledExecutions();
    
    return {
      success: true,
      message: 'Información de las tareas programadas',
      data: scheduleInfo
    };
  }
} 