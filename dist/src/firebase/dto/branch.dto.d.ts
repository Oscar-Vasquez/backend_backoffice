import { VehicleDto } from './vehicle.dto';
import { BranchProductDto } from './product.dto';
export declare class BranchDto {
    branchId: string;
    address: string;
    province: string;
    vehicles: {
        [key: string]: VehicleDto;
    };
    products: {
        [key: string]: BranchProductDto;
    };
}
