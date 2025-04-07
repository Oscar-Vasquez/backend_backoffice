import { VehicleDto } from './vehicle.dto';
import { BranchProductDto } from './product.dto';

export class BranchDto {
  branchId: string;
  address: string;
  province: string;
  vehicles: { [key: string]: VehicleDto };
  products: { [key: string]: BranchProductDto };
} 