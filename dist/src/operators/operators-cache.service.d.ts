import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    invalidations: number;
    size: number;
    lastCleanup: number;
    lastPreload: number;
}
interface OperatorFilters {
    status?: string;
    role?: string;
    branch_id?: string;
    search?: string;
}
export declare class OperatorsCacheService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private cache;
    private readonly DEFAULT_TTL;
    private readonly PRELOAD_TTL;
    private readonly MAX_CACHE_SIZE;
    private stats;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    preloadOperators(): Promise<void>;
    private mapOperatorFromPrisma;
    private appendToListCache;
    get<T>(key: string): T | null;
    set<T>(key: string, data: T, ttl?: number): void;
    invalidate(key: string): void;
    invalidateAll(): void;
    invalidatePattern(pattern: string): void;
    getOperatorsListCacheKey(page: number, limit: number, filters?: OperatorFilters): string;
    getOperatorCacheKey(operatorId: string): string;
    getOperatorActivitiesCacheKey(operatorId: string, page: number, limit: number): string;
    getCacheStats(): CacheStats;
    verifyAndRenewOperatorCache(operatorId: string): boolean;
    private cleanExpiredCache;
    private evictOldEntries;
    private logCacheStats;
}
export {};
