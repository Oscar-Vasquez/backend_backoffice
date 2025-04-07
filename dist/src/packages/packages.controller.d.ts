import { PackagesService } from './packages.service';
import { PackageNotificationService } from './services/package-notification.service';
import { UpdateDimensionsDto } from './dto/update-dimensions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateWeightsDto } from './dto/update-weights.dto';
import { PrismaService } from '../prisma/prisma.service';
interface RequestWithUser extends Request {
    user: {
        id?: string;
        sub?: string;
        email: string;
        role: string;
        branchReference?: string;
    };
}
export declare class PackagesController {
    private readonly packagesService;
    private readonly prisma;
    private readonly packageNotificationService;
    constructor(packagesService: PackagesService, prisma: PrismaService, packageNotificationService: PackageNotificationService);
    findByTracking(trackingNumber: string, req: RequestWithUser): Promise<{
        id: string;
        trackingNumber: string;
        packageStatus: import(".prisma/client").$Enums.package_status_enum;
        weight: number;
        volumetricWeight: number;
        length: number;
        width: number;
        height: number;
        createdAt: string;
        updatedAt: string;
        userId: string;
        branchId: string;
        shippingStages: import("@prisma/client/runtime/library").JsonValue[];
        insurance: boolean;
        position: string;
        invoice: any;
        user: any;
        branch: {
            id: string;
            name: string;
            address: string;
        };
    }>;
    findAll(skip?: number, take?: number, status?: string, userId?: string, branchId?: string): Promise<{
        data: {
            length: import("@prisma/client/runtime/library").Decimal | null;
            id: string;
            created_at: Date;
            updated_at: Date | null;
            branch_id: string | null;
            position: string | null;
            operator_id: string | null;
            width: import("@prisma/client/runtime/library").Decimal | null;
            height: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            tracking_number: string | null;
            user_reference: string | null;
            package_status: import(".prisma/client").$Enums.package_status_enum;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            volumetric_weight: import("@prisma/client/runtime/library").Decimal | null;
            insurance: boolean | null;
            shipping_stages: import("@prisma/client/runtime/library").JsonValue[];
            declared_value: import("@prisma/client/runtime/library").Decimal | null;
            customs_information: import("@prisma/client/runtime/library").JsonValue | null;
            is_fragile: boolean | null;
            estimated_delivery_date: Date | null;
        }[];
        meta: {
            total: number;
            skip: number;
            take: number;
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
            position: string;
            user: any;
            branch: {
                id: string;
                name: string;
                address: string;
            };
            operator: {
                id: string;
                name: string;
                email: string;
            };
            branches: {
                email: string | null;
                id: string;
                created_at: Date;
                updated_at: Date | null;
                phone: string | null;
                address: string | null;
                name: string;
                province: string | null;
                city: string | null;
                postal_code: string | null;
                is_active: boolean | null;
                prefix: string | null;
                company_id: string;
                manager_name: string | null;
                opening_hours: import("@prisma/client/runtime/library").JsonValue | null;
                timezone: string | null;
            };
            operators: {
                email: string;
                password: string;
                id: string;
                created_at: Date;
                updated_at: Date | null;
                first_name: string;
                last_name: string;
                phone: string | null;
                photo: string | null;
                role: import(".prisma/client").$Enums.operator_role_enum;
                status: import(".prisma/client").$Enums.operator_status_enum;
                last_login_at: Date | null;
                branch_id: string;
                type_operator_id: string;
                position: string | null;
                hire_date: Date | null;
                birth_date: Date | null;
                emergency_contact: import("@prisma/client/runtime/library").JsonValue | null;
                skills: string[];
                personal_id: string | null;
                address: string | null;
            };
            users: {
                email: string | null;
                id: string;
                created_at: Date;
                updated_at: Date | null;
                first_name: string | null;
                last_name: string | null;
                phone: string | null;
                branch_id: string | null;
                birth_date: Date | null;
                shipping_insurance: boolean;
                account_status: boolean | null;
                is_email_verified: boolean | null;
                is_online: boolean | null;
                is_verified: boolean | null;
                last_seen: Date | null;
                photo_url: string | null;
                plan_id: string | null;
                type_user_id: string | null;
                is_business: boolean | null;
                ruc: string | null;
                company_name: string | null;
                referral_source_id: string | null;
            };
            length: import("@prisma/client/runtime/library").Decimal | null;
            id: string;
            created_at: Date;
            updated_at: Date | null;
            branch_id: string | null;
            operator_id: string | null;
            width: import("@prisma/client/runtime/library").Decimal | null;
            height: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            tracking_number: string | null;
            user_reference: string | null;
            package_status: import(".prisma/client").$Enums.package_status_enum;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            volumetric_weight: import("@prisma/client/runtime/library").Decimal | null;
            insurance: boolean | null;
            shipping_stages: import("@prisma/client/runtime/library").JsonValue[];
            declared_value: import("@prisma/client/runtime/library").Decimal | null;
            customs_information: import("@prisma/client/runtime/library").JsonValue | null;
            is_fragile: boolean | null;
            estimated_delivery_date: Date | null;
        };
    }>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<{
        success: boolean;
        message: string;
        data: {
            length: import("@prisma/client/runtime/library").Decimal | null;
            id: string;
            created_at: Date;
            updated_at: Date | null;
            branch_id: string | null;
            position: string | null;
            operator_id: string | null;
            width: import("@prisma/client/runtime/library").Decimal | null;
            height: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            tracking_number: string | null;
            user_reference: string | null;
            package_status: import(".prisma/client").$Enums.package_status_enum;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            volumetric_weight: import("@prisma/client/runtime/library").Decimal | null;
            insurance: boolean | null;
            shipping_stages: import("@prisma/client/runtime/library").JsonValue[];
            declared_value: import("@prisma/client/runtime/library").Decimal | null;
            customs_information: import("@prisma/client/runtime/library").JsonValue | null;
            is_fragile: boolean | null;
            estimated_delivery_date: Date | null;
        };
    }>;
    updateDimensions(id: string, updateDimensionsDto: UpdateDimensionsDto, req: RequestWithUser): Promise<{
        success: boolean;
        message: string;
        data: {
            length: import("@prisma/client/runtime/library").Decimal | null;
            id: string;
            created_at: Date;
            updated_at: Date | null;
            branch_id: string | null;
            position: string | null;
            operator_id: string | null;
            width: import("@prisma/client/runtime/library").Decimal | null;
            height: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            tracking_number: string | null;
            user_reference: string | null;
            package_status: import(".prisma/client").$Enums.package_status_enum;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            volumetric_weight: import("@prisma/client/runtime/library").Decimal | null;
            insurance: boolean | null;
            shipping_stages: import("@prisma/client/runtime/library").JsonValue[];
            declared_value: import("@prisma/client/runtime/library").Decimal | null;
            customs_information: import("@prisma/client/runtime/library").JsonValue | null;
            is_fragile: boolean | null;
            estimated_delivery_date: Date | null;
        };
    }>;
    updateWeights(id: string, updateWeightsDto: UpdateWeightsDto): Promise<{
        success: boolean;
        message: string;
        data: {
            length: import("@prisma/client/runtime/library").Decimal | null;
            id: string;
            created_at: Date;
            updated_at: Date | null;
            branch_id: string | null;
            position: string | null;
            operator_id: string | null;
            width: import("@prisma/client/runtime/library").Decimal | null;
            height: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            tracking_number: string | null;
            user_reference: string | null;
            package_status: import(".prisma/client").$Enums.package_status_enum;
            weight: import("@prisma/client/runtime/library").Decimal | null;
            volumetric_weight: import("@prisma/client/runtime/library").Decimal | null;
            insurance: boolean | null;
            shipping_stages: import("@prisma/client/runtime/library").JsonValue[];
            declared_value: import("@prisma/client/runtime/library").Decimal | null;
            customs_information: import("@prisma/client/runtime/library").JsonValue | null;
            is_fragile: boolean | null;
            estimated_delivery_date: Date | null;
        };
    }>;
    assignUserToPackage(packageId: string, { userId }: {
        userId: string;
    }, req: RequestWithUser): Promise<{
        success: boolean;
        package: {
            id: string;
            tracking_number: string;
            status: import(".prisma/client").$Enums.package_status_enum;
            updatedAt: Date;
            user_reference: string;
            branch_id: string;
            branch_name: string;
            operator_id: string;
            position: string;
        };
        user: {
            id: string;
            email: string;
            name: string;
        };
    }>;
    getPackageClient(packageId: string): Promise<{
        success: boolean;
        hasClient: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
            phone: string;
            photo: string;
            accountStatus: boolean;
            branchName: string;
            planName: string;
            planRate: number;
            userType: string;
            shipping_insurance: boolean;
            assignedAt: Date;
        };
    }>;
    getUnassignedPercentage(branchId: string, req: RequestWithUser): Promise<{
        success: boolean;
        data: {
            percentage: number;
            assignedNotInvoiced: number;
            totalPackages: number;
            trend: number;
            lastMonthPercentage: number;
        } | {
            percentage: number;
            assignedNotInvoiced: number;
            totalPackages: number;
            trend: number;
            lastMonthPercentage: number;
            message: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    notifyPackageArrival(packageId: string, useSupabase: boolean, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            packageId: string;
            trackingNumber: string;
            emailResult: any;
            error?: undefined;
        } | {
            success: boolean;
            packageId: string;
            error: any;
            trackingNumber?: undefined;
            emailResult?: undefined;
        };
    }>;
    notifyBulkPackageArrival(data: {
        packageIds: string[];
    }, useSupabase: boolean, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            total: number;
            successful: number;
            failed: number;
            details: any[];
        };
    }>;
}
export {};
