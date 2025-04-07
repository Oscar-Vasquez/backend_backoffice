import { DashboardService } from '../dashboard/dashboard.service';
import { FirebaseDatabaseService } from '../firebase/firebase-database.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly firebaseService;
    constructor(dashboardService: DashboardService, firebaseService: FirebaseDatabaseService);
    getMetrics(): Promise<{
        paquetes: {
            total: number;
            incremento: number;
            desglose: {
                entregados: number;
                enProceso: number;
            };
        };
        facturas: {
            total: number;
            incremento: number;
            montoTotal: any;
            pendientes: number;
        };
        usuarios: {
            total: number;
            incremento: number;
            nuevos: number;
            activos: number;
        };
    }>;
    private calcularIncremento;
}
