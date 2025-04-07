export declare class ProductDto {
    productId: string;
    name: string;
    description: string;
    price: number;
    photo: string;
    sellerId: string;
    branchReference: string;
    status: string;
    createdTimestamp: Date;
    updatedTimestamp: Date;
}
export declare class BranchProductDto {
    productId: string;
    quantity: number;
    commissionPercentage: number;
    status: string;
}
