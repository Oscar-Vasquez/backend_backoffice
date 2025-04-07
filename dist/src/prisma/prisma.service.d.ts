import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private connectionEstablished;
    private lastQueryTime;
    private queryCount;
    private slowQueryCount;
    queryMetrics: {
        [key: string]: {
            count: number;
            totalTime: number;
            maxTime: number;
        };
    };
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private optimizeDatabase;
    private scheduleConnectionHealthCheck;
    onModuleDestroy(): Promise<void>;
    checkConnection(): Promise<boolean>;
    getQueryStats(): {
        queryCount: number;
        slowQueryCount: number;
        lastQueryTime: number;
        topSlowQueries: {
            query: string;
            maxTime: number;
            avgTime: number;
            count: number;
        }[];
    };
}
