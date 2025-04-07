import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { OperatorsService } from '../operators/operators.service';
import { ActivityType, ActivityStatus, ActivityAction } from '../operators/dto/operator-activity.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly operatorsService: OperatorsService
  ) {}

  async validateOperator(email: string, password: string) {
    try {
      this.logger.log(`🔍 Validating operator with email: ${email}`);
      
      // Find operator by email
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
        throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, operator.password);
      if (!isPasswordValid) {
        this.logger.warn(`❌ Invalid password for email: ${email}`);
        throw new UnauthorizedException('Credenciales inválidas');
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
    } catch (error) {
      this.logger.error(`❌ Error validating operator: ${error.message}`, error.stack);
      throw new UnauthorizedException('Error al validar credenciales');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`🔐 Login attempt for email: ${loginDto.email}`);
      
      const operator = await this.validateOperator(loginDto.email, loginDto.password);
      
      const payload = { 
        sub: operator.id,
        email: operator.email,
        role: operator.role
      };

      // Update last login timestamp
      await this.prisma.operators.update({
        where: { id: operator.id },
        data: { last_login_at: new Date() }
      });

      // Log login activity
      try {
        await this.operatorsService.logActivity(
          operator.id,
          ActivityType.LOGIN,
          ActivityAction.VIEW,
          `Inicio de sesión exitoso`,
          { ip: 'unknown' },
          ActivityStatus.COMPLETED
        );
      } catch (activityError) {
        this.logger.error(`Error logging login activity: ${activityError.message}`);
        // Don't fail the login if activity logging fails
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
    } catch (error) {
      this.logger.error(`❌ Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
