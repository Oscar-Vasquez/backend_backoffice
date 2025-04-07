import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    private calcularIncremento;
    getPackageMetrics(startDate: Date, endDate: Date): Promise<{
        mes: string;
        cantidad: number;
        pesoTotal: number;
    }[]>;
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
