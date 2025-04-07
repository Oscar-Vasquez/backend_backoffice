import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { operator_status_enum, package_status_enum, invoice_status_enum } from '@prisma/client';

// Definición de interfaces basadas en el esquema de Prisma
interface Branch {
  id: string;
  name: string;
  province: string;
  address: string;
  prefix?: string;
  is_active?: boolean;
}

interface Package {
  id: string;
  user_id?: string;
  branch_id?: string;
  weight?: number;
  total_weight?: number;
  package_status?: package_status_enum;
  created_at?: Date;
}

interface Operator {
  id: string;
  name: string;
  email: string;
  branch_id?: string;
  last_activity?: Date;
  status: string;
  role: string;
}

interface OperatorActivity {
  id: string;
  operator_id: string;
  action: string;
  description: string;
  created_at: Date;
  package_id?: string;
  invoice_id?: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('🚀 DashboardService inicializado');
  }

  async getMetrics() {
    try {
      this.logger.log('📊 Iniciando cálculo de métricas del dashboard...');
      
      // Obtener fecha del mes anterior
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      this.logger.debug('📅 Fechas de consulta:', {
        lastMonth,
        firstDayLastMonth,
        firstDayCurrentMonth
      });

      // Obtener métricas de paquetes utilizando Prisma
      const [totalPackages, deliveredPackages, inProcessPackages, lastMonthPackages] = await Promise.all([
        this.prisma.packages.count(),
        this.prisma.packages.count({ 
          where: { 
            package_status: package_status_enum.delivered 
          } 
        }),
        this.prisma.packages.count({ 
          where: { 
            package_status: package_status_enum.in_transit
          } 
        }),
        this.prisma.packages.count({
          where: {
            created_at: {
              gte: firstDayLastMonth,
              lt: firstDayCurrentMonth
            }
          }
        })
      ]);

      // Obtener métricas de facturas utilizando Prisma
      const [
        paidInvoices,
        pendingInvoices,
        lastMonthInvoices
      ] = await Promise.all([
        this.prisma.invoices.count({ 
          where: { 
            status: invoice_status_enum.paid 
          } 
        }),
        this.prisma.invoices.count({ 
          where: { 
            status: invoice_status_enum.draft 
          } 
        }),
        this.prisma.invoices.count({
          where: {
            issue_date: {
              gte: firstDayLastMonth,
              lt: firstDayCurrentMonth
            }
          }
        })
      ]);

      // Calcular monto total de facturas pagadas
      const invoiceAmounts = await this.prisma.invoices.aggregate({
        where: { status: invoice_status_enum.paid },
        _sum: { total_amount: true }
      });
      
      const totalAmount = invoiceAmounts._sum.total_amount?.toNumber() || 0;

      // Métricas de usuarios utilizando Prisma
      const [
        totalUsers,
        newUsers,
        activeUsers
      ] = await Promise.all([
        this.prisma.users.count(),
        this.prisma.users.count({
          where: {
            created_at: {
              gte: firstDayCurrentMonth
            }
          }
        }),
        this.prisma.users.count({
          where: {
            updated_at: {
              gte: lastMonth
            }
          }
        })
      ]);

      const lastMonthUsers = totalUsers - newUsers;

      // Calcular métricas
      const packagesIncrease = this.calcularIncremento(totalPackages, lastMonthPackages);
      const invoicesIncrease = this.calcularIncremento(paidInvoices, lastMonthInvoices);
      const usersIncrease = this.calcularIncremento(totalUsers, lastMonthUsers);

      // Imprimir resultados parciales para debug
      this.logger.debug('📊 Resultados parciales:', {
        paquetes: {
          total: totalPackages,
          entregados: deliveredPackages,
          enProceso: inProcessPackages,
          mesAnterior: lastMonthPackages
        },
        facturas: {
          total: paidInvoices,
          pendientes: pendingInvoices,
          mesAnterior: lastMonthInvoices,
          montoTotal: totalAmount
        },
        usuarios: {
          total: totalUsers,
          nuevos: newUsers,
          activos: activeUsers,
          mesAnterior: lastMonthUsers
        }
      });

      const metrics = {
        paquetes: {
          total: totalPackages,
          incremento: packagesIncrease,
          desglose: {
            entregados: deliveredPackages,
            enProceso: inProcessPackages
          }
        },
        facturas: {
          total: paidInvoices,
          incremento: invoicesIncrease,
          montoTotal: totalAmount,
          pendientes: pendingInvoices
        },
        usuarios: {
          total: totalUsers,
          incremento: usersIncrease,
          nuevos: newUsers,
          activos: activeUsers
        }
      };

      this.logger.log('✅ Métricas calculadas:', metrics);
      return metrics;
    } catch (error) {
      this.logger.error('❌ Error al obtener métricas del dashboard:', error);
      throw new Error('Error al obtener las métricas del dashboard');
    }
  }

  private calcularIncremento(actual: number, anterior: number): number {
    if (anterior === 0) return 100;
    return ((actual - anterior) / anterior) * 100;
  }

  async getPackageMetrics(startDate: Date, endDate: Date) {
    try {
      this.logger.debug('📊 Obteniendo métricas de paquetes...', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });

      // Primero obtener todos los paquetes entre las fechas dadas
      const packages = await this.prisma.packages.findMany({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          created_at: true,
          weight: true
        }
      });

      this.logger.debug(`📦 Total de paquetes encontrados: ${packages.length}`);

      if (packages.length === 0) {
        this.logger.warn('⚠️ No se encontraron paquetes');
        return [];
      }

      const packagesPorMes = new Map<string, { cantidad: number, pesoTotal: number }>();
      
      packages.forEach(pkg => {
        const createdAtDate = pkg.created_at;
        
        if (!createdAtDate) {
          this.logger.warn(`⚠️ Paquete ${pkg.id} no tiene fecha de creación válida`);
          return;
        }

        const mes = `${createdAtDate.getFullYear()}-${(createdAtDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const peso = pkg.weight || 0;
        if (peso === 0) {
          this.logger.warn(`⚠️ Paquete ${pkg.id} tiene peso 0 o no tiene peso definido`);
        }

        const actual = packagesPorMes.get(mes) || { cantidad: 0, pesoTotal: 0 };
        
        packagesPorMes.set(mes, {
          cantidad: actual.cantidad + 1,
          pesoTotal: actual.pesoTotal + Number(peso)
        });

        this.logger.debug(`📊 Actualizado mes ${mes}:`, packagesPorMes.get(mes));
      });

      // Convertir el Map a un array ordenado por fecha
      const metricas = Array.from(packagesPorMes.entries())
        .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
        .map(([mes, datos]) => ({
          mes,
          cantidad: datos.cantidad,
          pesoTotal: Number(datos.pesoTotal.toFixed(2))
        }));

      this.logger.debug('✅ Métricas calculadas:', metricas);
      return metricas;
    } catch (error) {
      this.logger.error('❌ Error al obtener métricas de paquetes:', error);
      throw error;
    }
  }

  async getBranchMetrics() {
    try {
      this.logger.log('📊 Obteniendo métricas por sucursal...');

      // Obtener todas las sucursales
      const branches = await this.prisma.branches.findMany({
        select: {
          id: true,
          name: true,
          province: true,
          address: true,
          prefix: true,
          is_active: true
        }
      });

      this.logger.log(`📍 Total de sucursales encontradas: ${branches.length}`);

      if (branches.length === 0) {
        this.logger.warn('⚠️ No se encontraron sucursales');
        return [];
      }

      // Calcular métricas por sucursal
      const branchMetrics = await Promise.all(branches.map(async branch => {
        // Contar paquetes por sucursal
        const totalPackages = await this.prisma.packages.count({
          where: { branch_id: branch.id }
        });

        // Calcular peso total
        const packageWeights = await this.prisma.packages.aggregate({
          where: { branch_id: branch.id },
          _sum: { weight: true }
        });
        
        const totalWeight = packageWeights._sum.weight?.toNumber() || 0;

        // Contar paquetes entregados
        const deliveredPackages = await this.prisma.packages.count({
          where: { 
            branch_id: branch.id,
            package_status: package_status_enum.delivered
          }
        });

        // Contar paquetes en proceso
        const inProcessPackages = await this.prisma.packages.count({
          where: { 
            branch_id: branch.id,
            package_status: package_status_enum.in_transit
          }
        });

        return {
          id: branch.id,
          name: branch.name,
          province: branch.province,
          address: branch.address,
          metrics: {
            totalPackages,
            totalWeight: Number(totalWeight.toFixed(2)),
            deliveredPackages,
            inProcessPackages,
            deliveryRate: totalPackages > 0 
              ? Number(((deliveredPackages / totalPackages) * 100).toFixed(2))
              : 0
          }
        };
      }));

      this.logger.log('✅ Métricas por sucursal calculadas:', branchMetrics);
      return branchMetrics;
    } catch (error) {
      this.logger.error('❌ Error al obtener métricas por sucursal:', error);
      throw error;
    }
  }

  async getOperatorActivity() {
    try {
      this.logger.log('📊 Obteniendo actividad de operadores...');

      // Obtener todas las sucursales
      const branches = await this.prisma.branches.findMany({
        select: {
          id: true,
          name: true
        }
      });

      const branchMap = new Map(branches.map(branch => [branch.id, branch]));
      this.logger.log(`📍 Total de sucursales encontradas: ${branches.length}`);

      // Obtener todos los operadores
      const operators = await this.prisma.operators.findMany({
        select: {
          id: true,
          email: true,
          branch_id: true,
          status: true,
          role: true
        }
      });

      // Obtener nombres de los operadores desde otra tabla si es necesario
      const operatorNames = await this.prisma.$queryRaw<Array<{id: string, name: string}>>`
        SELECT id, CONCAT(first_name, ' ', last_name) as name 
        FROM operators
      `;
      
      const operatorNameMap = new Map(operatorNames.map(op => [op.id, op.name]));
      
      this.logger.log(`👥 Total de operadores encontrados: ${operators.length}`);

      // Obtener la actividad reciente (últimas 24 horas)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const activities = await this.prisma.activities.findMany({
        where: {
          created_at: {
            gte: oneDayAgo
          },
          operator_id: {
            not: null
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100, // Limitar a las últimas 100 actividades
        select: {
          id: true,
          operator_id: true,
          action: true,
          description: true,
          created_at: true,
          entity_id: true,
          entity_type: true
        }
      });

      this.logger.log(`📝 Total de actividades encontradas: ${activities.length}`);

      // Agrupar actividades por sucursal
      const branchActivity = new Map<string, {
        branchName: string;
        operators: {
          [operatorId: string]: {
            name: string;
            email: string;
            role: string;
            status: string;
            activities: {
              action: string;
              details: string;
              timestamp: string;
              packageId?: string;
              invoiceId?: string;
            }[];
          };
        };
      }>();

      // Procesar operadores y sus actividades
      operators.forEach(operator => {
        if (!operator.branch_id) return;

        const branch = branchMap.get(operator.branch_id);
        if (!branch) return;

        if (!branchActivity.has(operator.branch_id)) {
          branchActivity.set(operator.branch_id, {
            branchName: branch.name,
            operators: {}
          });
        }

        const branchData = branchActivity.get(operator.branch_id);
        branchData.operators[operator.id] = {
          name: operatorNameMap.get(operator.id) || 'Sin nombre',
          email: operator.email,
          role: operator.role,
          status: operator.status,
          activities: []
        };
      });

      // Asignar actividades a los operadores
      activities.forEach(activity => {
        if (!activity.operator_id) return;
        
        const operator = operators.find(op => op.id === activity.operator_id);
        if (!operator || !operator.branch_id) return;
        
        const branchData = branchActivity.get(operator.branch_id);
        if (!branchData?.operators[operator.id]) return;
        
        // Determinar si es un paquete o una factura
        let packageId = undefined;
        let invoiceId = undefined;
        
        if (activity.entity_type === 'package' && activity.entity_id) {
          packageId = activity.entity_id;
        } else if (activity.entity_type === 'invoice' && activity.entity_id) {
          invoiceId = activity.entity_id;
        }
        
        branchData.operators[operator.id].activities.push({
          action: activity.action,
          details: activity.description || '',
          timestamp: activity.created_at.toISOString(),
          packageId,
          invoiceId
        });
      });

      // Convertir el Map a un array para la respuesta
      const result = Array.from(branchActivity.entries()).map(([branchId, data]) => ({
        branchId,
        branchName: data.branchName,
        operators: Object.entries(data.operators).map(([operatorId, operatorData]) => ({
          id: operatorId,
          ...operatorData
        }))
      }));

      this.logger.log('✅ Actividad de operadores procesada');
      return result;
    } catch (error) {
      this.logger.error('❌ Error al obtener actividad de operadores:', error);
      throw error;
    }
  }
} 