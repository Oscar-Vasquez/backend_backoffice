"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(JwtAuthGuard_1.name);
    }
    canActivate(context) {
        this.logger.debug('🔒 Verificando token JWT...');
        const request = context.switchToHttp().getRequest();
        this.logger.debug(`📝 Headers: ${JSON.stringify(request.headers)}`);
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
        }
        catch (error) {
            this.logger.error('❌ Error al procesar cookies:', error);
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
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
            return null;
        }
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map