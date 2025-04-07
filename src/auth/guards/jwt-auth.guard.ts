import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.debug('🔒 Verificando token JWT...');
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`📝 Headers: ${JSON.stringify(request.headers)}`);
    
    // Intentar extraer el token de las cookies si está presente
    try {
      if (!request.headers.authorization && request.headers.cookie) {
        const cookies = request.headers.cookie;
        const tokenFromCookie = cookies?.split(';')
          .find(c => c.trim().startsWith('workexpress_token='))
          ?.split('=')[1];
        
        if (tokenFromCookie) {
          request.headers.authorization = `Bearer ${tokenFromCookie}`;
          this.logger.debug('🔑 Token extraído de cookie y agregado a headers.authorization');
        }
      }
    } catch (error) {
      this.logger.error('❌ Error al procesar cookies:', error);
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    this.logger.debug(`🔑 Resultado de autenticación: ${JSON.stringify({ 
      error: err?.message || err, 
      user: user ? { id: user.id, email: user.email, role: user.role } : null, 
      info: info?.message || info 
    })}`);
    
    if (err) {
      this.logger.error('❌ Error de autenticación:', err);
      throw err;
    }
    
    if (!user) {
      this.logger.warn('⚠️ Usuario no autorizado:', { info });
      
      // En lugar de lanzar una excepción que interrumpe el flujo,
      // permitimos que continúe y las rutas individuales manejarán 
      // la ausencia de usuario si es necesario
      return null;
    }
    
    return user;
  }
} 