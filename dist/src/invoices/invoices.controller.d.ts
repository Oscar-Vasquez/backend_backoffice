import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Request } from 'express';
import { PackageNotificationService } from '../packages/services/package-notification.service';
import { SupabaseEmailService } from '../email/supabase-email.service';
interface RequestWithUser extends Request {
    user: {
        id?: string;
        sub?: string;
        email: string;
        role: string;
    };
}
export declare class InvoicesController {
    private readonly invoicesService;
    private readonly packageNotificationService;
    private readonly supabaseEmailService;
    constructor(invoicesService: InvoicesService, packageNotificationService: PackageNotificationService, supabaseEmailService: SupabaseEmailService);
    findAll(): Promise<{
        id: string;
        invoice_number: string;
        issue_date: Date;
        due_date: Date;
        status: import(".prisma/client").$Enums.invoice_status_enum;
        total_amount: import("@prisma/client/runtime/library").Decimal;
        is_paid: boolean;
        price_plan: import("@prisma/client/runtime/library").Decimal;
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
            weight: import("@prisma/client/runtime/library").Decimal;
        }[];
    }[]>;
    create(data: CreateInvoiceDto, req: RequestWithUser): Promise<import("./invoices.service").InvoiceCreateResult>;
    debugCreate(data: any, req: RequestWithUser): Promise<{
        success: boolean;
        message: string;
        data: {
            received: {
                price_plan: any;
                price_plan_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
                shipping_insurance: any;
                shipping_insurance_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
            };
            serialization_test: {
                price_plan: any;
                price_plan_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
                shipping_insurance: any;
                shipping_insurance_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
            };
        };
    }>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.invoice_status_enum;
        is_paid: boolean;
        updated_at: Date;
    }>;
    verifyPackage(tracking: string): Promise<{
        isInvoiced: boolean;
        invoiceDetails?: any;
    }>;
    sendInvoiceReminder(id: string, req: RequestWithUser): Promise<{
        success: boolean;
        message: string;
        details: {
            invoiceId: string;
            sentTo: any;
            emailResult: {
                success: boolean;
                sentTo: string;
                method: string;
                messageId?: undefined;
                fallback?: undefined;
                message?: undefined;
                previewUrl?: undefined;
                simulated?: undefined;
                error?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                messageId: any;
                method: string;
                fallback?: undefined;
                message?: undefined;
                previewUrl?: undefined;
                simulated?: undefined;
                error?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                method: string;
                fallback: boolean;
                message: string;
                messageId?: undefined;
                previewUrl?: undefined;
                simulated?: undefined;
                error?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                previewUrl: string | false;
                method: string;
                fallback: boolean;
                message: string;
                messageId?: undefined;
                simulated?: undefined;
                error?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                simulated: boolean;
                method: string;
                error: string;
                messageId?: undefined;
                fallback?: undefined;
                message?: undefined;
                previewUrl?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                simulated: boolean;
                method: string;
                message: string;
                messageId?: undefined;
                fallback?: undefined;
                previewUrl?: undefined;
                error?: undefined;
            } | {
                success: boolean;
                sentTo: string;
                error: any;
                method?: undefined;
                messageId?: undefined;
                fallback?: undefined;
                message?: undefined;
                previewUrl?: undefined;
                simulated?: undefined;
            };
        };
    }>;
}
export {};
