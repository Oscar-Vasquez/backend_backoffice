"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardService_1.name);
        this.logger.log('🚀 DashboardService inicializado');
    }
    async getMetrics() {
        try {
            this.logger.log('📊 Iniciando cálculo de métricas del dashboard...');
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            this.logger.debug('📅 Fechas de consulta:', {
                lastMonth,
                firstDayLastMonth,
                firstDayCurrentMonth
            });
            const [totalPackages, deliveredPackages, inProcessPackages, lastMonthPackages] = await Promise.all([
                this.prisma.packages.count(),
                this.prisma.packages.count({
                    where: {
                        package_status: client_1.package_status_enum.delivered
                    }
                }),
                this.prisma.packages.count({
                    where: {
                        package_status: client_1.package_status_enum.in_transit
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
            const [paidInvoices, pendingInvoices, lastMonthInvoices] = await Promise.all([
                this.prisma.invoices.count({
                    where: {
                        status: client_1.invoice_status_enum.paid
                    }
                }),
                this.prisma.invoices.count({
                    where: {
                        status: client_1.invoice_status_enum.draft
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
            const invoiceAmounts = await this.prisma.invoices.aggregate({
                where: { status: client_1.invoice_status_enum.paid },
                _sum: { total_amount: true }
            });
            const totalAmount = invoiceAmounts._sum.total_amount?.toNumber() || 0;
            const [totalUsers, newUsers, activeUsers] = await Promise.all([
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
            const packagesIncrease = this.calcularIncremento(totalPackages, lastMonthPackages);
            const invoicesIncrease = this.calcularIncremento(paidInvoices, lastMonthInvoices);
            const usersIncrease = this.calcularIncremento(totalUsers, lastMonthUsers);
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
        }
        catch (error) {
            this.logger.error('❌ Error al obtener métricas del dashboard:', error);
            throw new Error('Error al obtener las métricas del dashboard');
        }
    }
    calcularIncremento(actual, anterior) {
        if (anterior === 0)
            return 100;
        return ((actual - anterior) / anterior) * 100;
    }
    async getPackageMetrics(startDate, endDate) {
        try {
            this.logger.debug('📊 Obteniendo métricas de paquetes...', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
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
            const packagesPorMes = new Map();
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
            const metricas = Array.from(packagesPorMes.entries())
                .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
                .map(([mes, datos]) => ({
                mes,
                cantidad: datos.cantidad,
                pesoTotal: Number(datos.pesoTotal.toFixed(2))
            }));
            this.logger.debug('✅ Métricas calculadas:', metricas);
            return metricas;
        }
        catch (error) {
            this.logger.error('❌ Error al obtener métricas de paquetes:', error);
            throw error;
        }
    }
    async getBranchMetrics() {
        try {
            this.logger.log('📊 Obteniendo métricas por sucursal...');
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
            const branchMetrics = await Promise.all(branches.map(async (branch) => {
                const totalPackages = await this.prisma.packages.count({
                    where: { branch_id: branch.id }
                });
                const packageWeights = await this.prisma.packages.aggregate({
                    where: { branch_id: branch.id },
                    _sum: { weight: true }
                });
                const totalWeight = packageWeights._sum.weight?.toNumber() || 0;
                const deliveredPackages = await this.prisma.packages.count({
                    where: {
                        branch_id: branch.id,
                        package_status: client_1.package_status_enum.delivered
                    }
                });
                const inProcessPackages = await this.prisma.packages.count({
                    where: {
                        branch_id: branch.id,
                        package_status: client_1.package_status_enum.in_transit
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
        }
        catch (error) {
            this.logger.error('❌ Error al obtener métricas por sucursal:', error);
            throw error;
        }
    }
    async getOperatorActivity() {
        try {
            this.logger.log('📊 Obteniendo actividad de operadores...');
            const branches = await this.prisma.branches.findMany({
                select: {
                    id: true,
                    name: true
                }
            });
            const branchMap = new Map(branches.map(branch => [branch.id, branch]));
            this.logger.log(`📍 Total de sucursales encontradas: ${branches.length}`);
            const operators = await this.prisma.operators.findMany({
                select: {
                    id: true,
                    email: true,
                    branch_id: true,
                    status: true,
                    role: true
                }
            });
            const operatorNames = await this.prisma.$queryRaw `
        SELECT id, CONCAT(first_name, ' ', last_name) as name 
        FROM operators
      `;
            const operatorNameMap = new Map(operatorNames.map(op => [op.id, op.name]));
            this.logger.log(`👥 Total de operadores encontrados: ${operators.length}`);
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
                take: 100,
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
            const branchActivity = new Map();
            operators.forEach(operator => {
                if (!operator.branch_id)
                    return;
                const branch = branchMap.get(operator.branch_id);
                if (!branch)
                    return;
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
            activities.forEach(activity => {
                if (!activity.operator_id)
                    return;
                const operator = operators.find(op => op.id === activity.operator_id);
                if (!operator || !operator.branch_id)
                    return;
                const branchData = branchActivity.get(operator.branch_id);
                if (!branchData?.operators[operator.id])
                    return;
                let packageId = undefined;
                let invoiceId = undefined;
                if (activity.entity_type === 'package' && activity.entity_id) {
                    packageId = activity.entity_id;
                }
                else if (activity.entity_type === 'invoice' && activity.entity_id) {
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
        }
        catch (error) {
            this.logger.error('❌ Error al obtener actividad de operadores:', error);
            throw error;
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map