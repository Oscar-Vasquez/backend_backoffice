export declare enum ActivityType {
    LOGIN = "login",
    LOGOUT = "logout",
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view"
}
export declare enum ActivityStatus {
    COMPLETED = "completed",
    PENDING = "pending",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum ActivityAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view"
}
export declare class ActivityDetailsDto {
    trackingNumber?: string;
    location?: string;
    packageId?: string;
    invoiceId?: string;
    amount?: number;
    previousData?: any;
    newData?: any;
    entityId?: string;
    entityType?: string;
    reason?: string;
}
export declare class OperatorActivityDto {
    id: string;
    operatorId: string;
    type: ActivityType;
    action: ActivityAction;
    description: string;
    timestamp: Date;
    status: ActivityStatus;
    branchId?: string;
    details?: ActivityDetailsDto;
    ipAddress?: string;
    userAgent?: string;
}
