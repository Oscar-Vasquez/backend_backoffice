declare enum PackageStatus {
    PENDING = "pending",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    RETURNED = "returned",
    LOST = "lost",
    CANCELED = "canceled"
}
export declare class UpdateStatusDto {
    status: PackageStatus;
}
export {};
