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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const swagger_1 = require("@nestjs/swagger");
const firebase_database_service_1 = require("../firebase/firebase-database.service");
const firestore_1 = require("firebase-admin/firestore");
let DashboardController = class DashboardController {
    constructor(dashboardService, firebaseService) {
        this.dashboardService = dashboardService;
        this.firebaseService = firebaseService;
        console.log('🚀 DashboardController inicializado');
    }
    async getMetrics() {
        try {
            console.log('📊 Obteniendo métricas del dashboard...');
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const paquetesRef = this.firebaseService.getCollection('paquetes');
            const [paquetesSnapshot, paquetesEntregadosSnapshot, paquetesEnProcesoSnapshot, paquetesMesAnteriorSnapshot] = await Promise.all([
                paquetesRef.get(),
                paquetesRef.where('estado', '==', 'entregado').get(),
                paquetesRef.where('estado', '==', 'en_proceso').get(),
                paquetesRef.where('fechaCreacion', '>=', firestore_1.Timestamp.fromDate(firstDayLastMonth))
                    .where('fechaCreacion', '<', firestore_1.Timestamp.fromDate(firstDayCurrentMonth))
                    .get()
            ]);
            const facturasRef = this.firebaseService.getCollection('facturas');
            const [facturasPagadasSnapshot, facturasPendientesSnapshot, facturasMesAnteriorSnapshot] = await Promise.all([
                facturasRef.where('estado', '==', 'pagada').get(),
                facturasRef.where('estado', '==', 'pendiente').get(),
                facturasRef.where('fechaPago', '>=', firestore_1.Timestamp.fromDate(firstDayLastMonth))
                    .where('fechaPago', '<', firestore_1.Timestamp.fromDate(firstDayCurrentMonth))
                    .get()
            ]);
            const usuariosRef = this.firebaseService.getCollection('usuarios');
            const [usuariosSnapshot, usuariosNuevosSnapshot, usuariosActivosSnapshot] = await Promise.all([
                usuariosRef.get(),
                usuariosRef.where('fechaCreacion', '>=', firestore_1.Timestamp.fromDate(firstDayCurrentMonth)).get(),
                usuariosRef.where('ultimoAcceso', '>=', firestore_1.Timestamp.fromDate(lastMonth)).get()
            ]);
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
        }
        catch (error) {
            console.error('❌ Error al obtener métricas del dashboard:', error);
            throw error;
        }
    }
    calcularIncremento(actual, anterior) {
        if (anterior === 0)
            return 100;
        return ((actual - anterior) / anterior) * 100;
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener métricas del dashboard' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, common_1.Controller)('dashboard'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        firebase_database_service_1.FirebaseDatabaseService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map