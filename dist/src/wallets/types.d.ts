export interface Wallet {
    id: string;
    name: string;
    type: 'standard' | 'premium';
    balance: number;
    status: 'active' | 'inactive';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Transaction {
    id: string;
    walletId: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    status: 'completed' | 'pending' | 'failed';
    createdAt: Date;
}
export interface TransactionResponse {
    data: Transaction[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
