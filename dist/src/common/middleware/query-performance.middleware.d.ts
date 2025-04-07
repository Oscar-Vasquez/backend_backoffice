import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class QueryPerformanceMiddleware implements NestMiddleware {
    private prisma;
    private configService;
    private readonly logger;
    private readonly SLOW_QUERY_THRESHOLD;
    private readonly enablePerformanceMonitoring;
    constructor(prisma: PrismaService, configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): void;
}
