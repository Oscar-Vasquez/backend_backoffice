import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'workexpress_secret_key',
    });
  }

  async validate(payload: any) {
    try {
      const { sub: id } = payload;
      
      // Check if operator exists and is active
      const operator = await this.prisma.operators.findUnique({
        where: { 
          id,
          status: 'active'
        },
      });

      if (!operator) {
        throw new UnauthorizedException('Operador no encontrado o inactivo');
      }

      return {
        id: operator.id,
        email: operator.email,
        role: operator.role,
        branch_id: operator.branch_id,
        type_operator_id: operator.type_operator_id
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
} 