import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityAction, ActivityStatus, OperatorActivity } from '../activities/interfaces/operator-activity.interface';

@Injectable()
export class PackagesService {
  private readonly COLLECTION = 'packages';

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createPackage(packageData: any, operatorData: { id: string; email: string }) {
    try {
      console.log('👤 Operador que crea el paquete:', {
        operadorId: operatorData.id,
        email: operatorData.email
      });

      // Obtener información del operador
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

      // Obtener información de la sucursal
      let branchName = 'Sucursal no especificada';
      if (operatorDoc.branchReference) {
        const branchId = operatorDoc.branchReference.replace('/branches/', '');
        const branchDoc = await this.firebaseService.findOne('branches', branchId);
        if (branchDoc) {
          branchName = branchDoc.name;
        } else {
          console.warn('⚠️ No se encontró la sucursal del operador:', branchId);
        }
      } else {
        console.warn('⚠️ El operador no tiene una sucursal asignada');
      }

      console.log('📍 Sucursal del operador:', branchName);

      // Crear las etapas de envío
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

      // Crear el paquete con las etapas
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

      // Registrar la actividad
      const activity = {
        operatorId: operatorData.id,
        operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
        action: ActivityAction.PACKAGE_CREATED,
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
        status: ActivityStatus.COMPLETED,
        timestamp: currentTimestamp
      };

      await this.activitiesService.createActivity(activity);
      console.log('✅ Actividad registrada:', activity);

      return { id: packageId, ...packageData, shippingStages };
    } catch (error) {
      console.error('❌ Error al crear el paquete:', error);
      throw error;
    }
  }

