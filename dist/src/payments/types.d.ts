import { package_status_enum } from '@prisma/client';
export declare const INVOICE_STATUS: {
    readonly PAID: "PAGADO";
    readonly PENDING: "PENDIENTE";
    readonly PARTIAL: "PARCIAL";
};
export type InvoiceStatusType = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
export interface ShippingStage {
    position?: string;
    ubicacion?: string;
    location?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
    timestamp?: string;
    date?: string;
    time?: string;
    created_at?: string;
    status?: string;
    description?: string;
    notes?: string;
    details?: string;
    provider?: string;
    carrier?: string;
    tracking_url?: string;
    operator_id?: string;
    operator_name?: string;
    [key: string]: any;
}
export interface Invoice {
    id: string;
    userId: string;
    amount: number;
    status: InvoiceStatusType;
    date: string;
    description: string;
    paymentDate?: string;
    transactionId?: string;
    userName?: string;
    userEmail?: string;
    invoiceNumber?: string;
    dueDate?: string;
    totalAmount?: number;
    taxAmount?: number;
    discountAmount?: number;
    currency?: string;
    packages?: PackageInfo[];
}
export interface PackageInfo {
    id: string;
    trackingNumber: string;
    status: package_status_enum;
    position?: string | null;
    shipping_stages?: ShippingStage[];
}
export interface ProcessPaymentDto {
    invoiceId: string;
    amount: number;
    method: string;
    amountReceived: number;
}
