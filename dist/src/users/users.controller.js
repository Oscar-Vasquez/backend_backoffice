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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const types_1 = require("./types");
const admin = require("firebase-admin");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
        console.log('🚀 UsersController inicializado');
    }
    async createUser(createUserDto) {
        try {
            console.log('📝 Creando nuevo usuario:', createUserDto);
            const newUser = await this.usersService.createUser(createUserDto);
            console.log('✅ Usuario creado exitosamente');
            return newUser;
        }
        catch (error) {
            console.error('❌ Error al crear usuario:', error);
            throw new common_1.HttpException(error instanceof Error ? error.message : 'Error al crear usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllUsers() {
        try {
            console.log('📋 Obteniendo todos los usuarios con Prisma');
            const users = await this.usersService.getAllUsers();
            console.log(`✅ ${users.length} usuarios encontrados`);
            return users;
        }
        catch (error) {
            console.error('❌ Error al obtener usuarios:', error);
            throw new common_1.HttpException('Error al obtener usuarios', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSuggestions(query, firstName, lastName, limit) {
        if (firstName && lastName) {
            console.log(`🔍 Búsqueda por nombre y apellido separados: ${firstName} ${lastName}`);
            return this.usersService.searchByNameAndLastName(firstName, lastName, limit);
        }
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('Se requiere un término de búsqueda de al menos 2 caracteres');
        }
        console.log(`🔍 Búsqueda de sugerencias: ${query}`);
        return this.usersService.searchSuggestions(query, limit);
    }
    async searchUsers(query, exact, limit) {
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('Se requiere un término de búsqueda de al menos 2 caracteres');
        }
        const isExactSearch = exact === 'true';
        console.log(`🔍 Búsqueda ${isExactSearch ? 'exacta' : 'parcial'} de usuarios: ${query}`);
        if (isExactSearch) {
            return this.usersService.searchExactMatch(query, limit);
        }
        return this.usersService.searchUser(query);
    }
    async getTypeUsers() {
        try {
            console.log('📋 Obteniendo tipos de usuario');
            const types = await this.usersService.getTypeUsers();
            console.log(`✅ ${types.length} tipos encontrados`);
            return types;
        }
        catch (error) {
            console.error('❌ Error al obtener tipos de usuario:', error);
            throw new common_1.HttpException('Error al obtener tipos de usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserDetails(userId) {
        try {
            if (!userId?.trim()) {
                throw new common_1.HttpException({
                    message: '¡Ups! Falta el ID del usuario 🤔',
                    details: 'Necesitamos saber qué usuario quieres consultar'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            console.log('==================================');
            console.log('🔍 Obteniendo detalles del usuario:', userId);
            const result = await this.usersService.getUserDetails(userId);
            if (!result) {
                throw new common_1.HttpException({
                    message: '¡Vaya! No encontramos a este usuario 🔍',
                    details: 'Parece que el usuario que buscas no existe en el sistema'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            console.log('✅ Detalles obtenidos:', result);
            return {
                ...result,
                displayMessage: `¡Listo! Aquí está la información de ${result.firstName} 📋`
            };
        }
        catch (error) {
            console.error('❌ Error al obtener detalles:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: '¡Ups! No pudimos obtener la información 😅',
                details: 'Inténtalo de nuevo en un momento, estamos en ello'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUserStatus(userId, newStatus) {
        return this.usersService.updateUserStatus(userId, newStatus);
    }
    async sendCredentials(credentials) {
        try {
            console.log('📧 Iniciando envío de credenciales para:', credentials.email);
            console.log('🔑 Generando enlace de verificación...');
            const userRecord = await admin.auth().getUserByEmail(credentials.email);
            if (!userRecord) {
                throw new common_1.HttpException('Usuario no encontrado', common_1.HttpStatus.NOT_FOUND);
            }
            const actionCodeSettings = {
                url: `${process.env.FRONTEND_URL}/verify-email`,
                handleCodeInApp: true,
                dynamicLinkDomain: undefined
            };
            console.log('📝 Configuración de verificación:', actionCodeSettings);
            const verificationLink = await admin.auth().generateEmailVerificationLink(credentials.email.toLowerCase(), actionCodeSettings);
            const oobCode = verificationLink.match(/oobCode=([^&]+)/)?.[1];
            const localVerificationLink = `${process.env.FRONTEND_URL}/verify-email?mode=verifyEmail&oobCode=${oobCode}`;
            console.log('🔗 Enlace de verificación generado:', localVerificationLink);
            console.log('📧 Preparando envío de correo...');
            await this.usersService.sendCredentialsByEmail({
                ...credentials,
                verificationLink: localVerificationLink
            });
            console.log('✅ Credenciales enviadas exitosamente');
            return {
                success: true,
                message: 'Credenciales enviadas con éxito',
                details: {
                    email: credentials.email,
                    firstName: credentials.firstName,
                    verificationLinkGenerated: true
                }
            };
        }
        catch (error) {
            console.error('❌ Error al enviar credenciales:', error);
            console.error('Stack trace:', error.stack);
            let errorMessage = 'Error al enviar las credenciales por correo';
            let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'El usuario no existe en Firebase Auth';
                statusCode = common_1.HttpStatus.NOT_FOUND;
            }
            else if (error.code === 'auth/invalid-email') {
                errorMessage = 'El correo electrónico no es válido';
                statusCode = common_1.HttpStatus.BAD_REQUEST;
            }
            throw new common_1.HttpException({
                success: false,
                message: errorMessage,
                error: error.message,
                code: error.code
            }, statusCode);
        }
    }
    async assignClientToPackage(data) {
        try {
            console.log('🔄 Solicitud de asignación de cliente a paquete:', data);
            if (!data.packageId || !data.userId) {
                throw new common_1.HttpException('Se requieren los IDs del paquete y del usuario', common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.usersService.assignClientToPackage(data.packageId, data.userId);
            console.log('✅ Cliente asignado exitosamente al paquete');
            return result;
        }
        catch (error) {
            console.error('❌ Error al asignar cliente a paquete:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                message: 'Error al asignar cliente al paquete',
                details: error instanceof Error ? error.message : 'Error desconocido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkShippingInsurance(userId) {
        try {
            const userWithInsurance = await this.usersService.getShippingInsurance(userId);
            return userWithInsurance;
        }
        catch (error) {
            console.error('Error al consultar shipping_insurance:', error);
            throw new common_1.HttpException('Error al consultar el valor de shipping_insurance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    (0, swagger_1.ApiBody)({ type: types_1.CreateUserDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User created successfully',
        type: types_1.FirebaseUser
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request: Invalid input data'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns all users',
        type: [types_1.FirebaseUser]
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user suggestions based on search criteria' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search query term' }),
    (0, swagger_1.ApiQuery)({ name: 'firstName', required: false, description: 'Filter by first name' }),
    (0, swagger_1.ApiQuery)({ name: 'lastName', required: false, description: 'Filter by last name' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Maximum number of results', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns user suggestions matching the criteria',
        type: [types_1.FirebaseUser]
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request: Invalid or missing search term'
    }),
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('firstName')),
    __param(2, (0, common_1.Query)('lastName')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSuggestions", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Search users' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query term' }),
    (0, swagger_1.ApiQuery)({ name: 'exact', required: false, description: 'Whether to perform exact match search', type: 'boolean' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Maximum number of results', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns users matching the search criteria',
        type: [types_1.FirebaseUser]
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request: Invalid or missing search term'
    }),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('exact')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all user types' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns all user types',
        type: [types_1.TypeUser]
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Get)('types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getTypeUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID', type: 'string' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns user details',
        type: types_1.FirebaseUser
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request: Invalid or missing user ID'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserDetails", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update user status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID', type: 'string' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'New status value',
                    example: 'active'
                },
            },
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Status updated successfully',
        type: types_1.UpdateStatusResponse
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request: Invalid user ID or status'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Send credentials to a user' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password', 'firstName', 'lastName'],
            properties: {
                email: {
                    type: 'string',
                    example: 'user@example.com',
                    description: 'User email'
                },
                password: {
                    type: 'string',
                    example: 'Password123',
                    description: 'User password'
                },
                firstName: {
                    type: 'string',
                    example: 'John',
                    description: 'User first name'
                },
                lastName: {
                    type: 'string',
                    example: 'Doe',
                    description: 'User last name'
                },
            },
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credentials sent successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    (0, common_1.Post)('send-credentials'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendCredentials", null);
__decorate([
    (0, common_1.Post)('assign-to-package'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "assignClientToPackage", null);
__decorate([
    (0, common_1.Get)('db-check/:userId/shipping-insurance'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkShippingInsurance", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map