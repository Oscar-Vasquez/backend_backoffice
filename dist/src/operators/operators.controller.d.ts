import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OperatorActivityDto } from './dto/operator-activity.dto';
export declare class OperatorsController {
    private readonly operatorsService;
    private readonly logger;
    constructor(operatorsService: OperatorsService);
    createFirstAdmin(createOperatorDto: CreateOperatorDto): Promise<import("./types").Operator>;
    create(createOperatorDto: CreateOperatorDto, req: any): Promise<import("./types").Operator>;
    findAll(req: any, page?: number, limit?: number, status?: string, role?: string, branchId?: string, search?: string): Promise<{
        data: import("./types").Operator[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    private logActivityAsync;
    findOne(id: string, req: any, refresh?: string): Promise<import("./types").Operator>;
    getOperatorActivities(id: string, req: any, page?: number, limit?: number): Promise<{
        data: OperatorActivityDto[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    update(id: string, updateOperatorDto: UpdateOperatorDto, req: any): Promise<import("./types").Operator>;
    remove(id: string, req: any): Promise<void>;
    changePassword(id: string, changePasswordDto: ChangePasswordDto, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    clearCache(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
