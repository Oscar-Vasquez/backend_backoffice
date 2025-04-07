export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
  address?: string;
}

export interface Operator {
  operatorId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  photo: string;
  branchReference: string;
  branchName?: string;
  branchAddress?: string;
  branchProvince?: string;
  branchCity?: string;
  type_operator_id?: string;
  typeOperatorName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  hire_date?: Date | null;
  birth_date?: Date | null;
  emergency_contact?: EmergencyContact | null;
  skills?: string[];
  personal_id?: string | null;
  address?: string | null;
}

export interface CreateOperatorData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  branchReference: string;
  photo?: string;
  hire_date?: string;
  birth_date?: string;
  emergency_contact?: EmergencyContact;
  skills?: string[];
  personal_id?: string;
  address?: string;
}

export interface UpdateOperatorData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
  branchReference?: string;
  photo?: string;
  hire_date?: string;
  birth_date?: string;
  emergency_contact?: EmergencyContact;
  skills?: string[];
  personal_id?: string;
  address?: string;
} 