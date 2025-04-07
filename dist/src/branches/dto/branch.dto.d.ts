export declare class ProductDto {
    id: string;
    name: string;
    description: string;
}
export declare class CreateBranchDto {
    name: string;
    address?: string;
    province?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    prefix?: string;
    company_id?: string;
    manager_name?: string;
    opening_hours?: string;
    timezone?: string;
    vehicles?: any;
    products?: any;
}
export declare class UpdateBranchDto {
    name?: string;
    address?: string;
    province?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    prefix?: string;
    company_id?: string;
    manager_name?: string;
    opening_hours?: string;
    timezone?: string;
    vehicles?: any;
    products?: any;
}
