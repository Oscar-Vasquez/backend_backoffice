import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
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
    findByBranch(branchReference: string): Promise<{
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
}
