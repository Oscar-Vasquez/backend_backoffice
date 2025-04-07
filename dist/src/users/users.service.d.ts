import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseUser, UpdateStatusResponse, CreateUserDto } from './types';
import { WalletsService } from '../wallets/wallets.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly configService;
    private readonly walletsService;
    private readonly prisma;
    private readonly API_URL;
    private readonly db;
    constructor(configService: ConfigService, walletsService: WalletsService, prisma: PrismaService);
    private mapUserData;
    private mapPrismaUserToFirebaseUser;
    getAllUsers(): Promise<FirebaseUser[]>;
    searchSuggestions(query: string, limit?: number): Promise<any[]>;
    searchExactMatch(query: string, limit?: number): Promise<any[]>;
    searchByNameAndLastName(firstName: string, lastName: string, limit?: number): Promise<any[]>;
    searchUser(query: string): Promise<FirebaseUser | null>;
    getUserDetails(userId: string): Promise<FirebaseUser | null>;
    updateUserStatus(userId: string, status: string): Promise<UpdateStatusResponse>;
    getBranchName(branchPath: string | null | undefined): Promise<string | null>;
    getPlanName(planPath: string | null | undefined): Promise<string | null>;
    private createWalletForUser;
    private getWalletName;
    getWalletInfo(walletId: string): Promise<admin.firestore.DocumentData>;
    private delay;
    private createUserWithRetry;
    createUser(createUserDto: CreateUserDto): Promise<FirebaseUser>;
    getTypeUsers(): Promise<{
        id: string;
        name: string;
        description: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }[]>;
    sendCredentialsByEmail(credentials: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        verificationLink: string;
    }): Promise<boolean>;
    private processReferenceAsObject;
    getUserWithDetails(userId: string): Promise<FirebaseUser | null>;
    assignClientToPackage(packageId: string, userId: string): Promise<{
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
    getShippingInsurance(userId: string): Promise<any>;
}
