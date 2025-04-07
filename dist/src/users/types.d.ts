export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    birthDate: string;
    branchReference: string;
    subscriptionPlan: string;
    typeUserReference: string;
    address: string;
}
export declare class FirebaseUser {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    isVerified: boolean;
    isEmailVerified: boolean;
    accountStatus: boolean;
    birthDate: string;
    photo: string;
    branchReference: {
        path: string;
        id: string;
    };
    branchReferences?: string[];
    branchName: string;
    branchAddress: string;
    branchLocation: string;
    subscriptionPlan: {
        path: string;
        id: string;
    };
    typeUserReference: {
        path: string;
        id: string;
    };
    planRate?: number;
    price?: number;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
    walletReference: {
        path: string;
        id: string;
    };
    walletName: string;
    password?: string;
    assignedLocker: string;
    displayMessage?: string;
    subscriptionDetails?: {
        planName: string;
        description: string;
        price: string;
    };
    branchDetails?: {
        name: string;
        province: string;
        address: string;
    };
    shipping_insurance?: boolean;
    [key: string]: any;
}
export interface PrismaUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    isVerified: boolean;
    isEmailVerified: boolean;
    accountStatus: boolean;
    birthDate: Date;
    photoUrl: string;
    branchId: string;
    subscriptionPlanId: string;
    typeUserId: string;
    planRate: number;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    walletId: string | null;
    assignedLocker: string;
    displayMessage: string | null;
    shipping_insurance: boolean;
    branch?: any;
    subscriptionPlan?: any;
    typeUser?: any;
    wallet?: any;
}
export declare class UpdateStatusResponse {
    success: boolean;
    message: string;
    details?: {
        userId: string;
        previousStatus: boolean;
        newStatus: boolean;
        timestamp: string;
    };
}
export declare class TypeUser {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare class SearchDto {
    query: string;
}
