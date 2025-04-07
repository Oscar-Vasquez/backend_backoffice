import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class CashClosuresService {
    private readonly prisma;
    private readonly transactionsService;
    constructor(prisma: PrismaService, transactionsService: TransactionsService);
    getCurrentCashClosure(): Promise<{
        id: string;
        createdAt: string;
        status: string;
        paymentMethods: any[];
        totalAmount: number;
        totalCredit: any;
        totalDebit: any;
        closedAt?: undefined;
        message?: undefined;
    } | {
        id: string;
        createdAt: string;
        closedAt: string;
        status: string;
        paymentMethods: any[];
        totalAmount: number;
        totalCredit: any;
        totalDebit: any;
        message: string;
    }>;
    private createNewCashClosure;
    getCashClosureHistory(params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
    }): Promise<{
        data: {
            id: string;
            createdAt: string;
            closedAt: string;
            totalAmount: number;
            totalCredit: number;
            totalDebit: number;
            paymentMethodDetails: {
                id: string;
                name: string;
                credit: number;
                debit: number;
                total: number;
            }[];
            closedBy: any;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    closeCashClosure(userId: string): Promise<{
        id: string;
        createdAt: string;
        closedAt: string;
        status: string;
        paymentMethods: any[];
        totalAmount: number;
        totalCredit: any;
        totalDebit: any;
        closedBy: any;
    }>;
    automaticCloseCashClosure(): Promise<{
        id: string;
        createdAt: string;
        closedAt: string;
        status: string;
        paymentMethods: any[];
        totalAmount: number;
        totalCredit: any;
        totalDebit: any;
        closedBy: any;
    }>;
    automaticOpenCashClosure(): Promise<{
        id: string;
        createdAt: string;
        status: string;
        paymentMethods: any[];
        totalAmount: number;
        totalCredit: number;
        totalDebit: number;
    }>;
    checkAndProcessAutomaticCashClosure(): Promise<{
        action: string;
        time: string;
        error?: undefined;
    } | {
        action: string;
        time: string;
        error: any;
    }>;
    getTransactionsForCashClosure(cashClosureId: string, page?: number, limit?: number): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    private getPaymentMethodsForClosure;
}
