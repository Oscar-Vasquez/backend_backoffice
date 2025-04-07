import { ConfigService } from '@nestjs/config';
import { Wallet, TransactionResponse } from './types';
export declare class WalletsService {
    private readonly configService;
    private readonly db;
    constructor(configService: ConfigService);
    private createWallet;
    getWallet(id: string): Promise<Wallet>;
    getBalance(id: string): Promise<{
        balance: number;
    }>;
    updateStatus(id: string, status: 'active' | 'inactive'): Promise<Wallet>;
    getTransactions(id: string, page?: number, limit?: number): Promise<TransactionResponse>;
}
