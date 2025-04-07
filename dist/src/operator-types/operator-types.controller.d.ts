import { OperatorTypesService } from './operator-types.service';
import { CreateOperatorTypeDto, UpdateOperatorTypeDto } from './dto';
export declare class OperatorTypesController {
    private readonly operatorTypesService;
    private readonly logger;
    constructor(operatorTypesService: OperatorTypesService);
    create(createOperatorTypeDto: CreateOperatorTypeDto): Promise<{
        description: string | null;
        id: string;
        created_at: Date;
        updated_at: Date | null;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(name?: string): Promise<{
        description: string | null;
        id: string;
        created_at: Date;
        updated_at: Date | null;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findOne(id: string): Promise<{
        operators: {
            email: string;
            id: string;
            first_name: string;
            last_name: string;
            role: import(".prisma/client").$Enums.operator_role_enum;
            status: import(".prisma/client").$Enums.operator_status_enum;
        }[];
    } & {
        description: string | null;
        id: string;
        created_at: Date;
        updated_at: Date | null;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, updateOperatorTypeDto: UpdateOperatorTypeDto): Promise<{
        description: string | null;
        id: string;
        created_at: Date;
        updated_at: Date | null;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
