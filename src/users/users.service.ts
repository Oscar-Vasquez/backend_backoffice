import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseUser, UpdateStatusResponse, CreateUserDto } from './types';
import { WalletsService } from '../wallets/wallets.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly API_URL: string;
  private readonly db: admin.firestore.Firestore;

  constructor(
    private readonly configService: ConfigService,
    private readonly walletsService: WalletsService,
    private readonly prisma: PrismaService
  ) {
    console.log('🚀 UsersService inicializado');
    this.API_URL = this.configService.get<string>('API_URL');
    this.db = admin.firestore();
  }

  private mapUserData(
    doc: admin.firestore.DocumentSnapshot,
    details: {
      branchDetails?: any;
      planDetails?: any;
      walletName?: string;
    }
  ): FirebaseUser {
    const data = doc.data();
    if (!data) {
      throw new Error(`No se encontraron datos para el usuario ${doc.id}`);
    }

    console.log(`🔄 Mapeando datos del usuario ${doc.id}:`, {
      email: data.email,
      branchDetails: details.branchDetails,
      planDetails: details.planDetails
    });

    // Procesar accountStatus
    let finalAccountStatus = true; // Por defecto activo
    if (typeof data.accountStatus === 'boolean') {
      finalAccountStatus = data.accountStatus;
    } else if (typeof data.accountStatus === 'string') {
      finalAccountStatus = ['true', '1', 'active', 'activo'].includes(data.accountStatus.toLowerCase());
    } else if (typeof data.accountStatus === 'number') {
      finalAccountStatus = data.accountStatus === 1;
    }

    // Procesar referencias
    const processReference = (ref: any): { path: string; id: string } => {
      if (!ref) return { path: '', id: '' };
      if (typeof ref === 'string') return { path: ref, id: ref.split('/').pop() || '' };
      return { 
        path: ref.path || '', 
        id: ref.id || ref.path?.split('/').pop() || '' 
      };
    };

    // Convertir timestamps a ISO strings
    const toISOString = (timestamp: any) => {
      if (!timestamp) return '';
      if (timestamp instanceof Date) return timestamp.toISOString();
      if (typeof timestamp === 'string') return timestamp;
      if (timestamp.toDate) return timestamp.toDate().toISOString();
      return '';
    };

    // Procesar detalles de sucursal y plan
    const branchName = details.branchDetails?.name || 'Sucursal sin nombre';
    const planName = details.planDetails?.planName || details.planDetails?.name || 'Plan sin nombre';
    
    // Mejorar la extracción del precio del plan buscando en múltiples campos posibles
    let planPrice = 0;
    if (details.planDetails) {
      // Buscar el precio en diferentes campos posibles del plan
      planPrice = parseFloat(String(
        details.planDetails.price || 
        details.planDetails.rate || 
        details.planDetails.planRate || 
        0
      ));
    }
    
    // Si el usuario tiene data.planRate definido directamente, usar ese valor
    if (data.planRate && Number(data.planRate) > 0) {
      planPrice = Number(data.planRate);
    }
    
    const planDescription = details.planDetails?.description || '';

    console.log('📝 Detalles procesados:', {
      branchName,
      planName,
      planPrice,
      planDescription,
      dataHasPlanRate: !!data.planRate,
      dataPlanRateValue: data.planRate,
      rawPlanDetails: details.planDetails
    });

    const mappedUser: FirebaseUser = {
      userId: doc.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      isVerified: data.isVerified || false,
      isEmailVerified: data.isEmailVerified || false,
      accountStatus: finalAccountStatus,
      birthDate: toISOString(data.birthDate),
      photo: data.photoUrl || '',
      branchReference: processReference(data.branchReference),
      branchName: branchName,
      branchAddress: details.branchDetails?.address || '',
      branchLocation: details.branchDetails?.location || '',
      subscriptionPlan: processReference(data.subscriptionPlan),
      typeUserReference: processReference(data.typeUserReference),
      planRate: planPrice,
      price: planPrice,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
      lastLoginAt: toISOString(data.lastLoginAt),
      walletReference: processReference(data.walletReference),
      walletName: details.walletName || '',
      assignedLocker: data.assignedLocker || '',
      displayMessage: data.displayMessage || '',
      subscriptionDetails: {
        planName: planName,
        description: planDescription,
        price: planPrice.toString()
      },
      branchDetails: {
        name: branchName,
        province: details.branchDetails?.province || '',
        address: details.branchDetails?.address || ''
      }
    };

    console.log(`✅ Usuario ${doc.id} mapeado con éxito:`, {
      email: mappedUser.email,
      branchName: mappedUser.branchName,
      planName: mappedUser.subscriptionDetails?.planName,
      planPrice: mappedUser.subscriptionDetails?.price
    });

    return mappedUser;
  }

  /**
   * Mapea un usuario de Prisma a un formato compatible con Firebase
   * @param user - Datos del usuario de Prisma
   * @param branch - Datos de la sucursal (opcional)
   * @param plan - Datos del plan (opcional)
   * @param walletName - Nombre de la billetera (opcional)
   * @returns Datos del usuario en formato compatible con Firebase
   */
  private mapPrismaUserToFirebaseUser(
    user: any,
    branch?: any,
    plan?: any,
    walletName?: string
  ): any {
    console.log('🔄 Mapeando usuario de Prisma a formato Firebase:', {
      userId: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      planId: plan?.id,
      planName: plan?.name,
      shipping_insurance: plan?.shipping_insurance
    });
    
    return {
      uid: user.id,
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone,
      phone: user.phone,
      photoURL: user.photo_url,
      photo: user.photo_url,
      isAdmin: user.is_admin,
      createdAt: user.created_at?.toISOString(),
      lastLogin: user.last_login?.toISOString(),
      emailVerified: user.email_verified,
      disabled: user.disabled || false,
      displayMessage: user.display_message,
      address: user.address,
      status: user.account_status,
      verification: user.verification,
      shipping_insurance: plan?.shipping_insurance || false,
      // Información de planes
      planId: plan?.id,
      planName: plan?.name,
      planDescription: plan?.description,
      planRate: plan?.rate,
      planFrequency: plan?.frequency,
      planStatus: plan?.status,
      // Información de sucursal
      branchId: branch?.id,
      branchName: branch?.name,
      branchAddress: branch?.address,
      branchZipcode: branch?.zipcode,
      // Información adicional
      walletName: walletName,
      // Objetos anidados
      subscriptionPlan: plan,
      branch: branch
    };
  }

  async getAllUsers(): Promise<FirebaseUser[]> {
    try {
      console.log('📊 Obteniendo todos los usuarios con Prisma');
      
      // Use Prisma to fetch all users with their related data
      const users = await this.prisma.users.findMany({
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        }
      });
      
      console.log(`✅ ${users.length} usuarios encontrados con Prisma`);
      
      // Map the Prisma users to the FirebaseUser format
      return users.map(user => this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined // Default wallet name
      ));
    } catch (error) {
      console.error('❌ Error al obtener usuarios con Prisma:', error);
      throw new HttpException(
        'Error al obtener usuarios con Prisma',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchSuggestions(query: string, limit: number = 10) {
    try {
      console.log('🔍 Buscando sugerencias con Prisma:', query);
      
      const normalizedQuery = query.toLowerCase().trim();
      
      // Use Prisma to search users
      const users = await this.prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: normalizedQuery, mode: 'insensitive' } },
            { first_name: { contains: normalizedQuery, mode: 'insensitive' } },
            { last_name: { contains: normalizedQuery, mode: 'insensitive' } },
            { phone: { contains: normalizedQuery } }
          ]
        },
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        },
        take: limit // Limit results
      });
      
      console.log(`✅ ${users.length} sugerencias encontradas con Prisma`);
      
      // Map the Prisma users to the FirebaseUser format
      return users.map(user => this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined
      ));
    } catch (error) {
      console.error('❌ Error al buscar sugerencias con Prisma:', error);
      throw new HttpException(
        'Error al buscar sugerencias',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchExactMatch(query: string, limit: number = 10) {
    try {
      console.log('🔍 Buscando coincidencia exacta:', query);
      
      const normalizedQuery = query.toLowerCase().trim();
      const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
      
      if (searchTerms.length < 2) {
        // Si solo hay un término, usamos la búsqueda regular
        return this.searchSuggestions(query, limit);
      }
      
      // Para búsquedas de nombre completo (nombre + apellido)
      const users = await this.prisma.users.findMany({
        where: {
          AND: [
            // El primer término debe estar en el nombre
            { 
              OR: [
                { first_name: { contains: searchTerms[0], mode: 'insensitive' } },
                { last_name: { contains: searchTerms[0], mode: 'insensitive' } }
              ] 
            },
            // El resto de términos deben estar en el apellido o en el nombre
            {
              OR: [
                { first_name: { contains: searchTerms.slice(1).join(' '), mode: 'insensitive' } },
                { last_name: { contains: searchTerms.slice(1).join(' '), mode: 'insensitive' } }
              ]
            }
          ]
        },
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        },
        take: limit
      });
      
      console.log(`✅ ${users.length} coincidencias exactas encontradas con Prisma`);
      
      if (users.length === 0) {
        console.log('ℹ️ No se encontraron coincidencias exactas');
      }
      
      // Map the Prisma users to the FirebaseUser format
      return users.map(user => this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined
      ));
    } catch (error) {
      console.error('❌ Error al buscar coincidencia exacta:', error);
      throw new HttpException(
        'Error al buscar coincidencia exacta',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchByNameAndLastName(firstName: string, lastName: string, limit: number = 10) {
    try {
      console.log(`🔍 Buscando por nombre "${firstName}" y apellido "${lastName}"`);
      
      const normalizedFirstName = firstName.toLowerCase().trim();
      const normalizedLastName = lastName.toLowerCase().trim();
      
      const users = await this.prisma.users.findMany({
        where: {
          AND: [
            { first_name: { contains: normalizedFirstName, mode: 'insensitive' } },
            { last_name: { contains: normalizedLastName, mode: 'insensitive' } }
          ]
        },
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        },
        take: limit
      });
      
      console.log(`✅ ${users.length} usuarios encontrados con nombre "${firstName}" y apellido "${lastName}"`);
      
      // Map the Prisma users to the FirebaseUser format
      return users.map(user => this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined
      ));
    } catch (error) {
      console.error('❌ Error al buscar por nombre y apellido:', error);
      throw new HttpException(
        'Error al buscar por nombre y apellido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchUser(query: string): Promise<FirebaseUser | null> {
    try {
      console.log('🔍 Iniciando búsqueda con Prisma:', query);
      
      if (!query?.trim()) {
        console.log('⚠️ Query vacío, retornando null');
        return null;
      }

      const normalizedQuery = query.toLowerCase().trim();
      console.log('🔍 Query normalizado:', normalizedQuery);

      // Search for a user by email, name or phone
      const user = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: { contains: normalizedQuery, mode: 'insensitive' } },
            { first_name: { contains: normalizedQuery, mode: 'insensitive' } },
            { last_name: { contains: normalizedQuery, mode: 'insensitive' } },
            { phone: { contains: normalizedQuery } }
          ]
        },
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        }
      });
      
      if (!user) {
      console.log('ℹ️ No se encontraron usuarios que coincidan con:', normalizedQuery);
      return null;
      }

      console.log('✅ Usuario encontrado:', user.id);
      
      // Map user to FirebaseUser format
      return this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined
      );
        } catch (error) {
      console.error('❌ Error en searchUser con Prisma:', error);
      throw new HttpException(
        'Error al buscar usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserDetails(userId: string): Promise<FirebaseUser | null> {
    try {
      console.log('🔍 Obteniendo detalles del usuario con Prisma:', userId);
      
      // Use Prisma to fetch the user with all related data
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        include: {
          branches: true,
          plans: true,
          type_users: true,
          wallets: true
        }
      });
      
      if (!user) {
        console.log(`⚠️ Usuario no encontrado con ID: ${userId}`);
        return null;
      }
      
      console.log(`✅ Usuario encontrado en Prisma: ${user.id}`);
      
      // Map Prisma user to FirebaseUser format
      return this.mapPrismaUserToFirebaseUser(
        user,
        user.branches,
        user.plans,
        user.wallets?.length > 0 ? 'Mi Billetera' : undefined
      );
    } catch (error) {
      console.error('❌ Error al obtener detalles del usuario con Prisma:', error);
      throw new HttpException(
        'Error al obtener detalles del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateUserStatus(userId: string, status: string): Promise<UpdateStatusResponse> {
    try {
      console.log('🔄 Actualizando estado del usuario:', { userId, status });

      // Validar que el usuario existe
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpException(
          `Usuario con ID ${userId} no encontrado`,
          HttpStatus.NOT_FOUND
        );
      }

      const previousStatus = typeof userDoc.data().accountStatus === 'boolean' 
        ? userDoc.data().accountStatus 
        : userDoc.data().accountStatus === 'active';

      // Convertir el string a booleano para almacenamiento
      const newStatus = status === 'active';

      // Actualizar el estado
      await this.db.collection('users').doc(userId).update({
        accountStatus: newStatus,
        status: status, // Mantener también el campo status como string para compatibilidad
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Estado actualizado correctamente');

      return {
        success: true,
        message: `Estado del usuario actualizado a: ${status}`,
        details: {
          userId,
          previousStatus,
          newStatus: newStatus,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error en updateUserStatus:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al actualizar el estado del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getBranchName(branchPath: string | null | undefined): Promise<string | null> {
    try {
        if (!branchPath || typeof branchPath !== 'string') {
            console.log('⚠️ Referencia de sucursal no válida:', branchPath);
            return null;
        }

        // Usar la última parte de la ruta como ID
        const branchId = branchPath.split('/').pop();
        if (!branchId) {
            console.log('⚠️ No se pudo extraer el ID de la sucursal de:', branchPath);
            return null;
        }

        const branchDoc = await this.db.collection('branches').doc(branchId).get();
        return branchDoc.exists ? branchDoc.data().name : null;
    } catch (error) {
        console.error('❌ Error al obtener nombre de sucursal:', error);
        return null;
    }
  }

  async getPlanName(planPath: string | null | undefined): Promise<string | null> {
    try {
        if (!planPath || typeof planPath !== 'string') {
            console.log('⚠️ Referencia de plan no válida:', planPath);
            return null;
        }

        // Usar la última parte de la ruta como ID
        const planId = planPath.split('/').pop();
        if (!planId) {
            console.log('⚠️ No se pudo extraer el ID del plan de:', planPath);
            return null;
        }

        const planDoc = await this.db.collection('plans').doc(planId).get();
        return planDoc.exists ? planDoc.data().name : null;
    } catch (error) {
        console.error('❌ Error al obtener nombre de plan:', error);
        return null;
    }
  }

  private async createWalletForUser(userId: string): Promise<void> {
    try {
      const walletData = {
        name: 'Mi Billetera',
        type: 'standard',
        balance: 0,
        status: 'active',
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('wallets').add(walletData);
      console.log(`✅ Billetera creada para el usuario ${userId}`);
    } catch (error) {
      console.error('Error al crear billetera para el usuario:', error);
      throw new Error('Error al crear billetera para el usuario');
    }
  }

  private async getWalletName(userId: string): Promise<string | null> {
    try {
      // Primero intentamos obtener la billetera
      const walletsQuery = await this.db
        .collection('wallets')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      // Si no existe, la creamos
      if (walletsQuery.empty) {
        await this.createWalletForUser(userId);
        return 'Mi Billetera';
      }

      const wallet = walletsQuery.docs[0].data();
      return wallet.name || 'Mi Billetera';
    } catch (error) {
      console.error('Error al obtener nombre de billetera:', error);
      return 'Mi Billetera';
    }
  }

  async getWalletInfo(walletId: string) {
    try {
      const walletDoc = await this.db.collection('wallets').doc(walletId).get();
      if (!walletDoc.exists) return null;
      return walletDoc.data();
    } catch (error) {
      console.error('Error al obtener información de billetera:', error);
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createUserWithRetry(createUserDto: CreateUserDto, maxRetries = 3): Promise<admin.auth.UserRecord> {
    let lastError;
    let waitTime = 1000; // Tiempo inicial de espera: 1 segundo

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📝 Intento ${attempt} de crear usuario en Firebase Auth...`);
        
        const authUser = await admin.auth().createUser({
          email: createUserDto.email.toLowerCase(),
          password: createUserDto.password,
          displayName: `${createUserDto.firstName} ${createUserDto.lastName}`,
          emailVerified: false
        });

        console.log('✅ Usuario creado exitosamente en el intento', attempt);
        return authUser;
      } catch (error: any) {
        lastError = error;
        
        if (error?.errorInfo?.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          console.log(`⚠️ Demasiados intentos. Esperando ${waitTime/1000} segundos antes del siguiente intento...`);
          await this.delay(waitTime);
          waitTime *= 2; // Duplicar el tiempo de espera para el siguiente intento
          continue;
        }
        
        // Si es otro tipo de error, lo lanzamos inmediatamente
        throw error;
      }
    }

    // Si llegamos aquí, significa que agotamos todos los reintentos
    console.error('❌ Se agotaron los reintentos para crear el usuario');
    throw lastError;
  }

  async createUser(createUserDto: CreateUserDto): Promise<FirebaseUser> {
    try {
      console.log('🚀 Iniciando creación de usuario:', createUserDto);

      // Validar y formatear el número de teléfono
      const phoneNumber = createUserDto.phone?.trim() || '';
      if (!phoneNumber) {
        throw new HttpException(
          'El número de teléfono es requerido',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validar typeUserReference
      if (!createUserDto.typeUserReference) {
        throw new HttpException(
          'El tipo de usuario es requerido',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verificar si el tipo de usuario existe
      const typeUserRef = this.db.collection('typeUsers').doc(createUserDto.typeUserReference);
      const typeUserDoc = await typeUserRef.get();
      if (!typeUserDoc.exists) {
        throw new HttpException(
          'El tipo de usuario seleccionado no existe',
          HttpStatus.BAD_REQUEST
        );
      }

      // Usar el nuevo método con reintentos
      let authUser;
      try {
        authUser = await this.createUserWithRetry(createUserDto);
        console.log('✅ Usuario creado en Firebase Auth:', authUser.uid);
      } catch (error) {
        console.error('❌ Error al crear usuario en Auth:', error);
        throw new HttpException(
          'Error al crear la cuenta de usuario. Por favor, intenta nuevamente en unos momentos.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Preparar datos para Firestore
      const userData = {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email.toLowerCase(),
        phone: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
        address: createUserDto.address || '',
        birthDate: createUserDto.birthDate,
        branchReference: createUserDto.branchReference,
        subscriptionPlan: createUserDto.subscriptionPlan,
        typeUserReference: `/typeUsers/${createUserDto.typeUserReference}`,
        accountStatus: true,
        isVerified: false,
        isEmailVerified: false,
        isOnline: false,
        photo: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      };

      try {
        // Guardar en Firestore
        await this.db.collection('users').doc(authUser.uid).set(userData);
        console.log('✅ Datos guardados en Firestore');
        
        // Crear billetera para el usuario
        await this.createWalletForUser(authUser.uid);
        console.log('✅ Billetera creada');

        // Generar enlace de verificación y enviar correo
        const verificationLink = await admin.auth().generateEmailVerificationLink(
          createUserDto.email.toLowerCase(),
          {
            url: `${process.env.FRONTEND_URL}/verify-email`,
            handleCodeInApp: true,
            dynamicLinkDomain: undefined // Esto fuerza a usar la URL directa en lugar del dominio dinámico
          }
        );

        // Extraer el código oob del enlace original
        const oobCode = verificationLink.match(/oobCode=([^&]+)/)?.[1];
        
        // Crear un nuevo enlace que apunte a localhost
        const localVerificationLink = `${process.env.FRONTEND_URL}/verify-email?mode=verifyEmail&oobCode=${oobCode}`;
        
        console.log('🔗 Enlace de verificación generado:', localVerificationLink);

        // Enviar correo con credenciales y enlace de verificación
        await this.sendCredentialsByEmail({
          email: createUserDto.email,
          password: createUserDto.password,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          verificationLink: localVerificationLink
        });
        console.log('✅ Correo de bienvenida enviado con enlace de verificación');

        // Obtener datos completos del usuario
        const createdUser = await this.getUserDetails(authUser.uid);
        if (!createdUser) {
          throw new Error('Error al obtener los datos del usuario creado');
        }

        return createdUser;

      } catch (error) {
        // Si hay error, eliminar el usuario de Authentication
        console.error('❌ Error en el proceso:', error);
        await admin.auth().deleteUser(authUser.uid);
        throw new Error('Error al completar el registro del usuario');
      }

    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.code === 'auth/invalid-phone-number') {
        throw new HttpException(
          'El número de teléfono no es válido. Debe incluir el código de país (ejemplo: +507)',
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al crear usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTypeUsers() {
    try {
      console.log('🔍 Consultando tipos de usuario con Prisma');
      
      // Fetch all user types using Prisma
      const typeUsers = await this.prisma.type_users.findMany({
        where: {
          // No need for is_active filter as we don't have this field
        }
      });
      
      // Map to the expected format
      const mappedTypes = typeUsers.map(type => ({
        id: type.id,
        name: type.name || 'Sin nombre',
        description: type.description || 'Sin descripción',
        isActive: true, // Default to true since we don't have an is_active field
        createdAt: type.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: type.updated_at?.toISOString() || new Date().toISOString()
      }));
      
      console.log(`✅ ${mappedTypes.length} tipos de usuario encontrados`);
      return mappedTypes;
      
    } catch (error) {
      console.error('❌ Error al obtener tipos de usuario con Prisma:', error);
      throw new HttpException(
        'Error al obtener los tipos de usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendCredentialsByEmail(credentials: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    verificationLink: string;
  }) {
    const { email, password, firstName, lastName, verificationLink } = credentials;

    try {
      console.log('📧 Iniciando envío de correo con credenciales');
      console.log('📝 Verificando configuración SMTP...');
      
      const nodemailer = require('nodemailer');
      
      // Verificar variables de entorno
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missingVars.join(', ')}`);
      }
      
      // Configurar el transporte de correo
      const transportConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      console.log('📧 Configuración SMTP:', {
        host: transportConfig.host,
        port: transportConfig.port,
        secure: transportConfig.secure,
        user: transportConfig.auth.user
      });

      const transporter = nodemailer.createTransport(transportConfig);

      // Verificar conexión SMTP
      console.log('🔍 Verificando conexión SMTP...');
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada');

      // Preparar el contenido del correo
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: '¡Bienvenido a WorkExpress! - Verifica tu cuenta',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">¡Bienvenido a WorkExpress!</h1>
            <p>Hola ${firstName},</p>
            <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Contraseña temporal:</strong> ${password}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p><strong>Por favor, verifica tu cuenta haciendo clic en el siguiente botón:</strong></p>
              <a href="${verificationLink}" 
                 style="background-color: #4CAF50; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        margin: 10px 0;">
                Verificar mi cuenta
              </a>
            </div>
            
            <p>Por razones de seguridad, te recomendamos:</p>
            <ol>
              <li>Verificar tu cuenta usando el botón de arriba</li>
              <li>Iniciar sesión con estas credenciales</li>
              <li>Cambiar tu contraseña inmediatamente</li>
              <li>No compartir estas credenciales con nadie</li>
            </ol>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            
            <p>Puedes acceder a tu cuenta en: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
            
            <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
              Si no solicitaste esta cuenta, por favor ignora este correo o contacta a soporte.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 0.8em;">
                Este es un correo automático, por favor no responder.
              </p>
            </div>
          </div>
        `
      };

      // Enviar el correo
      console.log('📧 Enviando correo a:', email);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado exitosamente:', info.messageId);
      
      return true;
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      console.error('Stack trace:', error.stack);

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          'No se pudo conectar al servidor SMTP',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      if (error.code === 'EAUTH') {
        throw new HttpException(
          'Error de autenticación con el servidor SMTP',
          HttpStatus.UNAUTHORIZED
        );
      }

      throw new HttpException(
        `Error al enviar el correo electrónico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Reutilizamos la función processReference como un método de la clase
  private processReferenceAsObject(ref: any): { path: string; id: string } {
    if (!ref) return { path: '', id: '' };
    if (typeof ref === 'string') return { path: ref, id: ref.split('/').pop() || '' };
    return { 
      path: ref.path || '', 
      id: ref.id || ref.path?.split('/').pop() || '' 
    };
  }

  async getUserWithDetails(userId: string): Promise<FirebaseUser | null> {
    try {
      console.log('🔍 Buscando usuario detallado con ID:', userId);
      
      // Obtener documento del usuario
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('⚠️ Usuario no encontrado:', userId);
        return null;
      }

      // Procesar datos del usuario
      const userData = userDoc.data();
      const branchReference = this.processReferenceAsObject(userData.branchReference);
      const planReference = this.processReferenceAsObject(userData.subscriptionPlan);
      
      // Obtener nombre de la sucursal
      const branchName = await this.getBranchName(branchReference.path);
      
      // Obtener nombre del plan
      const planName = await this.getPlanName(planReference.path);

      // Mapear datos del usuario
      const user = {
        ...this.mapUserData(userDoc, {
          branchDetails: null,
          planDetails: null,
          walletName: null
        }),
        branchName: branchName,
        planName: planName
      };

      console.log('✅ Usuario detallado obtenido:', {
        id: user.userId,
        email: user.email,
        branchName: user.branchName,
        planName: user.planName
      });

      return user;
    } catch (error) {
      console.error('❌ Error al obtener usuario con detalles:', error);
      throw error;
    }
  }

  /**
   * Assigns a client to a package by updating the package's user_reference field
   * @param packageId - The ID of the package to update
   * @param userId - The ID of the user to assign to the package
   * @returns The updated package
   */
  async assignClientToPackage(packageId: string, userId: string) {
    try {
      console.log('🔄 Asignando cliente a paquete con Prisma:', { packageId, userId });
      
      // Check if user exists
      const user = await this.prisma.users.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new HttpException(
          'El usuario no existe',
          HttpStatus.NOT_FOUND
        );
      }
      
      // Check if package exists
      const packageExists = await this.prisma.packages.findUnique({
        where: { id: packageId }
      });
      
      if (!packageExists) {
        throw new HttpException(
          'El paquete no existe',
          HttpStatus.NOT_FOUND
        );
      }
      
      // Update the package with the user reference
      const updatedPackage = await this.prisma.packages.update({
        where: { id: packageId },
        data: {
          user_reference: userId,
          updated_at: new Date()
        },
        include: {
          users: {
            include: {
              branches: true,
              plans: true,
              type_users: true,
              wallets: true
            }
          }
        }
      });
      
      console.log('✅ Cliente asignado con éxito al paquete:', {
        packageId,
        userId,
        trackingNumber: updatedPackage.tracking_number
      });
      
      // Create a response object with all necessary information
      const response = {
        success: true,
        message: 'Cliente asignado exitosamente al paquete',
        package: {
          id: updatedPackage.id,
          trackingNumber: updatedPackage.tracking_number,
          status: updatedPackage.package_status,
          updatedAt: updatedPackage.updated_at?.toISOString(),
          dimensions: {
            height: updatedPackage.height,
            width: updatedPackage.width,
            length: updatedPackage.length,
            weight: updatedPackage.weight
          }
        },
        client: updatedPackage.users ? this.mapPrismaUserToFirebaseUser(
          updatedPackage.users,
          updatedPackage.users.branches,
          updatedPackage.users.plans,
          updatedPackage.users.wallets?.length > 0 ? 'Mi Billetera' : undefined
        ) : null
      };
      
      return response;
    } catch (error) {
      console.error('❌ Error al asignar cliente a paquete con Prisma:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error al asignar cliente al paquete',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Consulta directamente en la base de datos el valor de shipping_insurance para un usuario
   * @param userId ID del usuario a consultar
   * @returns Objeto con el valor de shipping_insurance y datos básicos del usuario
   */
  async getShippingInsurance(userId: string): Promise<any> {
    try {
      console.log(`🔍 Consultando shipping_insurance para usuario: ${userId}`);
      
      const userRecord = await this.prisma.users.findFirst({
        where: { id: userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          shipping_insurance: true
        }
      });
      
      if (!userRecord) {
        console.warn(`⚠️ Usuario ${userId} no encontrado`);
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }
      
      console.log(`📊 Valor de shipping_insurance para usuario ${userId} obtenido de la base de datos:`, {
        id: userRecord.id,
        name: `${userRecord.first_name} ${userRecord.last_name}`,
        email: userRecord.email,
        shipping_insurance: userRecord.shipping_insurance
      });
      
      // Devolver el valor de shipping_insurance
      return {
        shipping_insurance: userRecord.shipping_insurance,
        userId: userRecord.id,
        name: `${userRecord.first_name} ${userRecord.last_name}`,
        email: userRecord.email
      };
    } catch (error) {
      console.error(`Error al consultar shipping_insurance para usuario ${userId}:`, error);
      throw error;
    }
  }
}