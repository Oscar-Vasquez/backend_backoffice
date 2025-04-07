export declare class ShippingStageDto {
    stage: string;
    status: string;
    updatedTimestamp: Date;
    location: string;
    photo: string;
}
export declare class PackageDto {
    packageId: string;
    weight: number;
    width: number;
    length: number;
    height: number;
    trackingNumber: string;
    packageStatus: string;
    volumetricWeight: number;
    shippingStages: ShippingStageDto[];
}
