export declare class WalletDto {
    walletId: string;
    walletName: string;
    currentBalance: number;
}
export declare class WalletTransactionDto {
    transactionId: string;
    userReference: string;
    transactionType: string;
    amount: number;
    transactionDate: Date;
    referenceId: string;
    description: string;
}
