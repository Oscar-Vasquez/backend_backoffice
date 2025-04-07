import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    createTransaction(data: {
        description: string;
        status: string;
        transactionType: string;
        entityType: string;
        entityId: string;
        referenceId?: string;
        paymentMethodId?: string;
        metadata?: Record<string, any>;
        amount?: number;
        categoryId?: string;
        transactionTypeId?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        transaction: {
            amount: number;
            description: string | null;
            id: string;
            created_at: Date | null;
            updated_at: Date | null;
            status: string;
            entity_type: string | null;
            entity_id: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            transaction_date: Date | null;
            transaction_type: string;
            reference_id: string | null;
            payment_method_id: string | null;
            category_id: string | null;
            transaction_type_id: string | null;
        };
    }>;
    getTransactionTypes(): Promise<{
        success: boolean;
        types: {
            description: string | null;
            id: string;
            created_at: Date | null;
            updated_at: Date | null;
            name: string;
            is_active: boolean | null;
            code: string;
            affects_balance: string;
        }[];
    }>;
    getTransactionsByEntity(entityType: string, entityId: string): Promise<{
        success: boolean;
        count: number;
        transactions: {
            amount: number;
            payment_methods: {
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                details: import("@prisma/client/runtime/library").JsonValue | null;
                payment_type_id: number | null;
            };
            transaction_categories: {
                description: string | null;
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                parent_id: string | null;
            };
            transaction_types: {
                description: string | null;
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                code: string;
                affects_balance: string;
            };
            description: string | null;
            id: string;
            created_at: Date | null;
            updated_at: Date | null;
            status: string;
            entity_type: string | null;
            entity_id: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            transaction_date: Date | null;
            transaction_type: string;
            reference_id: string | null;
            payment_method_id: string | null;
            category_id: string | null;
            transaction_type_id: string | null;
        }[];
    }>;
    getTodayTransactions(page?: string, limit?: string): Promise<{
        data: {
            id: string;
            description: string;
            status: string;
            transactionDate: Date;
            transactionDateLocal: string;
            transactionType: string;
            entityType: string;
            entityId: string;
            amount: number;
            paymentMethod: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
            };
            transactionTypeDetails: {
                id: string;
                name: string;
                affectsBalance: string;
            };
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            date: string;
            period: string;
            cutoffTime: string;
            timezone: string;
            summary: {
                totalCredit: number;
                totalDebit: number;
            };
        };
        success: boolean;
        message: string;
    }>;
    getTransactionsByCategory(categoryId: string, page?: string, limit?: string, transactionType?: string): Promise<{
        data: {
            amount: number;
            payment_methods: {
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                details: import("@prisma/client/runtime/library").JsonValue | null;
                payment_type_id: number | null;
            };
            transaction_categories: {
                description: string | null;
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                parent_id: string | null;
            };
            transaction_types: {
                description: string | null;
                id: string;
                created_at: Date | null;
                updated_at: Date | null;
                name: string;
                is_active: boolean | null;
                code: string;
                affects_balance: string;
            };
            description: string | null;
            id: string;
            created_at: Date | null;
            updated_at: Date | null;
            status: string;
            entity_type: string | null;
            entity_id: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            transaction_date: Date | null;
            transaction_type: string;
            reference_id: string | null;
            payment_method_id: string | null;
            category_id: string | null;
            transaction_type_id: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            category: string;
        };
        success: boolean;
        message: string;
    }>;
}
