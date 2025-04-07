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
const firebase_service_1 = require("../firebase/firebase.service");
const activities_service_1 = require("../activities/activities.service");
const operator_activity_interface_1 = require("../activities/interfaces/operator-activity.interface");
let PackagesService = class PackagesService {
    constructor(firebaseService, activitiesService) {
        this.firebaseService = firebaseService;
        this.activitiesService = activitiesService;
        this.COLLECTION = 'packages';
    }
    async createPackage(packageData, operatorData) {
        try {
            console.log('👤 Operador que crea el paquete:', {
                operadorId: operatorData.id,
                email: operatorData.email
            });
            const operatorDoc = await this.firebaseService.findOne('operators', operatorData.id);
            if (!operatorDoc) {
                console.error('❌ Error: Operador no encontrado en la base de datos');
                throw new Error('Operador no encontrado');
            }
            console.log('ℹ️ Información del operador:', {
                id: operatorDoc.id,
                nombre: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                email: operatorDoc.email,
                branchReference: operatorDoc.branchReference
            });
            let branchName = 'Sucursal no especificada';
            if (operatorDoc.branchReference) {
                const branchId = operatorDoc.branchReference.replace('/branches/', '');
                const branchDoc = await this.firebaseService.findOne('branches', branchId);
                if (branchDoc) {
                    branchName = branchDoc.name;
                }
                else {
                    console.warn('⚠️ No se encontró la sucursal del operador:', branchId);
                }
            }
            else {
                console.warn('⚠️ El operador no tiene una sucursal asignada');
            }
            console.log('📍 Sucursal del operador:', branchName);
            const currentTimestamp = new Date().toISOString();
            const shippingStages = [
                {
                    location: branchName,
                    photo: "",
                    stage: "Panama",
                    status: "8",
                    updatedTimestamp: currentTimestamp
                },
                {
                    location: "Miami Warehouse 1",
                    photo: "",
                    stage: "Miami",
                    status: "8",
                    updatedTimestamp: currentTimestamp
                }
            ];
            const packageId = await this.firebaseService.create(this.COLLECTION, {
                ...packageData,
                shippingStages,
                createdAt: currentTimestamp,
                updatedAt: currentTimestamp,
                createdBy: operatorData.id
            });
            console.log('📦 Paquete creado:', {
                id: packageId,
                tracking: packageData.trackingNumber,
                createdBy: operatorData.id,
                stages: shippingStages
            });
            const activity = {
                operatorId: operatorData.id,
                operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                action: operator_activity_interface_1.ActivityAction.PACKAGE_CREATED,
                description: `Paquete ${packageData.trackingNumber} creado en el sistema`,
                entityType: 'package',
                entityId: packageId,
                metadata: {
                    packageId,
                    trackingNumber: packageData.trackingNumber,
                    operatorEmail: operatorData.email,
                    weight: packageData.weight,
                    volumetricWeight: packageData.volumetricWeight,
                    dimensions: {
                        length: packageData.length,
                        width: packageData.width,
                        height: packageData.height
                    },
                    branchName
                },
                status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                timestamp: currentTimestamp
            };
            await this.activitiesService.createActivity(activity);
            console.log('✅ Actividad registrada:', activity);
            return { id: packageId, ...packageData, shippingStages };
        }
        catch (error) {
            console.error('❌ Error al crear el paquete:', error);
            throw error;
        }
    }
    async assignUserToPackage(packageId, userId, operatorData) {
        try {
            console.log('🔄 Iniciando proceso de asignación de usuario a paquete');
            console.log('📝 Datos recibidos:', {
                packageId,
                userId,
                operador: operatorData
            });
            if (!packageId?.trim() || !userId?.trim()) {
                const error = new Error('IDs de paquete y usuario son requeridos y no pueden estar vacíos');
                console.error('❌ Error de validación:', error);
                throw error;
            }
            if (!operatorData?.id) {
                const error = new Error('Datos del operador son requeridos');
                console.error('❌ Error de validación:', error);
                throw error;
            }
            console.log('🔍 Buscando paquete por tracking number:', packageId);
            const conditions = [
                { field: 'trackingNumber', operator: '==', value: packageId }
            ];
            let packagesFound = await this.firebaseService.query(this.COLLECTION, conditions);
            let packageDoc;
            if (!packagesFound || packagesFound.length === 0) {
                console.log('⚠️ No se encontró por tracking, buscando por id directo');
                packageDoc = await this.firebaseService.findOne(this.COLLECTION, packageId);
                if (!packageDoc) {
                    console.log('⚠️ No se encontró por id directo, buscando por packageId');
                    const packageIdConditions = [
                        { field: 'packageId', operator: '==', value: packageId }
                    ];
                    packagesFound = await this.firebaseService.query(this.COLLECTION, packageIdConditions);
                    if (packagesFound && packagesFound.length > 0) {
                        packageDoc = packagesFound[0];
                    }
                }
            }
            else {
                packageDoc = packagesFound[0];
            }
            if (!packageDoc) {
                const error = new Error(`Paquete con ID/tracking ${packageId} no encontrado`);
                console.error('❌ Error:', error);
                throw error;
            }
            console.log('📦 Información del paquete encontrado:', {
                id: packageDoc.id,
                tracking: packageDoc.trackingNumber,
                packageId: packageDoc.packageId,
                estado: packageDoc.packageStatus,
                userReference: packageDoc.userReference
            });
            console.log('🔍 Verificando existencia del usuario:', userId);
            const userDoc = await this.firebaseService.findOne('users', userId);
            if (!userDoc) {
                const error = new Error(`Usuario con ID ${userId} no encontrado`);
                console.error('❌ Error:', error);
                throw error;
            }
            console.log('📄 Datos completos del usuario:', {
                id: userDoc.id,
                firstName: userDoc.firstName,
                lastName: userDoc.lastName,
                email: userDoc.email,
                subscriptionPlan: userDoc.subscriptionPlan
            });
            console.log('🔍 Analizando subscriptionPlan:', {
                tipo: typeof userDoc.subscriptionPlan,
                valor: userDoc.subscriptionPlan,
                esObjeto: userDoc.subscriptionPlan instanceof Object,
                tieneId: userDoc.subscriptionPlan?.id !== undefined,
                tienePath: userDoc.subscriptionPlan?.path !== undefined
            });
            let planId = null;
            let planRate = 0;
            let clientInfo = null;
            try {
                if (userDoc.subscriptionPlan) {
                    console.log('🔍 Analizando subscriptionPlan:', {
                        tipo: typeof userDoc.subscriptionPlan,
                        valor: userDoc.subscriptionPlan,
                        esObjeto: typeof userDoc.subscriptionPlan === 'object'
                    });
                    if (typeof userDoc.subscriptionPlan === 'string') {
                        planId = userDoc.subscriptionPlan.split('/').pop();
                    }
                    else if (typeof userDoc.subscriptionPlan === 'object') {
                        if (userDoc.subscriptionPlan.id) {
                            planId = userDoc.subscriptionPlan.id;
                        }
                        else if (userDoc.subscriptionPlan.path) {
                            planId = userDoc.subscriptionPlan.path.split('/').pop();
                        }
                    }
                    if (!planId) {
                        console.warn('⚠️ No se pudo extraer el planId del subscriptionPlan');
                    }
                    else {
                        console.log('🔍 PlanId extraído:', planId);
                        const planDoc = await this.firebaseService.findOne('plans', planId);
                        if (planDoc) {
                            planRate = planDoc.price || 0;
                            console.log('💰 Plan rate obtenido:', planRate);
                        }
                        else {
                            console.warn('⚠️ Plan no encontrado:', planId);
                        }
                    }
                }
                clientInfo = {
                    id: userId,
                    name: `${userDoc.firstName} ${userDoc.lastName}`,
                    email: userDoc.email,
                    planRate: planRate
                };
                console.log('👤 Información del cliente procesada:', clientInfo);
            }
            catch (planError) {
                console.error('❌ Error al procesar el subscriptionPlan:', planError);
                console.error('Stack:', planError.stack);
                clientInfo = {
                    id: userId,
                    name: `${userDoc.firstName} ${userDoc.lastName}`,
                    email: userDoc.email,
                    planRate: 0
                };
            }
            const currentUserId = packageDoc.userReference
                ? (typeof packageDoc.userReference === 'string'
                    ? packageDoc.userReference.split('/').pop()
                    : packageDoc.userReference.id)
                : null;
            if (currentUserId) {
                if (currentUserId === userId) {
                    console.log('ℹ️ El paquete ya está asignado al mismo usuario');
                    return {
                        id: userId,
                        message: 'El paquete ya está asignado a este usuario'
                    };
                }
                console.log('⚠️ El paquete tiene un usuario asignado diferente:', {
                    usuarioActual: currentUserId,
                    nuevoUsuario: userId
                });
            }
            console.log('🔍 Verificando información del operador:', operatorData.id);
            let operatorDoc = await this.firebaseService.findOne('operators', operatorData.id);
            if (!operatorDoc) {
                const operatorUserDoc = await this.firebaseService.findOne('users', operatorData.id);
                if (!operatorUserDoc) {
                    const error = new Error(`Operador con ID ${operatorData.id} no encontrado`);
                    console.error('❌ Error:', error);
                    throw error;
                }
                operatorDoc = operatorUserDoc;
            }
            console.log('ℹ️ Información del operador:', {
                id: operatorDoc.id,
                nombre: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                email: operatorDoc.email,
                role: operatorDoc.role
            });
            const userReference = `/users/${userId}`;
            console.log('📝 Actualizando paquete con referencia:', userReference);
            await this.firebaseService.update(this.COLLECTION, packageDoc.id, {
                userReference,
                updatedAt: new Date().toISOString(),
                updatedBy: operatorData.id
            });
            const activity = {
                operatorId: operatorData.id,
                operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                action: currentUserId ? operator_activity_interface_1.ActivityAction.PACKAGE_USER_UPDATED : operator_activity_interface_1.ActivityAction.PACKAGE_ASSIGNED,
                description: currentUserId
                    ? `Usuario del paquete ${packageDoc.trackingNumber} actualizado a ${userDoc.firstName} ${userDoc.lastName}`
                    : `Paquete ${packageDoc.trackingNumber} asignado al cliente ${userDoc.firstName} ${userDoc.lastName}`,
                entityType: 'package',
                entityId: packageDoc.id,
                metadata: {
                    packageId: packageDoc.id,
                    trackingNumber: packageDoc.trackingNumber,
                    userId,
                    userEmail: userDoc.email,
                    operatorEmail: operatorData.email,
                    userReference,
                    previousUserReference: packageDoc.userReference || null,
                    status: operator_activity_interface_1.ActivityStatus.COMPLETED
                },
                status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                timestamp: new Date().toISOString()
            };
            let createdActivity = null;
            try {
                console.log('🔄 Intentando registrar actividad en el sistema...');
                createdActivity = await this.activitiesService.createActivity(activity);
                if (!createdActivity?.id) {
                    console.error('❌ Error: No se recibió ID de actividad');
                    throw new Error('No se pudo registrar la actividad');
                }
                console.log('✅ Actividad registrada exitosamente:', {
                    activityId: createdActivity.id,
                    action: createdActivity.action,
                    description: createdActivity.description,
                    timestamp: createdActivity.timestamp
                });
            }
            catch (activityError) {
                console.error('❌ Error al registrar la actividad:', {
                    error: activityError.message,
                    activity: {
                        action: activity.action,
                        description: activity.description,
                        entityType: activity.entityType,
                        entityId: activity.entityId
                    }
                });
            }
            const response = {
                id: userId,
                name: `${userDoc.firstName} ${userDoc.lastName}`,
                email: userDoc.email,
                message: currentUserId ? 'Usuario del paquete actualizado' : 'Usuario asignado correctamente',
                activityId: createdActivity?.id || null
            };
            console.log('✅ Proceso completado exitosamente:', {
                ...response,
                activityRegistered: !!createdActivity?.id
            });
            return response;
        }
        catch (error) {
            console.error('❌ Error al asignar usuario al paquete:', error);
            throw error;
        }
    }
    async updatePackageStatus(trackingNumber, status, operatorData) {
        try {
            console.log('👤 Operador que actualiza el estado:', {
                operadorId: operatorData.id,
                email: operatorData.email
            });
            console.log('🔍 Buscando paquete por tracking:', trackingNumber);
            const conditions = [
                { field: 'trackingNumber', operator: '==', value: trackingNumber }
            ];
            const packagesFound = await this.firebaseService.query(this.COLLECTION, conditions);
            if (!packagesFound || packagesFound.length === 0) {
                console.error('❌ No se encontró el paquete con tracking:', trackingNumber);
                throw new Error(`No se encontró el paquete con tracking ${trackingNumber}`);
            }
            const packageDoc = packagesFound[0];
            console.log('📦 Paquete encontrado:', {
                id: packageDoc.id,
                tracking: packageDoc.trackingNumber,
                estadoAnterior: packageDoc.packageStatus,
                nuevoEstado: status
            });
            const operatorDoc = await this.getOperatorInfo(operatorData.id);
            if (!operatorDoc) {
                console.error('❌ Error: Operador no encontrado');
                throw new Error('Operador no encontrado');
            }
            console.log('ℹ️ Información del operador:', {
                id: operatorDoc.id,
                nombre: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                email: operatorDoc.email
            });
            await this.firebaseService.update(this.COLLECTION, packageDoc.id, {
                packageStatus: status,
                updatedAt: new Date().toISOString(),
                updatedBy: operatorData.id
            });
            let action = operator_activity_interface_1.ActivityAction.PACKAGE_STATUS_UPDATED;
            let description = `Estado del paquete ${packageDoc.trackingNumber} actualizado a ${status}`;
            if (status === 'INVOICED') {
                action = operator_activity_interface_1.ActivityAction.PACKAGE_INVOICED;
                description = `Paquete ${packageDoc.trackingNumber} facturado`;
            }
            const activity = {
                operatorId: operatorData.id,
                operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
                action: action,
                description: description,
                entityType: 'package',
                entityId: packageDoc.id,
                metadata: {
                    packageId: packageDoc.id,
                    trackingNumber: packageDoc.trackingNumber,
                    oldStatus: packageDoc.packageStatus,
                    newStatus: status,
                    operatorEmail: operatorData.email
                },
                status: operator_activity_interface_1.ActivityStatus.COMPLETED,
                timestamp: new Date().toISOString()
            };
            await this.activitiesService.createActivity(activity);
            console.log('✅ Actividad registrada:', activity);
            return {
                success: true,
                message: 'Estado del paquete actualizado correctamente',
                packageId: packageDoc.id,
                tracking: packageDoc.trackingNumber,
                newStatus: status
            };
        }
        catch (error) {
            console.error('❌ Error al actualizar el estado del paquete:', error);
            throw error;
        }
    }
    async findByTracking(trackingNumber) {
        try {
            console.log('🔍 Buscando paquete por tracking number:', trackingNumber);
            const conditions = [
                { field: 'trackingNumber', operator: '==', value: trackingNumber }
            ];
            const packagesFound = await this.firebaseService.query(this.COLLECTION, conditions);
            if (!packagesFound || packagesFound.length === 0) {
                console.log('❌ No se encontró ningún paquete con el tracking number:', trackingNumber);
                return null;
            }
            const packageDoc = packagesFound[0];
            console.log('📦 Paquete encontrado:', {
                id: packageDoc.id,
                tracking: packageDoc.trackingNumber,
                estado: packageDoc.packageStatus,
                userReference: packageDoc.userReference
            });
            let clientInfo = null;
            if (packageDoc.userReference) {
                try {
                    const userId = typeof packageDoc.userReference === 'string'
                        ? packageDoc.userReference.split('/').pop()
                        : packageDoc.userReference.id;
                    console.log('🔍 Buscando información del usuario:', userId);
                    const userDoc = await this.firebaseService.findOne('users', userId);
                    if (!userDoc) {
                        console.warn('⚠️ Usuario no encontrado:', userId);
                        return {
                            ...packageDoc,
                            invoice: packageDoc.invoiceReference,
                            client: null
                        };
                    }
                    console.log('📄 Datos del usuario:', {
                        id: userDoc.id,
                        firstName: userDoc.firstName,
                        lastName: userDoc.lastName,
                        email: userDoc.email,
                        subscriptionPlan: userDoc.subscriptionPlan
                    });
                    let planId = null;
                    let planRate = 0;
                    if (userDoc.subscriptionPlan) {
                        console.log('🔍 Analizando subscriptionPlan:', {
                            tipo: typeof userDoc.subscriptionPlan,
                            valor: userDoc.subscriptionPlan,
                            esObjeto: typeof userDoc.subscriptionPlan === 'object'
                        });
                        if (typeof userDoc.subscriptionPlan === 'string') {
                            planId = userDoc.subscriptionPlan.split('/').pop();
                        }
                        else if (typeof userDoc.subscriptionPlan === 'object') {
                            if (userDoc.subscriptionPlan.id) {
                                planId = userDoc.subscriptionPlan.id;
                            }
                            else if (userDoc.subscriptionPlan.path) {
                                planId = userDoc.subscriptionPlan.path.split('/').pop();
                            }
                        }
                        if (!planId) {
                            console.warn('⚠️ No se pudo extraer el planId del subscriptionPlan');
                        }
                        else {
                            console.log('🔍 PlanId extraído:', planId);
                            const planDoc = await this.firebaseService.findOne('plans', planId);
                            if (planDoc) {
                                planRate = planDoc.price || 0;
                                console.log('💰 Plan rate obtenido:', planRate);
                            }
                            else {
                                console.warn('⚠️ Plan no encontrado:', planId);
                            }
                        }
                    }
                    clientInfo = {
                        id: userId,
                        name: `${userDoc.firstName} ${userDoc.lastName}`,
                        email: userDoc.email,
                        planRate: planRate
                    };
                    console.log('👤 Información del cliente procesada:', clientInfo);
                }
                catch (error) {
                    console.error('❌ Error al procesar información del usuario:', error);
                    console.error('Stack:', error.stack);
                    clientInfo = null;
                }
            }
            const result = {
                ...packageDoc,
                invoice: packageDoc.invoiceReference,
                client: clientInfo
            };
            console.log('📦 Resultado final:', {
                id: result.id,
                tracking: result.trackingNumber,
                estado: result.packageStatus,
                invoice: result.invoice,
                clienteId: result.client?.id
            });
            return result;
        }
        catch (error) {
            console.error('❌ Error al buscar el paquete:', error);
            throw error;
        }
    }
    async getOperatorInfo(operatorId) {
        try {
            const userDoc = await this.firebaseService.findOne('users', operatorId);
            if (userDoc) {
                return userDoc;
            }
            const operatorDoc = await this.firebaseService.findOne('operators', operatorId);
            if (operatorDoc) {
                return operatorDoc;
            }
            return null;
        }
        catch (error) {
            console.error('❌ Error al obtener información del operador:', error);
            return null;
        }
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        activities_service_1.ActivitiesService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map