  async assignUserToPackage(packageId: string, userId: string, operatorData: { id: string; email: string }) {
    try {
      console.log('🔄 Iniciando proceso de asignación de usuario a paquete');
      console.log('📝 Datos recibidos:', {
        packageId,
        userId,
        operador: operatorData
      });

      // Validar formato de IDs
      if (!packageId?.trim() || !userId?.trim()) {
        const error = new Error('IDs de paquete y usuario son requeridos y no pueden estar vacíos');
        console.error('❌ Error de validación:', error);
        throw error;
      }

      // Validar que el operador existe
      if (!operatorData?.id) {
        const error = new Error('Datos del operador son requeridos');
        console.error('❌ Error de validación:', error);
        throw error;
      }

      // Buscar el paquete por trackingNumber primero
      console.log('🔍 Buscando paquete por tracking number:', packageId);
      const conditions = [
        { field: 'trackingNumber', operator: '==', value: packageId }
      ];
      
      let packagesFound = await this.firebaseService.query(this.COLLECTION, conditions);
      
      let packageDoc;
      if (!packagesFound || packagesFound.length === 0) {
        // Si no se encuentra por trackingNumber, intentar por id directo
        console.log('⚠️ No se encontró por tracking, buscando por id directo');
        packageDoc = await this.firebaseService.findOne(this.COLLECTION, packageId);
        
        if (!packageDoc) {
          // Si no se encuentra por id directo, intentar por packageId
          console.log('⚠️ No se encontró por id directo, buscando por packageId');
          const packageIdConditions = [
            { field: 'packageId', operator: '==', value: packageId }
          ];
          packagesFound = await this.firebaseService.query(this.COLLECTION, packageIdConditions);
          
          if (packagesFound && packagesFound.length > 0) {
            packageDoc = packagesFound[0];
          }
        }
      } else {
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

      // Validar que el usuario existe antes de continuar
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

      // Obtener la tarifa del plan del usuario
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

          // Extraer planId según el formato
          if (typeof userDoc.subscriptionPlan === 'string') {
            planId = userDoc.subscriptionPlan.split('/').pop();
          } else if (typeof userDoc.subscriptionPlan === 'object') {
            if (userDoc.subscriptionPlan.id) {
              planId = userDoc.subscriptionPlan.id;
            } else if (userDoc.subscriptionPlan.path) {
              planId = userDoc.subscriptionPlan.path.split('/').pop();
            }
          }

          if (!planId) {
            console.warn('⚠️ No se pudo extraer el planId del subscriptionPlan');
          } else {
            console.log('🔍 PlanId extraído:', planId);
            const planDoc = await this.firebaseService.findOne('plans', planId);
            if (planDoc) {
              planRate = planDoc.price || 0;
              console.log('💰 Plan rate obtenido:', planRate);
            } else {
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
      } catch (planError) {
        console.error('❌ Error al procesar el subscriptionPlan:', planError);
        console.error('Stack:', planError.stack);
        // En caso de error, aún devolvemos la información básica del cliente
        clientInfo = {
          id: userId,
          name: `${userDoc.firstName} ${userDoc.lastName}`,
          email: userDoc.email,
          planRate: 0
        };
      }

      // Normalizar la referencia actual del usuario (si existe)
      const currentUserId = packageDoc.userReference 
        ? (typeof packageDoc.userReference === 'string' 
            ? packageDoc.userReference.split('/').pop()
            : packageDoc.userReference.id)
        : null;

      // Validar si el paquete ya tiene usuario asignado
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

      // Obtener información del operador
      console.log('🔍 Verificando información del operador:', operatorData.id);
      let operatorDoc = await this.firebaseService.findOne('operators', operatorData.id);
      if (!operatorDoc) {
        // Si no se encuentra en operators, intentar en users
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

      // Construir la referencia del usuario con el formato correcto
      const userReference = `/users/${userId}`;
      console.log('📝 Actualizando paquete con referencia:', userReference);

      // Actualizar el paquete con la referencia del usuario
      await this.firebaseService.update(this.COLLECTION, packageDoc.id, {
        userReference,
        updatedAt: new Date().toISOString(),
        updatedBy: operatorData.id
      });

      // Registrar la actividad
      const activity = {
        operatorId: operatorData.id,
        operatorName: `${operatorDoc.firstName} ${operatorDoc.lastName}`,
        action: currentUserId ? ActivityAction.PACKAGE_USER_UPDATED : ActivityAction.PACKAGE_ASSIGNED,
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
          status: ActivityStatus.COMPLETED
        },
        status: ActivityStatus.COMPLETED,
        timestamp: new Date().toISOString()
      };

      let createdActivity: OperatorActivity | null = null;
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
      } catch (activityError) {
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

    } catch (error) {
      console.error('❌ Error al asignar usuario al paquete:', error);
      throw error;
    }
  }

  async updatePackageStatus(trackingNumber: string, status: string, operatorData: { id: string; email: string }) {
    try {
      console.log('👤 Operador que actualiza el estado:', {
        operadorId: operatorData.id,
        email: operatorData.email
      });

      // Buscar el paquete por tracking number
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

      // Obtener información del operador
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

      // Actualizar el estado del paquete
      await this.firebaseService.update(this.COLLECTION, packageDoc.id, {
        packageStatus: status,
        updatedAt: new Date().toISOString(),
        updatedBy: operatorData.id
      });

      // Registrar la actividad
      let action = ActivityAction.PACKAGE_STATUS_UPDATED;
      let description = `Estado del paquete ${packageDoc.trackingNumber} actualizado a ${status}`;

      // Si el estado es INVOICED, usar una acción específica
      if (status === 'INVOICED') {
        action = ActivityAction.PACKAGE_INVOICED;
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
        status: ActivityStatus.COMPLETED,
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

    } catch (error) {
      console.error('❌ Error al actualizar el estado del paquete:', error);
      throw error;
    }
  }

  async findByTracking(trackingNumber: string): Promise<any> {
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
      
      // Si el paquete tiene una referencia de usuario, obtener la información del cliente
      let clientInfo = null;
      if (packageDoc.userReference) {
        try {
          // Extraer el ID del usuario de la referencia
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
          
          // Obtener la tarifa del plan del usuario
          let planId = null;
          let planRate = 0;
          
          if (userDoc.subscriptionPlan) {
            console.log('🔍 Analizando subscriptionPlan:', {
              tipo: typeof userDoc.subscriptionPlan,
              valor: userDoc.subscriptionPlan,
              esObjeto: typeof userDoc.subscriptionPlan === 'object'
            });

            // Extraer planId según el formato
            if (typeof userDoc.subscriptionPlan === 'string') {
              planId = userDoc.subscriptionPlan.split('/').pop();
            } else if (typeof userDoc.subscriptionPlan === 'object') {
              if (userDoc.subscriptionPlan.id) {
                planId = userDoc.subscriptionPlan.id;
              } else if (userDoc.subscriptionPlan.path) {
                planId = userDoc.subscriptionPlan.path.split('/').pop();
              }
            }

            if (!planId) {
              console.warn('⚠️ No se pudo extraer el planId del subscriptionPlan');
            } else {
              console.log('🔍 PlanId extraído:', planId);
              const planDoc = await this.firebaseService.findOne('plans', planId);
              if (planDoc) {
                planRate = planDoc.price || 0;
                console.log('💰 Plan rate obtenido:', planRate);
              } else {
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
        } catch (error) {
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
    } catch (error) {
      console.error('❌ Error al buscar el paquete:', error);
      throw error;
    }
  }

  private async getOperatorInfo(operatorId: string) {
    try {
      // Primero buscar en la colección de users
      const userDoc = await this.firebaseService.findOne('users', operatorId);
      if (userDoc) {
        return userDoc;
      }

      // Si no se encuentra en users, buscar en operators
      const operatorDoc = await this.firebaseService.findOne('operators', operatorId);
      if (operatorDoc) {
        return operatorDoc;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al obtener información del operador:', error);
      return null;
    }
  }
} 