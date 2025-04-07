import { Controller, Get, Param, HttpException, HttpStatus, UseGuards, Req, Inject, forwardRef } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { CargoService } from './cargo.service';
import { firstValueFrom } from 'rxjs';
import { PackagesService } from '../packages/packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: {
    id?: string;
    sub?: string;
    email: string;
    role: string;
    branchReference?: string;
  };
}

// Interface para tipar los elementos de shippingStages
interface ShippingStage {
  location?: string;
  photo?: string;
  stage?: string;
  status?: string;
  updatedTimestamp?: string;
  [key: string]: any;
}

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentController {
  constructor(
    private readonly cargoService: CargoService,
    @Inject(forwardRef(() => PackagesService))
    private readonly packagesService: PackagesService,
    private readonly prisma: PrismaService
  ) {
    console.log('🚀 ShipmentController inicializado');
  }

  @Get('track/:trackingNumber')
  async trackShipment(@Param('trackingNumber') trackingNumber: string, @Req() req: RequestWithUser) {
    console.log('==================================');
    console.log(`🔍 GET /api/v1/shipments/track/${trackingNumber}`);
    console.log('🔍 Buscando información de envío:', trackingNumber);
    
    // Si req.user está vacío pero hay un token en la cabecera, intentar decodificarlo manualmente
    if (!req.user?.id && !req.user?.sub) {
      console.log('🔑 No se detectó usuario en req.user, intentando extraer token manualmente...');
      
      // Obtener el token de la cabecera de autorización
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      // O de la cookie si está disponible
      const cookies = req.headers.cookie;
      const tokenFromCookie = cookies?.split(';')
        .find(c => c.trim().startsWith('workexpress_token='))
        ?.split('=')[1];
      
      if (token || tokenFromCookie) {
        try {
          const jwt = require('jsonwebtoken');
          const selectedToken = token || tokenFromCookie;
          
          // Utilizar la misma clave secreta que utiliza la aplicación
          const decoded = jwt.verify(selectedToken, process.env.JWT_SECRET || 'workexpress_secret_key');
          console.log('✅ Token decodificado manualmente:', decoded);
          
          // Actualizar req.user con la información del token
          req.user = {
            id: decoded.sub,
            sub: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            ...decoded
          };
          
          console.log('✅ Usuario extraído manualmente del token:', {
            id: req.user.id || req.user.sub,
            email: req.user.email,
            role: req.user.role
          });
        } catch (tokenError) {
          console.error('❌ Error al decodificar token manualmente:', tokenError.message);
        }
      }
    }
    
    console.log('👤 Usuario autenticado:', {
      id: req.user?.sub || req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    });
    
    // Datos del usuario autenticado
    const userIdFromRequest = req.user?.sub || req.user?.id;
    const userEmailFromRequest = req.user?.email;
    const userRoleFromRequest = req.user?.role;
    
    console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
    console.log('🔍 Procesando usuario autenticado:', {
      id: userIdFromRequest,
      email: userEmailFromRequest,
      role: userRoleFromRequest || 'no_role'
    });
    
    // Intentar obtener un operador válido para asignar al paquete
    let validOperatorId = null;
    let operatorEmail = 'system@workexpress.com';
    
    if (userIdFromRequest && userEmailFromRequest) {
      try {
        // Verificar si el usuario autenticado es un operador válido por ID exacto
        const operator = await this.prisma.operators.findUnique({
          where: { id: userIdFromRequest },
          select: { id: true, email: true }
        });
        
        if (operator) {
          validOperatorId = operator.id;
          operatorEmail = operator.email;
          console.log('✅ Usuario autenticado encontrado como operador por ID exacto:', {
            id: validOperatorId,
            email: operatorEmail
          });
        } else {
          // Si no encuentra por ID, buscar por email exacto
          const operatorByEmail = await this.prisma.operators.findUnique({
            where: { email: userEmailFromRequest },
            select: { id: true, email: true }
          });
          
          if (operatorByEmail) {
            validOperatorId = operatorByEmail.id;
            operatorEmail = operatorByEmail.email;
            console.log('✅ Usuario autenticado encontrado como operador por email exacto:', {
              id: validOperatorId,
              email: operatorEmail
            });
          } else {
            console.log('⚠️ Usuario autenticado no es un operador exacto:', userIdFromRequest);
            
            // Si el usuario es administrador o tiene un rol específico, buscar un operador predeterminado
            if (userRoleFromRequest && ['admin', 'programador', 'manager'].includes(userRoleFromRequest.toLowerCase())) {
              console.log('🔍 Usuario tiene rol privilegiado, buscando operador predeterminado...');
              
              // Buscar un operador predeterminado
              const defaultOperator = await this.prisma.operators.findFirst({
                where: { 
                  status: 'active',
                  role: { in: ['admin', 'manager'] }
                },
                orderBy: { created_at: 'desc' },
                select: { id: true, email: true }
              });
              
              if (defaultOperator) {
                validOperatorId = defaultOperator.id;
                operatorEmail = defaultOperator.email;
                console.log('✅ Usando operador predeterminado (usuario tiene rol privilegiado):', {
                  id: validOperatorId,
                  email: operatorEmail
                });
              } else {
                console.log('⚠️ No se encontró operador predeterminado con rol privilegiado');
                
                // Último recurso: buscar cualquier operador activo
                const anyActiveOperator = await this.prisma.operators.findFirst({
                  where: { status: 'active' },
                  orderBy: { created_at: 'desc' },
                  select: { id: true, email: true }
                });
                
                if (anyActiveOperator) {
                  validOperatorId = anyActiveOperator.id;
                  operatorEmail = anyActiveOperator.email;
                  console.log('✅ Usando cualquier operador activo como último recurso:', {
                    id: validOperatorId,
                    email: operatorEmail
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error al verificar operador:', error);
      }
    } else {
      console.log('⚠️ No hay información de usuario en la solicitud, buscando operador predeterminado...');
      
      // Buscar un operador predeterminado
      try {
        const defaultOperator = await this.prisma.operators.findFirst({
          where: { status: 'active' },
          orderBy: { created_at: 'desc' },
          select: { id: true, email: true }
        });
        
        if (defaultOperator) {
          validOperatorId = defaultOperator.id;
          operatorEmail = defaultOperator.email;
          console.log('✅ Usando operador predeterminado (no hay usuario autenticado):', {
            id: validOperatorId,
            email: operatorEmail
          });
        }
      } catch (error) {
        console.error('❌ Error al buscar operador predeterminado:', error);
      }
    }
    
    // Datos del operador que se pasarán al servicio
    const operatorData = {
      id: validOperatorId,
      email: operatorEmail
    };
    
    console.log('👤 Datos finales del operador para la creación del paquete:', operatorData);
    
    try {
      // Primero buscar en la base de datos local utilizando Prisma
      const localPackage = await this.packagesService.findByTracking(trackingNumber);
      
      if (localPackage) {
        console.log('✅ Paquete encontrado en la base de datos local:', localPackage.id);
        console.log('📦 Datos del paquete local:');
        console.log(JSON.stringify({
          id: localPackage.id,
          trackingNumber: localPackage.trackingNumber,
          packageStatus: localPackage.packageStatus,
          weight: localPackage.weight,
          volumetricWeight: localPackage.volumetricWeight,
          dimensions: {
            length: localPackage.length,
            width: localPackage.width,
            height: localPackage.height
          },
          createdAt: localPackage.createdAt
        }, null, 2));
        
        // Transformar a formato de shipment details
        return {
          tracking: localPackage.trackingNumber,
          status: localPackage.packageStatus,
          status_name: this.getStatusName(localPackage.packageStatus),
          total_weight: localPackage.weight?.toString() || '0',
          vol_weight: localPackage.volumetricWeight?.toString() || '0',
          cargo_length: localPackage.length?.toString() || '0',
          cargo_width: localPackage.width?.toString() || '0',
          cargo_height: localPackage.height?.toString() || '0',
          unit: 'in',
          mode_name: 'AIR',
          shipper: 'WORKEXPRESS',
          datecreated: localPackage.createdAt || new Date().toISOString(),
          success: true
        };
      }
      
      // Si no se encuentra localmente, buscar en el servicio externo
      console.log('🔄 Paquete no encontrado localmente, buscando en servicio externo...');
      
      const shipmentDetails = await firstValueFrom(
        this.cargoService.getShipmentDetails(trackingNumber)
      ).catch(error => {
        console.error('❌ Error en la llamada a getShipmentDetails:', error);
        return null;
      });
      
      if (!shipmentDetails) {
        console.log('❌ No se encontraron detalles para el tracking:', trackingNumber);
        throw new HttpException(
          `No se encontró información para el tracking: ${trackingNumber}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      console.log('✅ Información de envío encontrada en servicio externo:', {
        tracking: shipmentDetails.tracking,
        status: shipmentDetails.status,
        statusName: shipmentDetails.status_name || shipmentDetails.mode_name
      });
      
      // Mostrar datos completos recibidos del servicio externo
      console.log('📋 Respuesta completa del servicio externo:');
      console.log(JSON.stringify(shipmentDetails, null, 2));
      
      // Guardar el paquete encontrado en la base de datos local con Prisma
      try {
        console.log('📦 Guardando información en base de datos usando Prisma...');
        console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
        
        // Usar el trackingNumber original si el servicio externo devuelve null
        const validTrackingNumber = shipmentDetails.tracking || trackingNumber;
        
        // Estado mapeado
        const mappedStatus = this.mapExternalStatus(shipmentDetails.status);
        console.log(`🔄 Estado mapeado: ${shipmentDetails.status} -> ${mappedStatus}`);
        
        const packageData = {
          trackingNumber: validTrackingNumber,
          packageStatus: mappedStatus,
          weight: parseFloat(shipmentDetails.total_weight) || 0,
          volumetricWeight: parseFloat(shipmentDetails.vol_weight) || 0,
          volWeight: parseFloat(shipmentDetails.vol_weight) || 0,
          length: parseFloat(shipmentDetails.cargo_length) || 0,
          width: parseFloat(shipmentDetails.cargo_width) || 0,
          height: parseFloat(shipmentDetails.cargo_height) || 0,
          insurance: false,
          shippingStages: [{
            location: shipmentDetails.destination || "Miami Warehouse",
            photo: "",
            stage: "En tránsito",
            status: shipmentDetails.status || "in transit",
            updatedTimestamp: shipmentDetails.datecreated || new Date().toISOString()
          }]
        };
        
        console.log('📦 Datos a guardar en la base de datos:');
        console.log(JSON.stringify(packageData, null, 2));
        
        const savedPackage = await this.packagesService.createPackage(packageData, operatorData);
        console.log('✅ Paquete guardado exitosamente en base de datos con Prisma:', savedPackage?.id);
        
        // Verificar los datos guardados
        if (savedPackage) {
          console.log('📦 Datos guardados en base de datos:');
          console.log(JSON.stringify({
            id: savedPackage.id,
            tracking_number: savedPackage.tracking_number,
            package_status: savedPackage.package_status,
            weight: savedPackage.weight,
            volumetric_weight: savedPackage.volumetric_weight
          }, null, 2));
        }
      } catch (saveError) {
        console.error('⚠️ Error al guardar paquete en base de datos:', saveError);
        console.error('Detalles del error:', saveError.message);
        // Continuamos aunque haya error al guardar
      }
      
      // Asegurarnos de que el tracking sea correcto en la respuesta
      if (!shipmentDetails.tracking) {
        shipmentDetails.tracking = trackingNumber;
      }
      
      // Asegurar que siempre haya un estado válido
      if (!shipmentDetails.status) {
        shipmentDetails.status = 'pending';
      }
      
      // Asegurar que siempre haya un nombre de estado válido
      if (!shipmentDetails.status_name && !shipmentDetails.mode_name) {
        shipmentDetails.status_name = 'PENDIENTE';
      }
      
      return shipmentDetails;
    } catch (error) {
      console.error('❌ Error al buscar shipment:', error);
      throw new HttpException(
        error.message || 'Error al buscar información del envío',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Get('track-details/:trackingNumber')
  async getTrackingDetails(@Param('trackingNumber') trackingNumber: string, @Req() req: RequestWithUser) {
    try {
      console.log('==================================');
      console.log(`🔍 GET /api/v1/shipments/track-details/${trackingNumber}`);
      console.log('🔍 Buscando detalles completos del envío:', trackingNumber);
      
      // Si req.user está vacío pero hay un token en la cabecera, intentar decodificarlo manualmente
      if (!req.user?.id && !req.user?.sub) {
        console.log('🔑 No se detectó usuario en req.user, intentando extraer token manualmente...');
        
        // Obtener el token de la cabecera de autorización
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        // O de la cookie si está disponible
        const cookies = req.headers.cookie;
        const tokenFromCookie = cookies?.split(';')
          .find(c => c.trim().startsWith('workexpress_token='))
          ?.split('=')[1];
        
        if (token || tokenFromCookie) {
          try {
            const jwt = require('jsonwebtoken');
            const selectedToken = token || tokenFromCookie;
            
            // Utilizar la misma clave secreta que utiliza la aplicación
            const decoded = jwt.verify(selectedToken, process.env.JWT_SECRET || 'workexpress_secret_key');
            console.log('✅ Token decodificado manualmente:', decoded);
            
            // Actualizar req.user con la información del token
            req.user = {
              id: decoded.sub,
              sub: decoded.sub,
              email: decoded.email,
              role: decoded.role,
              ...decoded
            };
            
            console.log('✅ Usuario extraído manualmente del token:', {
              id: req.user.id || req.user.sub,
              email: req.user.email,
              role: req.user.role
            });
          } catch (tokenError) {
            console.error('❌ Error al decodificar token manualmente:', tokenError.message);
          }
        }
      }
      
      console.log('👤 Usuario autenticado:', {
        id: req.user?.sub || req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      });
      
      // Datos del usuario autenticado
      const userIdFromRequest = req.user?.sub || req.user?.id;
      const userEmailFromRequest = req.user?.email;
      const userRoleFromRequest = req.user?.role;
      
      console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
      console.log('🔍 Procesando usuario autenticado:', {
        id: userIdFromRequest,
        email: userEmailFromRequest,
        role: userRoleFromRequest || 'no_role'
      });
      
      // Intentar obtener un operador válido para asignar al paquete
      let validOperatorId = null;
      let operatorEmail = 'system@workexpress.com';
      
      if (userIdFromRequest && userEmailFromRequest) {
        try {
          // Verificar si el usuario autenticado es un operador válido por ID exacto
          const operator = await this.prisma.operators.findUnique({
            where: { id: userIdFromRequest },
            select: { id: true, email: true }
          });
          
          if (operator) {
            validOperatorId = operator.id;
            operatorEmail = operator.email;
            console.log('✅ Usuario autenticado encontrado como operador por ID exacto:', {
              id: validOperatorId,
              email: operatorEmail
            });
          } else {
            // Si no encuentra por ID, buscar por email exacto
            const operatorByEmail = await this.prisma.operators.findUnique({
              where: { email: userEmailFromRequest },
              select: { id: true, email: true }
            });
            
            if (operatorByEmail) {
              validOperatorId = operatorByEmail.id;
              operatorEmail = operatorByEmail.email;
              console.log('✅ Usuario autenticado encontrado como operador por email exacto:', {
                id: validOperatorId,
                email: operatorEmail
              });
            } else {
              console.log('⚠️ Usuario autenticado no es un operador exacto:', userIdFromRequest);
              
              // Si el usuario es administrador o tiene un rol específico, buscar un operador predeterminado
              if (userRoleFromRequest && ['admin', 'programador', 'manager'].includes(userRoleFromRequest.toLowerCase())) {
                console.log('🔍 Usuario tiene rol privilegiado, buscando operador predeterminado...');
                
                // Buscar un operador predeterminado
                const defaultOperator = await this.prisma.operators.findFirst({
                  where: { 
                    status: 'active',
                    role: { in: ['admin', 'manager'] }
                  },
                  orderBy: { created_at: 'desc' },
                  select: { id: true, email: true }
                });
                
                if (defaultOperator) {
                  validOperatorId = defaultOperator.id;
                  operatorEmail = defaultOperator.email;
                  console.log('✅ Usando operador predeterminado (usuario tiene rol privilegiado):', {
                    id: validOperatorId,
                    email: operatorEmail
                  });
                } else {
                  console.log('⚠️ No se encontró operador predeterminado con rol privilegiado');
                  
                  // Último recurso: buscar cualquier operador activo
                  const anyActiveOperator = await this.prisma.operators.findFirst({
                    where: { status: 'active' },
                    orderBy: { created_at: 'desc' },
                    select: { id: true, email: true }
                  });
                  
                  if (anyActiveOperator) {
                    validOperatorId = anyActiveOperator.id;
                    operatorEmail = anyActiveOperator.email;
                    console.log('✅ Usando cualquier operador activo como último recurso:', {
                      id: validOperatorId,
                      email: operatorEmail
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error al verificar operador:', error);
        }
      } else {
        console.log('⚠️ No hay información de usuario en la solicitud, buscando operador predeterminado...');
        
        // Buscar un operador predeterminado
        try {
          const defaultOperator = await this.prisma.operators.findFirst({
            where: { status: 'active' },
            orderBy: { created_at: 'desc' },
            select: { id: true, email: true }
          });
          
          if (defaultOperator) {
            validOperatorId = defaultOperator.id;
            operatorEmail = defaultOperator.email;
            console.log('✅ Usando operador predeterminado (no hay usuario autenticado):', {
              id: validOperatorId,
              email: operatorEmail
            });
          }
        } catch (error) {
          console.error('❌ Error al buscar operador predeterminado:', error);
        }
      }
      
      // Datos del operador que se pasarán al servicio
      const operatorData = {
        id: validOperatorId,
        email: operatorEmail
      };
      
      console.log('👤 Datos finales del operador para la creación del paquete:', operatorData);
      
      // Primero buscar en la base de datos local con Prisma
      const localPackage = await this.packagesService.findByTracking(trackingNumber);
      
      if (localPackage) {
        console.log('✅ Paquete encontrado en la base de datos local');
        
        // Extraer información de shipping_stages para obtener detalles adicionales
        let destination = '';
        
        if (Array.isArray(localPackage.shippingStages) && localPackage.shippingStages.length > 0) {
          // Intentar obtener el location del primer elemento de shippingStages
          const firstStage = localPackage.shippingStages[0] as ShippingStage;
          destination = firstStage.location || '';
        }
          
        // Transformar a formato de respuesta amigable
        return {
          tracking: localPackage.trackingNumber,
          status: {
            code: localPackage.packageStatus,
            name: this.getStatusName(localPackage.packageStatus)
          },
          dimensions: {
            length: localPackage.length?.toString() || '0',
            width: localPackage.width?.toString() || '0',
            height: localPackage.height?.toString() || '0',
            unit: 'in'
          },
          weight: {
            total: localPackage.weight?.toString() || '0',
            volumetric: localPackage.volumetricWeight?.toString() || '0'
          },
          shipment: {
            mode: 'AIR',
            carrier: 'WORKEXPRESS',
            receipt: '' // No disponible en el objeto localPackage
          },
          dates: {
            created: localPackage.createdAt || new Date().toISOString()
          },
          destination: destination,
          consignee: '', // No disponible en el objeto localPackage
          source: 'local'
        };
      }
      
      // Si no se encuentra localmente, buscar en el servicio externo
      console.log('🔄 Paquete no encontrado localmente, buscando en servicio externo...');
      
      // Convertir Observable a Promise
      const shipmentDetails = await firstValueFrom(
        this.cargoService.getShipmentDetails(trackingNumber)
      ).catch(error => {
        console.error('❌ Error en la llamada a getShipmentDetails:', error);
        return null;
      });
      
      if (!shipmentDetails) {
        throw new HttpException(
          `No se encontró información para el tracking: ${trackingNumber}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      console.log('✅ Detalles de envío encontrados en servicio externo');
      
      // Guardar el paquete encontrado en la base de datos local usando Prisma
      try {
        console.log('📦 Guardando información en base de datos con Prisma...');
        console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
        
        // Usar el trackingNumber original si el servicio externo devuelve null
        const validTrackingNumber = shipmentDetails.tracking || trackingNumber;
        
        const packageData = {
          trackingNumber: validTrackingNumber,
          packageStatus: this.mapExternalStatus(shipmentDetails.status),
          weight: parseFloat(shipmentDetails.total_weight) || 0,
          volumetricWeight: parseFloat(shipmentDetails.vol_weight) || 0,
          volWeight: parseFloat(shipmentDetails.vol_weight) || 0,
          length: parseFloat(shipmentDetails.cargo_length) || 0,
          width: parseFloat(shipmentDetails.cargo_width) || 0,
          height: parseFloat(shipmentDetails.cargo_height) || 0,
          insurance: false,
          shippingStages: [{
            location: shipmentDetails.destination || "Miami Warehouse",
            photo: "",
            stage: "En tránsito",
            status: shipmentDetails.status || "in transit",
            updatedTimestamp: shipmentDetails.datecreated || new Date().toISOString()
          }]
        };
        
        await this.packagesService.createPackage(packageData, operatorData);
        console.log('✅ Paquete guardado exitosamente en base de datos con Prisma');
      } catch (saveError) {
        console.error('⚠️ Error al guardar paquete en base local:', saveError);
        // Continuamos aunque haya error al guardar
      }
      
      // Transformar a un formato más amigable para el frontend
      return {
        tracking: shipmentDetails.tracking || trackingNumber,
        status: {
          code: shipmentDetails.status || 'pending',
          name: shipmentDetails.status_name || shipmentDetails.mode_name || 'PENDIENTE'
        },
        dimensions: {
          length: shipmentDetails.cargo_length || '0',
          width: shipmentDetails.cargo_width || '0',
          height: shipmentDetails.cargo_height || '0',
          unit: shipmentDetails.unit || 'in'
        },
        weight: {
          total: shipmentDetails.total_weight || '0',
          volumetric: shipmentDetails.vol_weight || '0'
        },
        shipment: {
          mode: shipmentDetails.mode_name || 'AIR',
          carrier: shipmentDetails.shipper || 'WORKEXPRESS',
          receipt: shipmentDetails.receipt
        },
        dates: {
          created: shipmentDetails.datecreated || new Date().toISOString()
        },
        destination: shipmentDetails.destination,
        consignee: shipmentDetails.consignee_fullname,
        source: 'external'
      };
    } catch (error) {
      console.error('❌ Error al obtener detalles del envío:', error);
      throw new HttpException(
        error.message || 'Error al obtener detalles del envío',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Función auxiliar para mapear códigos de estado a nombres legibles
  private getStatusName(statusCode: string): string {
    const statusMap = {
      'pending': 'Pendiente',
      'in_transit': 'En Tránsito',
      'delivered': 'Entregado',
      'canceled': 'Cancelado',
      'returned': 'Devuelto',
      'lost': 'Extraviado',
      'INVOICED': 'Facturado',
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobado',
      'REJECTED': 'Rechazado'
    };
    
    return statusMap[statusCode] || statusCode || 'Desconocido';
  }
  
  /**
   * Mapea los estados del servicio externo a los estados válidos del enum package_status_enum
   * @param externalStatus El estado proporcionado por el servicio externo
   * @returns Un valor válido para el enum package_status_enum
   */
  private mapExternalStatus(externalStatus: string): string {
    console.log('🔄 Mapeando estado externo:', externalStatus);
    
    // Convertir a string para asegurar compatibilidad
    const status = String(externalStatus || '').toLowerCase();
    
    // Mapa de equivalencias entre estados externos y estados del enum
    const statusMap: Record<string, string> = {
      '1': 'in_transit',      // 1 suele ser "En tránsito" en sistemas externos
      '2': 'delivered',       // 2 suele ser "Entregado"
      '3': 'pending',         // 3 en algunos sistemas es "Procesando"
      '4': 'returned',        // 4 podría ser "Devuelto" 
      '5': 'lost',            // 5 podría ser "Perdido"
      '0': 'canceled',        // 0 podría ser "Cancelado"
      
      // Estados textuales (por si acaso en algún momento cambian a texto)
      'en tránsito': 'in_transit',
      'entregado': 'delivered',
      'pendiente': 'pending',
      'devuelto': 'returned',
      'perdido': 'lost',
      'cancelado': 'canceled',
      
      // Estados en inglés
      'in transit': 'in_transit',
      'delivered': 'delivered',
      'pending': 'pending',
      'returned': 'returned',
      'lost': 'lost',
      'canceled': 'canceled'
    };
    
    // Si el estado existe en el mapa, devolver el equivalente, si no, usar 'pending' como fallback
    const mappedStatus = statusMap[status] || 'pending';
    console.log('✅ Estado mapeado:', status, '->', mappedStatus);
    
    return mappedStatus;
  }
} 