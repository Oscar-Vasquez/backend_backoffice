import { BranchDto } from '../../firebase/dto/branch.dto';

export interface Plan {
  id?: string;
  planId: string;
  planName: string;
  description: string;
  price: number;
  branchReference: string;
  branch?: BranchDto;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// También podemos definir el tipo para la respuesta de Firebase
export interface PlanDocument extends Omit<Plan, 'createdAt' | 'updatedAt' | 'branch'> {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
} 