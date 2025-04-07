import { Controller, Post, Body, Param, Get, UseGuards, Req, Put, Inject, forwardRef } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CargoService } from '../../cargo/cargo.service';

interface RequestWithUser extends Request {
  user: {
    id?: string;
    sub?: string;
    email: string;
    role: string;
    branchReference?: string;
  };
}

@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    @Inject(forwardRef(() => CargoService))
    private readonly cargoService: CargoService
  ) {}

  @Get('tracking/:trackingNumber')
  async findByTracking(
    @Param('trackingNumber') trackingNumber: string,
    @Req() req: RequestWithUser,
  ) {
    console.log('🔍 Buscando paquete por tracking:', trackingNumber);
    
    const operatorData = {
      id: req.user.sub || req.user.id,
      email: req.user.email
    };

    try {
      // Primero buscar en la colección de packages
      const existingPackage = await this.packagesService.findByTracking(trackingNumber);
      
      if (existingPackage) {
        console.log('✅ Paquete encontrado en la base de datos local');
        return existingPackage;
      }

      // Si no existe, buscar en el servicio de cargo
      console.log('🔄 Buscando en servicio de cargo...');
      const cargoResponse = await this.cargoService.findByTracking(trackingNumber);
      
      if (!cargoResponse || !cargoResponse.data) {
        console.log('❌ Paquete no encontrado en ningún servicio');
        return null;
      }

      const cargoPackage = cargoResponse.data;

      // Transformar los datos del servicio de cargo al formato de package
      const packageData = {
        trackingNumber: cargoPackage.tracking,
        packageStatus: cargoPackage.status || 'pending',
        weight: parseFloat(cargoPackage.totalWeight) || 0,
        volumetricWeight: parseFloat(cargoPackage.volWeight) || 0,
        length: parseFloat(cargoPackage.dimensions?.length) || 0,
        width: parseFloat(cargoPackage.dimensions?.width) || 0,
        height: parseFloat(cargoPackage.dimensions?.height) || 0,
        insurance: false,
        shippingStages: [{
          location: "Miami Warehouse 1",
          photo: "",
          stage: "Miami",
          status: cargoPackage.status || "in transit",
          updatedTimestamp: new Date().toISOString()
        }]
      };

      // Crear el paquete en la base de datos
      console.log('📦 Creando nuevo paquete en la base de datos');
      const newPackage = await this.packagesService.createPackage(packageData, operatorData);
      
      console.log('✅ Paquete creado exitosamente');
      return newPackage;
    } catch (error) {
      console.error('❌ Error en findByTracking:', error);
      throw error;
    }
  }

  @Post()
  async createPackage(
    @Body() packageData: any,
    @Req() req: RequestWithUser,
  ) {
    const operatorData = {
      id: req.user.sub || req.user.id,
      email: req.user.email
    };
    
    return this.packagesService.createPackage(packageData, operatorData);
  }

  @Put(':packageId/assign-user')
  async assignUserToPackage(
    @Param('packageId') packageId: string,
    @Body() { userId }: { userId: string },
    @Req() req: RequestWithUser,
  ) {
    console.log('🔄 Recibida solicitud de asignación de usuario a paquete:', {
      packageId,
      userId,
      operador: {
        id: req.user?.sub || req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      }
    });

    if (!packageId?.trim() || !userId?.trim()) {
      const error = new Error('Se requieren IDs válidos de paquete y usuario');
      console.error('❌ Error de validación:', error, { packageId, userId });
      throw error;
    }

    if (!req.user?.sub && !req.user?.id) {
      const error = new Error('Información del operador incompleta o inválida');
      console.error('❌ Error de validación:', error, { user: req.user });
      throw error;
    }

    const operatorData = {
      id: req.user.sub || req.user.id,
      email: req.user.email
    };
    
    console.log('👤 Datos del operador validados:', operatorData);
    
    try {
      console.log('🔄 Iniciando proceso de asignación con datos validados:', {
        packageId: packageId.trim(),
        userId: userId.trim(),
        operador: operatorData
      });
      
      const result = await this.packagesService.assignUserToPackage(
        packageId.trim(), 
        userId.trim(), 
        operatorData
      );
      
      console.log('✅ Asignación completada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en el controlador:', error);
      throw error;
    }
  }

  @Put(':packageId/status')
  async updatePackageStatus(
    @Param('packageId') packageId: string,
    @Body() { status }: { status: string },
    @Req() req: RequestWithUser,
  ) {
    const operatorData = {
      id: req.user.sub || req.user.id,
      email: req.user.email
    };
    
    return this.packagesService.updatePackageStatus(packageId, status, operatorData);
  }
} 