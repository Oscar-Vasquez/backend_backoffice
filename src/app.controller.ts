import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {
    console.log('🚀 AppController inicializado');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    console.log('🏥 Health check solicitado');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
  
  @Get('metrics/db')
  getDatabaseMetrics() {
    console.log('📊 Métricas de base de datos solicitadas');
    return {
      timestamp: new Date().toISOString(),
      metrics: this.prisma.getQueryStats(),
      connection: {
        established: this.prisma['connectionEstablished'],
        lastQuery: new Date(this.prisma['lastQueryTime']).toISOString(),
        inactiveTime: Date.now() - this.prisma['lastQueryTime']
      }
    };
  }
}
