import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../modules/activities/activities.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Invoice } from './types';
export declare class PaymentsService implements OnModuleInit {
    private readonly prisma;
    private readonly activitiesService;
    private readonly transactionsService;
    constructor(prisma: PrismaService, activitiesService: ActivitiesService, transactionsService: TransactionsService);
    onModuleInit(): Promise<void>;
    processPayment(invoiceId: string, amount: number, paymentDetails: {
        method: string;
        amountReceived: number;
        paymentMethodId?: string;
        isPartialPayment?: boolean;
        requestId?: string;
    }, operatorData: {
        id: string;
        email: string;
    }): Promise<any>;
    getUserInvoices(userId: string): Promise<Invoice[]>;
    getPendingInvoices(search?: string): Promise<Invoice[]>;
    private convertToPaymentMethodEnum;
    private getPackagePosition;
}
