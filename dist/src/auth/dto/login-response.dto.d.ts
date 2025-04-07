declare class OperatorDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    branchName: string;
    branchReference: string;
    type_operator_id: string | null;
    photo: string | null;
}
export declare class LoginResponseDto {
    access_token: string;
    operator: OperatorDto;
}
export {};
