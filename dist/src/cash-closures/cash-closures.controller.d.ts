import { CashClosuresService } from './cash-closures.service';
import { CashClosuresCronService } from './cash-closures.cron';
export declare class CashClosuresController {
    private readonly cashClosuresService;
    private readonly cashClosuresCronService;
    constructor(cashClosuresService: CashClosuresService, cashClosuresCronService: CashClosuresCronService);
    getCurrentCashClosure(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getCashClosureHistory(page?: string, limit?: string, startDate?: string, endDate?: string, status?: string): Promise<{
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
        success: boolean;
    }>;
    closeCashClosure(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: string;
            closedAt: string;
            status: string;
            paymentMethods: any[];
            totalAmount: number;
            totalCredit: any;
            totalDebit: any;
            closedBy: any;
        };
    }>;
    getTransactionsForCashClosure(id: string, page?: string, limit?: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
        success: boolean;
    }>;
    testAutomaticClose(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: string;
            closedAt: string;
            status: string;
            paymentMethods: any[];
            totalAmount: number;
            totalCredit: any;
            totalDebit: any;
            closedBy: any;
        };
    }>;
    testAutomaticOpen(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: string;
            status: string;
            paymentMethods: any[];
            totalAmount: number;
            totalCredit: number;
            totalDebit: number;
        };
    }>;
    getAutomaticStatus(): Promise<{
        success: boolean;
        message: string;
        data: {
            currentServerTime: string;
            timeZone: string;
            localTime: string;
            action: string;
            time: string;
            error?: undefined;
        } | {
            currentServerTime: string;
            timeZone: string;
            localTime: string;
            action: string;
            time: string;
            error: any;
        };
    }>;
    getScheduleInfo(): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            currentTime: string;
            currentTimeLocal: string;
            timeZone: string;
            jobs: {};
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            currentTime?: undefined;
            currentTimeLocal?: undefined;
            timeZone?: undefined;
            jobs?: undefined;
        };
    }>;
}
