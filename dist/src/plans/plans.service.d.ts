import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class PlansService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createPlanDto: CreatePlanDto): Promise<{
        id: any;
        planName: any;
        description: any;
        price: number;
        isActive: any;
        branchReference: string;
        branch: {
            id: any;
            province: any;
        };
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(): Promise<{
        id: any;
        planName: any;
        description: any;
        price: number;
        isActive: any;
        branchReference: string;
        branch: {
            id: any;
            province: any;
        };
        createdAt: any;
        updatedAt: any;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        planName: any;
        description: any;
        price: number;
        isActive: any;
        branchReference: string;
        branch: {
            id: any;
            province: any;
        };
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, updatePlanDto: UpdatePlanDto): Promise<{
        id: any;
        planName: any;
        description: any;
        price: number;
        isActive: any;
        branchReference: string;
        branch: {
            id: any;
            province: any;
        };
        createdAt: any;
        updatedAt: any;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findByBranch(branchReference: any): Promise<{
        id: any;
        planName: any;
        description: any;
        price: number;
        isActive: any;
        branchReference: string;
        branch: {
            id: any;
            province: any;
        };
        createdAt: any;
        updatedAt: any;
    }[]>;
    private extractBranchId;
    private mapPlanToDto;
}
