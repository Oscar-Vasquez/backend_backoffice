import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    healthCheck(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
    getDatabaseMetrics(): {
        timestamp: string;
        metrics: {
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
        connection: {
            established: boolean;
            lastQuery: string;
            inactiveTime: number;
        };
    };
}
