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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
const wallets_service_1 = require("../wallets/wallets.service");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(configService, walletsService, prisma) {
        this.configService = configService;
        this.walletsService = walletsService;
        this.prisma = prisma;
        console.log('🚀 UsersService inicializado');
        this.API_URL = this.configService.get('API_URL');
        this.db = admin.firestore();
    }
    mapUserData(doc, details) {
        const data = doc.data();
        if (!data) {
            throw new Error(`No se encontraron datos para el usuario ${doc.id}`);
        }
        console.log(`🔄 Mapeando datos del usuario ${doc.id}:`, {
            email: data.email,
            branchDetails: details.branchDetails,
            planDetails: details.planDetails
        });
        let finalAccountStatus = true;
        if (typeof data.accountStatus === 'boolean') {
            finalAccountStatus = data.accountStatus;
        }
        else if (typeof data.accountStatus === 'string') {
            finalAccountStatus = ['true', '1', 'active', 'activo'].includes(data.accountStatus.toLowerCase());
        }
        else if (typeof data.accountStatus === 'number') {
            finalAccountStatus = data.accountStatus === 1;
        }
        const processReference = (ref) => {
            if (!ref)
                return { path: '', id: '' };
            if (typeof ref === 'string')
                return { path: ref, id: ref.split('/').pop() || '' };
            return {
                path: ref.path || '',
                id: ref.id || ref.path?.split('/').pop() || ''
            };
        };
        const toISOString = (timestamp) => {
            if (!timestamp)
                return '';
            if (timestamp instanceof Date)
                return timestamp.toISOString();
            if (typeof timestamp === 'string')
                return timestamp;
            if (timestamp.toDate)
                return timestamp.toDate().toISOString();
            return '';
        };
        const branchName = details.branchDetails?.name || 'Sucursal sin nombre';
        const planName = details.planDetails?.planName || details.planDetails?.name || 'Plan sin nombre';
        let planPrice = 0;
        if (details.planDetails) {
            planPrice = parseFloat(String(details.planDetails.price ||
                details.planDetails.rate ||
                details.planDetails.planRate ||
                0));
        }
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
        const mappedUser = {
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
    mapPrismaUserToFirebaseUser(user, branch, plan, walletName) {
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
            planId: plan?.id,
            planName: plan?.name,
            planDescription: plan?.description,
            planRate: plan?.rate,
            planFrequency: plan?.frequency,
            planStatus: plan?.status,
            branchId: branch?.id,
            branchName: branch?.name,
            branchAddress: branch?.address,
            branchZipcode: branch?.zipcode,
            walletName: walletName,
            subscriptionPlan: plan,
            branch: branch
        };
    }
    async getAllUsers() {
        try {
            console.log('📊 Obteniendo todos los usuarios con Prisma');
            const users = await this.prisma.users.findMany({
                include: {
                    branches: true,
                    plans: true,
                    type_users: true,
                    wallets: true
                }
            });
            console.log(`✅ ${users.length} usuarios encontrados con Prisma`);
            return users.map(user => this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined));
        }
        catch (error) {
            console.error('❌ Error al obtener usuarios con Prisma:', error);
            throw new common_1.HttpException('Error al obtener usuarios con Prisma', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchSuggestions(query, limit = 10) {
        try {
            console.log('🔍 Buscando sugerencias con Prisma:', query);
            const normalizedQuery = query.toLowerCase().trim();
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
                take: limit
            });
            console.log(`✅ ${users.length} sugerencias encontradas con Prisma`);
            return users.map(user => this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined));
        }
        catch (error) {
            console.error('❌ Error al buscar sugerencias con Prisma:', error);
            throw new common_1.HttpException('Error al buscar sugerencias', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchExactMatch(query, limit = 10) {
        try {
            console.log('🔍 Buscando coincidencia exacta:', query);
            const normalizedQuery = query.toLowerCase().trim();
            const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
            if (searchTerms.length < 2) {
                return this.searchSuggestions(query, limit);
            }
            const users = await this.prisma.users.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { first_name: { contains: searchTerms[0], mode: 'insensitive' } },
                                { last_name: { contains: searchTerms[0], mode: 'insensitive' } }
                            ]
                        },
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
            return users.map(user => this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined));
        }
        catch (error) {
            console.error('❌ Error al buscar coincidencia exacta:', error);
            throw new common_1.HttpException('Error al buscar coincidencia exacta', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchByNameAndLastName(firstName, lastName, limit = 10) {
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
            return users.map(user => this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined));
        }
        catch (error) {
            console.error('❌ Error al buscar por nombre y apellido:', error);
            throw new common_1.HttpException('Error al buscar por nombre y apellido', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async searchUser(query) {
        try {
            console.log('🔍 Iniciando búsqueda con Prisma:', query);
            if (!query?.trim()) {
                console.log('⚠️ Query vacío, retornando null');
                return null;
            }
            const normalizedQuery = query.toLowerCase().trim();
            console.log('🔍 Query normalizado:', normalizedQuery);
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
            return this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined);
        }
        catch (error) {
            console.error('❌ Error en searchUser con Prisma:', error);
            throw new common_1.HttpException('Error al buscar usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserDetails(userId) {
        try {
            console.log('🔍 Obteniendo detalles del usuario con Prisma:', userId);
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
            return this.mapPrismaUserToFirebaseUser(user, user.branches, user.plans, user.wallets?.length > 0 ? 'Mi Billetera' : undefined);
        }
        catch (error) {
            console.error('❌ Error al obtener detalles del usuario con Prisma:', error);
            throw new common_1.HttpException('Error al obtener detalles del usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUserStatus(userId, status) {
        try {
            console.log('🔄 Actualizando estado del usuario:', { userId, status });
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                throw new common_1.HttpException(`Usuario con ID ${userId} no encontrado`, common_1.HttpStatus.NOT_FOUND);
            }
            const previousStatus = typeof userDoc.data().accountStatus === 'boolean'
                ? userDoc.data().accountStatus
                : userDoc.data().accountStatus === 'active';
            const newStatus = status === 'active';
            await this.db.collection('users').doc(userId).update({
                accountStatus: newStatus,
                status: status,
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
        }
        catch (error) {
            console.error('❌ Error en updateUserStatus:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al actualizar el estado del usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBranchName(branchPath) {
        try {
            if (!branchPath || typeof branchPath !== 'string') {
                console.log('⚠️ Referencia de sucursal no válida:', branchPath);
                return null;
            }
            const branchId = branchPath.split('/').pop();
            if (!branchId) {
                console.log('⚠️ No se pudo extraer el ID de la sucursal de:', branchPath);
                return null;
            }
            const branchDoc = await this.db.collection('branches').doc(branchId).get();
            return branchDoc.exists ? branchDoc.data().name : null;
        }
        catch (error) {
            console.error('❌ Error al obtener nombre de sucursal:', error);
            return null;
        }
    }
    async getPlanName(planPath) {
        try {
            if (!planPath || typeof planPath !== 'string') {
                console.log('⚠️ Referencia de plan no válida:', planPath);
                return null;
            }
            const planId = planPath.split('/').pop();
            if (!planId) {
                console.log('⚠️ No se pudo extraer el ID del plan de:', planPath);
                return null;
            }
            const planDoc = await this.db.collection('plans').doc(planId).get();
            return planDoc.exists ? planDoc.data().name : null;
        }
        catch (error) {
            console.error('❌ Error al obtener nombre de plan:', error);
            return null;
        }
    }
    async createWalletForUser(userId) {
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
        }
        catch (error) {
            console.error('Error al crear billetera para el usuario:', error);
            throw new Error('Error al crear billetera para el usuario');
        }
    }
    async getWalletName(userId) {
        try {
            const walletsQuery = await this.db
                .collection('wallets')
                .where('userId', '==', userId)
                .limit(1)
                .get();
            if (walletsQuery.empty) {
                await this.createWalletForUser(userId);
                return 'Mi Billetera';
            }
            const wallet = walletsQuery.docs[0].data();
            return wallet.name || 'Mi Billetera';
        }
        catch (error) {
            console.error('Error al obtener nombre de billetera:', error);
            return 'Mi Billetera';
        }
    }
    async getWalletInfo(walletId) {
        try {
            const walletDoc = await this.db.collection('wallets').doc(walletId).get();
            if (!walletDoc.exists)
                return null;
            return walletDoc.data();
        }
        catch (error) {
            console.error('Error al obtener información de billetera:', error);
            return null;
        }
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async createUserWithRetry(createUserDto, maxRetries = 3) {
        let lastError;
        let waitTime = 1000;
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
            }
            catch (error) {
                lastError = error;
                if (error?.errorInfo?.message?.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
                    console.log(`⚠️ Demasiados intentos. Esperando ${waitTime / 1000} segundos antes del siguiente intento...`);
                    await this.delay(waitTime);
                    waitTime *= 2;
                    continue;
                }
                throw error;
            }
        }
        console.error('❌ Se agotaron los reintentos para crear el usuario');
        throw lastError;
    }
    async createUser(createUserDto) {
        try {
            console.log('🚀 Iniciando creación de usuario:', createUserDto);
            const phoneNumber = createUserDto.phone?.trim() || '';
            if (!phoneNumber) {
                throw new common_1.HttpException('El número de teléfono es requerido', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!createUserDto.typeUserReference) {
                throw new common_1.HttpException('El tipo de usuario es requerido', common_1.HttpStatus.BAD_REQUEST);
            }
            const typeUserRef = this.db.collection('typeUsers').doc(createUserDto.typeUserReference);
            const typeUserDoc = await typeUserRef.get();
            if (!typeUserDoc.exists) {
                throw new common_1.HttpException('El tipo de usuario seleccionado no existe', common_1.HttpStatus.BAD_REQUEST);
            }
            let authUser;
            try {
                authUser = await this.createUserWithRetry(createUserDto);
                console.log('✅ Usuario creado en Firebase Auth:', authUser.uid);
            }
            catch (error) {
                console.error('❌ Error al crear usuario en Auth:', error);
                throw new common_1.HttpException('Error al crear la cuenta de usuario. Por favor, intenta nuevamente en unos momentos.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
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
                await this.db.collection('users').doc(authUser.uid).set(userData);
                console.log('✅ Datos guardados en Firestore');
                await this.createWalletForUser(authUser.uid);
                console.log('✅ Billetera creada');
                const verificationLink = await admin.auth().generateEmailVerificationLink(createUserDto.email.toLowerCase(), {
                    url: `${process.env.FRONTEND_URL}/verify-email`,
                    handleCodeInApp: true,
                    dynamicLinkDomain: undefined
                });
                const oobCode = verificationLink.match(/oobCode=([^&]+)/)?.[1];
                const localVerificationLink = `${process.env.FRONTEND_URL}/verify-email?mode=verifyEmail&oobCode=${oobCode}`;
                console.log('🔗 Enlace de verificación generado:', localVerificationLink);
                await this.sendCredentialsByEmail({
                    email: createUserDto.email,
                    password: createUserDto.password,
                    firstName: createUserDto.firstName,
                    lastName: createUserDto.lastName,
                    verificationLink: localVerificationLink
                });
                console.log('✅ Correo de bienvenida enviado con enlace de verificación');
                const createdUser = await this.getUserDetails(authUser.uid);
                if (!createdUser) {
                    throw new Error('Error al obtener los datos del usuario creado');
                }
                return createdUser;
            }
            catch (error) {
                console.error('❌ Error en el proceso:', error);
                await admin.auth().deleteUser(authUser.uid);
                throw new Error('Error al completar el registro del usuario');
            }
        }
        catch (error) {
            console.error('❌ Error al crear usuario:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            if (error.code === 'auth/invalid-phone-number') {
                throw new common_1.HttpException('El número de teléfono no es válido. Debe incluir el código de país (ejemplo: +507)', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(error instanceof Error ? error.message : 'Error al crear usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTypeUsers() {
        try {
            console.log('🔍 Consultando tipos de usuario con Prisma');
            const typeUsers = await this.prisma.type_users.findMany({
                where: {}
            });
            const mappedTypes = typeUsers.map(type => ({
                id: type.id,
                name: type.name || 'Sin nombre',
                description: type.description || 'Sin descripción',
                isActive: true,
                createdAt: type.created_at?.toISOString() || new Date().toISOString(),
                updatedAt: type.updated_at?.toISOString() || new Date().toISOString()
            }));
            console.log(`✅ ${mappedTypes.length} tipos de usuario encontrados`);
            return mappedTypes;
        }
        catch (error) {
            console.error('❌ Error al obtener tipos de usuario con Prisma:', error);
            throw new common_1.HttpException('Error al obtener los tipos de usuario', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendCredentialsByEmail(credentials) {
        const { email, password, firstName, lastName, verificationLink } = credentials;
        try {
            console.log('📧 Iniciando envío de correo con credenciales');
            console.log('📝 Verificando configuración SMTP...');
            const nodemailer = require('nodemailer');
            const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            if (missingVars.length > 0) {
                throw new Error(`Faltan variables de entorno: ${missingVars.join(', ')}`);
            }
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
            console.log('🔍 Verificando conexión SMTP...');
            await transporter.verify();
            console.log('✅ Conexión SMTP verificada');
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
            console.log('📧 Enviando correo a:', email);
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Correo enviado exitosamente:', info.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Error al enviar el correo:', error);
            console.error('Stack trace:', error.stack);
            if (error.code === 'ECONNREFUSED') {
                throw new common_1.HttpException('No se pudo conectar al servidor SMTP', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            if (error.code === 'EAUTH') {
                throw new common_1.HttpException('Error de autenticación con el servidor SMTP', common_1.HttpStatus.UNAUTHORIZED);
            }
            throw new common_1.HttpException(`Error al enviar el correo electrónico: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    processReferenceAsObject(ref) {
        if (!ref)
            return { path: '', id: '' };
        if (typeof ref === 'string')
            return { path: ref, id: ref.split('/').pop() || '' };
        return {
            path: ref.path || '',
            id: ref.id || ref.path?.split('/').pop() || ''
        };
    }
    async getUserWithDetails(userId) {
        try {
            console.log('🔍 Buscando usuario detallado con ID:', userId);
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                console.log('⚠️ Usuario no encontrado:', userId);
                return null;
            }
            const userData = userDoc.data();
            const branchReference = this.processReferenceAsObject(userData.branchReference);
            const planReference = this.processReferenceAsObject(userData.subscriptionPlan);
            const branchName = await this.getBranchName(branchReference.path);
            const planName = await this.getPlanName(planReference.path);
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
        }
        catch (error) {
            console.error('❌ Error al obtener usuario con detalles:', error);
            throw error;
        }
    }
    async assignClientToPackage(packageId, userId) {
        try {
            console.log('🔄 Asignando cliente a paquete con Prisma:', { packageId, userId });
            const user = await this.prisma.users.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new common_1.HttpException('El usuario no existe', common_1.HttpStatus.NOT_FOUND);
            }
            const packageExists = await this.prisma.packages.findUnique({
                where: { id: packageId }
            });
            if (!packageExists) {
                throw new common_1.HttpException('El paquete no existe', common_1.HttpStatus.NOT_FOUND);
            }
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
                client: updatedPackage.users ? this.mapPrismaUserToFirebaseUser(updatedPackage.users, updatedPackage.users.branches, updatedPackage.users.plans, updatedPackage.users.wallets?.length > 0 ? 'Mi Billetera' : undefined) : null
            };
            return response;
        }
        catch (error) {
            console.error('❌ Error al asignar cliente a paquete con Prisma:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error al asignar cliente al paquete', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getShippingInsurance(userId) {
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
                throw new common_1.NotFoundException(`Usuario con ID ${userId} no encontrado`);
            }
            console.log(`📊 Valor de shipping_insurance para usuario ${userId} obtenido de la base de datos:`, {
                id: userRecord.id,
                name: `${userRecord.first_name} ${userRecord.last_name}`,
                email: userRecord.email,
                shipping_insurance: userRecord.shipping_insurance
            });
            return {
                shipping_insurance: userRecord.shipping_insurance,
                userId: userRecord.id,
                name: `${userRecord.first_name} ${userRecord.last_name}`,
                email: userRecord.email
            };
        }
        catch (error) {
            console.error(`Error al consultar shipping_insurance para usuario ${userId}:`, error);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        wallets_service_1.WalletsService,
        prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map