import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly logger;
    constructor(dashboardService: DashboardService);
    getPackageMetrics(startDate: string, endDate: string): Promise<{
        mes: string;
        cantidad: number;
        pesoTotal: number;
    }[]>;
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
            montoTotal: number;
            pendientes: number;
        };
        usuarios: {
            total: number;
            incremento: number;
            nuevos: number;
            activos: number;
        };
    }>;
    getBranchMetrics(): Promise<{
        id: string;
        name: string;
        province: string;
        address: string;
        metrics: {
            totalPackages: number;
            totalWeight: number;
            deliveredPackages: number;
            inProcessPackages: number;
            deliveryRate: number;
        };
    }[]>;
    getOperatorActivity(): Promise<{
        branchId: string;
        branchName: string;
        operators: {
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
            id: string;
        }[];
    }[]>;
}
