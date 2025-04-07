import { PrismaService } from '../prisma/prisma.service';
import { OperatorsCacheService } from './operators-cache.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { Operator } from './types';
import { ActivityType, ActivityStatus, OperatorActivityDto, ActivityAction } from './dto/operator-activity.dto';
export declare class OperatorsService {
    private readonly prisma;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: OperatorsCacheService);
    private mapOperatorData;
    private parseEmergencyContact;
    findAll(page?: number, limit?: number, filters?: {
        status?: string;
        role?: string;
        branchId?: string;
        search?: string;
    }): Promise<{
        operators: Operator[];
        total: number;
    }>;
    findOne(operatorId: string, forceRefresh?: boolean): Promise<Operator>;
    create(createOperatorDto: CreateOperatorDto): Promise<Operator>;
    update(operatorId: string, updateOperatorDto: UpdateOperatorDto): Promise<Operator>;
    remove(operatorId: string): Promise<void>;
    logActivity(operatorId: string, type: ActivityType, action: ActivityAction, description: string, details?: any, status?: ActivityStatus, branchId?: string, req?: any): Promise<void>;
    getOperatorActivities(operatorId: string, page?: number, limit?: number): Promise<{
        activities: OperatorActivityDto[];
        total: number;
    }>;
    private mapActivityTypeToPrisma;
    private mapPrismaActivityType;
    private mapActivityStatusToPrisma;
    private mapPrismaActivityStatus;
    invalidateOperatorCache(operatorId: string): void;
    verifyPassword(operatorId: string, currentPassword: string): Promise<boolean>;
    updatePassword(operatorId: string, newPassword: string): Promise<void>;
}
