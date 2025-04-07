import { operator_role_enum, operator_status_enum } from '@prisma/client';
declare class EmergencyContactDto {
    name: string;
    phone: string;
    relationship?: string;
    address?: string;
}
export declare class CreateOperatorDto {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password: string;
    photo?: string;
    role?: operator_role_enum;
    status?: operator_status_enum;
    branch_id: string;
    type_operator_id: string;
    hire_date?: string;
    birth_date?: string;
    emergency_contact?: EmergencyContactDto;
    skills?: string[];
    personal_id?: string;
    address?: string;
}
export {};
