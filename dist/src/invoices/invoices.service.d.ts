import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from '../modules/activities/activities.service';
import { PackagesService } from '../packages/packages.service';
import { PrismaService } from '../prisma/prisma.service';
import { invoice_status_enum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export interface Invoice {
    id: string;
    invoice_number: string;
    customer?: {
        name: string;
        email?: string;
        photo?: string;
    };
    issue_date: string;
    due_date: string;
    total_amount: number;
    status: string;
    price_plan?: number;
    shipping_insurance?: boolean;
}
export interface InvoiceCreateResult {
    id: string;
    invoice_number: string;
    issue_date: Date;
    due_date: Date;
    status: invoice_status_enum;
    total_amount: Decimal;
    price_plan?: number;
    shipping_insurance?: boolean;
    items: {
        name: string;
        description: string;
        quantity: number;
        price: number;
        totalPrice: number;
        trackingNumber: string;
        weight: number;
        rate: number;
    }[];
    customer: {
        id: string;
        name: string;
        email: string;
    };
    packageIds: string[];
    notifications?: {
        sent: number;
        total: number;
        error?: string;
    };
    invoiceNotification?: {
        sent: boolean;
        method?: string;
        fallback?: boolean;
        simulated?: boolean;
        error?: string;
    };
}
export declare class InvoicesService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly activitiesService;
    private readonly packagesService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, activitiesService: ActivitiesService, packagesService: PackagesService);
    private isPackageAlreadyInvoiced;
    verifyPackageStatus(trackingNumber: string): Promise<{
        isInvoiced: boolean;
        invoiceDetails?: any;
    }>;
    createInvoice(createInvoiceDto: CreateInvoiceDto, operatorData: {
        id: string;
        email: string;
    }): Promise<InvoiceCreateResult>;
    findAll(): Promise<{
        id: string;
        invoice_number: string;
        issue_date: Date;
        due_date: Date;
        status: import(".prisma/client").$Enums.invoice_status_enum;
        total_amount: Decimal;
        is_paid: boolean;
        price_plan: Decimal;
        shipping_insurance: boolean;
        customer: {
            id: string;
            name: string;
            email: string;
            photo: string;
        };
        packages: {
            id: string;
            tracking_number: string;
            status: import(".prisma/client").$Enums.package_status_enum;
            weight: Decimal;
        }[];
    }[]>;
    updateStatus(invoiceId: string, newStatus: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.invoice_status_enum;
        is_paid: boolean;
        updated_at: Date;
    }>;
    findById(id: string): Promise<Invoice>;
    findInvoiceWithDetails(id: string): Promise<any>;
    logReminderSent(invoiceId: string, operatorId: string, success: boolean): Promise<void>;
}
