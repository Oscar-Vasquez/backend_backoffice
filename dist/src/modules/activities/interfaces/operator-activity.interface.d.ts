export declare enum ActivityAction {
    PACKAGE_CREATED = "PACKAGE_CREATED",
    PACKAGE_UPDATED = "PACKAGE_UPDATED",
    PACKAGE_DELETED = "PACKAGE_DELETED",
    PACKAGE_ASSIGNED = "PACKAGE_ASSIGNED",
    PACKAGE_USER_UPDATED = "PACKAGE_USER_UPDATED",
    PACKAGE_STATUS_UPDATED = "PACKAGE_STATUS_UPDATED",
    PACKAGE_INVOICED = "PACKAGE_INVOICED",
    INVOICE_CREATED = "INVOICE_CREATED",
    PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    USER_DELETED = "USER_DELETED",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT"
}
export declare enum ActivityStatus {
    COMPLETED = "completed",
    PENDING = "pending",
    FAILED = "failed"
}
export interface CreateActivityDto {
    operatorId: string;
    operatorName: string;
    action: ActivityAction;
    description: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    status: ActivityStatus;
    timestamp?: string;
}
export interface OperatorActivity extends CreateActivityDto {
    id?: string;
}
