import { WalletsService } from './wallets.service';
import { Wallet, TransactionResponse } from './types';
export declare class WalletsController {
    private readonly walletsService;
    constructor(walletsService: WalletsService);
    getWalletByUserId(userId: string): Promise<Wallet>;
    getWallet(id: string): Promise<Wallet>;
    getBalance(id: string): Promise<{
        balance: number;
    }>;
    updateStatus(id: string, status: 'active' | 'inactive'): Promise<Wallet>;
    getTransactions(id: string, page?: string, limit?: string): Promise<TransactionResponse>;
}
