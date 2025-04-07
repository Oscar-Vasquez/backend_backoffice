import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolClient, QueryResult } from 'pg';
export declare class SqlService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private pool;
    private queryStats;
    private readonly SLOW_QUERY_THRESHOLD;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>, maxRetries?: number): Promise<T>;
    private isTransientError;
    private scheduleHealthCheck;
    private truncateQuery;
}
