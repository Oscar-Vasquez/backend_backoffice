import { Controller, Post, Get, Put, Body, Param, HttpException, HttpStatus, NotFoundException, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FirebaseUser, UpdateStatusResponse, CreateUserDto, SearchDto, TypeUser } from './types';
import * as admin from 'firebase-admin';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    console.log('🚀 UsersController inicializado');
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: FirebaseUser
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request: Invalid input data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<FirebaseUser> {
    try {
      console.log('📝 Creando nuevo usuario:', createUserDto);
      const newUser = await this.usersService.createUser(createUserDto);
      console.log('✅ Usuario creado exitosamente');
      return newUser;
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al crear usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all users',
    type: [FirebaseUser]
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Get('all')
  async getAllUsers() {
    try {
      console.log('📋 Obteniendo todos los usuarios con Prisma');
      const users = await this.usersService.getAllUsers();
      console.log(`✅ ${users.length} usuarios encontrados`);
      return users;
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      throw new HttpException(
        'Error al obtener usuarios',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Get user suggestions based on search criteria' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query term' })
  @ApiQuery({ name: 'firstName', required: false, description: 'Filter by first name' })
  @ApiQuery({ name: 'lastName', required: false, description: 'Filter by last name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user suggestions matching the criteria',
    type: [FirebaseUser]
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request: Invalid or missing search term' 
  })
  @Get('suggestions')
  async getSuggestions(
    @Query('q') query?: string,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('limit') limit?: number
  ) {
    // Si tenemos firstName y lastName, usar búsqueda compuesta
    if (firstName && lastName) {
      console.log(`🔍 Búsqueda por nombre y apellido separados: ${firstName} ${lastName}`);
      return this.usersService.searchByNameAndLastName(firstName, lastName, limit);
    }
    
    // Si no hay query, devolver error
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Se requiere un término de búsqueda de al menos 2 caracteres');
    }
    
    console.log(`🔍 Búsqueda de sugerencias: ${query}`);
    return this.usersService.searchSuggestions(query, limit);
  }

  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query term' })
  @ApiQuery({ name: 'exact', required: false, description: 'Whether to perform exact match search', type: 'boolean' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns users matching the search criteria',
    type: [FirebaseUser]
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request: Invalid or missing search term' 
  })
  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('exact') exact?: string,
    @Query('limit') limit?: number
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Se requiere un término de búsqueda de al menos 2 caracteres');
    }
    
    const isExactSearch = exact === 'true';
    console.log(`🔍 Búsqueda ${isExactSearch ? 'exacta' : 'parcial'} de usuarios: ${query}`);
    
    if (isExactSearch) {
      return this.usersService.searchExactMatch(query, limit);
    }
    
    return this.usersService.searchUser(query);
  }

  @ApiOperation({ summary: 'Get all user types' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all user types',
    type: [TypeUser]
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Get('types')
  async getTypeUsers() {
    try {
      console.log('📋 Obteniendo tipos de usuario');
      const types = await this.usersService.getTypeUsers();
      console.log(`✅ ${types.length} tipos encontrados`);
      return types;
    } catch (error) {
      console.error('❌ Error al obtener tipos de usuario:', error);
      throw new HttpException(
        'Error al obtener tipos de usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user details',
    type: FirebaseUser
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request: Invalid or missing user ID' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Get(':id')
  async getUserDetails(@Param('id') userId: string): Promise<FirebaseUser> {
    try {
      if (!userId?.trim()) {
        throw new HttpException({
          message: '¡Ups! Falta el ID del usuario 🤔',
          details: 'Necesitamos saber qué usuario quieres consultar'
        }, HttpStatus.BAD_REQUEST);
      }

      console.log('==================================');
      console.log('🔍 Obteniendo detalles del usuario:', userId);
      
      const result = await this.usersService.getUserDetails(userId);
      
      if (!result) {
        throw new HttpException({
          message: '¡Vaya! No encontramos a este usuario 🔍',
          details: 'Parece que el usuario que buscas no existe en el sistema'
        }, HttpStatus.NOT_FOUND);
      }
      
      console.log('✅ Detalles obtenidos:', result);
      return {
        ...result,
        displayMessage: `¡Listo! Aquí está la información de ${result.firstName} 📋`
      };
    } catch (error) {
      console.error('❌ Error al obtener detalles:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException({
        message: '¡Ups! No pudimos obtener la información 😅',
        details: 'Inténtalo de nuevo en un momento, estamos en ello'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({ 
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
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status updated successfully',
    type: UpdateStatusResponse
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request: Invalid user ID or status' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Put(':id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') newStatus: string
  ): Promise<UpdateStatusResponse> {
    return this.usersService.updateUserStatus(userId, newStatus);
  }

  @ApiOperation({ summary: 'Send credentials to a user' })
  @ApiBody({
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
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Credentials sent successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  @Post('send-credentials')
  async sendCredentials(@Body() credentials: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
  }) {
    try {
      console.log('📧 Iniciando envío de credenciales para:', credentials.email);
      
      // Generar enlace de verificación con URL personalizada
      console.log('🔑 Generando enlace de verificación...');
      
      // Primero, asegurarnos de que el usuario existe
      const userRecord = await admin.auth().getUserByEmail(credentials.email);
      
      if (!userRecord) {
        throw new HttpException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND
        );
      }

      // Generar el enlace de verificación
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/verify-email`,
        handleCodeInApp: true,
        dynamicLinkDomain: undefined
      };

      console.log('📝 Configuración de verificación:', actionCodeSettings);
      
      const verificationLink = await admin.auth().generateEmailVerificationLink(
        credentials.email.toLowerCase(),
        actionCodeSettings
      );

      // Extraer el código oob del enlace original
      const oobCode = verificationLink.match(/oobCode=([^&]+)/)?.[1];
      
      // Crear un nuevo enlace que apunte a localhost
      const localVerificationLink = `${process.env.FRONTEND_URL}/verify-email?mode=verifyEmail&oobCode=${oobCode}`;

      console.log('🔗 Enlace de verificación generado:', localVerificationLink);
      console.log('📧 Preparando envío de correo...');

      // Enviar correo con credenciales y enlace de verificación
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
    } catch (error) {
      console.error('❌ Error al enviar credenciales:', error);
      console.error('Stack trace:', error.stack);
      
      let errorMessage = 'Error al enviar las credenciales por correo';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'El usuario no existe en Firebase Auth';
        statusCode = HttpStatus.NOT_FOUND;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido';
        statusCode = HttpStatus.BAD_REQUEST;
      }

      throw new HttpException({
        success: false,
        message: errorMessage,
        error: error.message,
        code: error.code
      }, statusCode);
    }
  }

  @Post('assign-to-package')
  async assignClientToPackage(
    @Body() data: { packageId: string; userId: string }
  ) {
    try {
      console.log('🔄 Solicitud de asignación de cliente a paquete:', data);
      
      if (!data.packageId || !data.userId) {
        throw new HttpException(
          'Se requieren los IDs del paquete y del usuario',
          HttpStatus.BAD_REQUEST
        );
      }
      
      const result = await this.usersService.assignClientToPackage(
        data.packageId, 
        data.userId
      );
      
      console.log('✅ Cliente asignado exitosamente al paquete');
      return result;
    } catch (error) {
      console.error('❌ Error al asignar cliente a paquete:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          message: 'Error al asignar cliente al paquete',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint para verificar directamente en la base de datos el valor de shipping_insurance
  @Get('db-check/:userId/shipping-insurance')
  async checkShippingInsurance(@Param('userId') userId: string) {
    try {
      // Consultar directamente a la base de datos a través del servicio
      const userWithInsurance = await this.usersService.getShippingInsurance(userId);
      
      // Devolver el valor de shipping_insurance
      return userWithInsurance;
    } catch (error) {
      console.error('Error al consultar shipping_insurance:', error);
      throw new HttpException(
        'Error al consultar el valor de shipping_insurance',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 