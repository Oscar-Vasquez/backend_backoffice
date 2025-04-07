import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
export declare class OptimizedPoolService {
    private configService;
    private pool;
    constructor(configService: ConfigService);
    getPool(): Pool;
    getClient(): Promise<any>;
    query(text: string, params?: any[]): Promise<any>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
    onApplicationShutdown(): Promise<void>;
}
