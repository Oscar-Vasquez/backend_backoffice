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
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PackagesService = class PackagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { skip, take, cursor, where, orderBy } = params;
        try {
            const packages = await this.prisma.packages.findMany({
                skip,
                take,
                cursor,
                where,
                orderBy,
            });
            const totalCount = await this.prisma.packages.count({ where });
            return {
                data: packages,
                meta: {
                    total: totalCount,
                    skip: skip || 0,
                    take: take || totalCount,
                },
            };
        }
        catch (error) {
            console.error('Error fetching packages:', error);
            throw new Error('Failed to fetch packages');
        }
    }
    async findOne(id) {
        try {
            const packageData = await this.prisma.packages.findUnique({
                where: { id },
                include: {
                    users: true,
                    branches: true,
                    operators: true
                }
            });
            if (!packageData) {
                throw new common_1.NotFoundException(`Package with ID ${id} not found`);
            }
            let userData = null;
            if (packageData.user_reference && packageData.users) {
                userData = {
                    id: packageData.users.id,
                    email: packageData.users.email,
                    name: `${packageData.users.first_name || ''} ${packageData.users.last_name || ''}`.trim(),
                    phone: packageData.users.phone,
                    photo: packageData.users.photo_url,
                    accountStatus: packageData.users.account_status
                };
            }
            return {
                success: true,
                data: {
                    ...packageData,
                    position: packageData.position || this.generarCodigoCasillero(packageData.tracking_number),
                    user: userData,
                    branch: packageData.branches ? {
                        id: packageData.branches.id,
                        name: packageData.branches.name,
                        address: packageData.branches.address,
                    } : null,
                    operator: packageData.operators ? {
                        id: packageData.operators.id,
                        name: `${packageData.operators.first_name} ${packageData.operators.last_name}`,
                        email: packageData.operators.email
                    } : null
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error('Error fetching package:', error);
            throw new Error('Failed to fetch package');
        }
    }
    async findByTracking(trackingNumber) {
        try {
            console.log('🔍 Buscando paquete por tracking en Prisma:', trackingNumber);
            const packageData = await this.prisma.packages.findFirst({
                where: {
                    tracking_number: trackingNumber,
                },
                include: {
                    users: {
                        include: {
                            branches: true,
                            plans: true,
                            type_users: true
                        }
                    },
                    branches: true
                }
            });
            if (!packageData) {
                console.log('❌ Paquete no encontrado en base de datos local para tracking:', trackingNumber);
                return null;
            }
            console.log('✅ Paquete encontrado en base de datos local:', {
                id: packageData.id,
                status: packageData.package_status,
                tracking: packageData.tracking_number,
                created_at: packageData.created_at,
                user_reference: packageData.user_reference
            });
            let userData = null;
            if (packageData.user_reference && packageData.users) {
                console.log('👤 Usuario asignado al paquete:', packageData.user_reference);
                console.log('🔍 DEBUG - Estructura del usuario:', {
                    keys: Object.keys(packageData.users),
                    user_id: packageData.users.id,
                    first_name: packageData.users.first_name,
                    email: packageData.users.email
                });
                const userObj = packageData.users;
                userData = {
                    id: packageData.users.id,
                    email: packageData.users.email,
                    name: `${packageData.users.first_name || ''} ${packageData.users.last_name || ''}`.trim(),
                    firstName: packageData.users.first_name,
                    lastName: packageData.users.last_name,
                    phone: packageData.users.phone,
                    photo: packageData.users.photo_url,
                    accountStatus: packageData.users.account_status,
                    branchName: packageData.users.branches?.name || '',
                    planName: packageData.users.plans?.name || '',
                    planRate: packageData.users.plans?.price ? Number(packageData.users.plans.price) : 0,
                    userType: packageData.users.type_users?.name || '',
                    shipping_insurance: !!packageData.users.shipping_insurance,
                    assignedAt: packageData.updated_at
                };
                console.log('📊 Datos completos del cliente asignado:', {
                    id: userData.id,
                    name: userData.name,
                    planName: userData.planName,
                    branchName: userData.branchName,
                    shipping_insurance: userData.shipping_insurance
                });
            }
            else {
                console.log('ℹ️ El paquete no tiene usuario asignado');
            }
            const formattedResponse = {
                id: packageData.id,
                trackingNumber: packageData.tracking_number,
                packageStatus: packageData.package_status,
                weight: packageData.weight !== null ? Number(packageData.weight) : 0,
                volumetricWeight: packageData.volumetric_weight !== null ? Number(packageData.volumetric_weight) : 0,
                length: packageData.length !== null ? Number(packageData.length) : 0,
                width: packageData.width !== null ? Number(packageData.width) : 0,
                height: packageData.height !== null ? Number(packageData.height) : 0,
                createdAt: packageData.created_at?.toISOString(),
                updatedAt: packageData.updated_at?.toISOString(),
                userId: packageData.user_reference,
                branchId: packageData.branch_id,
                shippingStages: packageData.shipping_stages || [],
                insurance: packageData.insurance,
                position: packageData.position || this.generarCodigoCasillero(packageData.tracking_number),
                invoice: null,
                user: userData,
                branch: packageData.branches ? {
                    id: packageData.branches.id,
                    name: packageData.branches.name,
                    address: packageData.branches.address,
                } : null
            };
            console.log('📦 Datos guardados en base de datos:');
            console.log(JSON.stringify({
                id: formattedResponse.id,
                tracking_number: formattedResponse.trackingNumber,
                package_status: formattedResponse.packageStatus,
                weight: formattedResponse.weight.toString(),
                volumetric_weight: formattedResponse.volumetricWeight,
                dimensions: {
                    length: formattedResponse.length,
                    width: formattedResponse.width,
                    height: formattedResponse.height
                },
                position: formattedResponse.position
            }, null, 2));
            return formattedResponse;
        }
        catch (error) {
            console.error('❌ Error al buscar paquete por tracking:', error);
            return null;
        }
    }
    generarCodigoCasillero(tracking) {
        const numeros = tracking.replace(/\D/g, "");
        if (numeros.length < 2) {
            console.log('⚠️ Tracking no tiene suficientes números para generar código:', tracking);
            return "0A";
        }
        const penultimoDigito = numeros[numeros.length - 2];
        const ultimoDigito = parseInt(numeros[numeros.length - 1], 10);
        let letra = "C";
        if (ultimoDigito <= 2)
            letra = "A";
        else if (ultimoDigito <= 5)
            letra = "B";
        const codigoCasillero = `${penultimoDigito}${letra}`;
        console.log(`🏷️ Código de casillero generado para tracking ${tracking}: ${codigoCasillero}`);
        return codigoCasillero;
    }
    async createPackage(packageData, operatorData) {
        try {
            console.log('==================================');
            console.log('📦 Creando nuevo paquete en Prisma:', packageData.trackingNumber);
            console.log('👤 Operador:', {
                id: operatorData.id,
                email: operatorData.email
            });
            console.log('📋 Datos completos del paquete recibidos:');
            console.log(JSON.stringify(packageData, null, 2));
            let operatorId = null;
            let branchId = null;
            let userId = null;
            const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
            if (operatorData.id && isValidUUID(operatorData.id)) {
                try {
                    const operator = await this.prisma.operators.findUnique({
                        where: { id: operatorData.id },
                        select: {
                            id: true,
                            branch_id: true,
                            branches: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    });
                    if (operator) {
                        console.log('✅ Operador encontrado en la base de datos, usando ID para operator_id:', operatorData.id);
                        operatorId = operatorData.id;
                        if (operator.branch_id) {
                            console.log('✅ Sucursal del operador encontrada, usando ID para branch_id:', operator.branch_id);
                            branchId = operator.branch_id;
                            console.log('📍 Nombre de la sucursal:', operator.branches?.name || 'No disponible');
                        }
                        else {
                            console.log('⚠️ El operador no tiene una sucursal asignada');
                        }
                    }
                    else {
                        console.log('⚠️ El ID proporcionado no corresponde a un operador en la base de datos:', operatorData.id);
                    }
                }
                catch (error) {
                    console.error('❌ Error al verificar operador:', error);
                }
            }
            else {
                console.log('⚠️ ID de operador no válido o no es UUID:', operatorData.id);
            }
            console.log('⚠️ No se va a asignar user_reference, se usará null');
            const packageStatus = this.mapStatusToValidEnum(packageData.packageStatus || 'pending');
            const posicionCasillero = this.generarCodigoCasillero(packageData.trackingNumber);
            console.log('📍 Posición de casillero generada:', posicionCasillero);
            const createData = {
                tracking_number: packageData.trackingNumber,
                package_status: packageStatus,
                weight: packageData.weight !== undefined ? packageData.weight : null,
                volumetric_weight: packageData.volumetricWeight !== undefined ? packageData.volumetricWeight :
                    (packageData.volWeight !== undefined ? packageData.volWeight : null),
                length: packageData.length !== undefined ? packageData.length : null,
                width: packageData.width !== undefined ? packageData.width : null,
                height: packageData.height !== undefined ? packageData.height : null,
                insurance: packageData.insurance || false,
                shipping_stages: packageData.shippingStages || [],
                user_reference: null,
                position: posicionCasillero
            };
            if (operatorId) {
                createData['operator_id'] = operatorId;
            }
            if (branchId) {
                createData['branch_id'] = branchId;
            }
            console.log('📊 DATOS QUE SE ENVIARÁN A LA BASE DE DATOS:');
            console.log(JSON.stringify(createData, null, 2));
            const newPackage = await this.prisma.packages.create({
                data: createData,
            });
            console.log('✅ Paquete creado exitosamente:', {
                id: newPackage.id,
                tracking: newPackage.tracking_number,
                status: newPackage.package_status,
                volumetric_weight: newPackage.volumetric_weight,
                operator_id: newPackage.operator_id,
                branch_id: newPackage.branch_id,
                user_reference: newPackage.user_reference,
                position: newPackage.position
            });
            return newPackage;
        }
        catch (error) {
            console.error('❌ Error al crear paquete:', error);
            throw new Error(`Failed to create package: ${error.message}`);
        }
    }
    async updateStatus(id, status) {
        try {
            const existingPackage = await this.prisma.packages.findUnique({
                where: { id },
            });
            if (!existingPackage) {
                throw new common_1.NotFoundException(`Package with ID ${id} not found`);
            }
            let position = existingPackage.position;
            if (!position && existingPackage.tracking_number) {
                position = this.generarCodigoCasillero(existingPackage.tracking_number);
                console.log('📍 Generada posición de casillero para el paquete:', position);
            }
            const updatedPackage = await this.prisma.packages.update({
                where: { id },
                data: {
                    package_status: status,
                    position: position,
                    updated_at: new Date(),
                },
            });
            return {
                success: true,
                message: 'Package status updated successfully',
                data: updatedPackage,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error('Error updating package status:', error);
            throw new Error('Failed to update package status');
        }
    }
    async updateDimensions(id, updateDimensionsDto) {
        try {
            const existingPackage = await this.prisma.packages.findUnique({
                where: { id },
            });
            if (!existingPackage) {
                throw new common_1.NotFoundException(`Package with ID ${id} not found`);
            }
            let volumetricWeight = updateDimensionsDto.volumetric_weight;
            if (!volumetricWeight && updateDimensionsDto.length && updateDimensionsDto.width && updateDimensionsDto.height) {
                volumetricWeight = (updateDimensionsDto.length * updateDimensionsDto.width * updateDimensionsDto.height) / 5000;
            }
            let position = existingPackage.position;
            if (!position && existingPackage.tracking_number) {
                position = this.generarCodigoCasillero(existingPackage.tracking_number);
                console.log('📍 Generada posición de casillero para el paquete:', position);
            }
            const updatedPackage = await this.prisma.packages.update({
                where: { id },
                data: {
                    length: updateDimensionsDto.length !== undefined ? updateDimensionsDto.length : existingPackage.length,
                    width: updateDimensionsDto.width !== undefined ? updateDimensionsDto.width : existingPackage.width,
                    height: updateDimensionsDto.height !== undefined ? updateDimensionsDto.height : existingPackage.height,
                    weight: updateDimensionsDto.weight !== undefined ? updateDimensionsDto.weight : existingPackage.weight,
                    volumetric_weight: volumetricWeight !== undefined ? volumetricWeight : existingPackage.volumetric_weight,
                    is_fragile: updateDimensionsDto.is_fragile !== undefined ? updateDimensionsDto.is_fragile : existingPackage.is_fragile,
                    position: position,
                    updated_at: new Date(),
                },
            });
            console.log('✅ Dimensiones actualizadas exitosamente:', {
                id: updatedPackage.id,
                dimensions: {
                    length: updatedPackage.length,
                    width: updatedPackage.width,
                    height: updatedPackage.height,
                },
                weights: {
                    weight: updatedPackage.weight,
                    volumetric_weight: updatedPackage.volumetric_weight,
                },
                position: updatedPackage.position
            });
            return {
                success: true,
                message: 'Package dimensions updated successfully',
                data: updatedPackage,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error('Error updating package dimensions:', error);
            throw new Error('Failed to update package dimensions');
        }
    }
    async updateWeights(id, updateWeightsDto) {
        try {
            const existingPackage = await this.prisma.packages.findUnique({
                where: { id },
            });
            if (!existingPackage) {
                throw new common_1.NotFoundException(`Package with ID ${id} not found`);
            }
            let position = existingPackage.position;
            if (!position && existingPackage.tracking_number) {
                position = this.generarCodigoCasillero(existingPackage.tracking_number);
                console.log('📍 Generada posición de casillero para el paquete:', position);
            }
            const updatedPackage = await this.prisma.packages.update({
                where: { id },
                data: {
                    weight: updateWeightsDto.weight,
                    volumetric_weight: updateWeightsDto.volumetric_weight,
                    position: position,
                    updated_at: new Date(),
                },
            });
            console.log('✅ Pesos actualizados exitosamente:', {
                id: updatedPackage.id,
                weight: updatedPackage.weight,
                volumetric_weight: updatedPackage.volumetric_weight,
                position: updatedPackage.position
            });
            return {
                success: true,
                message: 'Package weights updated successfully',
                data: updatedPackage,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            console.error('Error updating package weights:', error);
            throw new Error('Failed to update package weights');
        }
    }
    async updatePackageStatus(trackingNumber, status, operatorData) {
        try {
            console.log(`🔄 Actualizando estado del paquete ${trackingNumber} a ${status}`);
            const existingPackage = await this.prisma.packages.findFirst({
                where: { tracking_number: trackingNumber },
            });
            if (!existingPackage) {
                console.log('❌ Paquete no encontrado:', trackingNumber);
                throw new common_1.NotFoundException(`Package with tracking number ${trackingNumber} not found`);
            }
            console.log('🔄 Paquete encontrado, actualizando estado:', existingPackage.id);
            const mappedStatus = this.mapStatusToValidEnum(status);
            let position = existingPackage.position;
            if (!position) {
                position = this.generarCodigoCasillero(trackingNumber);
                console.log('📍 Generada posición de casillero para el paquete:', position);
            }
            const updatedPackage = await this.prisma.packages.update({
                where: { id: existingPackage.id },
                data: {
                    package_status: mappedStatus,
                    position: position,
                    updated_at: new Date(),
                },
            });
            console.log('✅ Estado actualizado exitosamente:', {
                id: updatedPackage.id,
                status: updatedPackage.package_status,
                position: updatedPackage.position,
                originalStatus: status
            });
            return {
                success: true,
                message: 'Package status updated successfully',
                data: updatedPackage,
            };
        }
        catch (error) {
            console.error('❌ Error al actualizar estado del paquete:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to update package status: ${error.message}`);
        }
    }
    mapStatusToValidEnum(inputStatus) {
        console.log('🔄 Mapeando estado a enum válido:', inputStatus);
        const status = String(inputStatus || '').toLowerCase();
        const statusMap = {
            '0': 'canceled',
            '1': 'in_transit',
            '2': 'delivered',
            '3': 'pending',
            '4': 'returned',
            '5': 'lost',
            'invoiced': 'pending',
            'pending': 'pending',
            'in_transit': 'in_transit',
            'intransit': 'in_transit',
            'in transit': 'in_transit',
            'delivered': 'delivered',
            'returned': 'returned',
            'lost': 'lost',
            'canceled': 'canceled',
            'cancelled': 'canceled',
            'pendiente': 'pending',
            'en tránsito': 'in_transit',
            'en transito': 'in_transit',
            'entregado': 'delivered',
            'devuelto': 'returned',
            'perdido': 'lost',
            'cancelado': 'canceled',
            'INVOICED': 'pending',
            'PENDING': 'pending',
            'IN_TRANSIT': 'in_transit',
            'DELIVERED': 'delivered',
            'RETURNED': 'returned',
            'LOST': 'lost',
            'CANCELED': 'canceled'
        };
        const mappedStatus = statusMap[status] || 'pending';
        console.log('✅ Estado mapeado correctamente:', status, '->', mappedStatus);
        return mappedStatus;
    }
    async assignUserToPackage(packageId, userId, operatorData) {
        console.log('🔄 Service: Iniciando assignUserToPackage', {
            packageId,
            userId,
            operatorData,
        });
        try {
            console.log('📝 Verificando paquete antes de actualizar');
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId);
            let existingPackage;
            if (isUUID) {
                console.log('🔍 Buscando paquete por UUID:', packageId);
                existingPackage = await this.prisma.packages.findUnique({
                    where: { id: packageId },
                });
            }
            else {
                console.log('🔍 Buscando paquete por tracking number:', packageId);
                existingPackage = await this.prisma.packages.findFirst({
                    where: { tracking_number: packageId },
                });
            }
            if (!existingPackage) {
                console.error('❌ Package not found:', packageId);
                throw new common_1.HttpException(`No se encontró el paquete con identificador: ${packageId}`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log('📦 Estado actual del paquete:', {
                id: existingPackage.id,
                tracking_number: existingPackage.tracking_number,
                user_reference: existingPackage.user_reference
            });
            const existingUser = await this.prisma.users.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                console.error('❌ User not found:', userId);
                throw new common_1.HttpException(`No se encontró el usuario con ID: ${userId}`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log('👤 Usuario encontrado:', existingUser.id);
            console.log('🔍 Buscando información del operador con ID:', operatorData.id);
            const operator = await this.prisma.operators.findUnique({
                where: { id: operatorData.id },
                select: {
                    id: true,
                    email: true,
                    branch_id: true,
                    branches: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            if (!operator) {
                console.warn('⚠️ No se encontró el operador, continuando sin asignar sucursal');
            }
            else {
                console.log('👤 Datos del operador obtenidos:', {
                    id: operator.id,
                    email: operator.email,
                    branch_id: operator.branch_id,
                    branch_name: operator.branches?.name
                });
            }
            let position = existingPackage.position;
            if (!position && existingPackage.tracking_number) {
                position = this.generarCodigoCasillero(existingPackage.tracking_number);
                console.log('📍 Generada posición de casillero para el paquete:', position);
            }
            console.log('🔄 Ejecutando actualización SQL directa con UUID del paquete:', existingPackage.id);
            if (operator && operator.branch_id) {
                console.log('📝 Actualizando paquete con branch_id del operador:', operator.branch_id);
                await this.prisma.$executeRaw `
          UPDATE packages 
          SET user_reference = ${userId}::uuid, 
              branch_id = ${operator.branch_id}::uuid,
              operator_id = ${operatorData.id}::uuid,
              position = ${position},
              updated_at = NOW() 
          WHERE id = ${existingPackage.id}::uuid
        `;
            }
            else {
                console.log('📝 Actualizando paquete sin branch_id (no disponible)');
                await this.prisma.$executeRaw `
          UPDATE packages 
          SET user_reference = ${userId}::uuid, 
              operator_id = ${operatorData.id}::uuid,
              position = ${position},
              updated_at = NOW() 
          WHERE id = ${existingPackage.id}::uuid
        `;
            }
            const verifyPackage = await this.prisma.packages.findUnique({
                where: { id: existingPackage.id },
                include: {
                    branches: true
                }
            });
            console.log('🔍 Verificación después de actualizar:', {
                id: verifyPackage.id,
                tracking_number: verifyPackage.tracking_number,
                user_reference: verifyPackage.user_reference,
                branch_id: verifyPackage.branch_id,
                branch_name: verifyPackage.branches?.name,
                operator_id: verifyPackage.operator_id,
                position: verifyPackage.position,
                updated: verifyPackage.user_reference === userId
            });
            if (verifyPackage.user_reference !== userId) {
                console.error('❌ La actualización no se aplicó correctamente');
                throw new common_1.HttpException('La asignación de usuario no se pudo completar', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            await this.prisma.activities.create({
                data: {
                    type: 'update',
                    action: 'assign_user_to_package',
                    description: `Usuario asignado al paquete ${existingPackage.tracking_number || existingPackage.id}`,
                    entity_type: 'packages',
                    entity_id: existingPackage.id,
                    operator_id: operatorData.id,
                    branch_id: operator?.branch_id || null,
                    new_values: {
                        user_id: userId,
                        user_name: `${existingUser.first_name} ${existingUser.last_name}`,
                        user_email: existingUser.email,
                        package_tracking: existingPackage.tracking_number,
                        operator: operatorData.email,
                        branch_id: operator?.branch_id || null,
                        branch_name: operator?.branches?.name || null,
                        position: position
                    },
                },
            });
            console.log('✅ Package updated successfully');
            return {
                success: true,
                package: {
                    id: verifyPackage.id,
                    tracking_number: verifyPackage.tracking_number,
                    status: verifyPackage.package_status,
                    updatedAt: verifyPackage.updated_at,
                    user_reference: verifyPackage.user_reference,
                    branch_id: verifyPackage.branch_id,
                    branch_name: verifyPackage.branches?.name,
                    operator_id: verifyPackage.operator_id,
                    position: verifyPackage.position
                },
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: `${existingUser.first_name} ${existingUser.last_name}`,
                },
            };
        }
        catch (error) {
            console.error('❌ Error updating package:', error);
            throw new common_1.HttpException(error.message || 'Error al asignar usuario al paquete', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPackageClient(packageId) {
        try {
            console.log('🔍 Buscando cliente asignado al paquete:', packageId);
            const packageData = await this.prisma.packages.findUnique({
                where: { id: packageId },
                include: {
                    users: {
                        include: {
                            branches: true,
                            plans: true,
                            type_users: true
                        }
                    }
                }
            });
            if (!packageData) {
                console.log('❌ Paquete no encontrado:', packageId);
                throw new common_1.NotFoundException(`Package with ID ${packageId} not found`);
            }
            if (!packageData.user_reference || !packageData.users) {
                console.log('ℹ️ El paquete no tiene usuario asignado');
                return {
                    success: true,
                    hasClient: false,
                    message: 'No hay cliente asignado a este paquete',
                    data: null
                };
            }
            const userData = {
                id: packageData.users.id,
                email: packageData.users.email,
                name: `${packageData.users.first_name || ''} ${packageData.users.last_name || ''}`.trim(),
                firstName: packageData.users.first_name,
                lastName: packageData.users.last_name,
                phone: packageData.users.phone,
                photo: packageData.users.photo_url,
                accountStatus: packageData.users.account_status,
                branchName: packageData.users.branches?.name || '',
                planName: packageData.users.plans?.name || '',
                planRate: packageData.users.plans?.price ? Number(packageData.users.plans.price) : 0,
                userType: packageData.users.type_users?.name || '',
                shipping_insurance: !!packageData.users.shipping_insurance,
                assignedAt: packageData.updated_at
            };
            console.log('✅ Cliente encontrado:', userData.name);
            console.log('🔍 DEBUG - Cliente shipping_insurance:', {
                clientName: userData.name,
                planName: userData.planName,
                shipping_insurance: userData.shipping_insurance,
                original_value: packageData.users.shipping_insurance
            });
            return {
                success: true,
                hasClient: true,
                message: 'Cliente asignado encontrado',
                data: userData
            };
        }
        catch (error) {
            console.error('❌ Error al obtener cliente del paquete:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.HttpException('Error al obtener información del cliente', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAssignedNotInvoicedPercentage(branchId) {
        try {
            console.log('📊 Calculando métricas de paquetes no facturados para sucursal:', branchId);
            const totalPackages = await this.prisma.packages.count({
                where: {
                    branch_id: branchId,
                },
            });
            console.log(`📦 Total de paquetes en la sucursal ${branchId}: ${totalPackages}`);
            if (totalPackages === 0) {
                console.log('❌ No hay paquetes en esta sucursal');
                return {
                    percentage: 0,
                    assignedNotInvoiced: 0,
                    totalPackages: 0,
                    trend: 0,
                    lastMonthPercentage: 0,
                    message: 'No hay paquetes en esta sucursal'
                };
            }
            const samplePackages = await this.prisma.packages.findMany({
                where: {
                    branch_id: branchId,
                },
                take: 5,
                select: {
                    id: true,
                    tracking_number: true,
                    package_status: true,
                    user_reference: true,
                    branch_id: true,
                    created_at: true,
                    invoice_packages: {
                        select: {
                            id: true,
                            invoice_id: true
                        }
                    }
                }
            });
            console.log('📋 Muestra de paquetes en esta sucursal:');
            samplePackages.forEach(pkg => {
                console.log(JSON.stringify({
                    id: pkg.id,
                    tracking: pkg.tracking_number,
                    status: pkg.package_status,
                    branch_id: pkg.branch_id,
                    user_assigned: pkg.user_reference ? 'SÍ' : 'NO',
                    user_id: pkg.user_reference,
                    created_at: pkg.created_at,
                    has_invoices: pkg.invoice_packages.length > 0,
                    invoice_count: pkg.invoice_packages.length
                }, null, 2));
            });
            const assignedNotInvoiced = await this.prisma.packages.count({
                where: {
                    branch_id: branchId,
                    user_reference: { not: null },
                    invoice_packages: {
                        none: {}
                    }
                },
            });
            console.log(`🔍 Paquetes con cliente asignado pero no facturados: ${assignedNotInvoiced}`);
            if (assignedNotInvoiced > 0) {
                const sampleNotInvoiced = await this.prisma.packages.findMany({
                    where: {
                        branch_id: branchId,
                        user_reference: { not: null },
                        invoice_packages: {
                            none: {}
                        }
                    },
                    take: 5,
                    select: {
                        id: true,
                        tracking_number: true,
                        package_status: true,
                        user_reference: true,
                        branch_id: true,
                        created_at: true
                    }
                });
                console.log('📋 Muestra de paquetes con cliente asignado pero no facturados:');
                sampleNotInvoiced.forEach(pkg => {
                    console.log(JSON.stringify({
                        id: pkg.id,
                        tracking: pkg.tracking_number,
                        status: pkg.package_status,
                        branch_id: pkg.branch_id,
                        user_id: pkg.user_reference,
                        created_at: pkg.created_at
                    }, null, 2));
                });
            }
            const percentage = (assignedNotInvoiced / totalPackages) * 100;
            console.log(`📊 Porcentaje calculado: ${percentage.toFixed(2)}%`);
            const currentDate = new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            console.log(`📅 Rango de fechas para último mes: ${firstDayOfLastMonth.toISOString()} hasta ${firstDayOfMonth.toISOString()}`);
            const lastMonthPackages = await this.prisma.packages.count({
                where: {
                    branch_id: branchId,
                    created_at: {
                        gte: firstDayOfLastMonth,
                        lt: firstDayOfMonth,
                    },
                },
            });
            const lastMonthAssignedNotInvoiced = await this.prisma.packages.count({
                where: {
                    branch_id: branchId,
                    user_reference: { not: null },
                    invoice_packages: {
                        none: {}
                    },
                    created_at: {
                        gte: firstDayOfLastMonth,
                        lt: firstDayOfMonth,
                    },
                },
            });
            console.log(`📊 Mes anterior - Total: ${lastMonthPackages}, No facturados: ${lastMonthAssignedNotInvoiced}`);
            const lastMonthPercentage = lastMonthPackages > 0
                ? (lastMonthAssignedNotInvoiced / lastMonthPackages) * 100
                : 0;
            const trend = percentage - lastMonthPercentage;
            console.log(`📈 Tendencia: ${trend.toFixed(2)}% (Actual: ${percentage.toFixed(2)}%, Mes anterior: ${lastMonthPercentage.toFixed(2)}%)`);
            if (totalPackages > 0 && assignedNotInvoiced === 0) {
                console.log('⚠️ Hay paquetes en la sucursal pero ninguno cumple con la condición de tener cliente asignado y no estar facturado');
                const withClient = await this.prisma.packages.count({
                    where: {
                        branch_id: branchId,
                        user_reference: { not: null }
                    }
                });
                const notInvoiced = await this.prisma.packages.count({
                    where: {
                        branch_id: branchId,
                        invoice_packages: {
                            none: {}
                        }
                    }
                });
                console.log(`📊 Diagnóstico adicional - Paquetes con cliente: ${withClient}, Paquetes no facturados: ${notInvoiced}`);
            }
            const result = {
                percentage: Math.round(percentage * 100) / 100,
                assignedNotInvoiced,
                totalPackages,
                trend: Math.round(trend * 100) / 100,
                lastMonthPercentage: Math.round(lastMonthPercentage * 100) / 100,
            };
            console.log('✅ Resultado final de la métrica:', result);
            return result;
        }
        catch (error) {
            console.error('❌ Error al calcular porcentaje de paquetes:', error);
            throw new Error(`Error al calcular estadísticas de paquetes: ${error.message}`);
        }
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map