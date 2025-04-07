import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CashClosuresService } from './cash-closures.service';
import { CronJob } from 'cron';

@Injectable()
export class CashClosuresCronService {
  private readonly logger = new Logger(CashClosuresCronService.name);
  
  constructor(
    private readonly cashClosuresService: CashClosuresService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {
    this.logger.log('🚀 Servicio de cierres de caja automáticos inicializado');
  }
  
  /**
   * Verifica si es momento de cerrar la caja (cada 5 minutos)
   * Cierra la caja automáticamente a las 6:00 PM (18:00)
   */
  @Cron('0 */5 * * * *', {
    timeZone: 'America/Panama'
  })
  async checkAndProcessAutomaticCashClosures() {
    this.logger.debug('Verificando si es momento de ejecutar operaciones automáticas de caja');
    
    try {
      const result = await this.cashClosuresService.checkAndProcessAutomaticCashClosure();
      
      if (result.action === 'close') {
        this.logger.log(`✅ Cierre de caja automático completado a las ${new Date().toLocaleTimeString()}`);
      } else if (result.action === 'open') {
        this.logger.log(`✅ Apertura de caja automática completada a las ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error en la verificación de operaciones automáticas de caja: ${error.message}`);
    }
  }
  
  /**
   * Cierre de caja a las 6:00 PM todos los días
   */
  @Cron('0 0 18 * * *', {
    timeZone: 'America/Panama'
  })
  async automaticCashClosure() {
    this.logger.log('⏰ Ejecutando cierre automático de caja (6:00 PM)');
    
    try {
      const result = await this.cashClosuresService.automaticCloseCashClosure();
      
      if (result) {
        this.logger.log(`✅ Cierre de caja automático completado correctamente. ID: ${result.id}`);
      } else {
        this.logger.warn('⚠️ No se pudo completar el cierre automático de caja');
      }
    } catch (error) {
      this.logger.error(`❌ Error en el cierre automático de caja: ${error.message}`);
    }
  }
  
  /**
   * Apertura de caja a las 9:00 AM todos los días
   */
  @Cron('0 0 9 * * *', {
    timeZone: 'America/Panama'
  })
  async automaticCashOpening() {
    this.logger.log('⏰ Ejecutando apertura automática de caja (9:00 AM)');
    
    try {
      const result = await this.cashClosuresService.automaticOpenCashClosure();
      
      if (result) {
        this.logger.log(`✅ Apertura de caja automática completada correctamente. ID: ${result.id}`);
      } else {
        this.logger.warn('⚠️ No se pudo completar la apertura automática de caja');
      }
    } catch (error) {
      this.logger.error(`❌ Error en la apertura automática de caja: ${error.message}`);
    }
  }
  
  /**
   * Obtiene información sobre las próximas ejecuciones programadas
   */
  getNextScheduledExecutions() {
    try {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      const nextExecutions = {};
      
      for (const [name, job] of cronJobs.entries()) {
        if (name.includes('CashClosuresCronService')) {
          const nextExecution = (job as CronJob).nextDate().toJSDate();
          nextExecutions[name] = {
            nextExecution,
            nextExecutionLocal: nextExecution.toLocaleString('es-PA', { timeZone: 'America/Panama' }),
            expression: (job as CronJob).cronTime.source
          };
        }
      }
      
      return {
        success: true,
        currentTime: new Date().toISOString(),
        currentTimeLocal: new Date().toLocaleString('es-PA', { timeZone: 'America/Panama' }),
        timeZone: 'America/Panama',
        jobs: nextExecutions
      };
    } catch (error) {
      this.logger.error(`❌ Error al obtener información de las tareas programadas: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 