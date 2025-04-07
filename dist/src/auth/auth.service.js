"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const operators_service_1 = require("../operators/operators.service");
const operator_activity_dto_1 = require("../operators/dto/operator-activity.dto");
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, prisma, operatorsService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.operatorsService = operatorsService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateOperator(email, password) {
        try {
            this.logger.log(`🔍 Validating operator with email: ${email}`);
            const operator = await this.prisma.operators.findUnique({
                where: {
                    email,
                },
                include: {
                    branches: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            if (!operator || operator.status !== 'active') {
                this.logger.warn(`❌ Invalid credentials or inactive account for email: ${email}`);
                throw new common_1.UnauthorizedException('Credenciales inválidas o cuenta inactiva');
            }
            const isPasswordValid = await bcrypt.compare(password, operator.password);
            if (!isPasswordValid) {
                this.logger.warn(`❌ Invalid password for email: ${email}`);
                throw new common_1.UnauthorizedException('Credenciales inválidas');
            }
            this.logger.log(`✅ Operator validated successfully: ${operator.id}`);
            return {
                id: operator.id,
                email: operator.email,
                firstName: operator.first_name,
                lastName: operator.last_name,
                role: operator.role,
                status: operator.status,
                branchId: operator.branch_id,
                branchName: operator.branches?.name || null,
                type_operator_id: operator.type_operator_id,
                photo: operator.photo
            };
        }
        catch (error) {
            this.logger.error(`❌ Error validating operator: ${error.message}`, error.stack);
            throw new common_1.UnauthorizedException('Error al validar credenciales');
        }
    }
    async login(loginDto) {
        try {
            this.logger.log(`🔐 Login attempt for email: ${loginDto.email}`);
            const operator = await this.validateOperator(loginDto.email, loginDto.password);
            const payload = {
                sub: operator.id,
                email: operator.email,
                role: operator.role
            };
            await this.prisma.operators.update({
                where: { id: operator.id },
                data: { last_login_at: new Date() }
            });
            try {
                await this.operatorsService.logActivity(operator.id, operator_activity_dto_1.ActivityType.LOGIN, operator_activity_dto_1.ActivityAction.VIEW, `Inicio de sesión exitoso`, { ip: 'unknown' }, operator_activity_dto_1.ActivityStatus.COMPLETED);
            }
            catch (activityError) {
                this.logger.error(`Error logging login activity: ${activityError.message}`);
            }
            this.logger.log(`✅ Login successful for operator: ${operator.id}`);
            return {
                access_token: this.jwtService.sign(payload),
                operator: {
                    id: operator.id,
                    email: operator.email,
                    firstName: operator.firstName,
                    lastName: operator.lastName,
                    role: operator.role,
                    branchName: operator.branchName || '',
                    branchReference: operator.branchId || '',
                    type_operator_id: operator.type_operator_id || null,
                    photo: operator.photo || null
                }
            };
        }
        catch (error) {
            this.logger.error(`❌ Login failed: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        operators_service_1.OperatorsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map