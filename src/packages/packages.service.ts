import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDimensionsDto } from './dto/update-dimensions.dto';
import { Prisma } from '@prisma/client';
import { UpdateWeightsDto } from './dto/update-weights.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.packagesWhereUniqueInput;
    where?: Prisma.packagesWhereInput;
    orderBy?: Prisma.packagesOrderByWithRelationInput;
  }) {
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
    } catch (error) {
      console.error('Error fetching packages:', error);
      throw new Error('Failed to fetch packages');
    }
  }

  async findOne(id: string) {
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
        throw new NotFoundException(`Package with ID ${id} not found`);
      }

      // Preparar los datos del usuario si existe
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching package:', error);
      throw new Error('Failed to fetch package');
    }
  }

  async findByTracking(trackingNumber: string) {
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
      
      // Si hay un usuario asignado, obtener información detallada
      let userData = null;
      if (packageData.user_reference && packageData.users) {
        console.log('👤 Usuario asignado al paquete:', packageData.user_reference);
        
        // Log para depurar la estructura del objeto de usuario
        console.log('🔍 DEBUG - Estructura del usuario:', {
          keys: Object.keys(packageData.users),
          user_id: packageData.users.id,
          first_name: packageData.users.first_name,
          email: packageData.users.email
        });
        
        // Verificación de propiedades específicas usando indexación segura
        const userObj = packageData.users as any; // Casting para acceso seguro por indexación
        
        // Datos extendidos del cliente, similar a getPackageClient
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
      } else {
        console.log('ℹ️ El paquete no tiene usuario asignado');
      }
      
      // Transformar el formato de los nombres de campos para compatibilidad
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
        user: userData, // Incluir la información del usuario en la respuesta
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
    } catch (error) {
      console.error('❌ Error al buscar paquete por tracking:', error);
      return null;
    }
  }

  /**
   * Genera un código de casillero basado en el número de tracking
   * @param tracking Número de tracking del paquete
   * @returns Código de casillero en formato {número}{letra}
   */
  private generarCodigoCasillero(tracking: string): string {
    // Extraer solo los números del tracking
    const numeros = tracking.replace(/\D/g, ""); // Elimina letras y deja solo números

    if (numeros.length < 2) {
      console.log('⚠️ Tracking no tiene suficientes números para generar código:', tracking);
      return "0A"; // Valor por defecto si no hay suficientes números
    }

    // Tomar el penúltimo dígito
    const penultimoDigito = numeros[numeros.length - 2];

    // Tomar el último dígito y convertirlo en una letra
    const ultimoDigito = parseInt(numeros[numeros.length - 1], 10);

    let letra = "C"; // Por defecto, 6-7-8-9 → C
    if (ultimoDigito <= 2) letra = "A"; // 0-1-2 → A
    else if (ultimoDigito <= 5) letra = "B"; // 3-4-5 → B

    // Retornar el código de casillero
    const codigoCasillero = `${penultimoDigito}${letra}`;
    console.log(`🏷️ Código de casillero generado para tracking ${tracking}: ${codigoCasillero}`);
    return codigoCasillero;
  }

  async createPackage(packageData: any, operatorData: { id: string, email: string }) {
    try {
      console.log('==================================');
      console.log('📦 Creando nuevo paquete en Prisma:', packageData.trackingNumber);
      console.log('👤 Operador:', {
        id: operatorData.id,
        email: operatorData.email
      });
      
      // Mostrar todos los datos recibidos
      console.log('📋 Datos completos del paquete recibidos:');
      console.log(JSON.stringify(packageData, null, 2));
      
      // Obtener un operador válido para asignar como propietario
      let operatorId = null;
      let branchId = null;
      let userId = null;
      
      // Verificar si el ID es un UUID válido (estructura básica)
      const isValidUUID = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      
      // Comprobar si el operador existe en la tabla operators
      if (operatorData.id && isValidUUID(operatorData.id)) {
        try {
          // Verificar si el ID del operador existe en la tabla operators y obtener su branch_id
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
            
            // Obtener la branch_id del operador
            if (operator.branch_id) {
              console.log('✅ Sucursal del operador encontrada, usando ID para branch_id:', operator.branch_id);
              branchId = operator.branch_id;
              console.log('📍 Nombre de la sucursal:', operator.branches?.name || 'No disponible');
            } else {
              console.log('⚠️ El operador no tiene una sucursal asignada');
            }
          } else {
            console.log('⚠️ El ID proporcionado no corresponde a un operador en la base de datos:', operatorData.id);
          }
        } catch (error) {
          console.error('❌ Error al verificar operador:', error);
        }
      } else {
        console.log('⚠️ ID de operador no válido o no es UUID:', operatorData.id);
      }
      
      // Para user_reference, vamos a establecerlo como null por defecto
      // No buscamos un usuario predeterminado
      console.log('⚠️ No se va a asignar user_reference, se usará null');
      
      // Mapear el estado a un valor válido del enum package_status_enum
      const packageStatus = this.mapStatusToValidEnum(packageData.packageStatus || 'pending');

      // Generar código de casillero basado en el tracking number
      const posicionCasillero = this.generarCodigoCasillero(packageData.trackingNumber);
      console.log('📍 Posición de casillero generada:', posicionCasillero);
      
      // Construir el objeto con los datos que se enviarán a la base de datos
      const createData = {
        tracking_number: packageData.trackingNumber,
        package_status: packageStatus as any,
        weight: packageData.weight !== undefined ? packageData.weight : null,
        volumetric_weight: packageData.volumetricWeight !== undefined ? packageData.volumetricWeight : 
                          (packageData.volWeight !== undefined ? packageData.volWeight : null),
        length: packageData.length !== undefined ? packageData.length : null,
        width: packageData.width !== undefined ? packageData.width : null,
        height: packageData.height !== undefined ? packageData.height : null,
        insurance: packageData.insurance || false,
        shipping_stages: packageData.shippingStages || [],
        user_reference: null, // Establecer como null explícitamente
        position: posicionCasillero // Guardar la posición del casillero
      };
      
      // Solo añadir operator_id si es un ID válido que existe en la tabla operators
      if (operatorId) {
        createData['operator_id'] = operatorId;
      }
      
      // Añadir branch_id si se encontró una sucursal para el operador
      if (branchId) {
        createData['branch_id'] = branchId;
      }
      
      // Mostrar datos que se enviarán a la base de datos
      console.log('📊 DATOS QUE SE ENVIARÁN A LA BASE DE DATOS:');
      console.log(JSON.stringify(createData, null, 2));
      
      // Crear el paquete en la base de datos
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
        position: newPackage.position // Mostramos la posición asignada
      });
      return newPackage;
    } catch (error) {
      console.error('❌ Error al crear paquete:', error);
      throw new Error(`Failed to create package: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      const existingPackage = await this.prisma.packages.findUnique({
        where: { id },
      });

      if (!existingPackage) {
        throw new NotFoundException(`Package with ID ${id} not found`);
      }

      // Verificar si el paquete ya tiene una posición asignada, si no, generarla
      let position = existingPackage.position;
      if (!position && existingPackage.tracking_number) {
        position = this.generarCodigoCasillero(existingPackage.tracking_number);
        console.log('📍 Generada posición de casillero para el paquete:', position);
      }

      const updatedPackage = await this.prisma.packages.update({
        where: { id },
        data: {
          package_status: status as any,
          position: position, // Guardar la posición
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Package status updated successfully',
        data: updatedPackage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating package status:', error);
      throw new Error('Failed to update package status');
    }
  }

  async updateDimensions(id: string, updateDimensionsDto: UpdateDimensionsDto) {
    try {
      // Verificar si el paquete existe
      const existingPackage = await this.prisma.packages.findUnique({
        where: { id },
      });

      if (!existingPackage) {
        throw new NotFoundException(`Package with ID ${id} not found`);
      }

      // Calcular el peso volumétrico si no se proporciona
      let volumetricWeight = updateDimensionsDto.volumetric_weight;
      if (!volumetricWeight && updateDimensionsDto.length && updateDimensionsDto.width && updateDimensionsDto.height) {
        // Fórmula estándar para calcular el peso volumétrico (L x W x H / 5000)
        volumetricWeight = (updateDimensionsDto.length * updateDimensionsDto.width * updateDimensionsDto.height) / 5000;
      }

      // Verificar si el paquete ya tiene una posición asignada, si no, generarla
      let position = existingPackage.position;
      if (!position && existingPackage.tracking_number) {
        position = this.generarCodigoCasillero(existingPackage.tracking_number);
        console.log('📍 Generada posición de casillero para el paquete:', position);
      }

      // Actualizar las dimensiones del paquete
      const updatedPackage = await this.prisma.packages.update({
        where: { id },
        data: {
          length: updateDimensionsDto.length !== undefined ? updateDimensionsDto.length : existingPackage.length,
          width: updateDimensionsDto.width !== undefined ? updateDimensionsDto.width : existingPackage.width,
          height: updateDimensionsDto.height !== undefined ? updateDimensionsDto.height : existingPackage.height,
          weight: updateDimensionsDto.weight !== undefined ? updateDimensionsDto.weight : existingPackage.weight,
          volumetric_weight: volumetricWeight !== undefined ? volumetricWeight : existingPackage.volumetric_weight,
          is_fragile: updateDimensionsDto.is_fragile !== undefined ? updateDimensionsDto.is_fragile : existingPackage.is_fragile,
          position: position, // Guardar la posición
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating package dimensions:', error);
      throw new Error('Failed to update package dimensions');
    }
  }

  async updateWeights(id: string, updateWeightsDto: UpdateWeightsDto) {
    try {
      // Verificar si el paquete existe
      const existingPackage = await this.prisma.packages.findUnique({
        where: { id },
      });

      if (!existingPackage) {
        throw new NotFoundException(`Package with ID ${id} not found`);
      }

      // Verificar si el paquete ya tiene una posición asignada, si no, generarla
      let position = existingPackage.position;
      if (!position && existingPackage.tracking_number) {
        position = this.generarCodigoCasillero(existingPackage.tracking_number);
        console.log('📍 Generada posición de casillero para el paquete:', position);
      }

      // Actualizar los pesos del paquete
      const updatedPackage = await this.prisma.packages.update({
        where: { id },
        data: {
          weight: updateWeightsDto.weight,
          volumetric_weight: updateWeightsDto.volumetric_weight,
          position: position, // Guardar la posición
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating package weights:', error);
      throw new Error('Failed to update package weights');
    }
  }

  async updatePackageStatus(trackingNumber: string, status: string, operatorData?: { id: string, email: string }) {
    try {
      console.log(`🔄 Actualizando estado del paquete ${trackingNumber} a ${status}`);
      
      // Buscar el paquete por tracking number
      const existingPackage = await this.prisma.packages.findFirst({
        where: { tracking_number: trackingNumber },
      });

      if (!existingPackage) {
        console.log('❌ Paquete no encontrado:', trackingNumber);
        throw new NotFoundException(`Package with tracking number ${trackingNumber} not found`);
      }

      console.log('🔄 Paquete encontrado, actualizando estado:', existingPackage.id);
      
      // Mapear el estado proporcionado a un valor válido en el enum de Prisma
      const mappedStatus = this.mapStatusToValidEnum(status);
      
      // Verificar si el paquete ya tiene una posición asignada, si no, generarla
      let position = existingPackage.position;
      if (!position) {
        position = this.generarCodigoCasillero(trackingNumber);
        console.log('📍 Generada posición de casillero para el paquete:', position);
      }
      
      // Actualizar el estado del paquete
      const updatedPackage = await this.prisma.packages.update({
        where: { id: existingPackage.id },
        data: {
          package_status: mappedStatus as any,
          position: position, // Guardar la posición
          updated_at: new Date(),
        },
      });

      console.log('✅ Estado actualizado exitosamente:', {
        id: updatedPackage.id,
        status: updatedPackage.package_status,
        position: updatedPackage.position,
        originalStatus: status // guardar el estado original para referencia
      });

      return {
        success: true,
        message: 'Package status updated successfully',
        data: updatedPackage,
      };
    } catch (error) {
      console.error('❌ Error al actualizar estado del paquete:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update package status: ${error.message}`);
    }
  }
  
  /**
   * Mapea un estado de cualquier formato a un valor válido del enum package_status_enum
   * @param inputStatus El estado proporcionado que se debe mapear
   * @returns Un valor válido para el enum package_status_enum
   */
  private mapStatusToValidEnum(inputStatus: string): string {
    console.log('🔄 Mapeando estado a enum válido:', inputStatus);
    
    // Asegurarse de que es string y convertir a minúsculas para comparar
    const status = String(inputStatus || '').toLowerCase();
    
    // Mapa de equivalencias de estados a valores válidos del enum
    const statusMap: Record<string, string> = {
      // Valores numéricos (comunes en sistemas externos)
      '0': 'canceled',
      '1': 'in_transit',
      '2': 'delivered',
      '3': 'pending',
      '4': 'returned',
      '5': 'lost',
      
      // Estados en mayúsculas/minúsculas/mixtos
      'invoiced': 'pending',      // INVOICED no existe en el enum, se mapea a pending
      'pending': 'pending',
      'in_transit': 'in_transit',
      'intransit': 'in_transit',
      'in transit': 'in_transit',
      'delivered': 'delivered',
      'returned': 'returned',
      'lost': 'lost',
      'canceled': 'canceled',
      'cancelled': 'canceled',
      
      // Estados en español
      'pendiente': 'pending',
      'en tránsito': 'in_transit',
      'en transito': 'in_transit',
      'entregado': 'delivered',
      'devuelto': 'returned',
      'perdido': 'lost',
      'cancelado': 'canceled',
      
      // Estados específicos del sistema
      'INVOICED': 'pending',
      'PENDING': 'pending',
      'IN_TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'RETURNED': 'returned',
      'LOST': 'lost',
      'CANCELED': 'canceled'
    };
    
    // Si el estado existe en el mapa, devolver el valor mapeado
    // De lo contrario, usar 'pending' como fallback seguro
    const mappedStatus = statusMap[status] || 'pending';
    
    console.log('✅ Estado mapeado correctamente:', status, '->', mappedStatus);
    return mappedStatus;
  }

  /**
   * Assigns a user to a package
   * @param packageId - The ID or tracking number of the package to update
   * @param userId - The ID of the user to assign to the package
   * @param operatorData - Information about the operator performing the action
   * @returns The updated package with user information
   */
  async assignUserToPackage(
    packageId: string,
    userId: string,
    operatorData: { id: string; email: string },
  ) {
    console.log('🔄 Service: Iniciando assignUserToPackage', {
      packageId,
      userId,
      operatorData,
    });

    try {
      console.log('📝 Verificando paquete antes de actualizar');
      
      // Verificar si el ID es un UUID válido
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId);
      
      // Buscar paquete por ID o por tracking number según corresponda
      let existingPackage;
      if (isUUID) {
        console.log('🔍 Buscando paquete por UUID:', packageId);
        // Si es un UUID, buscar por ID
        existingPackage = await this.prisma.packages.findUnique({
          where: { id: packageId },
        });
      } else {
        console.log('🔍 Buscando paquete por tracking number:', packageId);
        // Si no es un UUID, buscar por tracking number
        existingPackage = await this.prisma.packages.findFirst({
          where: { tracking_number: packageId },
        });
      }

      if (!existingPackage) {
        console.error('❌ Package not found:', packageId);
        throw new HttpException(
          `No se encontró el paquete con identificador: ${packageId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log('📦 Estado actual del paquete:', {
        id: existingPackage.id,
        tracking_number: existingPackage.tracking_number,
        user_reference: existingPackage.user_reference
      });

      // Verificar si el usuario existe
      const existingUser = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        console.error('❌ User not found:', userId);
        throw new HttpException(
          `No se encontró el usuario con ID: ${userId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log('👤 Usuario encontrado:', existingUser.id);

      // Obtener datos del operador, incluyendo su branch_id
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
      } else {
        console.log('👤 Datos del operador obtenidos:', {
          id: operator.id,
          email: operator.email,
          branch_id: operator.branch_id,
          branch_name: operator.branches?.name
        });
      }

      // Verificar si el paquete ya tiene una posición asignada
      let position = existingPackage.position;
      
      // Si no tiene posición, generarla a partir del tracking number
      if (!position && existingPackage.tracking_number) {
        position = this.generarCodigoCasillero(existingPackage.tracking_number);
        console.log('📍 Generada posición de casillero para el paquete:', position);
      }

      // Hacer una actualización SQL directa para asegurar que se actualicen los campos
      console.log('🔄 Ejecutando actualización SQL directa con UUID del paquete:', existingPackage.id);
      
      if (operator && operator.branch_id) {
        // Si tenemos el branch_id del operador, lo actualizamos junto con el user_reference
        console.log('📝 Actualizando paquete con branch_id del operador:', operator.branch_id);
        await this.prisma.$executeRaw`
          UPDATE packages 
          SET user_reference = ${userId}::uuid, 
              branch_id = ${operator.branch_id}::uuid,
              operator_id = ${operatorData.id}::uuid,
              position = ${position},
              updated_at = NOW() 
          WHERE id = ${existingPackage.id}::uuid
        `;
      } else {
        // Si no tenemos branch_id, solo actualizamos el user_reference
        console.log('📝 Actualizando paquete sin branch_id (no disponible)');
        await this.prisma.$executeRaw`
          UPDATE packages 
          SET user_reference = ${userId}::uuid, 
              operator_id = ${operatorData.id}::uuid,
              position = ${position},
              updated_at = NOW() 
          WHERE id = ${existingPackage.id}::uuid
        `;
      }

      // Verificar que el paquete se haya actualizado correctamente
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
        throw new HttpException(
          'La asignación de usuario no se pudo completar',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Registrar actividad
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

      // Formatear la respuesta
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
    } catch (error) {
      console.error('❌ Error updating package:', error);
      throw new HttpException(
        error.message || 'Error al asignar usuario al paquete',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener los datos del cliente asignado a un paquete
   * @param packageId - ID del paquete
   * @returns Información del cliente si está asignado, o null si no hay cliente asignado
   */
  async getPackageClient(packageId: string) {
    try {
      console.log('🔍 Buscando cliente asignado al paquete:', packageId);
      
      // Buscar el paquete con su usuario relacionado
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
        throw new NotFoundException(`Package with ID ${packageId} not found`);
      }
      
      // Verificar si hay un usuario asignado
      if (!packageData.user_reference || !packageData.users) {
        console.log('ℹ️ El paquete no tiene usuario asignado');
        return {
          success: true,
          hasClient: false,
          message: 'No hay cliente asignado a este paquete',
          data: null
        };
      }
      
      // Formatear la información del usuario
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
    } catch (error) {
      console.error('❌ Error al obtener cliente del paquete:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener información del cliente',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene el porcentaje de paquetes que tienen clientes asignados pero todavía no han sido facturados
   * para una sucursal específica
   * @param branchId ID de la sucursal
   * @returns Porcentaje y datos estadísticos
   */
  async getAssignedNotInvoicedPercentage(branchId: string) {
    try {
      console.log('📊 Calculando métricas de paquetes no facturados para sucursal:', branchId);
      
      // Obtener total de paquetes para la sucursal
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

      // Obtener una muestra de los paquetes para diagnóstico
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

      // Obtener paquetes que tienen cliente asignado pero no están facturados
      const assignedNotInvoiced = await this.prisma.packages.count({
        where: {
          branch_id: branchId,
          user_reference: { not: null },  // Tiene cliente asignado
          invoice_packages: {
            none: {}                     // No tiene ninguna factura asociada
          }
        },
      });

      console.log(`🔍 Paquetes con cliente asignado pero no facturados: ${assignedNotInvoiced}`);

      // Obtener una muestra de los paquetes no facturados con cliente asignado
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

      // Calcular porcentaje
      const percentage = (assignedNotInvoiced / totalPackages) * 100;
      console.log(`📊 Porcentaje calculado: ${percentage.toFixed(2)}%`);

      // Obtener tendencia comparado con el mes anterior
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      
      console.log(`📅 Rango de fechas para último mes: ${firstDayOfLastMonth.toISOString()} hasta ${firstDayOfMonth.toISOString()}`);
      
      // Contar paquetes del mes anterior
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
      
      // Calcular porcentaje del mes anterior
      const lastMonthPercentage = lastMonthPackages > 0 
        ? (lastMonthAssignedNotInvoiced / lastMonthPackages) * 100 
        : 0;
      
      // Calcular tendencia
      const trend = percentage - lastMonthPercentage;
      console.log(`📈 Tendencia: ${trend.toFixed(2)}% (Actual: ${percentage.toFixed(2)}%, Mes anterior: ${lastMonthPercentage.toFixed(2)}%)`);

      // Verificar si hay alguna condición extraña que pueda afectar el cálculo
      if (totalPackages > 0 && assignedNotInvoiced === 0) {
        console.log('⚠️ Hay paquetes en la sucursal pero ninguno cumple con la condición de tener cliente asignado y no estar facturado');
        
        // Revisar si hay paquetes con cliente asignado
        const withClient = await this.prisma.packages.count({
          where: {
            branch_id: branchId,
            user_reference: { not: null }
          }
        });
        
        // Revisar si hay paquetes no facturados
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
    } catch (error) {
      console.error('❌ Error al calcular porcentaje de paquetes:', error);
      throw new Error(`Error al calcular estadísticas de paquetes: ${error.message}`);
    }
  }
} 