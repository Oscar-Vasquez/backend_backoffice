import { PaymentsService } from './payments.service';
import { Invoice } from './types';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    processPayment(invoiceId: string, paymentData: {
        amount: number;
        method: string;
        amountReceived: number;
        paymentMethodId?: string;
        isPartialPayment?: boolean;
    }, req: any): Promise<any>;
    getUserInvoices(userId: string): Promise<{
        success: boolean;
        message: string;
        invoices: Invoice[];
    }>;
    getPendingInvoices(search?: string): Promise<{
        success: boolean;
        count: number;
        invoices: Invoice[];
    }>;
    getEnums(): Promise<{
        invoice_status_enum: {
            draft: "draft";
            sent: "sent";
            paid: "paid";
            partial: "partial";
            overdue: "overdue";
            cancelled: "cancelled";
        };
        payment_method_enum: {
            cash: "cash";
            credit_card: "credit_card";
            debit_card: "debit_card";
            bank_transfer: "bank_transfer";
            paypal: "paypal";
            crypto: "crypto";
            gift_card: "gift_card";
            store_credit: "store_credit";
        };
        payment_status_enum: {
            pending: "pending";
            completed: "completed";
            failed: "failed";
            refunded: "refunded";
            partially_refunded: "partially_refunded";
            chargeback: "chargeback";
        };
        INVOICE_STATUS: {
            readonly PAID: "PAGADO";
            readonly PENDING: "PENDIENTE";
            readonly PARTIAL: "PARCIAL";
        };
    }>;
}
