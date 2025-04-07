import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorTypeDto, UpdateOperatorTypeDto } from './dto';
export declare class OperatorTypesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createOperatorTypeDto: CreateOperatorTypeDto): Promise<{
        description: string | null;
        id: string;
        created_at: Date;
        updated_at: Date | null;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(): Promise<{
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
