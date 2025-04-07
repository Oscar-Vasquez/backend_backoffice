import { Controller, Get, Injectable } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FirebaseDatabaseService } from '../firebase/firebase-database.service';
import { Timestamp } from 'firebase-admin/firestore';

@ApiTags('Dashboard')
@Controller('dashboard')
@Injectable()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly firebaseService: FirebaseDatabaseService
  ) {
    console.log('🚀 DashboardController inicializado');
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
    try {
      console.log('📊 Obteniendo métricas del dashboard...');

      // Obtener fecha del mes anterior
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Consultas para paquetes
      const paquetesRef = this.firebaseService.getCollection('paquetes');
      const [
        paquetesSnapshot,
        paquetesEntregadosSnapshot,
        paquetesEnProcesoSnapshot,
        paquetesMesAnteriorSnapshot
      ] = await Promise.all([
        paquetesRef.get(),
        paquetesRef.where('estado', '==', 'entregado').get(),
        paquetesRef.where('estado', '==', 'en_proceso').get(),
        paquetesRef.where('fechaCreacion', '>=', Timestamp.fromDate(firstDayLastMonth))
          .where('fechaCreacion', '<', Timestamp.fromDate(firstDayCurrentMonth))
          .get()
      ]);

      // Consultas para facturas
      const facturasRef = this.firebaseService.getCollection('facturas');
      const [
        facturasPagadasSnapshot,
        facturasPendientesSnapshot,
        facturasMesAnteriorSnapshot
      ] = await Promise.all([
        facturasRef.where('estado', '==', 'pagada').get(),
        facturasRef.where('estado', '==', 'pendiente').get(),
        facturasRef.where('fechaPago', '>=', Timestamp.fromDate(firstDayLastMonth))
          .where('fechaPago', '<', Timestamp.fromDate(firstDayCurrentMonth))
          .get()
      ]);

      // Consultas para usuarios
      const usuariosRef = this.firebaseService.getCollection('usuarios');
      const [
        usuariosSnapshot,
        usuariosNuevosSnapshot,
        usuariosActivosSnapshot
      ] = await Promise.all([
        usuariosRef.get(),
        usuariosRef.where('fechaCreacion', '>=', Timestamp.fromDate(firstDayCurrentMonth)).get(),
        usuariosRef.where('ultimoAcceso', '>=', Timestamp.fromDate(lastMonth)).get()
      ]);

      // Calcular métricas
      const totalPaquetes = paquetesSnapshot.size;
      const paquetesEntregados = paquetesEntregadosSnapshot.size;
      const paquetesEnProceso = paquetesEnProcesoSnapshot.size;
      const paquetesMesAnterior = paquetesMesAnteriorSnapshot.size;
      const incrementoPaquetes = this.calcularIncremento(totalPaquetes, paquetesMesAnterior);

      const facturasPagadas = facturasPagadasSnapshot.size;
      const facturasPendientes = facturasPendientesSnapshot.size;
      const facturasMesAnterior = facturasMesAnteriorSnapshot.size;
      const incrementoFacturas = this.calcularIncremento(facturasPagadas, facturasMesAnterior);
      const montoTotal = facturasPagadasSnapshot.docs.reduce((total, doc) => total + (doc.data().monto || 0), 0);

      const totalUsuarios = usuariosSnapshot.size;
      const usuariosNuevos = usuariosNuevosSnapshot.size;
      const usuariosActivos = usuariosActivosSnapshot.size;
      const usuariosMesAnterior = totalUsuarios - usuariosNuevos;
      const incrementoUsuarios = this.calcularIncremento(totalUsuarios, usuariosMesAnterior);

      const metrics = {
        paquetes: {
          total: totalPaquetes,
          incremento: incrementoPaquetes,
          desglose: {
            entregados: paquetesEntregados,
            enProceso: paquetesEnProceso
          }
        },
        facturas: {
          total: facturasPagadas,
          incremento: incrementoFacturas,
          montoTotal,
          pendientes: facturasPendientes
        },
        usuarios: {
          total: totalUsuarios,
          incremento: incrementoUsuarios,
          nuevos: usuariosNuevos,
          activos: usuariosActivos
        }
      };

      console.log('✅ Métricas obtenidas:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Error al obtener métricas del dashboard:', error);
      throw error;
    }
  }

  private calcularIncremento(actual: number, anterior: number): number {
    if (anterior === 0) return 100;
    return ((actual - anterior) / anterior) * 100;
  }
} 