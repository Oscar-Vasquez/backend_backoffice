import { UsersService } from './users.service';
import { FirebaseUser, UpdateStatusResponse, CreateUserDto } from './types';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto): Promise<FirebaseUser>;
    getAllUsers(): Promise<FirebaseUser[]>;
    getSuggestions(query?: string, firstName?: string, lastName?: string, limit?: number): Promise<any[]>;
    searchUsers(query: string, exact?: string, limit?: number): Promise<any[] | FirebaseUser>;
    getTypeUsers(): Promise<{
        id: string;
        name: string;
        description: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }[]>;
    getUserDetails(userId: string): Promise<FirebaseUser>;
    updateUserStatus(userId: string, newStatus: string): Promise<UpdateStatusResponse>;
    sendCredentials(credentials: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        success: boolean;
        message: string;
        details: {
            email: string;
            firstName: string;
            verificationLinkGenerated: boolean;
        };
    }>;
    assignClientToPackage(data: {
        packageId: string;
        userId: string;
    }): Promise<{
        success: boolean;
        message: string;
        package: {
            id: string;
            trackingNumber: string;
            status: import(".prisma/client").$Enums.package_status_enum;
            updatedAt: string;
            dimensions: {
                height: import("@prisma/client/runtime/library").Decimal;
                width: import("@prisma/client/runtime/library").Decimal;
                length: import("@prisma/client/runtime/library").Decimal;
                weight: import("@prisma/client/runtime/library").Decimal;
            };
        };
        client: any;
    }>;
    checkShippingInsurance(userId: string): Promise<any>;
}
