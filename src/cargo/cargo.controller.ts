import { Controller, Get, Query, HttpException, HttpStatus, Param, Req, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { CargoService } from './cargo.service';
import { ShipmentDetails } from './interfaces/shipment-details.interface';
import { firstValueFrom } from 'rxjs';
import { PackagesService } from '../packages/packages.service';
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

@Controller('cargo')
export class CargoController {
  constructor(
    private readonly cargoService: CargoService,
    @Inject(forwardRef(() => PackagesService))
    private readonly packagesService: PackagesService,
    private readonly prisma: PrismaService
  ) {
    console.log('🚀 CargoController inicializado');
  }

  @Get('packages')
  async getPackages() {
    try {
      console.log('⚡ Obteniendo paquetes de CargoPanama');
      const result = await this.cargoService.getPackages();
      console.log(`✅ Se encontraron ${result.data.length} paquetes`);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener paquetes:', error);
      throw new HttpException(
        error.message || 'Error al obtener paquetes',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tracking/:number')
  async findByTracking(@Param('number') trackingNumber: string, @Req() request: Request) {
    try {
      console.log('==================================');
      console.log(`🎯 GET /api/v1/cargo/tracking/${trackingNumber}`);
      console.log('📡 Headers:', JSON.stringify(request.headers, null, 2));
      console.log('🔍 Buscando tracking:', trackingNumber);
      
      const result = await this.cargoService.findByTracking(trackingNumber);
      console.log('✅ Paquete encontrado:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ Error al buscar tracking:', error);
      throw new HttpException(
        error.message || 'Error al buscar tracking',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('external-tracking/:number')
  async getExternalTracking(@Param('number') trackingNumber: string, @Req() req: RequestWithUser) {
    try {
      console.log('==================================');
      console.log(`🌐 GET /api/v1/cargo/external-tracking/${trackingNumber}`);
      console.log('🔍 Buscando tracking externo:', trackingNumber);
      
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
      console.log('🔍 Verificando información de autenticación en el controlador de Cargo');
      if (!req.user) {
        console.log('⚠️ ADVERTENCIA: No hay información de usuario en req.user. Headers:', req.headers);
      }
      
      // Datos del operador (si existe en la solicitud)
      const userIdFromRequest = req.user?.sub || req.user?.id;
      const userEmailFromRequest = req.user?.email;
      const userRoleFromRequest = req.user?.role;
      
      console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
      
      // Intentar obtener un operador válido para asignar al paquete
      let validOperatorId = null;
      let operatorEmail = 'system@workexpress.com';
      
      if (userIdFromRequest && userEmailFromRequest) {
        console.log('🔍 Procesando usuario autenticado:', {
          id: userIdFromRequest,
          email: userEmailFromRequest,
          role: userRoleFromRequest || 'no_role'
        });
        
        try {
          // Si es el usuario autenticado, verificar primero por ID exacto
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
              
              // Si el usuario es administrador o tiene un rol privilegiado, buscar un operador predeterminado
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
        console.log('⚠️ Detalles de la solicitud:');
        console.log('- Headers de autorización:', req.headers.authorization ? 'Presente' : 'No presente');
        console.log('- Cookies:', req.headers.cookie || 'No hay cookies');
        
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
      
      // Primero verificar si ya existe en la base de datos local
      console.log('🔍 Verificando si ya existe en la base de datos local antes de buscar externamente...');
      const existingPackage = await this.packagesService.findByTracking(trackingNumber);
      if (existingPackage) {
        console.log('✅ Paquete ya existente en base de datos local:', existingPackage.id);
        console.log('📦 Datos del paquete existente:');
        console.log(JSON.stringify({
          id: existingPackage.id,
          trackingNumber: existingPackage.trackingNumber,
          packageStatus: existingPackage.packageStatus,
          weight: existingPackage.weight,
          volumetricWeight: existingPackage.volumetricWeight,
          dimensions: {
            length: existingPackage.length,
            width: existingPackage.width,
            height: existingPackage.height
          }
        }, null, 2));
        
        return {
          tracking: existingPackage.trackingNumber,
          status: existingPackage.packageStatus,
          status_name: existingPackage.packageStatus === 'in_transit' ? 'EN TRÁNSITO' : 
                       existingPackage.packageStatus === 'delivered' ? 'ENTREGADO' : 'PENDIENTE',
          total_weight: String(existingPackage.weight || '0'),
          vol_weight: String(existingPackage.volumetricWeight || '0'),
          cargo_length: String(existingPackage.length || '0'),
          cargo_width: String(existingPackage.width || '0'),
          cargo_height: String(existingPackage.height || '0'),
          unit: 'in',
          mode: 'AIR',
          shipper: 'WORKEXPRESS',
        };
      }
      
      console.log('🌐 Paquete no encontrado localmente, buscando en servicio externo...');
      const externalData = await firstValueFrom(
        this.cargoService.getShipmentDetails(trackingNumber)
      );
      
      console.log('🌐 Respuesta del servicio externo:');
      console.log(JSON.stringify(externalData, null, 2));
      
      if (externalData && externalData.tracking === trackingNumber) {
        console.log('✅ Paquete encontrado en servicio externo:', {
          tracking: externalData.tracking,
          status: externalData.status
        });
        
        // Extraer datos relevantes
        console.log('📊 Analizando datos de respuesta externa:');
        console.log({
          tracking: externalData.tracking || 'No disponible',
          status: externalData.status || 'No disponible',
          status_name: externalData.status_name || 'No disponible',
          weight: {
            total: externalData.total_weight || '0',
            volumetric: externalData.vol_weight || '0'
          },
          dimensions: {
            length: externalData.cargo_length || '0',
            width: externalData.cargo_width || '0',
            height: externalData.cargo_height || '0'
          }
        });
        
        // Guardar el paquete en la base de datos local
        try {
          console.log('💾 Guardando resultado de tracking externo en base de datos local...');
          console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
          
          // Transformar los datos para coincidir con la estructura esperada por createPackage
          const packageData = {
            trackingNumber: externalData.tracking,
            packageStatus: this.mapExternalStatus(externalData.status),
            weight: parseFloat(externalData.total_weight) || 0,
            volWeight: parseFloat(externalData.vol_weight) || 0,
            volumetricWeight: parseFloat(externalData.vol_weight) || 0,
            length: parseFloat(externalData.cargo_length) || 0,
            width: parseFloat(externalData.cargo_width) || 0,
            height: parseFloat(externalData.cargo_height) || 0,
          };
          
          console.log('📦 Datos transformados para createPackage:');
          console.log(JSON.stringify(packageData, null, 2));
          
          const savedPackage = await this.packagesService.createPackage(packageData, operatorData);
          console.log('✅ Paquete guardado en base de datos local:', savedPackage?.id);
          
          if (savedPackage) {
            console.log('📦 Datos guardados en base de datos:');
            console.log(JSON.stringify({
              id: savedPackage.id,
              tracking_number: savedPackage.tracking_number,
              package_status: savedPackage.package_status,
              weight: savedPackage.weight,
              volumetric_weight: savedPackage.volumetric_weight,
              dimensions: {
                length: savedPackage.length,
                width: savedPackage.width,
                height: savedPackage.height
              }
            }, null, 2));
          }
        } catch (saveError) {
          console.error('❌ Error al guardar paquete en base de datos local:', saveError);
          console.error('Detalles del error:', saveError.message);
          if (saveError.stack) {
            console.error('Stack trace:', saveError.stack);
          }
        }
        
        return externalData;
      }
      
      console.log('❌ Paquete no encontrado en servicio externo');
      throw new HttpException('Package not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      console.error('❌ Error en getExternalTracking:', error.message);
      console.error('Detalles completos del error:', error);
      throw new HttpException(error.message || 'Error getting external tracking', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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