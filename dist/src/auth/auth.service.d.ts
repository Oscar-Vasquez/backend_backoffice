import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { OperatorsService } from '../operators/operators.service';
export declare class AuthService {
    private readonly jwtService;
    private readonly prisma;
    private readonly operatorsService;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService, operatorsService: OperatorsService);
    validateOperator(email: string, password: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.operator_role_enum;
        status: "active";
        branchId: string;
        branchName: string;
        type_operator_id: string;
        photo: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        operator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.operator_role_enum;
            branchName: string;
            branchReference: string;
            type_operator_id: string;
            photo: string;
        };
    }>;
}
